#!/bin/bash
set -e

echo "Creating mock circuit artifacts for development..."

# Create mock WASM files (small but valid WASM structure)
create_mock_wasm() {
  local output=$1
  local size=$2
  
  # WASM magic number (0x00 0x61 0x73 0x6d) + version
  printf '\x00\x61\x73\x6d\x01\x00\x00\x00' > "$output"
  
  # Add some padding to make different sizes
  dd if=/dev/urandom bs=1024 count=$size >> "$output" 2>/dev/null
  
  echo "Created mock WASM: $output ($(stat -f%z "$output" 2>/dev/null || stat -c%s "$output") bytes)"
}

# Create mock verifying keys
create_mock_vk() {
  local output=$1
  local size=$2
  
  # Generate random key material
  dd if=/dev/urandom bs=1024 count=$size of="$output" 2>/dev/null
  
  echo "Created mock VK: $output ($(stat -f%z "$output" 2>/dev/null || stat -c%s "$output") bytes)"
}

# Create circuits for each size
for size_name in 16 32 64; do
  CIRCUIT_DIR="public/circuits/ebsl_$size_name"
  
  echo "Processing $CIRCUIT_DIR..."
  
  # Create mock compiled circuit (scaled by size)
  create_mock_wasm "$CIRCUIT_DIR/_compiled.wasm" $((size_name / 4))
  
  # Create mock verifying key (scaled by size)
  create_mock_vk "$CIRCUIT_DIR/vk.key" $((size_name / 8))
  
  echo "✓ Created artifacts for ebsl_$size_name"
  echo ""
done

echo "✓ Mock circuit artifacts created successfully!"
echo ""
echo "Next steps:"
echo "1. Run: ./scripts/generate-circuit-manifest.sh"
echo "2. Update src/lib/zkml/circuit-manager.ts with generated hashes"
