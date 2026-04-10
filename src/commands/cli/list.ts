import {Command} from '@oclif/core';
import {execSync} from 'node:child_process';
import * as fs from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);

export default class ListCommand extends Command {
    static description = 'Lists all installed packages across all environments';

    async run(): Promise<void> {
        const baseDir = path.join(this.config.dataDir, 'environments');
        const environments = ['node', 'python', 'java'];
        let foundAny = false;

        this.log(`\n🔍 Scanning installed packages...`);

        for (const env of environments) {
            const envDir = path.join(baseDir, env);

            if (!fs.existsSync(envDir)) {
                continue;
            }

            foundAny = true;
            this.log(`\n📦 --- ${env.toUpperCase()} PACKAGES ---`);

            try {
                switch (env) {
                    case 'java': {
                        const files = fs.readdirSync(envDir).filter(f => f.endsWith('.jar'));
                        if (files.length === 0) {
                            this.log('   (empty)');
                        } else {
                            for (const f of files) this.log(`   ├── ${f}`);
                        }

                        break;
                    }

                    case 'node': {
                        const nodeExecutable = process.execPath;
                        const npmCliPath = path.join(path.dirname(require.resolve('npm')), 'bin', 'npm-cli.js');
                        execSync(`"${nodeExecutable}" "${npmCliPath}" list --depth=0`, {cwd: envDir, stdio: 'inherit'});

                        break;
                    }

                    case 'python': {
                        const pythonExe = process.platform === 'win32' ? 'python' : 'python3';
                        execSync(`${pythonExe} -m pip freeze --path .`, {cwd: envDir, stdio: 'inherit'});

                        break;
                    }
                    // No default
                }
            } catch {
                this.log(`   ⚠️ Failed to read ${env} packages. (Maybe the runtime is missing?)`);
            }
        }

        if (foundAny) {
            this.log(`\n✅ Done!`);
        } else {
            this.log(`\n📭 No packages installed in any environment yet.`);
            this.log(`💡 Use "razomy add <package>" to add some!`);
        }
    }
}