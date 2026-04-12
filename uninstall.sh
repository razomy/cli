#!/bin/bash
set -e

INSTALL_DIR="/usr/local/lib/razomy/cli"

echo "🗑️ Uninstalling Razomy CLI..."

# Step 1: Remove all symlinks (main command + aliases)
if [ -d "$INSTALL_DIR/bin" ]; then
    echo "🔗 Removing command symlinks from /usr/local/bin..."

    # Loop through the bin folder to dynamically find and remove every alias
    for cmd in "$INSTALL_DIR/bin/"*; do
        # Extract just the filename (e.g., 'razomy', 'r')
        cmd_name=$(basename "$cmd")

        # If the symlink exists in the system bin folder, delete it
        if [ -L "/usr/local/bin/$cmd_name" ]; then
            sudo rm -f "/usr/local/bin/$cmd_name"
            echo "   Removed: $cmd_name"
        fi
    done
else
    echo "⚠️ Bin directory not found ($INSTALL_DIR/bin). Checking for fallback..."
    # Fallback just in case the user manually deleted the lib folder first
    if [ -L "/usr/local/bin/razomy" ]; then
        sudo rm -f "/usr/local/bin/razomy"
    fi
fi

# Step 2: Remove the main installation directory
if [ -d "$INSTALL_DIR" ]; then
    echo "📁 Removing installation files from $INSTALL_DIR..."
    sudo rm -rf "$INSTALL_DIR"
else
    echo "⚠️ Installation directory not found at $INSTALL_DIR, skipping."
fi

echo "✅ Uninstallation complete!"