import {Command} from '@oclif/core';
import {execSync} from 'node:child_process';

export default class ListCommand extends Command {
  static description = 'List an npm packages';

  async run(): Promise<void> {
    await this.parse(ListCommand);
    execSync(`npm list`, {stdio: 'inherit'});
  }
}