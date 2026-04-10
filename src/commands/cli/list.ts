import {Command} from '@oclif/core';
import * as fs from 'node:fs';
import path from 'node:path';

import {defaultPackage, RuntimesRegistry} from "../../lib/env/runtime.ts";

export default class ListCommand extends Command {
    static description = 'Lists all installed packages across all environments';

    async run(): Promise<void> {
        const baseDir = path.join(this.config.dataDir, 'environments');
        const environments = Object.keys(RuntimesRegistry);
        let foundAny = false;

        this.log(`🔍 Scanning installed packages...`);

        for (const env of environments) {
            const envDir = path.join(baseDir, env);
            const runtimeDir = path.join(this.config.dataDir, 'runtimes', env);

            if (!fs.existsSync(envDir)) {
                continue;
            }

            foundAny = true;
            this.log(`📦 ${env.toUpperCase()} PACKAGES:`);

            try {
                const packages = RuntimesRegistry[env].list(envDir, runtimeDir);

                if (packages.length === 0) {
                    this.log('   (empty)');
                } else {
                    // Отрисовываем каждый элемент
                    for (const [index, pkg] of packages.entries()) {
                        const isLast = index === packages.length - 1;
                        const prefix = isLast ? '   └── ' : '   ├── ';
                        this.log(`${prefix}${pkg}`);
                    }
                }
            } catch {
                this.log(`   ⚠️ Failed to read ${env} packages. (Maybe the runtime is missing?)`);
            }
        }

        if (foundAny) {
            this.log(`✅ Done!`);
        } else {
            this.log(`📭 No packages installed in any environment yet.`);
            this.log(`💡 Use "razomy cli add ${defaultPackage.packageName}" to add some!`);
        }
    }
}