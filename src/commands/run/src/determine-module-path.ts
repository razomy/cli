import {search} from "@inquirer/prompts";

import {getInstalledPackages} from "./get-installed-packages.js";

export async function determineModulePath(cliDataDir: string, providedArg?: string): Promise<string> {
    const installedPackages = getInstalledPackages(cliDataDir);

    if (providedArg) {
        const filteredPackages = installedPackages.find(pkg => pkg.toLowerCase().includes(providedArg));
        return filteredPackages || providedArg;
    }

    return search({
        message: 'Select an npm package or type a local file path:',
        async source(searchTerm) {
            const term = (searchTerm || '').toLowerCase();
            const filteredPackages = installedPackages
                .filter(pkg => pkg.toLowerCase().includes(term))
                .map(pkg => ({name: `📦 ${pkg}`, value: pkg}));

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