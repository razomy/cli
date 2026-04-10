import {Command} from "@oclif/core";

import {FunctionSpecification} from "./function-specification.ts";

export function printSpecificationInfo(cmd: Command, spec: FunctionSpecification): void {
    const params = spec.parameters.map(i => `${i.name}: ${i.type}`).join(', ');

    const m = `--- 📘 Selected function: ${spec.name}(${params}): ${spec.returns.type} ---`;
    cmd.log(m);
    cmd.log(`⏎ Returns: ${spec.returns.description}`);

    if (spec.examples && spec.examples.length > 0) {
        cmd.log(`💡 Example: ${spec.examples[0].code} ➔ ${spec.examples[0].expected}`);
    }

    cmd.log('-'.repeat(m.length));
}