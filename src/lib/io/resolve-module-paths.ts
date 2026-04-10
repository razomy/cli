import {dirname, resolve} from "node:path";
import {pathToFileURL} from "node:url";

export function resolveModulePaths(cliDataDir: string, modulePath: string): { importPath: string; moduleDir: string } {
    let importPath = modulePath;
    let moduleDir = '';

    if (importPath.startsWith('.') || importPath.startsWith('/')) {
        const absolutePath = resolve(cliDataDir, importPath);
        importPath = pathToFileURL(absolutePath).href;
        moduleDir = dirname(absolutePath);
    } else {
        try {
            // eslint-disable-next-line no-undef,unicorn/prefer-module
            const packageJsonPath = require.resolve(`${modulePath}/package.json`, {paths: [cliDataDir]});
            moduleDir = dirname(packageJsonPath);
        } catch {
            moduleDir = resolve(cliDataDir, 'node_modules', modulePath);
        }
    }

    return {importPath, moduleDir};
}