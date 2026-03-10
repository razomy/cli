import {Args, Command} from '@oclif/core';
import {execSync} from 'node:child_process';
import * as fs from 'node:fs';

export default class InstallCommand extends Command {
  static args = {
    packageName: Args.string({
      description: 'The npm package name',
      required: true,
    }),
  };
  static description = 'Installs an npm package for dynamic use';

  async run(): Promise<void> {
    const {args} = await this.parse(InstallCommand);
    this.log(`⏳ Installing package ${args.packageName}...`);

    const cliDataDir = this.config.dataDir+ '/npm';

// Создаем папку, если её нет
    if (!fs.existsSync(cliDataDir)) {
      fs.mkdirSync(cliDataDir, {recursive: true});
    }

    try {
      // Install the package in the current directory (or you can use the global flag -g)
      execSync(`npm install ${args.packageName}`, {
        cwd: cliDataDir,
        stdio: 'inherit'
      });
      this.log(`✅ Package ${args.packageName} installed successfully!`);
    } catch (error) {
      this.error(`❌ Error installing package: ${error}`);
    }
  }
}