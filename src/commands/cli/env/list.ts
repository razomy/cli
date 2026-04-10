import {Command} from '@oclif/core';
import * as fs from 'node:fs';
import path from 'node:path';

export default class EnvList extends Command {
    static description = 'Lists all installed runtime environments';

    async run(): Promise<void> {
        const runtimesDir = path.join(this.config.dataDir, 'runtimes');

        this.log(`\n🔍 Scanning installed environments...`);

        // Если папки runtimes вообще нет, значит ничего не установлено
        if (!fs.existsSync(runtimesDir)) {
            this.log('📭 No runtime environments installed yet.');
            this.log('💡 Run "razomy env add node" to install one.');
            return;
        }

        // Читаем содержимое папки
        const items = fs.readdirSync(runtimesDir);
        const installedEnvs = items.filter(item => {
            const itemPath = path.join(runtimesDir, item);
            return fs.statSync(itemPath).isDirectory(); // берем только папки
        });

        if (installedEnvs.length === 0) {
            this.log('📭 No runtime environments installed yet.');
            return;
        }

        // Выводим список
        this.log('✅ Installed runtimes:');
        for (const env of installedEnvs) {
            this.log(`   🚀 ${env.toUpperCase()} -> ${path.join(runtimesDir, env)}`);
        }
    }
}