import {Command} from '@oclif/core';

import {RuntimeRegistry} from "../runtime/runtime.ts";

// eslint-disable-next-line max-params
export async function runFunction(cmd: Command,
                                  runtime: string,
                                  defaultWorkspaceDir: string,
                                  versionRuntimeDir: string,
                                  packageName: string,
                                  functionName: string,
                                  params: string): Promise<void> {
    cmd.log('🚀 Executing...');
    let result: unknown;
    try {
        result = await RuntimeRegistry[runtime].run(defaultWorkspaceDir, versionRuntimeDir, packageName, functionName, params);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        cmd.error(`Function "${functionName}" or "default()" not found in the module.` + message);
    }

    cmd.log('✅ Execution completed successfully!');
    cmd.log('Result:');
    cmd.log(result as never);
}

/**
 * Creates the runner files and returns an object capable of executing them.
 */
export function createCliRunner(runtime: string, defaultWorkspaceDir: string, versionRuntimeDir: string) {
    const key = runtime.toLowerCase();
    const handler = RuntimeRegistry[key];
    handler.install('@razomy/run', defaultWorkspaceDir, versionRuntimeDir);
    handler.setup(defaultWorkspaceDir, runtime);
}