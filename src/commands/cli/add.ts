import {Args, Command} from '@oclif/core';
import {execSync} from 'node:child_process';
import * as fs from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';

// Создаем require для работы в ESM/TS окружении
const require = createRequire(import.meta.url);

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

    const cliDataDir = path.join(this.config.dataDir, 'npm');

    // Создаем папку, если её нет
    if (!fs.existsSync(cliDataDir)) {
      fs.mkdirSync(cliDataDir, {recursive: true});
    }

    try {
      // 1. process.execPath — это абсолютный путь к Node.js,
      // который выполняет текущий код (внутри вашей чистой Ubuntu это будет Node из архива).
      const nodeExecutable = process.execPath;

      // 2. Находим путь к файлу запуска npm внутри наших собственных node_modules
      const npmMainPath = require.resolve('npm'); // найдет node_modules/npm/index.js
      const npmCliPath = path.join(path.dirname(npmMainPath), 'bin', 'npm-cli.js');

      // 3. Формируем команду вида: /path/to/node /path/to/npm-cli.js install <пакет>
      // Оборачиваем пути в кавычки на случай пробелов в путях
      const command = `"${nodeExecutable}" "${npmCliPath}" install ${args.packageName}`;

      // 4. Запускаем!
      execSync(command, {
        cwd: cliDataDir,
        stdio: 'inherit'
      });

      this.log(`✅ Package ${args.packageName} installed successfully!`);
    } catch (error) {
      this.error(`❌ Error installing package: ${error}`);
    }
  }
}