import {Args, Command, Flags} from '@oclif/core';
import {execSync} from 'node:child_process';
import * as fs from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);

export default class InstallCommand extends Command {
    static args = {
        packageName: Args.string({
            description: 'Name of the package (e.g. @razomy/string-case)',
            required: true,
        }),
    };
    static description = 'Installs a package';
    static flags = {
        env: Flags.string({
            char: 'e',
            default: 'node',
            description: 'Target environment (node, python, java)',
            options: ['node', 'python', 'java'],
        }),
    };

    async run(): Promise<void> {
        const {args, flags} = await this.parse(InstallCommand);
        const envDir = path.join(this.config.dataDir, 'environments', flags.env);

        if (!fs.existsSync(envDir)) {
            fs.mkdirSync(envDir, {recursive: true});
        }

        this.log(`⏳ Installing [${flags.env}] package: ${args.packageName}...`);

        try {
            switch (flags.env) {
                case 'java': {
                    this.installJava(args.packageName, envDir);

                    break;
                }

                case 'node': {
                    this.installNode(args.packageName, envDir);

                    break;
                }

                case 'python': {
                    this.installPython(args.packageName, envDir);

                    break;
                }

                default: {
                    throw new Error(`${flags.env} ${args.packageName} doesn't exist`);
                }
            }

            this.log(`✅ Package ${args.packageName} installed successfully in ${envDir}!`);
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this.error(`❌ Error installing package: ${msg}`);
        }
    }

    private installJava(pkg: string, dir: string) {
        const cmd = `mvn dependency:get -Dartifact=${pkg} -Ddest=${dir}`;
        execSync(cmd, {cwd: dir, stdio: 'inherit'});
    }

    private installNode(pkg: string, dir: string) {
        const pkgJsonPath = path.join(dir, 'package.json');
        if (!fs.existsSync(pkgJsonPath)) {
            fs.writeFileSync(pkgJsonPath, JSON.stringify({name: '@razomy/cli-env', version: '1.0.0'}));
        }

        const nodeExecutable = process.execPath;
        const npmMainPath = require.resolve('npm');
        const npmCliPath = path.join(path.dirname(npmMainPath), 'bin', 'npm-cli.js');

        const cmd = `"${nodeExecutable}" "${npmCliPath}" install ${pkg}`;
        execSync(cmd, {cwd: dir, stdio: 'inherit'});
    }


    private installPython(pkg: string, dir: string) {
        const pythonExe = process.platform === 'win32' ? 'python' : 'python3';
        const cmd = `${pythonExe} -m pip install ${pkg} --target .`;
        execSync(cmd, {cwd: dir, stdio: 'inherit'});
    }
}