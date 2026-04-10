import {Args, Command, Flags} from '@oclif/core';
import * as fs from 'node:fs';
import path from 'node:path';

import {defaultPackage, RuntimesRegistry} from "../../lib/env/runtime.ts";

export default class UninstallCommand extends Command {
    static args = {
        packageName: Args.string({required: true}),
    };
    static description = 'Uninstalls a package from the environment';
    static flags = {
        env: Flags.string({
            char: 'e',
            default: defaultPackage.envName,
            description: `Target environment (e.g. ${defaultPackage.envName})`,
            options: Object.keys(RuntimesRegistry),
        }),
    };

    async run(): Promise<void> {
        const {args, flags} = await this.parse(UninstallCommand);
        const envDir = path.join(this.config.dataDir, 'environments', flags.env);
        const runtimeDir = path.join(this.config.dataDir, 'runtimes', flags.env);

        if (!fs.existsSync(envDir)) {
            this.error(`❌ Environment ${flags.env} is empty.`);
        }

        this.log(`⏳ Uninstalling [${flags.env}] package: ${args.packageName}...`);

        try {
            RuntimesRegistry[flags.env].remove(args.packageName, envDir, runtimeDir);
            this.log(`✅ Package ${args.packageName} uninstalled!`);
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this.error(`❌ Error uninstalling package: ${msg}`);
        }
    }
}