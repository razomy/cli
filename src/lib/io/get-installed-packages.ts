import {existsSync, readFileSync} from "node:fs";
import {join} from "node:path";

export function getInstalledPackages(cliDataDir: string): string[] {
    const packages = new Set<string>();
    try {
        const pkgPath = join(cliDataDir, 'package.json');
        if (existsSync(pkgPath)) {
            const packageName = JSON.parse(readFileSync(pkgPath, 'utf8'));
            for (const dep of Object.keys(packageName.dependencies || {})) packages.add(dep);
            for (const dep of Object.keys(packageName.devDependencies || {})) packages.add(dep);
        }
    } catch {
        // Silently fail if package.json is missing or malformed
    }

    return [...packages];
}