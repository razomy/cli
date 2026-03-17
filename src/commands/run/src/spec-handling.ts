import {select} from '@inquirer/prompts';
import {Command} from '@oclif/core';

import {FunctionSpecification} from './function-specification.js';
import {printSpecificationInfo} from "./print-specification-info.js";

export async function selectFunction(cmd: Command, specs: FunctionSpecification[], args: string[]) {
  if (specs.length === 0) {
    return {functionNameToRun: '', remainingArgs: args, selectedSpec: undefined};
  }

  const passedFuncName = args[0];
  let selectedSpec = specs.find(s => s.name === passedFuncName);
  let remainingArgs = args;

  if (selectedSpec) {
    remainingArgs = args.slice(1);
  } else {
    selectedSpec = await select({
      choices: specs.map(s => {
        const params = s.parameters.map(i => `${i.name}: ${i.type}`).join(', ');
        return {
          name: `${s.name}(${params}): ${s.returns.type}`,
          value: s
        };
      }),
      message: 'Multiple functions available in the module. Select one:'
    });
  }

  if (selectedSpec) {
    printSpecificationInfo(cmd, selectedSpec);
  }

  return {functionNameToRun: selectedSpec?.name || '', remainingArgs, selectedSpec};
}
