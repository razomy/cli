#!/bin/bash
set -e

REPO="razomy/cli"

echo "🔍 Finding latest version..."
# Dynamically fetch the latest release tag from GitHub (removes the 'v' prefix)
VERSION=$(curl -s "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name":' | sed -E 's/.*"v([^"]+)".*/\1/')

if [ -z "$VERSION" ]; then
  echo "❌ Failed to fetch latest version. Exiting."
  exit 1
fi

OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"
if [ "$ARCH" = "x86_64" ]; then ARCH="x64"; fi
if [ "$ARCH" = "aarch64" ]; then ARCH="arm64"; fi

# Oclif names files with a 'v' before the version
FILENAME="razomy-v${VERSION}-${OS}-${ARCH}.tar.gz"
URL="https://github.com/${REPO}/releases/download/v${VERSION}/${FILENAME}"

# The folder inside the tarball matches the filename without .tar.gz
EXTRACTED_DIR="razomy-v${VERSION}-${OS}-${ARCH}"

echo "⬇️  Downloading Razomy CLI v${VERSION} for ${OS}-${ARCH}..."
curl -L -o razomy.tar.gz "$URL"

echo "📦 Unpacking..."
tar -xzf razomy.tar.gz

echo "🚚 Moving to /usr/local/lib..."
# Remove older version if it exists
sudo rm -rf /usr/local/lib/razomy/cli
sudo mkdir -p /usr/local/lib/razomy

# Move the exact extracted folder
sudo mv "$EXTRACTED_DIR" /usr/local/lib/razomy/cli

echo "🔗 Setting up commands and aliases..."
for cmd in /usr/local/lib/razomy/cli/bin/*; do
  cmd_name=$(basename "$cmd")
  sudo ln -sf "$cmd" "/usr/local/bin/$cmd_name"
done

# Clean up the downloaded file
rm razomy.tar.gz

echo "✅ Installation complete!"
echo "You can now run:"
echo "  razomy --help"
echo "  r --help"