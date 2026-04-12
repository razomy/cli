import {Args, Command} from '@oclif/core';
import * as fs from 'node:fs';
import path from 'node:path';

import {defaultPackage, linkExists, RuntimeRegistry} from "../../../lib/runtime/runtime.ts";

export default class RuntimeRemoveCommand extends Command {
    static args = {
        runtimeName: Args.string({
            description: `Which runtime to remove (e.g. ${defaultPackage.runtimeName})`,
            options: Object.keys(RuntimeRegistry),
            required: true,
        }),
        version: Args.string({
            description: `Specific version to remove (e.g. ${RuntimeRegistry[defaultPackage.runtimeName].defaultVersion}). If not provided, completely removes the runtime.`,
            required: false,
        }),
    };
    static description = 'Removes an installed runtime or a specific version';

    async run(): Promise<void> {
        const {args} = await this.parse(RuntimeRemoveCommand);
        const {runtimeName, version} = args;

        const runtimeDir = path.join(this.config.dataDir, 'cli', 'runtimes', runtimeName);

        this.log(`⏳ Checking ${runtimeName.toUpperCase()} runtime...`);

        if (!fs.existsSync(runtimeDir)) {
            this.error(`❌ Runtime '${runtimeName}' is not installed.\nNothing to remove.`);
        }

        try {
            if (version) {
                const versionRuntimeDir = path.join(runtimeDir, version);

                if (!fs.existsSync(versionRuntimeDir)) {
                    this.error(`❌ Version '${version}' of '${runtimeName}' is not installed.`);
                }

                this.log(`🗑️  Removing ${runtimeName.toUpperCase()} v${version}...`);
                fs.rmSync(versionRuntimeDir, {force: true, recursive: true});

                const defaultRuntimeDir = path.join(runtimeDir, 'default');
                if (linkExists(defaultRuntimeDir)) {
                    try {
                        const realPath = fs.realpathSync(defaultRuntimeDir);
                        if (realPath === versionRuntimeDir) {
                            fs.rmSync(defaultRuntimeDir, {force: true, recursive: true});
                            this.log(`⚠️  The default version was removed. 'default' alias cleared.`);
                        }
                    } catch {
                        // Симлинк сломался (мы только что удалили его цель) - чистим мусор
                        fs.rmSync(defaultRuntimeDir, {force: true, recursive: true});
                    }
                }

                this.log(`✅ ${runtimeName.toUpperCase()} v${version} successfully removed!`);

                const remainingItems = fs.readdirSync(runtimeDir);
                if (remainingItems.length === 0 || (remainingItems.length === 1 && remainingItems[0] === 'default')) {
                    fs.rmSync(runtimeDir, {force: true, recursive: true});
                }

            } else {
                this.log(`🗑️  Removing ALL versions of ${runtimeName.toUpperCase()}...`);
                fs.rmSync(runtimeDir, {force: true, recursive: true});
                this.log(`✅ ${runtimeName.toUpperCase()} completely removed!`);
            }

        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.error(`❌ Error removing runtime: ${message}`);
        }
    }
}
