#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Monolithic Implementation of EBSL with ZKML Proof Generation using EZKL

This script encapsulates the core principles from the EBSL_Torch_EZKL notebook into a
single, executable Python file. It demonstrates a complete end-to-end workflow:

Part 1: Evidence-Based Subjective Logic (EBSL)
  - Implements a vectorized EBSL algorithm using PyTorch for efficient computation.
  - Generates a realistic P2P web-of-trust network using NetworkX.
  - Computes global reputation scores based on trust attestations (opinions).
  - The fusion logic is designed to be ZK-friendly, using only basic arithmetic operations.

Part 2: ONNX Model Export
  - Defines a PyTorch `nn.Module` that mirrors the ZK-friendly EBSL fusion logic.
  - Exports this model to a static ONNX graph, which is required for the EZKL pipeline.

Part 3: Zero-Knowledge Proof Generation with EZKL
  - Uses the EZKL Python API to orchestrate the ZK-SNARK pipeline.
  - Demonstrates a "witness-first" flow: settings are generated, the circuit is compiled,
    a witness is created from sample data, and then the proving/verification keys are set up.
  - Generates a zero-knowledge proof attesting to the correct execution of the EBSL fusion.
  - Verifies the proof to confirm the integrity of the computation.

Unique Aspects Captured:
- Vectorized, arithmetic-only EBSL fusion suitable for ZK circuits.
- Static ONNX export for compatibility with EZKL's Halo2 backend.
- Complete EZKL pipeline (settings, SRS, compile, witness, setup, prove, verify) using the Python API.
- Compatibility functions to handle potential differences across EZKL versions.
"""

import os
import json
import time
import random
import pathlib

import numpy as np
import torch
import torch.nn as nn
import torch.onnx
import pandas as pd
import networkx as nx
import ezkl  # requires ezkl to be installed

# Optional reproducibility for consistent data generation and model initialization
random.seed(1337)
torch.manual_seed(1337)
np.random.seed(1337)


# ===============================================
# Part 1: Evidence-Based Subjective Logic (EBSL)
# ===============================================

class Opinion:
    """Subjective Logic Opinion as (belief, disbelief, uncertainty, base_rate)."""
    __slots__ = ("belief", "disbelief", "uncertainty", "base_rate")

    def __init__(self, belief=0.0, disbelief=0.0, uncertainty=1.0, base_rate=0.5):
        self.belief = float(belief)
        self.disbelief = float(disbelief)
        self.uncertainty = float(uncertainty)
        self.base_rate = float(base_rate)

    def to_tensor(self):
        """Converts the opinion to a PyTorch tensor."""
        return torch.tensor([self.belief, self.disbelief, self.uncertainty, self.base_rate], dtype=torch.float32)

    @classmethod
    def from_tensor(cls, t):
        """Creates an Opinion object from a PyTorch tensor."""
        return cls(float(t[0]), float(t[1]), float(t[2]), float(t[3]))

    def __repr__(self):
        return f"Opinion(b={self.belief:.3f}, d={self.disbelief:.3f}, u={self.uncertainty:.3f}, a={self.base_rate:.3f})"


class EBSLAlgorithm:
    """
    Evidence-Based Subjective Logic – vectorized. Cumulative fusion is implemented with
    basic arithmetic operations for ZK-friendly ONNX export.
    """
    def __init__(self, num_nodes: int, device="cpu"):
        self.num_nodes = num_nodes
        self.device = torch.device(device)
        self.trust_matrix = torch.zeros((num_nodes, num_nodes, 4), dtype=torch.float32, device=self.device)
        # Default: full uncertainty, base_rate=0.5
        self.trust_matrix[..., 2] = 1.0
        self.trust_matrix[..., 3] = 0.5
        # Reputation (starts uncertain)
        self.reputation = torch.zeros((num_nodes, 4), dtype=torch.float32, device=self.device)
        self.reputation[:, 2] = 1.0
        self.reputation[:, 3] = 0.5

    @staticmethod
    def _safe_pairwise_product_across_sources(x: torch.Tensor, eps: float = 1e-6) -> torch.Tensor:
        """
        Computes product over the source dimension (S) of a tensor of shape [S, N]
        using only clamped multiplications. This avoids ReduceProd, making the ONNX graph
        EZKL-friendly.
        """
        S = x.shape[0]
        acc = torch.ones_like(x[0])
        for i in range(S):
            acc = acc * torch.clamp(x[i], eps, 1.0 - eps)
        return acc

    def fuse_all_nodes(self, eps_sum: float = 1e-6) -> torch.Tensor:
        """
        Performs a single-pass cumulative fusion for all target nodes using only
        arithmetic operations (+, -, *, /, clamp) for ZK compatibility.
        """
        T = self.trust_matrix  # [S, N, 4]
        S, N = T.shape[0], T.shape[1]
        b = T[..., 0]  # [S, N]
        d = T[..., 1]
        u = T[..., 2]
        a = T[..., 3]

        # Fused belief: 1 - Π (1 - b_k)
        prod_1mb = self._safe_pairwise_product_across_sources(1.0 - b)
        fused_b = torch.clamp(1.0 - prod_1mb, 1e-6, 1.0 - 1e-6)

        # Fused disbelief: 1 - Π (1 - d_k)
        prod_1md = self._safe_pairwise_product_across_sources(1.0 - d)
        fused_d = torch.clamp(1.0 - prod_1md, 1e-6, 1.0 - 1e-6)

        # Fused uncertainty: Π u_k
        prod_u = self._safe_pairwise_product_across_sources(u)
        fused_u = torch.clamp(prod_u, 1e-6, 1.0 - 1e-6)

        # Normalize to ensure b + d + u = 1
        total = fused_b + fused_d + fused_u + eps_sum
        fused_b = fused_b / total
        fused_d = fused_d / total
        fused_u = fused_u / total

        # Fused base rate: weighted by (1 - u) across sources
        weights = (1.0 - u)  # [S, N]
        num = torch.zeros((N,), dtype=torch.float32, device=self.device)
        den = torch.zeros((N,), dtype=torch.float32, device=self.device)
        for i in range(S):
            num += a[i] * weights[i]
            den += weights[i]
        fused_a = torch.where(den > 0.0, num / (den + 1e-6), torch.full_like(den, 0.5))

        rep = torch.stack([fused_b, fused_d, fused_u, fused_a], dim=1)  # [N, 4]
        self.reputation = rep
        return rep

    def compute_reputation(self) -> torch.Tensor:
        """Computes reputation. A single pass is sufficient for this cumulative fusion."""
        return self.fuse_all_nodes()


class WebOfTrustDataset:
    """Generates a synthetic scale-free P2P trust network."""
    def __init__(self, num_nodes=50):
        self.num_nodes = num_nodes
        self.graph = nx.DiGraph()
        self.graph.add_nodes_from(range(num_nodes))

    def generate_scale_free_network(self, num_edges=100):
        if num_edges < self.num_nodes:
            num_edges = self.num_nodes * 2
        prob = min(1.0, num_edges / (self.num_nodes * (self.num_nodes - 1)))
        G = nx.gnp_random_graph(self.num_nodes, prob, directed=True)
        for u, v in G.edges():
            if u != v and not self.graph.has_edge(u, v):
                self.graph.add_edge(u, v)
        while self.graph.number_of_edges() < num_edges:
            s = random.randrange(self.num_nodes)
            t = random.randrange(self.num_nodes)
            if s != t and not self.graph.has_edge(s, t):
                self.graph.add_edge(s, t)
        return self.graph

    def generate_trust_levels(self):
        out = []
        for (s, t) in self.graph.edges():
            if random.random() < 0.6:  # 60% of edges have a non-uncertain opinion
                pos = random.random() < 0.85
                strength = random.uniform(0.5, 0.9)
                op = Opinion(
                    belief=strength if pos else 1.0 - strength,
                    disbelief=(1.0 - strength) if pos else strength,
                    uncertainty=random.uniform(0.0, 0.2),
                    base_rate=0.5
                )
            else:  # 40% are fully uncertain
                op = Opinion(0.0, 0.0, 1.0, 0.5)
            out.append((s, t, op))
        return out


# ==============================================
# Part 2: PyTorch Model for ONNX Static Export
# ==============================================

class EBSLFusionONNX(nn.Module):
    """
    PyTorch module that takes a flattened [N*N*4] trust tensor and emits [N,4] fused opinions.
    This module mirrors the ZK-friendly logic of EBSLAlgorithm.fuse_all_nodes.
    """
    def __init__(self, N: int):
        super().__init__()
        self.N = int(N)

    @staticmethod
    def _clamp01(x, lo=1e-6, hi=1.0 - 1e-6):
        return torch.clamp(x, lo, hi)

    def _reduce_mul_over_sources(self, X):  # X: [S, N]
        S = X.shape[0]
        acc = torch.ones_like(X[0])
        for i in range(S):
            acc = acc * self._clamp01(X[i])
        return acc

    def forward(self, flat):
        # The input 'flat' is expected to be [1, N*N*4]. We reshape it to [S=N, N, 4].
        N = self.N
        T = flat.view(1, N * N * 4).view(N, N, 4)  # [S, N, 4]; S == N

        b = T[..., 0]  # [S, N]
        d = T[..., 1]
        u = T[..., 2]
        a = T[..., 3]

        prod_1mb = self._reduce_mul_over_sources(1.0 - b)
        prod_1md = self._reduce_mul_over_sources(1.0 - d)
        prod_u = self._reduce_mul_over_sources(u)

        fb = self._clamp01(1.0 - prod_1mb)
        fd = self._clamp01(1.0 - prod_1md)
        fu = self._clamp01(prod_u)

        total = fb + fd + fu + 1e-6
        fb = fb / total
        fd = fd / total
        fu = fu / total

        weights = (1.0 - u)  # [S, N]
        num = torch.zeros_like(fb)
        den = torch.zeros_like(fb)
        for i in range(N):
            num = num + a[i] * weights[i]
            den = den + weights[i]
        fa = torch.where(den > 0.0, num / (den + 1e-6), torch.full_like(den, 0.5))

        out = torch.stack([fb, fd, fu, fa], dim=1)  # [N, 4]
        return out


# ==========================================
# Part 3: EZKL Workflow Helper Functions
# ==========================================

def save_json(path, obj):
    """Saves a Python object to a JSON file."""
    with open(path, "w") as f:
        json.dump(obj, f, indent=2)


def read_json(path):
    """Reads a JSON file into a Python object."""
    with open(path, "r") as f:
        return json.load(f)


def gen_settings_compat(model_path: str, settings_path: str):
    """
    Generates EZKL settings using PyRunArgs for compatibility across versions.
    Falls back to a simple call and JSON patching for older builds.
    """
    try:
        runargs = ezkl.PyRunArgs()

        def set_if(obj, name, value):
            if hasattr(obj, name):
                setattr(obj, name, value)
                return True
            return False

        set_if(runargs, "input_scale", 5)
        set_if(runargs, "param_scale", 5)
        if not set_if(runargs, "tolerance", 1e-5):
            set_if(runargs, "epsilon", 1e-5)
        set_if(runargs, "logrows", 17)
        try:
            runargs.commitment = ezkl.PyCommitments.KZG
        except Exception:
            set_if(runargs, "commitment", "KZG")
        set_if(runargs, "input_visibility", "Private")
        set_if(runargs, "output_visibility", "Public")
        set_if(runargs, "param_visibility", "Private")

        ezkl.gen_settings(model=model_path, output=settings_path, py_run_args=runargs)
    except (TypeError, AttributeError):
        print("    (Using fallback gen_settings API)")
        ezkl.gen_settings(model_path, settings_path)
        # Patch JSON for older builds
        s = read_json(settings_path)
        ra = s.get("run_args", {}) or {}
        ra.update({
            "input_scale": 5, "param_scale": 5, "epsilon": 1e-5,
            "logrows": 17, "commitment": "KZG", "input_visibility": "Private",
            "output_visibility": "Public", "param_visibility": "Private"
        })
        s["run_args"] = ra
        if not s.get("model_input_scales"): s["model_input_scales"] = [5]
        if not s.get("model_output_scales"): s["model_output_scales"] = [5]
        save_json(settings_path, s)

def compile_circuit_compat(model_path: str, compiled_path: str, settings_path: str):
    """EZKL compile_circuit compatibility wrapper."""
    try:
        ezkl.compile_circuit(model=model_path, compiled_circuit=compiled_path, settings_path=settings_path)
    except TypeError:
        ezkl.compile_circuit(model_path, compiled_path, settings_path)

def gen_witness_compat(data_path: str, compiled_path: str, witness_path: str):
    """EZKL gen_witness compatibility wrapper."""
    try:
        ezkl.gen_witness(data=data_path, model=compiled_path, output=witness_path)
    except TypeError:
        ezkl.gen_witness(data_path, compiled_path, witness_path)

def setup_compat(compiled_path: str, vk_path: str, pk_path: str):
    """EZKL setup compatibility wrapper."""
    try:
        ezkl.setup(model=compiled_path, vk_path=vk_path, pk_path=pk_path)
    except TypeError:
        ezkl.setup(compiled_path, vk_path, pk_path)

def prove_compat(compiled_path: str, witness_path: str, pk_path: str, proof_path: str):
    """EZKL prove compatibility wrapper."""
    try:
        ezkl.prove(witness=witness_path, model=compiled_path, pk_path=pk_path, proof_path=proof_path)
    except TypeError:
        ezkl.prove(witness_path, compiled_path, pk_path, proof_path)

def verify_compat(settings_path: str, vk_path: str, proof_path: str) -> bool:
    """EZKL verify compatibility wrapper."""
    try:
        return ezkl.verify(proof_path=proof_path, settings_path=settings_path, vk_path=vk_path)
    except TypeError:
        return ezkl.verify(proof_path, settings_path, vk_path)

def ensure_kzg_srs(settings_path: str):
    """Provisions the required KZG Structured Reference String (SRS)."""
    try:
        ezkl.get_srs(settings_path=settings_path)
        return
    except Exception:
        pass
    # Fallback for some builds
    s = read_json(settings_path)
    lr = int(s.get("run_args", {}).get("logrows", 17))
    home = pathlib.Path.home()
    srs_dir = home / ".ezkl" / "srs"
    srs_dir.mkdir(parents=True, exist_ok=True)
    canonical = srs_dir / f"kzg{lr}.srs"
    if hasattr(ezkl, "gen_srs"):
        ezkl.gen_srs(str(canonical), lr)
    if not canonical.exists() or canonical.stat().st_size == 0:
        raise RuntimeError("Failed to provision KZG SRS")


# =================================
# Main Execution Workflow
# =================================

def main():
    """Orchestrates the entire EBSL -> ONNX -> EZKL workflow."""
    print("--- Starting Monolithic EBSL → ONNX → EZKL Workflow ---")

    # ========= Part 1: Data & EBSL =========
    N, E = 30, 80
    ds = WebOfTrustDataset(N)
    G = ds.generate_scale_free_network(num_edges=E)
    edges = ds.generate_trust_levels()
    print(f"Generated graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")

    ebsl = EBSLAlgorithm(N, device="cpu")
    for s, t, op in edges:
        ebsl.trust_matrix[s, t] = op.to_tensor()

    print("\nComputing EBSL reputation...")
    t0 = time.time()
    rep = ebsl.compute_reputation()
    print(f"Reputation computed in {time.time() - t0:.4f}s\n")

    reputation_df = pd.DataFrame([
        {"node_id": i, "belief": float(rep[i, 0]), "disbelief": float(rep[i, 1]),
         "uncertainty": float(rep[i, 2]), "base_rate": float(rep[i, 3])}
        for i in range(N)
    ])
    print("Reputation Analysis Summary:")
    print(reputation_df.describe())

    # ========= Part 2: Export ONNX (static) =========
    model = EBSLFusionONNX(N)
    onnx_path = "ebsl_fusion.onnx"
    print("\nExporting EBSL fusion to ONNX (static, arith-only)...")
    dummy = torch.rand(1, N * N * 4, dtype=torch.float32)
    torch.onnx.export(
        model, dummy, onnx_path,
        input_names=["input"], output_names=["output"],
        opset_version=17, dynamic_axes=None,  # static shapes are crucial for EZKL
    )
    print(f"✅ ONNX exported to {onnx_path}")

    # ========= Part 3: Prepare EZKL IO =========
    INPUT_PATH = "input.json"
    flat_input = ebsl.trust_matrix.cpu().numpy().astype(np.float32).reshape(-1).tolist()
    with torch.no_grad():
        expected_output = model(torch.tensor(flat_input, dtype=torch.float32).view(1, -1)).detach().cpu().numpy().reshape(-1).tolist()
    save_json(INPUT_PATH, {"input_data": [flat_input], "output_data": [expected_output]})
    print("\nWriting EZKL input file...")
    print(f"✅ {INPUT_PATH} written")

    # Define file paths for the EZKL pipeline
    CIRCUIT_PATH = "model.ezkl"
    SETTINGS_PATH = "settings.json"
    WITNESS_PATH = "witness.json"
    VK_PATH = "vk.key"
    PK_PATH = "pk.key"
    PROOF_PATH = "proof.json"

    print("\n=== EZKL Pipeline (Python API, KZG; witness-first, static ONNX) ===")

    # [1/7] gen-settings
    print("\n[1/7] Generating settings...")
    gen_settings_compat(onnx_path, SETTINGS_PATH)
    s = read_json(SETTINGS_PATH)
    print(f"    Settings generated: commitment={s['run_args'].get('commitment')}, logrows={s['run_args'].get('logrows')}")

    # [2/7] ensure KZG SRS
    print("[2/7] Ensuring KZG SRS is available...")
    ensure_kzg_srs(SETTINGS_PATH)
    print("    ✅ SRS is ready")

    # [3/7] compile-circuit
    print("[3/7] Compiling circuit...")
    compile_circuit_compat(onnx_path, CIRCUIT_PATH, SETTINGS_PATH)
    print(f"    Circuit compiled: {CIRCUIT_PATH} ({os.path.getsize(CIRCUIT_PATH)} bytes)")

    # [4/7] gen-witness (before setup)
    print("[4/7] Generating witness...")
    gen_witness_compat(INPUT_PATH, CIRCUIT_PATH, WITNESS_PATH)
    print(f"    Witness generated: {WITNESS_PATH} ({os.path.getsize(WITNESS_PATH)} bytes)")

    # [5/7] setup (PK/VK)
    print("[5/7] Setting up proving and verification keys...")
    t_start = time.time()
    setup_compat(CIRCUIT_PATH, VK_PATH, PK_PATH)
    print(f"    Setup completed in {time.time() - t_start:.2f}s")
    print(f"    Proving Key (pk): {PK_PATH} ({os.path.getsize(PK_PATH)} bytes)")
    print(f"    Verification Key (vk): {VK_PATH} ({os.path.getsize(VK_PATH)} bytes)")

    # [6/7] prove
    print("[6/7] Generating proof...")
    t_start = time.time()
    prove_compat(CIRCUIT_PATH, WITNESS_PATH, PK_PATH, PROOF_PATH)
    print(f"    Proof generated in {time.time() - t_start:.2f}s")
    print(f"    Proof: {PROOF_PATH} ({os.path.getsize(PROOF_PATH)} bytes)")

    # [7/7] verify
    print("[7/7] Verifying proof...")
    t_start = time.time()
    is_valid = verify_compat(SETTINGS_PATH, VK_PATH, PROOF_PATH)
    print(f"    Verification completed in {time.time() - t_start:.2f}s")
    print("✅ Proof VERIFIED successfully!" if is_valid else "❌ Proof verification FAILED.")

    print("\n--- Workflow complete ---")

if __name__ == "__main__":
    main()
