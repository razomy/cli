/* eslint-disable @typescript-eslint/no-explicit-any */
import {Args, Command} from '@oclif/core';
import * as fs from 'node:fs';
import path from 'node:path';

import {collectParameters} from "./src/collect-parameters.js";
import {determineModulePath} from "./src/determine-module-path.js";
import {executeFunction} from './src/execute-function.js';
import {loadSpecifications} from "./src/load-specifications.js";
import {createExecutor} from './src/module-resolution.js';
import {resolveModulePaths} from "./src/resolve-module-paths.js";
import {selectFunction} from './src/spec-handling.js';

export default class IoCommand extends Command {
    static args = {
        modulePath: Args.string({
            description: 'Path to a local file or npm package name',
            required: false
        }),
    };
    static description = 'Dynamically executes a function from a JS module with autocomplete and prompts';
    static strict = false;

    async run(): Promise<void> {
        const {args, argv} = await this.parse(IoCommand);
        const dynamicArgs = argv.slice(1) as string[];

        const cliDataDir = path.join(this.config.dataDir, 'environments', 'node');
        if (!fs.existsSync(cliDataDir)) {
            this.error(`❌ Node.js environment is not set up or no packages installed.\n💡 Run "mytool install <package>" first.`);
        }

        try {
            const targetModulePath = await determineModulePath(cliDataDir, args.modulePath);
            this.log(`\n📦 Preparing module: ${targetModulePath}...`);

            const {importPath, moduleDir} = resolveModulePaths(cliDataDir, targetModulePath);
            const specs = loadSpecifications(moduleDir);

            const {functionNameToRun, remainingArgs, selectedSpec} = await selectFunction(this, specs, dynamicArgs);
            const finalParams = await collectParameters(this, selectedSpec, remainingArgs);
            const fileUrl = await createExecutor(importPath, moduleDir);

            await executeFunction(this, fileUrl, functionNameToRun, finalParams);
        } catch (error: unknown) {
            this.handleExecutionError(error, args.modulePath || 'Unknown Module');
        }
    }

    private handleExecutionError(error: any, modulePath: string): void {
        if (error.isTtyError) {
            this.error('Interactive mode is not supported in the current terminal.');
        } else if (error.code === 'MODULE_NOT_FOUND' || error.code === 'ERR_MODULE_NOT_FOUND') {
            this.error(`Module "${modulePath}" not found.`);
        } else {
            // Лучше выводить сообщение об ошибке безопасно
            const msg = error instanceof Error ? error.message : String(error);
            this.error(`Execution error: ${msg}`);
        }
    }
}
