import {Args, Command, Flags} from '@oclif/core';
import * as fs from 'node:fs';
import path from 'node:path';

import {defaultPackage, RuntimeRegistry} from "../../lib/runtime/runtime.ts";

export default class RemovePackageCommand extends Command {
    static args = {
        packageName: Args.string({required: true}),
    };
    static description = 'Uninstalls a package from the workspace';
    static flags = {
        runtime: Flags.string({
            char: 'r',
            default: defaultPackage.runtimeName,
            description: `Target runtime (e.g. ${defaultPackage.runtimeName})`,
            options: Object.keys(RuntimeRegistry),
        }),
    };

    async run(): Promise<void> {
        const {args, flags} = await this.parse(RemovePackageCommand);
        const defaultRuntimeDir = path.join(this.config.dataDir, 'cli', 'runtimes', flags.runtime, 'default');
        const defaultWorkspaceDir = path.join(this.config.dataDir, 'cli', 'workspaces', flags.runtime, 'default');

        if (!fs.existsSync(defaultRuntimeDir)) {
            this.error(`❌ Runtime ${flags.runtime} is empty.`);
        }

        this.log(`⏳ Uninstalling [${flags.runtime}] package: ${args.packageName}...`);

        try {
            RuntimeRegistry[flags.runtime].remove(args.packageName, defaultWorkspaceDir, defaultRuntimeDir);
            this.log(`✅ Package ${args.packageName} uninstalled!`);
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this.error(`❌ Error uninstalling package: ${msg}`);
        }
    }
}