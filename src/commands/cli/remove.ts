import {Args, Command} from '@oclif/core';
import {execSync} from 'node:child_process';

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
    const cliDataDir = this.config.dataDir+ '/npm';

    try {
      execSync(`npm uninstall ${args.packageName}`, {cwd: cliDataDir, stdio: 'inherit'});
      this.log(`✅ Package ${args.packageName} successfully uninstalled!`);
    } catch (error) {
      this.error(`❌ Error uninstalling package: ${error}`);
    }
  }
}