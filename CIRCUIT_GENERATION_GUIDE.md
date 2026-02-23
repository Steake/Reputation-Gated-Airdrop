# EZKL Circuit Generation Guide

**Critical Task:** Generate actual EZKL circuits to replace placeholder infrastructure

**Estimated Time:** 4-8 hours (depending on hardware)
**Prerequisites:** Linux/macOS with 16GB+ RAM, GPU recommended

---

## Quick Start

```bash
# 1. Navigate to notebooks directory
cd Notebooks

# 2. Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run circuit generation script
python ebsl_full_script.py --max-opinions 16 --output-dir ../public/circuits/ebsl_16
python ebsl_full_script.py --max-opinions 32 --output-dir ../public/circuits/ebsl_32
python ebsl_full_script.py --max-opinions 64 --output-dir ../public/circuits/ebsl_64

# 5. Generate circuit manifest
cd ..
npm run generate-circuit-manifest
```

---

## Detailed Instructions

### Step 1: Environment Setup

#### System Requirements

- **OS:** Linux (Ubuntu 20.04+) or macOS (12+)
- **RAM:** 16GB minimum, 32GB recommended
- **CPU:** Multi-core processor (8+ cores recommended)
- **GPU:** NVIDIA GPU with CUDA support (optional but significantly faster)
- **Storage:** 10GB free space for circuits and temporary files
- **Python:** 3.10 or 3.11 (tested with 3.11.14)

#### Create Virtual Environment

```bash
cd Notebooks

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip
```

#### Install Dependencies

```bash
# Install required packages
pip install -r requirements.txt

# Verify installations
python -c "import torch; print(f'PyTorch: {torch.__version__}')"
python -c "import ezkl; print(f'EZKL: {ezkl.__version__}')"
python -c "import onnx; print(f'ONNX: {onnx.__version__}')"
```

**Expected output:**

```
PyTorch: 2.8.0
EZKL: 22.2.1
ONNX: 1.16.x
```

### Step 2: Understand the Pipeline

The EBSL + EZKL pipeline consists of:

1. **EBSL Model Definition** (PyTorch)
   - Implements subjective logic fusion
   - Overflow-safe operations
   - ZK-friendly computations

2. **ONNX Export**
   - Converts PyTorch model to ONNX format
   - Required for EZKL circuit compilation

3. **EZKL Circuit Compilation**
   - Generates proving and verifying keys
   - Creates compiled circuit WASM
   - Produces circuit settings

4. **Witness Generation**
   - Creates example inputs
   - Generates witness data
   - Tests circuit functionality

5. **Proof Generation (Optional)**
   - Generates a test proof
   - Verifies the proof
   - Validates end-to-end pipeline

### Step 3: Run Circuit Generation

#### Option A: Using the Python Script (Recommended)

```bash
# Navigate to Notebooks directory
cd Notebooks

# Generate circuits for different sizes
# 16 opinions (fastest, good for testing)
python ebsl_full_script.py \
  --max-opinions 16 \
  --output-dir ../public/circuits/ebsl_16 \
  --skip-proof  # Skip proof generation for faster compilation

# 32 opinions (medium, production-ready)
python ebsl_full_script.py \
  --max-opinions 32 \
  --output-dir ../public/circuits/ebsl_32 \
  --skip-proof

# 64 opinions (large, for high-trust scenarios)
python ebsl_full_script.py \
  --max-opinions 64 \
  --output-dir ../public/circuits/ebsl_64 \
  --skip-proof
```

**Script Arguments:**

- `--max-opinions`: Number of opinions the circuit can handle (16, 32, or 64)
- `--output-dir`: Where to save circuit artifacts
- `--skip-proof`: Skip proof generation (faster compilation, recommended)
- `--zk-strategy`: Optimization level ("conservative", "balanced", "aggressive")
- `--verbose`: Enable detailed logging

#### Option B: Using Jupyter Notebook

```bash
# Install Jupyter if not already installed
pip install jupyter

# Start Jupyter
jupyter notebook

# Open EBSL_Pipeline_Complete.ipynb
# Run all cells (Cell -> Run All)
```

**Notebook Cells:**

1. Imports and setup
2. EBSL model definition
3. Model testing
4. ONNX export
5. EZKL circuit compilation
6. Witness generation
7. Proof generation (optional)
8. Performance analysis

### Step 4: Verify Circuit Generation

After running the script, verify that the following files exist:

```bash
# Check directory structure
ls -la public/circuits/ebsl_16/
ls -la public/circuits/ebsl_32/
ls -la public/circuits/ebsl_64/
```

**Expected files for each circuit size:**

```
public/circuits/ebsl_16/
├── _compiled.wasm          # Compiled circuit (WASM format)
├── settings.json           # Circuit settings and parameters
├── vk.key                  # Verifying key
├── pk.key                  # Proving key (optional, used for server-side)
├── srs.params              # Structured Reference String (optional)
└── witness.json            # Example witness (for testing)
```

**Verify file sizes:**

