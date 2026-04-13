#!/bin/bash
set -e

REPO="razomy/cli"

OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"
if [ "$ARCH" = "x86_64" ]; then ARCH="x64"; fi
if [ "$ARCH" = "aarch64" ]; then ARCH="arm64"; fi

echo "🔍 Finding latest release for ${OS}-${ARCH}..."

ASSET_URL=$(curl -s "https://api.github.com/repos/${REPO}/releases" \
  | grep '"browser_download_url":' \
  | grep "${OS}-${ARCH}\.tar\.gz" \
  | cut -d '"' -f 4 \
  | head -n 1)

if [ -z "$ASSET_URL" ]; then
  echo "❌ Failed to find a matching release asset for ${OS}-${ARCH}."
  exit 1
fi

VERSION=$(echo "$ASSET_URL" | awk -F'/' '{print $(NF-1)}')

echo "⬇️  Downloading Razomy CLI ${VERSION} from: $ASSET_URL"
curl -L -o razomy.tar.gz "$ASSET_URL"

echo "📦 Unpacking..."
rm -rf /tmp/razomy-extract
mkdir -p /tmp/razomy-extract
tar -xzf razomy.tar.gz -C /tmp/razomy-extract --strip-components=1

echo "🚚 Moving to /usr/local/lib..."
sudo rm -rf /usr/local/lib/razomy/cli
sudo mkdir -p /usr/local/lib/razomy

sudo mv /tmp/razomy-extract /usr/local/lib/razomy/cli

echo "🔗 Setting up commands and aliases..."
for cmd in /usr/local/lib/razomy/cli/bin/*; do
  cmd_name=$(basename "$cmd")
  sudo ln -sf "$cmd" "/usr/local/bin/$cmd_name"
done

rm razomy.tar.gz

echo "✅ Installation complete!"
echo "You can now run:"
echo "  razomy --help"
echo "  r --help"