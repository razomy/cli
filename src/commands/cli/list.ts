import {Command} from '@oclif/core';
import {execSync} from 'node:child_process';
import fs from 'node:fs';

export default class ListCommand extends Command {
  static description = 'List an npm packages';

  async run(): Promise<void> {
    await this.parse(ListCommand);
    const cliDataDir = this.config.dataDir + '/npm';
    if (!fs.existsSync(cliDataDir)) {
      fs.mkdirSync(cliDataDir, {recursive: true});
    }

    execSync(`npm list`, {cwd: cliDataDir, stdio: 'inherit'});
  }
}