```bash
# Compiled circuits should be several MB
du -h public/circuits/ebsl_*/compiled.wasm

# Verifying keys should be several hundred KB
du -h public/circuits/ebsl_*/vk.key
```

### Step 5: Generate Circuit Manifest

Create a script to calculate SHA-256 hashes for circuit integrity verification:

```bash
# Create manifest generation script
cat > scripts/generate-manifest.sh << 'EOF'
#!/bin/bash
set -e

CIRCUITS_DIR="public/circuits"
OUTPUT_FILE="src/lib/zkml/circuit-hashes.json"

echo "Generating circuit manifest..."
echo "{" > $OUTPUT_FILE

for size in 16 32 64; do
  CIRCUIT_DIR="$CIRCUITS_DIR/ebsl_$size"

  if [ -d "$CIRCUIT_DIR" ]; then
    # Calculate combined hash of compiled.wasm + vk.key
    COMPILED_WASM="$CIRCUIT_DIR/_compiled.wasm"
    VK_KEY="$CIRCUIT_DIR/vk.key"

    if [ -f "$COMPILED_WASM" ] && [ -f "$VK_KEY" ]; then
      HASH=$(cat "$COMPILED_WASM" "$VK_KEY" | sha256sum | awk '{print $1}')
      echo "  \"$size\": \"$HASH\"," >> $OUTPUT_FILE
      echo "✓ Generated hash for ebsl_$size: $HASH"
    else
      echo "✗ Missing files for ebsl_$size"
    fi
  else
    echo "✗ Directory not found: $CIRCUIT_DIR"
  fi
done

# Remove trailing comma and close JSON
sed -i '$ s/,$//' $OUTPUT_FILE
echo "}" >> $OUTPUT_FILE

echo "✓ Manifest generated: $OUTPUT_FILE"
cat $OUTPUT_FILE
EOF

chmod +x scripts/generate-manifest.sh

# Run manifest generation
./scripts/generate-manifest.sh
```

### Step 6: Update Circuit Manager

Update `src/lib/zkml/circuit-manager.ts` with the generated hashes:

```typescript
// Replace the placeholder hashes with real ones
export const CIRCUIT_HASHES: Record<string, string> = {
  "16": "abc123...", // From manifest
  "32": "def456...", // From manifest
  "64": "ghi789...", // From manifest
};
```

### Step 7: Test Circuit Loading

```bash
# Build the project
npm run build

# Start dev server
npm run dev

# In browser console (http://localhost:5173):
# Open developer tools and check for circuit loading logs
```

**Expected browser console output:**

```
[CircuitManager] Downloading 16 circuit...
[CircuitManager] Downloaded 16 circuit (hash: abc123...)
[CircuitManager] Cached 16 circuit
[EZKL] Loading @ezkljs/engine...
[EZKL] Engine loaded successfully
```

---

## Troubleshooting

### Common Issues

#### 1. EZKL Installation Fails

**Error:** `Failed building wheel for ezkl`

**Solution:**

```bash
# Install build dependencies
sudo apt-get install build-essential libssl-dev libffi-dev python3-dev

# Or on macOS:
brew install openssl

# Retry installation
pip install ezkl==22.2.1
```

#### 2. PyTorch CUDA Issues

**Error:** `CUDA not available` or `torch.cuda.is_available() returns False`

**Solution:**

```bash
# Install PyTorch with CUDA support
pip install torch==2.8.0+cu118 -f https://download.pytorch.org/whl/torch_stable.html

# Or use CPU-only version (slower but works):
pip install torch==2.8.0+cpu -f https://download.pytorch.org/whl/torch_stable.html
```

#### 3. Memory Errors During Compilation

**Error:** `MemoryError` or `OOM (Out of Memory)`

**Solution:**

```bash
# Reduce circuit size
python ebsl_full_script.py --max-opinions 8  # Smaller circuit

# Or add swap space (Linux):
sudo fallocate -l 8G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Close other applications to free memory
```

#### 4. EZKL Circuit Compilation Hangs

**Error:** Script hangs during `ezkl.compile()` step

**Solution:**

```bash
# Use more aggressive timeout
python ebsl_full_script.py --timeout 3600  # 1 hour

# Or compile with CLI directly:
ezkl compile-circuit \
  --model zkml_artifacts/ebsl_model.onnx \
  --compiled-circuit zkml_artifacts/_compiled.wasm \
  --settings zkml_artifacts/settings.json
```

#### 5. ONNX Export Fails

**Error:** `RuntimeError: ONNX export failed`

**Solution:**

```python
# In the notebook or script, add explicit opset version:
torch.onnx.export(
    model,
    dummy_input,
    "ebsl_model.onnx",
    opset_version=13,  # Try different versions: 11, 12, 13, 14
    do_constant_folding=True,
    input_names=['combined_input'],
    output_names=['fused_opinion'],
)
```

#### 6. Circuit Hash Mismatch

**Error:** `Circuit integrity error: downloaded circuit hash mismatch`

**Solution:**

