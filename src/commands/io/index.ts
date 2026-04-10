/* eslint-disable @typescript-eslint/no-explicit-any */
import {Args, Command} from '@oclif/core';
import * as fs from 'node:fs';
import path from 'node:path';

import {collectParameters} from "../../lib/io/collect-parameters.ts";
import {determineModulePath} from "../../lib/io/determine-module-path.ts";
import {executeFunction} from '../../lib/io/execute-function.ts';
import {loadSpecifications} from "../../lib/io/load-specifications.ts";
import {createExecutor} from '../../lib/io/module-resolution.ts';
import {resolveModulePaths} from "../../lib/io/resolve-module-paths.ts";
import {selectFunction} from '../../lib/io/spec-handling.ts';
import {defaultPackage} from "../../lib/env/runtime.ts";

export default class IoCommand extends Command {
    static args = {
        modulePath: Args.string({
            description: 'Path to package name with function path',
            required: false
        }),
    };
    static description = 'Dynamically executes a function from a any module with autocomplete and prompts';
    static strict = false;

    async run(): Promise<void> {
        const {args, argv} = await this.parse(IoCommand);
        const dynamicArgs = argv.slice(1) as string[];

        const cliDataDir = path.join(this.config.dataDir, 'environments', 'node');
        if (!fs.existsSync(cliDataDir)) {
            this.error(`❌ Node.js environment is not set up or no packages installed.\n💡 Run "razomy cli add ${defaultPackage.packageName}" first.`);
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
