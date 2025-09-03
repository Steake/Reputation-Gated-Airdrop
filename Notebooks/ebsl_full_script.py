#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
EBSL + EZKL (Fixed: overflow-safe packing/rebasing + stable product)
- Single-input ONNX: combined_input = concat(flat(opinions), flat(mask))
- Robust EZKL settings: decomp_legs↑, safe rebasing knobs, version-safe fallbacks
- Stable product via log/exp, sign-preserving denominator clamp
- Async-safe ezkl calls, CLI SRS fallback, verbose timing & run report
"""

import os
import json
import time
import argparse
import traceback
from dataclasses import dataclass, asdict
from contextlib import contextmanager
from typing import Optional, Dict, Any

import numpy as np
import torch
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from hypothesis import given, strategies as st, settings as hyp_settings

import asyncio
import inspect
import subprocess
from pathlib import Path as _Path

import ezkl
import onnx

# --------------------------- Logging -----------------------------------------

@dataclass
class StepResult:
    name: str
    ok: bool
    seconds: float
    extra: dict

class Logger:
    def __init__(self, verbose: bool = True):
        self.verbose = verbose
        self.steps = []

    def banner(self, title: str):
        line = "=" * 78
        print(f"\n{line}\n{title}\n{line}")

    def info(self, msg: str):
        if self.verbose:
            print(msg)

    def warn(self, msg: str):
        print(f"[!] {msg}")

    def error(self, msg: str):
        print(f"[✗] {msg}")

    def ok(self, msg: str):
        print(f"[✓] {msg}")

    @contextmanager
    def timed(self, name: str, extra: Optional[Dict[str, Any]] = None):
        start = time.perf_counter()
        ok = True
        info = dict(extra or {})
        try:
            yield info
            ok = True
        except Exception as e:
            ok = False
            info["exception"] = repr(e)
            info["traceback"] = traceback.format_exc(limit=12)
            self.error(f"{name} failed: {e}")
            raise
        finally:
            dur = time.perf_counter() - start
            self.steps.append(StepResult(name, ok, dur, info))
            status = "OK" if ok else "FAIL"
            self.info(f"[{status}] {name} in {dur:.3f}s")

    def dump_report(self, path: str):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w") as f:
            json.dump([asdict(s) for s in self.steps], f, indent=2)
        self.ok(f"Run report written: {path}")

# --------------------------- Async helpers -----------------------------------

def run_with_loop(func, /, *args, **kwargs):
    """
    Always execute in a running asyncio loop and await if needed.
    Works whether func is sync or returns a coroutine.
    """
    async def _runner():
        res = func(*args, **kwargs)
        if inspect.isawaitable(res):
            return await res
        return res
    return asyncio.run(_runner())

def get_srs_with_fallback(settings_path: str, srs_path: str, logger: Logger) -> bool:
    """
    Try Python binding; if that fails, fall back to `ezkl get-srs -S settings.json`.
    """
    try:
        ok = run_with_loop(ezkl.get_srs, srs_path=srs_path, settings_path=settings_path)
        if ok:
            return True
        logger.warn("ezkl.get_srs returned False; attempting CLI fallback")
    except Exception as e:
        logger.warn(f"ezkl.get_srs raised {e!r}; attempting CLI fallback")

    try:
        cmd = ["ezkl", "get-srs", "-S", settings_path]
        subprocess.run(cmd, check=True)
        if _Path(srs_path).exists():
            return True
        default_srs = _Path.home() / ".ezkl" / "srs" / "kzg15.srs"
        if default_srs.exists():
            import shutil
            shutil.copy2(default_srs, srs_path)
            logger.info(f"Copied SRS from default location to {srs_path}")
            return True
        return False
    except Exception as e2:
        logger.error(f"CLI get-srs failed: {e2!r}")
        return False

# --------------------------- EZKL safe utilities ------------------------------

def safe_setattr(obj, name, value, logger: Logger):
    """Set attribute if it exists in bindings; otherwise log and continue."""
    try:
        setattr(obj, name, value)
        logger.info(f"run_args.{name} = {value!r}")
    except Exception as e:
        logger.warn(f"run_args field {name!r} not supported by this ezkl version: {e!r}")

def safe_calibrate(logger: Logger, *, data, model, settings, **kwargs) -> bool:
    """
    Call ezkl.calibrate_settings with rich kwargs; on TypeError,
    progressively back off to a minimal call.
    """
    try:
        return bool(run_with_loop(ezkl.calibrate_settings, data=data, model=model, settings=settings, **kwargs))
    except TypeError as e:
        logger.warn(f"Calibration kwargs not fully supported ({e}); retrying with reduced kwargs")
        # Fallback 1: keep impactful knobs
        try_kwargs = {k: kwargs[k] for k in ["target", "lookup_safety_margin", "max_logrows"] if k in kwargs}
        try:
            return bool(run_with_loop(ezkl.calibrate_settings, data=data, model=model, settings=settings, **try_kwargs))
        except TypeError as e2:
            logger.warn(f"Reduced calibration call failed ({e2}); retrying minimal")
            # Fallback 2: minimal signature
            return bool(run_with_loop(ezkl.calibrate_settings, data=data, model=model, settings=settings))

# --------------------------- EBSL logic --------------------------------------

class ClassicalEBSLAlgorithm:
    @staticmethod
    def fuse(opinions_tensor: torch.Tensor) -> torch.Tensor:
        # opinions_tensor: [N, 4] -> [b,d,u,a]
        b, d, u, a = [o.squeeze(-1) for o in opinions_tensor.split(1, dim=-1)]
        denominator = torch.sum(u, dim=-1) - (opinions_tensor.shape[0] - 1)
        if torch.any(denominator == 0):
            denominator = denominator + (denominator == 0) * 1e-9
        b_fused = torch.sum(b * u, dim=-1) / denominator
        d_fused = torch.sum(d * u, dim=-1) / denominator
        u_fused = torch.prod(u, dim=-1) / denominator
        a_fused = torch.sum((a * u), dim=-1) / denominator
        return torch.stack([b_fused, d_fused, u_fused, a_fused], dim=-1)

class EBSLAlgorithm:
    @staticmethod
    def fuse(opinions_tensor: torch.Tensor) -> torch.Tensor:
        b, d, u, a = [o.squeeze(-1) for o in opinions_tensor.split(1, dim=-1)]
        denominator = torch.sum(u, dim=-1) - (opinions_tensor.shape[0] - 1)
        is_zero = (denominator == 0).to(torch.float32)
        denominator = denominator + (is_zero * 1e-9)
        inv_denominator = torch.reciprocal(denominator)
        b_fused = torch.sum(b * u, dim=-1) * inv_denominator
        d_fused = torch.sum(d * u, dim=-1) * inv_denominator
        u_fused = torch.prod(u, dim=-1) * inv_denominator
        a_fused = torch.sum((a * u), dim=-1) * inv_denominator
        return torch.stack([b_fused, d_fused, u_fused, a_fused], dim=-1)

    @staticmethod
    def calculate_reputation(final_opinion_tensor: torch.Tensor) -> torch.Tensor:
        b, d, u, a = [o.squeeze(-1) for o in final_opinion_tensor.split(1, dim=-1)]
        return b + a * u

# --------------------------- Property tests + perf ----------------------------

@st.composite
def opinion_strategy(draw):
    b = draw(st.floats(0.0, 1.0))
    d = draw(st.floats(0.0, 1.0 - b))
    u = 1.0 - b - d
    a = draw(st.floats(0.0, 1.0))
    return torch.tensor([b, d, u, a], dtype=torch.float32)

@st.composite
def opinions_tensor_strategy(draw, min_opinions=2, max_opinions=50):
    num_opinions = draw(st.integers(min_opinions, max_opinions))
    opinions = draw(st.lists(opinion_strategy(), min_size=num_opinions, max_size=num_opinions))
    return torch.stack(opinions)

def run_property_based_correctness_test(logger: Logger):
    logger.banner("Property-based correctness test")
    @given(opinions_tensor=opinions_tensor_strategy())
    @hyp_settings(max_examples=100, deadline=None)
    def test_fusion_equivalence(opinions_tensor):
        classical_result = ClassicalEBSLAlgorithm.fuse(opinions_tensor)
        zk_friendly_result = EBSLAlgorithm.fuse(opinions_tensor)
        assert torch.allclose(classical_result, zk_friendly_result, atol=1e-6)
    with logger.timed("hypothesis_equivalence_test"):
        test_fusion_equivalence()
    logger.ok("Equivalence holds for 100 random examples")

def run_comparative_performance_analysis(logger: Logger, skip_plots: bool):
    logger.banner("Comparative performance analysis")
    opinion_counts = list(range(10, 201, 10))
    results = {'classical': [], 'zk_friendly': []}
    with logger.timed("perf_benchmark"):
        for count in opinion_counts:
            b = torch.rand(count)
            d = torch.rand(count) * (1 - b)
            u = 1 - b - d
            a = torch.rand(count)
            sample_tensor = torch.stack([b, d, u, a], dim=1)
            t0 = time.perf_counter()
            ClassicalEBSLAlgorithm.fuse(sample_tensor)
            results['classical'].append(time.perf_counter() - t0)
            t0 = time.perf_counter()
            EBSLAlgorithm.fuse(sample_tensor)
            results['zk_friendly'].append(time.perf_counter() - t0)
    logger.ok("Perf benchmark complete")
    if not skip_plots:
        os.makedirs("zkml_artifacts", exist_ok=True)
        plt.figure(figsize=(10, 6))
        plt.plot(opinion_counts, results['classical'], marker='o', label='Classical')
        plt.plot(opinion_counts, results['zk_friendly'], marker='x', label='ZK-Friendly')
        plt.xlabel("Number of Opinions to Fuse")
        plt.ylabel("Execution Time [s] (log)")
        plt.title("Performance Comparison: Classical vs ZK-Friendly EBSL Fusion")
        plt.legend(); plt.grid(True); plt.yscale('log'); plt.tight_layout()
        plot_path = os.path.join("zkml_artifacts", "perf_plot.png")
        plt.savefig(plot_path, dpi=160)
        logger.ok(f"Saved performance plot: {plot_path}")

# --------------------------- Torch EBSL module --------------------------------

class EBslFusionModule(torch.nn.Module):
    """
    ZK-optimized EBSL fusion module with overflow-safe ops.
    Input: combined tensor with opinions and mask flattened and concatenated
    Outputs:
      fused:    (B, 4)
      rep:      (B, 1)
    """
    def __init__(self, max_opinions: int = 16):
        super().__init__()
        self.max_opinions = max_opinions
        self.opinions_size = max_opinions * 4  # N * 4 for [b,d,u,a]
        self.mask_size = max_opinions         # N for mask
        self.register_buffer('epsilon', torch.tensor(1e-6))
        self.register_buffer('one', torch.tensor(1.0))

    def forward(self, combined_input: torch.Tensor):
        batch_size = combined_input.shape[0]

        # Split & reshape back to opinions and mask
        opinions_flat = combined_input[:, :self.opinions_size]
        mask_flat = combined_input[:, self.opinions_size:self.opinions_size + self.mask_size]
        opinions = opinions_flat.view(batch_size, self.max_opinions, 4)
        mask = mask_flat.view(batch_size, self.max_opinions)

        b = opinions[..., 0]
        d = opinions[..., 1]
        u = opinions[..., 2]
        a = opinions[..., 3]

        m = mask
        K = torch.sum(m, dim=1)

        sum_bu = torch.sum((b * u) * m, dim=1)
        sum_du = torch.sum((d * u) * m, dim=1)
        sum_au = torch.sum((a * u) * m, dim=1)
        sum_u  = torch.sum(u * m, dim=1)

        # Stable product via logs (avoids huge intermediates)
        u_masked = u * m + (self.one - m)                # 1 for masked-out entries
        u_clamped = torch.clamp(u_masked, min=self.epsilon, max=self.one)
        sum_log = torch.sum(torch.log(u_clamped), dim=1)
        prod_u = torch.exp(sum_log)

        # Sign-preserving denom clamp
        denom = sum_u - K + self.one
        denom_sign = torch.where(denom >= 0, self.one, -self.one)
        denom = denom_sign * torch.clamp(torch.abs(denom), min=self.epsilon)

        b_f = sum_bu / denom
        d_f = sum_du / denom
        u_f = prod_u / denom
        a_f = sum_au / denom

        fused = torch.stack([b_f, d_f, u_f, a_f], dim=1)
        rep = (b_f + a_f * u_f).unsqueeze(1)
        return fused, rep

def _gen_synthetic_opinions(N: int):
    b = torch.rand(N)
    d = torch.rand(N) * (1.0 - b)
    u = 1.0 - b - d
    a = torch.rand(N)
    opinions = torch.stack([b, d, u, a], dim=1)
    mask = torch.ones(N)
    return opinions, mask

def summarize_settings(path: str) -> dict:
    try:
        with open(path, "r") as f:
            s = json.load(f)
        out = {
            "logrows": s.get("logrows"),
            "input_visibility": s.get("input_visibility"),
            "param_visibility": s.get("param_visibility"),
            "output_visibility": s.get("output_visibility"),
        }
        if all(v is None for v in out.values()) and isinstance(s, dict):
            run_args = s.get("run_args") or s.get("py_run_args") or {}
            out.update({
                "input_visibility": run_args.get("input_visibility", out["input_visibility"]),
                "param_visibility": run_args.get("param_visibility", out["param_visibility"]),
                "output_visibility": run_args.get("output_visibility", out["output_visibility"]),
            })
        return out
    except Exception:
        return {}

# --------------------------- EZKL pipeline ------------------------------------

def run_zkml_pipeline_with_ebsl(logger: Logger, max_opinions: int = 16,
                               zk_strategy: str = "balanced",
                               manual_input_scale: int = None,
                               manual_param_scale: int = None,
                               skip_calibration: bool = False):
    logger.banner("ZKML pipeline: EBSL fusion in EZKL")
    wd = os.path.abspath("zkml_artifacts")
    os.makedirs(wd, exist_ok=True)

    # 1) Export ONNX
    with logger.timed("export_onnx", extra={"max_opinions": max_opinions}) as info:
        model = EBslFusionModule(max_opinions=max_opinions).eval()
        opinions, mask = _gen_synthetic_opinions(max_opinions)
        opinions_b, mask_b = opinions.unsqueeze(0), mask.unsqueeze(0)

        # Create combined input for single-input model
        opinions_flat = opinions_b.flatten(start_dim=1)
        mask_flat = mask_b.flatten(start_dim=1)
        combined_input = torch.cat([opinions_flat, mask_flat], dim=1)

        onnx_path = os.path.join(wd, "ebsl_model.onnx")
        torch.onnx.export(
            model,
            combined_input,
            onnx_path,
            input_names=["combined_input"],
            output_names=["fused", "rep"],
            opset_version=13,
            dynamic_axes=None,
        )
        info["onnx_path"] = onnx_path
        logger.ok(f"Exported ONNX -> {onnx_path}")
        if logger.verbose:
            logger.info(f"combined input shape: {tuple(combined_input.shape)}")
            logger.info("sample opinions[0,:3]: " + json.dumps(opinions_b[0, :3].detach().numpy().tolist(), indent=2))

    # 2) gen_settings
    with logger.timed("gen_settings") as info:
        run_args = ezkl.PyRunArgs()
        # visibility
        safe_setattr(run_args, "input_visibility",  "public", logger)
        safe_setattr(run_args, "param_visibility",  "fixed",  logger)
        safe_setattr(run_args, "output_visibility", "public", logger)

        # packing & rebasing defenses
        safe_setattr(run_args, "decomp_base", 16384, logger)          # 2^14 base
        safe_setattr(run_args, "decomp_legs", 4, logger)              # 4 limbs => ~56-bit capacity
        safe_setattr(run_args, "div_rebasing", True, logger)          # may be absent; safe_setattr handles it
        safe_setattr(run_args, "scale_rebase_multiplier", 2, logger)
        safe_setattr(run_args, "check_mode", "safe", logger)

        # scales
        if manual_input_scale is not None:
            safe_setattr(run_args, "input_scale", manual_input_scale, logger)
            safe_setattr(run_args, "param_scale", manual_param_scale or manual_input_scale, logger)
            logger.info(f"Using manual scales: input={manual_input_scale}, param={manual_param_scale or manual_input_scale}")
        elif zk_strategy == "conservative":
            safe_setattr(run_args, "input_scale", 4, logger)
            safe_setattr(run_args, "param_scale", 4, logger)
            logger.info("Using conservative ZK strategy (scale=4)")
        elif zk_strategy == "aggressive":
            safe_setattr(run_args, "input_scale", 8, logger)
            safe_setattr(run_args, "param_scale", 8, logger)
            logger.info("Using aggressive ZK strategy (scale=8)")
        else:  # balanced
            safe_setattr(run_args, "input_scale", 6, logger)
            safe_setattr(run_args, "param_scale", 6, logger)
            logger.info("Using balanced ZK strategy (scale=6)")

        settings_path = os.path.join(wd, "settings.json")
        # BUGFIX: use the outer-scope onnx_path, not info["onnx_path"]
        ok = run_with_loop(ezkl.gen_settings, model=onnx_path, output=settings_path, py_run_args=run_args)
        if not ok:
            raise RuntimeError("gen_settings failed")
        info["settings_path"] = settings_path
        info["summary"] = summarize_settings(settings_path)
        logger.ok(f"Generated settings -> {settings_path}")
        logger.info("settings summary: " + json.dumps(info["summary"], indent=2))

    # 3) input.json (GraphData: single input vector)
    with logger.timed("write_input_json") as info:
        opinions_data = opinions_b.detach().cpu().numpy().flatten().tolist()
        mask_data = mask_b.detach().cpu().numpy().flatten().tolist()
        combined_input_list = opinions_data + mask_data

        graph_data = {
            "input_data": [combined_input_list],
            "input_shapes": [[len(combined_input_list)]]
        }

        input_json = os.path.join(wd, "input.json")
        with open(input_json, "w") as f:
            json.dump(graph_data, f)
        info["input_json"] = input_json
        logger.ok(f"Wrote input -> {input_json}")

    # 4) calibrate_settings (robust)
    with logger.timed("calibrate_settings") as info:
        if skip_calibration:
            logger.info("Skipping calibration (--skip-calibration set)")
            info["calibrated"] = False
            info["skipped"] = True
            info["risk_assessment"] = {
                "numerical_precision": "unknown - using default scales",
                "performance": "potentially suboptimal",
                "circuit_size": "potentially larger than necessary",
                "proof_time": "may be slower than optimal"
            }
        else:
            cal_kwargs = dict(
                target="resources",
                lookup_safety_margin=2,
                scales=[6, 8, 10, 12],
                scale_rebase_multiplier=[1, 2, 4],
                max_logrows=16,
            )
            try:
                cal_ok = safe_calibrate(logger, data=input_json, model=onnx_path, settings=settings_path, **cal_kwargs)
                info["calibrated"] = bool(cal_ok)
                if cal_ok:
                    logger.ok("Settings calibrated successfully")
                    # Try to extract optimized scales
                    try:
                        with open(settings_path, 'r') as f:
                            settings = json.load(f)
                        ra = settings.get('run_args', settings.get('py_run_args', {}))
                        info["optimized_scales"] = {
                            "input_scale": ra.get('input_scale'),
                            "param_scale": ra.get('param_scale')
                        }
                        info["risk_assessment"] = {
                            "numerical_precision": "optimized",
                            "performance": "optimized",
                            "circuit_size": "optimized",
                            "proof_time": "optimized"
                        }
                        logger.info(f"Optimized scales: {info['optimized_scales']}")
                    except Exception:
                        pass
                else:
                    logger.warn("Calibration returned False - using balanced fallback scales")
                    with open(settings_path, 'r') as f:
                        settings = json.load(f)
                    fallback_scale = 6
                    if 'run_args' in settings:
                        settings['run_args']['input_scale'] = fallback_scale
                        settings['run_args']['param_scale'] = fallback_scale
                    elif 'py_run_args' in settings:
                        settings['py_run_args']['input_scale'] = fallback_scale
                        settings['py_run_args']['param_scale'] = fallback_scale
                    with open(settings_path, 'w') as f:
                        json.dump(settings, f, indent=2)
                    info["fallback_scales"] = {"input_scale": fallback_scale, "param_scale": fallback_scale}
            except Exception as e:
                info["calibration_exception"] = repr(e)
                logger.warn(f"Calibration failed: {e}")
                # Emergency fallback
                try:
                    with open(settings_path, 'r') as f:
                        settings = json.load(f)
                    ra_key = 'run_args' if 'run_args' in settings else 'py_run_args'
                    settings[ra_key]['input_scale'] = 6
                    settings[ra_key]['param_scale'] = 6
                    settings[ra_key]['lookup_range'] = [-1024, 1024]
                    with open(settings_path, 'w') as f:
                        json.dump(settings, f, indent=2)
                    logger.ok("Applied emergency fallback settings")
                    info["emergency_scales"] = {"input_scale": 6, "param_scale": 6}
                except Exception as e2:
                    logger.warn(f"Could not apply manual settings: {e2}")

    # 5) compile_circuit
    with logger.timed("compile_circuit") as info:
        compiled_path = os.path.join(wd, "compiled.onnx")
        ok = run_with_loop(ezkl.compile_circuit, model=onnx_path, compiled_circuit=compiled_path, settings_path=settings_path)
        if not ok:
            raise RuntimeError("compile_circuit failed")
        info["compiled_path"] = compiled_path
        logger.ok(f"Compiled circuit -> {compiled_path}")
        try:
            circuit_size = os.path.getsize(compiled_path)
            info["circuit_size_bytes"] = circuit_size
            logger.info(f"Compiled circuit size: {circuit_size:,} bytes ({circuit_size/1024:.1f} KB)")
        except Exception:
            pass

    # 6) get_srs
    with logger.timed("get_srs") as info:
        srs_path = os.path.join(wd, "kzg.srs")
        ok = get_srs_with_fallback(settings_path=settings_path, srs_path=srs_path, logger=logger)
        if not ok:
            raise RuntimeError("get_srs failed")
        info["srs_path"] = srs_path
        logger.ok(f"SRS ready -> {srs_path}")

    # 7) setup
    with logger.timed("setup") as info:
        pk_path = os.path.join(wd, "model.pk")
        vk_path = os.path.join(wd, "model.vk")
        ok = run_with_loop(ezkl.setup, model=compiled_path, vk_path=vk_path, pk_path=pk_path, srs_path=srs_path)
        if not ok:
            raise RuntimeError("setup failed")
        info["pk_path"] = pk_path
        info["vk_path"] = vk_path
        logger.ok(f"Setup complete -> pk:{pk_path}, vk:{vk_path}")

    # 8) gen_witness
    with logger.timed("gen_witness") as info:
        witness_path = os.path.join(wd, "witness.json")
        ok = run_with_loop(ezkl.gen_witness, data=input_json, model=compiled_path, output=witness_path)
        if not ok:
            raise RuntimeError("gen_witness failed")
        info["witness_path"] = witness_path
        try:
            witness_size = os.path.getsize(witness_path)
            info["witness_size_bytes"] = witness_size
            logger.info(f"Witness size: {witness_size:,} bytes ({witness_size/1024:.1f} KB)")
        except Exception:
            pass

        # Torch peek for numerical accuracy comparison
        with torch.no_grad():
            opinions_flat = opinions_b.flatten(start_dim=1)
            mask_flat = mask_b.flatten(start_dim=1)
            combined_input = torch.cat([opinions_flat, mask_flat], dim=1)
            fused_t, rep_t = EBslFusionModule(max_opinions=max_opinions).eval()(combined_input)
        info["torch_fused"] = fused_t[0].detach().cpu().numpy().tolist()
        info["torch_rep"] = rep_t[0].detach().cpu().numpy().tolist()
        logger.ok(f"Witness generated -> {witness_path}")
        logger.info("Torch fused: " + json.dumps(info["torch_fused"], indent=2))
        logger.info("Torch rep:   " + json.dumps(info["torch_rep"], indent=2))

    # 9) mock
    with logger.timed("mock"):
        ok = run_with_loop(ezkl.mock, witness=witness_path, model=compiled_path)
        if not ok:
            raise RuntimeError("mock failed")
        logger.ok("Mock successful")

    # 10) prove
    with logger.timed("prove") as info:
        proof_path = os.path.join(wd, "proof.pf")
        ok = run_with_loop(
            ezkl.prove,
            witness=witness_path, model=compiled_path, pk_path=pk_path,
            proof_path=proof_path, srs_path=srs_path, proof_type="single"
        )
        if not ok:
            raise RuntimeError("prove failed")
        info["proof_path"] = proof_path
        try:
            proof_size = os.path.getsize(proof_path)
            info["proof_size_bytes"] = proof_size
            logger.ok(f"Proof generated -> {proof_path} ({proof_size:,} bytes, {proof_size/1024:.1f} KB)")
        except Exception:
            logger.ok(f"Proof generated -> {proof_path}")

    # 11) verify
    with logger.timed("verify") as info:
        ok = run_with_loop(ezkl.verify, proof_path=proof_path, settings_path=settings_path, vk_path=vk_path, srs_path=srs_path)
        info["verified"] = bool(ok)
        if ok:
            logger.ok("Proof verified ✅")
        else:
            logger.error("Proof verification failed ❌")

# --------------------------- Calibration impact (optional) --------------------

def measure_calibration_impact(logger: Logger, max_opinions: int = 4):
    logger.banner("Calibration Impact Analysis")
    results = {}
    try:
        logger.info("Testing WITH calibration...")
        with logger.timed("with_calibration") as info:
            run_zkml_pipeline_with_ebsl(logger, max_opinions=max_opinions,
                                       zk_strategy="balanced", skip_calibration=False)
        results["with_calibration"] = info
    except Exception as e:
        logger.warn(f"Calibration test failed: {e}")
        results["with_calibration"] = {"error": str(e)}

    try:
        logger.info("Testing WITHOUT calibration...")
        with logger.timed("without_calibration") as info:
            run_zkml_pipeline_with_ebsl(logger, max_opinions=max_opinions,
                                       zk_strategy="balanced", skip_calibration=True)
        results["without_calibration"] = info
    except Exception as e:
        logger.warn(f"Non-calibration test failed: {e}")
        results["without_calibration"] = {"error": str(e)}

    logger.banner("Calibration Impact Report")
    with_time = sum(step.seconds for step in logger.steps if "with_calibration" in step.name)
    without_time = sum(step.seconds for step in logger.steps if "without_calibration" in step.name)
    logger.info(f"WITH calibration total time: {with_time:.2f}s")
    logger.info(f"WITHOUT calibration total time: {without_time:.2f}s")
    if with_time and without_time:
        if with_time < without_time:
            logger.ok(f"Calibration improved performance by {((without_time - with_time) / without_time * 100):.1f}%")
        else:
            logger.warn(f"Calibration overhead {((with_time - without_time) / without_time * 100):.1f}%")
    return results

# --------------------------- Main --------------------------------------------

def main():
    ap = argparse.ArgumentParser(description="EBSL + EZKL (Fixed)")
    ap.add_argument("--verbose", action="store_true", help="Enable verbose logs")
    ap.add_argument("--max-opinions", type=int, default=16, help="Max opinion rows (fixed circuit shape)")
    ap.add_argument("--skip-plots", action="store_true", help="Skip performance plot generation")
    ap.add_argument("--zk-strategy", choices=["conservative", "balanced", "aggressive"],
                    default="balanced", help="ZK optimization strategy")
    ap.add_argument("--input-scale", type=int, help="Manual input scale override")
    ap.add_argument("--param-scale", type=int, help="Manual parameter scale override")
    ap.add_argument("--skip-calibration", action="store_true", help="Skip calibration step for production use")
    ap.add_argument("--measure-calibration", action="store_true", help="Measure calibration vs non-calibration impact")
    args = ap.parse_args()

    logger = Logger(verbose=args.verbose)

    try:
        if args.measure_calibration:
            measure_calibration_impact(logger, max_opinions=4)
        else:
            run_property_based_correctness_test(logger)
            run_comparative_performance_analysis(logger, skip_plots=args.skip_plots)
            run_zkml_pipeline_with_ebsl(logger, max_opinions=args.max_opinions,
                                       zk_strategy=args.zk_strategy,
                                       manual_input_scale=args.input_scale,
                                       manual_param_scale=args.param_scale,
                                       skip_calibration=args.skip_calibration)
    except Exception as e:
        logger.error(f"Fatal error: {e}")
    finally:
        report_path = os.path.join("zkml_artifacts", "run_report.json")
        logger.dump_report(report_path)
        print("\n--- All Functional Script Stages Finished ---")

if __name__ == "__main__":
    main()
