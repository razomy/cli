import {existsSync, readFileSync} from "node:fs";
import {join} from "node:path";

import {FunctionSpecification} from "./function-specification.js";

export function loadSpecifications(moduleDir: string): FunctionSpecification[] {
    const specPath1 = join(moduleDir, 'specifications.json');
    const actualSpecPath = existsSync(specPath1) ? specPath1 : null;

    if (actualSpecPath) {
        return JSON.parse(readFileSync(actualSpecPath, 'utf8')) as FunctionSpecification[];
    }

    return [];
}