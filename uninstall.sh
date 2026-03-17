#!/bin/bash
set -e

# Define paths (matching the installation script)
INSTALL_DIR="/usr/local/lib/razomy"
BIN_LINK="/usr/local/bin/razomy"

echo "Uninstalling Razomy CLI..."

# Remove the symlink
if [ -L "$BIN_LINK" ]; then
    echo "Removing symlink from $BIN_LINK..."
    sudo rm "$BIN_LINK"
else
    echo "Symlink not found at $BIN_LINK, skipping."
fi

# Remove the installation directory
if [ -d "$INSTALL_DIR" ]; then
    echo "Removing files from $INSTALL_DIR..."
    sudo rm -rf "$INSTALL_DIR"
else
    echo "Installation directory not found at $INSTALL_DIR, skipping."
fi

echo "Uninstallation complete!"