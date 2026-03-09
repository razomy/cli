#!/bin/bash
set -e

REPO="razomy/cli"
VERSION="0.0.0-alpha.1"

OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"
if [ "$ARCH" = "x86_64" ]; then ARCH="x64"; fi
if [ "$ARCH" = "aarch64" ]; then ARCH="arm64"; fi

FILENAME="razomy-${VERSION}-${OS}-${ARCH}.tar.gz"
URL="https://github.com/${REPO}/releases/download/${VERSION}/${FILENAME}"

echo "Download Razomy CLI..."
curl -L -o razomy.tar.gz "$URL"

echo "Unpacking..."
tar -xzf razomy.tar.gz
sudo mv razomy /usr/local/lib/razomy
sudo ln -s /usr/local/lib/razomy/bin/razomy /usr/local/bin/razomy

rm razomy.tar.gz
echo "Installation complete! Enter: razomy --help"