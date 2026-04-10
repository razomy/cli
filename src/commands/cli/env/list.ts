import {Command} from '@oclif/core';
import * as fs from 'node:fs';
import path from 'node:path';

import {defaultPackage, linkExists} from "../../../lib/env/runtime.ts";

export default class EnvList extends Command {
    static description = 'Lists all installed runtime environments and their versions';

    async run(): Promise<void> {
        const runtimesDir = path.join(this.config.dataDir, 'runtimes');

        this.log(`🔍 Scanning installed environments...`);

        if (!fs.existsSync(runtimesDir)) {
            this.log('📭 No runtime environments installed yet.');
            this.log(`💡 Run "razomy cli env add ${defaultPackage.packageName}" to install one.`);
            return;
        }

        const envs = fs.readdirSync(runtimesDir).filter(item => fs.statSync(path.join(runtimesDir, item)).isDirectory());

        if (envs.length === 0) {
            this.log('📭 No runtime environments installed yet.');
            return;
        }

        this.log('✅ Installed runtimes:');

        for (const env of envs) {
            const envDir = path.join(runtimesDir, env);
            const items = fs.readdirSync(envDir);

            let defaultVersion: null | string = null;
            const defaultLinkPath = path.join(envDir, 'default');

            if (linkExists(defaultLinkPath)) {
                try {
                    const realPath = fs.realpathSync(defaultLinkPath);
                    defaultVersion = path.basename(realPath);
                } catch {
                    defaultVersion = 'broken';
                }
            }

            const versions = items.filter(item => {
                if (item === 'default') return false;
                const itemPath = path.join(envDir, item);
                return fs.lstatSync(itemPath).isDirectory();
            });

            this.log(`📦 ${env.toUpperCase()}`);
            if (versions.length === 0) {
                this.log(`   └─ (empty)`);
                continue;
            }

            for (const [index, version] of versions.entries()) {
                const isLast = index === versions.length - 1;
                const prefix = isLast ? '   └─' : '   ├─';
                const defaultTag = version === defaultVersion ? ' (⭐ default)' : '';
                this.log(`${prefix} v${version}${defaultTag}`);
            }
        }
    }

}