import {Args, Command} from '@oclif/core';
import * as fs from 'node:fs';
import path from 'node:path';

export default class EnvRemove extends Command {
    static args = {
        envName: Args.string({
            description: 'Which environment to remove',
            options: ['node', 'python', 'java'],
            required: true,
        }),
    };
static description = 'Removes an installed runtime environment';

    async run(): Promise<void> {
        const {args} = await this.parse(EnvRemove);
        const runtimeDir = path.join(this.config.dataDir, 'runtimes', args.envName);

        this.log(`⏳ Checking ${args.envName.toUpperCase()} runtime...`);

        if (!fs.existsSync(runtimeDir)) {
            this.error(`❌ Environment '${args.envName}' is not installed.\nNothing to remove.`);
        }

        try {
            this.log(`🗑️  Removing ${args.envName.toUpperCase()} files...`);

            // Удаляем папку рекурсивно (аналог rm -rf)
            fs.rmSync(runtimeDir, { force: true, recursive: true });

            this.log(`✅ ${args.envName.toUpperCase()} successfully removed!`);
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this.error(`❌ Error removing environment: ${msg}`);
        }
    }
}