```bash
# Regenerate manifest
./scripts/generate-manifest.sh

# Clear browser cache (in DevTools):
# Application -> Storage -> Clear site data

# Verify files weren't corrupted:
shasum -a 256 public/circuits/ebsl_16/_compiled.wasm
```

---

## Performance Optimization

### Compilation Time

| Circuit Size | Opinions | Compile Time | Memory Usage |
| ------------ | -------- | ------------ | ------------ |
| Small        | 16       | 15-30 min    | 4-8 GB       |
| Medium       | 32       | 30-60 min    | 8-16 GB      |
| Large        | 64       | 1-2 hours    | 16-32 GB     |

**Tips:**

- Use `--skip-proof` to save 50% compilation time
- Use `--zk-strategy=balanced` for good performance/security trade-off
- Run compilations in parallel for different sizes (if you have enough RAM)

### Proof Generation Time

| Circuit Size | Opinions | Prove Time (CPU) | Prove Time (GPU) |
| ------------ | -------- | ---------------- | ---------------- |
| Small        | 16       | 2-5 seconds      | <1 second        |
| Medium       | 32       | 5-15 seconds     | 1-3 seconds      |
| Large        | 64       | 15-60 seconds    | 3-10 seconds     |

---

## Advanced Configuration

### Custom EZKL Settings

Modify `ebsl_full_script.py` to customize circuit parameters:

```python
# In the script, find the settings generation section:
settings = {
    "run_args": {
        "tolerance": 0.0,
        "input_scale": 7,       # Higher = more precision, larger circuit
        "param_scale": 7,
        "scale_rebase_multiplier": 10,
        "lookup_range": [-32768, 32768],
        "logrows": 17,          # 2^17 rows, increase for larger circuits
        "num_inner_cols": 2,
        "variables": ["batch_size"],
        "input_visibility": "public",
        "output_visibility": "public",
        "param_visibility": "fixed",
    }
}
```

### Batch Circuit Generation

Create a batch script to generate all circuits:

```bash
#!/bin/bash
# batch-generate-circuits.sh

SIZES=(16 32 64)
OUTPUT_BASE="../public/circuits"

for size in "${SIZES[@]}"; do
  echo "==================================="
  echo "Generating circuit for $size opinions"
  echo "==================================="

  python ebsl_full_script.py \
    --max-opinions $size \
    --output-dir "$OUTPUT_BASE/ebsl_$size" \
    --skip-proof \
    --zk-strategy balanced \
    --verbose

  if [ $? -eq 0 ]; then
    echo "✓ Successfully generated ebsl_$size circuit"
  else
    echo "✗ Failed to generate ebsl_$size circuit"
    exit 1
  fi
done

echo "==================================="
echo "Generating circuit manifest"
echo "==================================="
./scripts/generate-manifest.sh

echo "✓ All circuits generated successfully!"
```

---

## Verification Checklist

Before proceeding to testing, verify:

- [ ] Python environment set up correctly
- [ ] All dependencies installed (torch, ezkl, onnx)
- [ ] Circuit generation script runs without errors
- [ ] All three circuit sizes generated (16, 32, 64)
- [ ] Circuit artifacts present in `public/circuits/ebsl_*/`
- [ ] Circuit manifest generated with real SHA-256 hashes
- [ ] `CIRCUIT_HASHES` in `circuit-manager.ts` updated
- [ ] Build succeeds: `npm run build`
- [ ] Dev server starts: `npm run dev`
- [ ] Browser console shows successful circuit loading
- [ ] Circuit caching works (check IndexedDB in DevTools)

---

## Next Steps

After successfully generating circuits:

1. **Test Local Proof Generation:**
   - Navigate to http://localhost:5173
   - Connect wallet
   - Generate a proof
   - Verify it completes successfully

2. **Run E2E Tests:**

   ```bash
   npm run test:e2e
   ```

3. **Verify Remote Fallback:**
   - Test on low-memory device or mobile
   - Ensure remote fallback triggers correctly

4. **Performance Testing:**
   - Measure proof generation times
   - Test with different attestation counts
   - Verify circuit selection logic

5. **Production Deployment:**
   - Upload circuits to CDN
   - Update circuit base URL in config
   - Enable circuit preloading
   - Monitor circuit loading times

---

## Resources

- **EZKL Documentation:** https://docs.ezkl.xyz/
- **PyTorch ONNX Export:** https://pytorch.org/docs/stable/onnx.html
- **Project Notebooks:** `/Notebooks/EBSL_Pipeline_Complete.ipynb`
- **Original Script:** `/Notebooks/ebsl_full_script.py`
- **Circuit Manager:** `/src/lib/zkml/circuit-manager.ts`
- **Hybrid Prover:** `/src/lib/zkml/hybrid-prover.ts`

---

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review EZKL logs in `zkml_artifacts/`
3. Verify Python environment: `pip list | grep -E "(torch|ezkl|onnx)"`
4. Check available memory: `free -h` (Linux) or `vm_stat` (macOS)
5. Review circuit generation logs
6. Open an issue with error details and system specs

---

**Last Updated:** 2025-11-03
**Version:** 1.0
