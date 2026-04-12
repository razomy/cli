import {Args, Command, Flags} from '@oclif/core';
import * as fs from 'node:fs';
import path from 'node:path';

import {defaultPackage, RuntimeRegistry} from "../../lib/runtime/runtime.ts";
import {createCliRunner} from "../../lib/io/run-function.ts";


export default class AddPackageCommand extends Command {
    static args = {
        packageName: Args.string({
            description: `Name of the package (e.g. ${defaultPackage.packageName})`,
            required: true,
        }),
    };
    static description = 'Installs a package';
    static flags = {
        runtime: Flags.string({
            char: 'r',
            default: defaultPackage.runtimeName,
            description: `Target runtime (e.g. ${defaultPackage.runtimeName})`,
            options: Object.keys(RuntimeRegistry),
        }),
    };

    async run(): Promise<void> {
        const {args, flags} = await this.parse(AddPackageCommand);
        const defaultRuntimeDir = path.join(this.config.dataDir, 'cli', 'runtimes', flags.runtime, 'default');
        const defaultWorkspaceDir = path.join(this.config.dataDir, 'cli', 'workspaces', flags.runtime, 'default');

        if (!fs.existsSync(defaultWorkspaceDir)) {
            fs.mkdirSync(defaultWorkspaceDir, {recursive: true});
        }

        this.log(`⏳ Installing [${flags.runtime}] package: ${args.packageName}...`);
        try {
            RuntimeRegistry[flags.runtime].install(args.packageName, defaultWorkspaceDir, defaultRuntimeDir);
            createCliRunner(flags.runtime, defaultWorkspaceDir, defaultRuntimeDir);
            this.log(`✅ Package ${args.packageName} installed successfully in ${defaultWorkspaceDir}!`);
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this.error(`❌ Error installing package: ${msg}`);
        }
    }
}