import {Command} from '@oclif/core';
import * as fs from 'node:fs';
import path from 'node:path';

import {defaultPackage, RuntimeRegistry} from "../../lib/runtime/runtime.ts";
import InstallPackageCommand from "./add.ts";

export default class ListPackageCommand extends Command {
    static description = 'Lists all installed packages across all workspaces';

    async run(): Promise<void> {
        const workspacesDir = path.join(this.config.dataDir, 'cli','workspaces');
        const runtimes = Object.keys(RuntimeRegistry);
        let foundAny = false;

        this.log(`🔍 Scanning installed packages...`);

        for (const runtime of runtimes) {
            const defaultRuntimeDir = path.join(this.config.dataDir,'cli', 'runtimes', runtime, 'default');
            const defaultWorkspaceDir = path.join(workspacesDir, runtime, 'default');

            if (!fs.existsSync(defaultWorkspaceDir)) {
                continue;
            }

            foundAny = true;
            this.log(`📦 ${runtime.toUpperCase()} PACKAGES:`);

            try {
                const packages = RuntimeRegistry[runtime].list(defaultWorkspaceDir, defaultRuntimeDir);

                if (packages.length === 0) {
                    this.log('   (empty)');
                } else {
                    // Отрисовываем каждый элемент
                    for (const [index, packageName] of packages.entries()) {
                        const isLast = index === packages.length - 1;
                        const prefix = isLast ? '   └── ' : '   ├── ';
                        this.log(`${prefix}${packageName}`);
                    }
                }
            } catch {
                this.log(`   ⚠️ Failed to read ${runtime} packages. (Maybe the runtime is missing?)`);
            }
        }

        if (foundAny) {
            this.log(`✅ Done!`);
        } else {
            this.log(`📭 No packages installed in any workspace yet.`);
            this.log(`💡 Use "razomy cli add ${defaultPackage.packageName}" to add some!`);
        }
    }
}