#!/bin/bash
set -e

REPO="razomy/cli"
VERSION="0.0.0-alpha.3"

OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"
if [ "$ARCH" = "x86_64" ]; then ARCH="x64"; fi
if [ "$ARCH" = "aarch64" ]; then ARCH="arm64"; fi

FILENAME="razomy-${VERSION}-${OS}-${ARCH}.tar.gz"
URL="https://github.com/${REPO}/releases/download/${VERSION}/${FILENAME}"

echo "⬇️  Downloading Razomy CLI..."
curl -L -o razomy.tar.gz "$URL"

echo "📦 Unpacking..."
tar -xzf razomy.tar.gz

# Remove older version if it exists
sudo rm -rf /usr/local/lib/razomy

# Move to the global lib folder
sudo mv razomy /usr/local/lib/razomy

echo "🔗 Setting up commands and aliases..."
# ---------------------------------------------------------
# THE MAGIC: Loop through everything in the bin folder
# and create a symlink for each one in /usr/local/bin.
# ---------------------------------------------------------
for cmd in /usr/local/lib/razomy/bin/*; do
  cmd_name=$(basename "$cmd")
  sudo ln -sf "$cmd" "/usr/local/bin/$cmd_name"
done

# Clean up the downloaded file
rm razomy.tar.gz

echo "✅ Installation complete!"
echo "You can now run:"
echo "  razomy --help"
echo "  rr --help"