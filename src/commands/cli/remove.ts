import {Args, Command} from '@oclif/core';
import {execSync} from 'node:child_process';
import * as fs from 'node:fs';
import {createRequire} from 'node:module';
import * as path from 'node:path';


const require = createRequire(import.meta.url);

export default class UninstallCommand extends Command {
  static args = {
    packageName: Args.string({
      description: 'Name of the npm package',
      required: true,
    }),
  };
  static description = 'Uninstalls an npm package';

  async run(): Promise<void> {
    const {args} = await this.parse(UninstallCommand);
    this.log(`⏳ Uninstalling package ${args.packageName}...`);

    const cliDataDir = path.join(this.config.dataDir, 'npm');

    // На всякий случай проверяем папку, чтобы не упало,
    // если пользователь вызовет uninstall до install
    if (!fs.existsSync(cliDataDir)) {
      fs.mkdirSync(cliDataDir, {recursive: true});
    }

    try {
      const nodeExecutable = process.execPath;
      const npmMainPath = require.resolve('npm');
      const npmCliPath = path.join(path.dirname(npmMainPath), 'bin', 'npm-cli.js');

      const command = `"${nodeExecutable}" "${npmCliPath}" uninstall ${args.packageName}`;

      execSync(command, {cwd: cliDataDir, stdio: 'inherit'});
      this.log(`✅ Package ${args.packageName} successfully uninstalled!`);
    } catch (error) {
      this.error(`❌ Error uninstalling package: ${error}`);
    }
  }
}