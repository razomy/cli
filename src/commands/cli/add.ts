import { Args, Command } from '@oclif/core';
import { execSync } from 'node:child_process';

export default class InstallCommand extends Command {
  static args = {
    packageName: Args.string({
      description: 'The npm package name',
      required: true,
    }),
  };
static description = 'Installs an npm package for dynamic use';

  async run(): Promise<void> {
    const { args } = await this.parse(InstallCommand);
    this.log(`⏳ Installing package ${args.packageName}...`);

    try {
      // Install the package in the current directory (or you can use the global flag -g)
      execSync(`npm install ${args.packageName}`, { stdio: 'inherit' });
      this.log(`✅ Package ${args.packageName} installed successfully!`);
    } catch (error) {
      this.error(`❌ Error installing package: ${error}`);
    }
  }
}