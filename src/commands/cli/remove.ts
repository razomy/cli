import {Args, Command, Flags} from '@oclif/core';
import {execSync} from 'node:child_process';
import * as fs from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);

export default class UninstallCommand extends Command {
    static args = {
        packageName: Args.string({required: true}),
    };
    static description = 'Uninstalls a package from the environment';
    static flags = {
        env: Flags.string({
            char: 'e',
            default: 'node',
            options: ['node', 'python', 'java'],
        }),
    };

    async run(): Promise<void> {
        const {args, flags} = await this.parse(UninstallCommand);
        const envDir = path.join(this.config.dataDir, 'environments', flags.env);

        if (!fs.existsSync(envDir)) {
            this.error(`❌ Environment ${flags.env} is empty.`);
        }

        this.log(`⏳ Uninstalling [${flags.env}] package: ${args.packageName}...`);

        try {
            switch (flags.env) {
                case 'java': {
                    const files = fs.readdirSync(envDir);
                    const jarFile = files.find(f => f.includes(args.packageName) && f.endsWith('.jar'));
                    if (jarFile) {
                        fs.unlinkSync(path.join(envDir, jarFile));
                    } else {
                        this.log(`⚠️ Java package ${args.packageName} not found.`);
                    }

                    break;
                }

                case 'node': {
                    const nodeExecutable = process.execPath;
                    const npmCliPath = path.join(path.dirname(require.resolve('npm')), 'bin', 'npm-cli.js');
                    execSync(`"${nodeExecutable}" "${npmCliPath}" uninstall ${args.packageName}`, {
                        cwd: envDir,
                        stdio: 'inherit'
                    });

                    break;
                }

                case 'python': {
                    const pythonExe = process.platform === 'win32' ? 'python' : 'python3';
                    execSync(`${pythonExe} -m pip uninstall -y ${args.packageName}`, {
                        cwd: envDir,
                        env: {...process.env, PYTHONPATH: envDir},
                        stdio: 'inherit'
                    });

                    break;
                }

                default: {
                    throw new Error(`${flags.env} ${args.packageName} doesn't exist`);
                }
            }

            this.log(`✅ Package ${args.packageName} uninstalled!`);
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this.error(`❌ Error uninstalling package: ${msg}`);
        }
    }
}