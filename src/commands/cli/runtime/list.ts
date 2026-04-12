import {Command} from '@oclif/core';
import * as fs from 'node:fs';
import path from 'node:path';

import {defaultPackage, linkExists} from "../../../lib/runtime/runtime.ts";

export default class RuntimeListCommand extends Command {
    static description = 'Lists all installed runtimes and their versions';

    async run(): Promise<void> {
        const runtimesDir = path.join(this.config.dataDir, 'cli', 'runtimes');

        this.log(`🔍 Scanning installed runtimes...`);

        if (!fs.existsSync(runtimesDir)) {
            this.log('📭 No runtimes installed yet.');
            this.log(`💡 Run "razomy cli runtime add ${defaultPackage.runtimeName}" to install one.`);
            return;
        }

        const runtimes = fs.readdirSync(runtimesDir)
            .filter(item => fs.statSync(path.join(runtimesDir, item)).isDirectory());

        if (runtimes.length === 0) {
            this.log('📭 No runtimes installed yet.');
            return;
        }

        this.log('✅ Installed runtimes:');

        for (const runtime of runtimes) {
            const runtimeDir = path.join(runtimesDir, runtime);
            const versionsAndDefault = fs.readdirSync(runtimeDir);

            let defaultVersion: null | string = null;
            const defaultLinkPath = path.join(runtimeDir, 'default');

            if (linkExists(defaultLinkPath)) {
                try {
                    const realPath = fs.realpathSync(defaultLinkPath);
                    defaultVersion = path.basename(realPath);
                } catch {
                    defaultVersion = 'broken';
                }
            }

            const versions = versionsAndDefault.filter(item => {
                if (item === 'default') return false;
                const itemPath = path.join(runtimeDir, item);
                return fs.lstatSync(itemPath).isDirectory();
            });

            this.log(`📦 ${runtime.toUpperCase()}`);
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