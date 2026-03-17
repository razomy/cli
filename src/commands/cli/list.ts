import {Command} from '@oclif/core';
import {execSync} from 'node:child_process';
import * as fs from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);

export default class ListCommand extends Command {
  static description = 'List an npm packages';

  async run(): Promise<void> {
    await this.parse(ListCommand);

    // Используем path.join для безопасной склейки путей
    const cliDataDir = path.join(this.config.dataDir, 'npm');

    if (!fs.existsSync(cliDataDir)) {
      fs.mkdirSync(cliDataDir, {recursive: true});
    }

    try {
      const nodeExecutable = process.execPath;
      const npmMainPath = require.resolve('npm');
      const npmCliPath = path.join(path.dirname(npmMainPath), 'bin', 'npm-cli.js');

      const command = `"${nodeExecutable}" "${npmCliPath}" list`;

      execSync(command, {cwd: cliDataDir, stdio: 'inherit'});
    } catch (error) {
      // npm list возвращает ошибку (non-zero exit code), если есть проблемы с peerDependencies.
      // Чтобы CLI не "падал" с некрасивым трейсом, лучше обернуть в try/catch.
      this.error(`❌ Error listing packages: ${error}`);
    }
  }
}