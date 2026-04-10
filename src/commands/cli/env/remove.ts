import {Args, Command} from '@oclif/core';
import * as fs from 'node:fs';
import path from 'node:path';

import {defaultPackage, linkExists, RuntimesRegistry} from "../../../lib/env/runtime.ts";

export default class EnvRemove extends Command {
    static args = {
        envName: Args.string({
            description: `Which environment to remove (e.g. ${defaultPackage.envName})`,
            options: Object.keys(RuntimesRegistry),
            required: true,
        }),
        version: Args.string({
            description: `Specific version to remove (e.g. ${RuntimesRegistry[defaultPackage.envName].defaultVersion}). If not provided, completely removes the environment.`,
            required: false,
        }),
    };
    static description = 'Removes an installed runtime environment or a specific version';

    async run(): Promise<void> {
        const {args} = await this.parse(EnvRemove);
        const {envName, version} = args;

        const envDir = path.join(this.config.dataDir, 'runtimes', envName);

        this.log(`⏳ Checking ${envName.toUpperCase()} runtime...`);

        if (!fs.existsSync(envDir)) {
            this.error(`❌ Environment '${envName}' is not installed.\nNothing to remove.`);
        }

        try {
            if (version) {
                const versionDir = path.join(envDir, version);

                if (!fs.existsSync(versionDir)) {
                    this.error(`❌ Version '${version}' of '${envName}' is not installed.`);
                }

                this.log(`🗑️  Removing ${envName.toUpperCase()} v${version}...`);
                fs.rmSync(versionDir, {force: true, recursive: true});

                const defaultLinkPath = path.join(envDir, 'default');
                if (linkExists(defaultLinkPath)) {
                    try {
                        const realPath = fs.realpathSync(defaultLinkPath);
                        if (realPath === versionDir) {
                            fs.rmSync(defaultLinkPath, {force: true, recursive: true});
                            this.log(`⚠️  The default version was removed. 'default' alias cleared.`);
                        }
                    } catch {
                        // Симлинк сломался (мы только что удалили его цель) - чистим мусор
                        fs.rmSync(defaultLinkPath, {force: true, recursive: true});
                    }
                }

                this.log(`✅ ${envName.toUpperCase()} v${version} successfully removed!`);

                const remainingItems = fs.readdirSync(envDir);
                if (remainingItems.length === 0 || (remainingItems.length === 1 && remainingItems[0] === 'default')) {
                    fs.rmSync(envDir, {force: true, recursive: true});
                }

            } else {
                this.log(`🗑️  Removing ALL versions of ${envName.toUpperCase()}...`);
                fs.rmSync(envDir, {force: true, recursive: true});
                this.log(`✅ ${envName.toUpperCase()} completely removed!`);
            }

        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this.error(`❌ Error removing environment: ${msg}`);
        }
    }
}
