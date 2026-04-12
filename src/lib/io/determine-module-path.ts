import {search} from "@inquirer/prompts";

import {getInstalledPackages} from "./get-installed-packages.ts";

export async function determineModulePath(defaultWorkspaceDir: string, providedArg?: string): Promise<string> {
    const installedPackages = getInstalledPackages(defaultWorkspaceDir);

    if (providedArg) {
        const filteredPackages = installedPackages.find(packageName => packageName.toLowerCase().includes(providedArg));
        return filteredPackages || providedArg;
    }

    return search({
        message: 'Select an npm package or type a local file path:',
        async source(searchTerm) {
            const term = (searchTerm || '').toLowerCase();
            const filteredPackages = installedPackages
                .filter(packageName => packageName.toLowerCase().includes(term))
                .map(packageName => ({name: `📦 ${packageName}`, value: packageName}));

            if (term.length > 0) {
                filteredPackages.unshift({
                    name: `📄 Use local path: ${term}`,
                    value: term
                });
            }

            return filteredPackages;
        }
    });
}