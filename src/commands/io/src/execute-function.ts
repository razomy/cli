import {Command} from '@oclif/core';

export async function executeFunction(cmd: Command, importPath: string, functionNameToRun: string, finalParams: string[]): Promise<void> {
  const dynamicModule = await import(importPath, {});

  cmd.log('🚀 Executing...');

  const executionContext = {cli: cmd, params: finalParams};
  let result: unknown = null;
  if (functionNameToRun && typeof dynamicModule[functionNameToRun] === 'function') {
    result = await dynamicModule[functionNameToRun](...finalParams);
  } else if (typeof dynamicModule.default === 'function') {
    result = await dynamicModule.default(executionContext);
  } else if (typeof dynamicModule.run === 'function') {
    result = await dynamicModule.run(executionContext);
  } else {
    cmd.error(`Function "${functionNameToRun}" or "default()" not found in the module.`);
  }

  cmd.log('✅ Execution completed successfully!');
  cmd.log('Result:');
  cmd.log(result as never);
}
