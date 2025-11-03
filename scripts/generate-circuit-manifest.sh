#!/bin/bash
set -e

CIRCUITS_DIR="public/circuits"
CIRCUIT_MANAGER_FILE="src/lib/zkml/circuit-manager.ts"

echo "Generating circuit manifest with SHA-256 hashes..."
echo ""

# Function to calculate combined hash
calculate_hash() {
  local circuit_dir=$1
  local compiled_wasm="$circuit_dir/_compiled.wasm"
  local vk_key="$circuit_dir/vk.key"

  if [ -f "$compiled_wasm" ] && [ -f "$vk_key" ]; then
    # Combine files and hash
    cat "$compiled_wasm" "$vk_key" | sha256sum | awk '{print $1}'
  else
    echo ""
  fi
}

# Generate hashes for each circuit
echo "Calculating circuit hashes..."
echo ""

HASH_16=$(calculate_hash "$CIRCUITS_DIR/ebsl_16")
HASH_32=$(calculate_hash "$CIRCUITS_DIR/ebsl_32")
HASH_64=$(calculate_hash "$CIRCUITS_DIR/ebsl_64")

if [ -z "$HASH_16" ] || [ -z "$HASH_32" ] || [ -z "$HASH_64" ]; then
  echo "❌ Error: Missing circuit files"
  echo "Please run: ./scripts/create-mock-circuits.sh first"
  exit 1
fi

echo "Circuit Hashes:"
echo "  ebsl_16: $HASH_16"
echo "  ebsl_32: $HASH_32"
echo "  ebsl_64: $HASH_64"
echo ""

# Backup original file
if [ -f "$CIRCUIT_MANAGER_FILE" ]; then
  cp "$CIRCUIT_MANAGER_FILE" "$CIRCUIT_MANAGER_FILE.backup"
  echo "✓ Backed up original circuit-manager.ts"
fi

# Update CIRCUIT_HASHES in circuit-manager.ts
echo "Updating $CIRCUIT_MANAGER_FILE..."

# Create temporary file with updated hashes
cat > /tmp/circuit_hashes_update.txt << EOF
export const CIRCUIT_HASHES: Record<string, string> = {
  "16": "$HASH_16", // 16 opinions
  "32": "$HASH_32", // 32 opinions
  "64": "$HASH_64", // 64 opinions
};
EOF

# Use sed to replace the CIRCUIT_HASHES section
# This is a bit complex but handles multi-line replacement
awk '
  /export const CIRCUIT_HASHES/ {
    print "export const CIRCUIT_HASHES: Record<string, string> = {"
    print "  \"16\": \"'"$HASH_16"'\", // 16 opinions"
    print "  \"32\": \"'"$HASH_32"'\", // 32 opinions"
    print "  \"64\": \"'"$HASH_64"'\", // 64 opinions"
    print "};"
    # Skip until we find the closing brace
    while (getline > 0) {
      if (/^};/) break
    }
    next
  }
  { print }
' "$CIRCUIT_MANAGER_FILE" > "$CIRCUIT_MANAGER_FILE.tmp"

mv "$CIRCUIT_MANAGER_FILE.tmp" "$CIRCUIT_MANAGER_FILE"

echo "✓ Updated CIRCUIT_HASHES in circuit-manager.ts"
echo ""

# Verify the update
echo "Verification:"
grep -A 4 "export const CIRCUIT_HASHES" "$CIRCUIT_MANAGER_FILE"
echo ""

echo "✅ Circuit manifest generation complete!"
echo ""
echo "Files created/updated:"
echo "  - public/circuits/ebsl_16/_compiled.wasm"
echo "  - public/circuits/ebsl_16/vk.key"
echo "  - public/circuits/ebsl_16/settings.json"
echo "  - public/circuits/ebsl_32/_compiled.wasm"
echo "  - public/circuits/ebsl_32/vk.key"
echo "  - public/circuits/ebsl_32/settings.json"
echo "  - public/circuits/ebsl_64/_compiled.wasm"
echo "  - public/circuits/ebsl_64/vk.key"
echo "  - public/circuits/ebsl_64/settings.json"
echo "  - $CIRCUIT_MANAGER_FILE"
echo ""
echo "Next step: npm run build"
