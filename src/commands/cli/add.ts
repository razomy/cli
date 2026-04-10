import {Args, Command, Flags} from '@oclif/core';
import * as fs from 'node:fs';
import path from 'node:path';

import {defaultPackage, RuntimesRegistry} from "../../lib/env/runtime.ts";


export default class InstallCommand extends Command {
    static args = {
        packageName: Args.string({
            description: `Name of the package (e.g. ${defaultPackage.packageName})`,
            required: true,
        }),
    };
    static description = 'Installs a package';
    static flags = {
        env: Flags.string({
            char: 'e',
            default: defaultPackage.envName,
            description: `Target environment (e.g. ${defaultPackage.envName})`,
            options: Object.keys(RuntimesRegistry),
        }),
    };

    async run(): Promise<void> {
        const {args, flags} = await this.parse(InstallCommand);
        const envDir = path.join(this.config.dataDir, 'environments', flags.env);
        const envBaseDir = path.join(this.config.dataDir, 'runtimes', flags.env, 'default');

        if (!fs.existsSync(envDir)) {
            fs.mkdirSync(envDir, {recursive: true});
        }

        this.log(`⏳ Installing [${flags.env}] package: ${args.packageName}...`);
        try {
            RuntimesRegistry[flags.env].install(args.packageName, envDir, envBaseDir);
            this.log(`✅ Package ${args.packageName} installed successfully in ${envDir}!`);
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this.error(`❌ Error installing package: ${msg}`);
        }
    }
}