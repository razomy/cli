import {input} from "@inquirer/prompts";
import {Command} from "@oclif/core";

import {FunctionSpecification} from "./function-specification.ts";

export async function collectParameters(cmd: Command, spec: FunctionSpecification | undefined, args: string[]): Promise<string[]> {
    const finalParams: string[] = [];

    if (spec && spec.parameters.length > 0) {
        cmd.log('⚙️  Collecting parameters:');

        for (let i = 0; i < spec.parameters.length; i++) {
            const paramDef = spec.parameters[i];

            if (args[i]) {
                cmd.log(`✔ ${paramDef.name} = ${args[i]}`);
                finalParams.push(args[i]);
            } else {
                // eslint-disable-next-line no-await-in-loop
                const answer = await input({
                    message: `${paramDef.description} Type "${paramDef.type}".\n Enter <${paramDef.name}>:`
                });
                finalParams.push(answer);
            }
        }
    } else if (args.length > 0) {
        finalParams.push(...args);
    }

    return finalParams;
}