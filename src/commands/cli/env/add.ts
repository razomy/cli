import {Args, Command} from '@oclif/core';
import extractZip from 'extract-zip';
import * as fs from 'node:fs';
import * as https from 'node:https';
import os from 'node:os';
import path from 'node:path';
import * as tar from 'tar';

export default class EnvInstall extends Command {
    static args = {
        envName: Args.string({
            description: 'Which environment to install',
            options: ['node', 'python', 'java'],
            required: true,
        }),
    };
static description = 'Downloads and installs isolated runtimes (Node.js, Python, Java)';

    async run(): Promise<void> {
        const {args} = await this.parse(EnvInstall);

        // Папка для движка (например: dataDir/runtimes/node)
        const runtimeDir = path.join(this.config.dataDir, 'runtimes', args.envName);

        // Временная папка для скачивания архива
        const tempDir = path.join(this.config.dataDir, 'temp');

        if (!fs.existsSync(runtimeDir)) fs.mkdirSync(runtimeDir, {recursive: true});
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, {recursive: true});

        try {
            // 1. Получаем правильный URL в зависимости от ОС (Windows, Mac, Linux)
            const downloadInfo = this.getDownloadInfo(args.envName);
            const archivePath = path.join(tempDir, downloadInfo.filename);

            this.log(`⏳ Downloading ${args.envName.toUpperCase()} from official servers...`);
            this.log(`🌐 URL: ${downloadInfo.url}`);

            // 2. Скачиваем файл
            await this.downloadFile(downloadInfo.url, archivePath);
            this.log(`📦 Download complete. Extracting...`);

            // 3. Распаковываем
            await this.extractArchive(archivePath, runtimeDir);

            // 4. Удаляем временный архив
            fs.unlinkSync(archivePath);

            this.log(`✅ ${args.envName.toUpperCase()} successfully installed in:`);
            this.log(`   📂 ${runtimeDir}`);

        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this.error(`❌ Error installing runtime: ${msg}`);
        }
    }

    // --- ЛОГИКА СКАЧИВАНИЯ ФАЙЛА (с поддержкой редиректов) ---
    private downloadFile(url: string, dest: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = https.get(url, (response) => {
                // Обрабатываем редиректы (например, API Adoptium редиректит на github)
                if ((response.statusCode === 301 || response.statusCode === 302) && response.headers.location) {
                        return this.downloadFile(response.headers.location, dest).then(resolve).catch(reject);
                    }

                if (response.statusCode !== 200) {
                    reject(new Error(`Failed to download, status code: ${response.statusCode}`));
                    return;
                }

                const file = fs.createWriteStream(dest);
                response.pipe(file);

                file.on('finish', () => {
                    file.close();
                    resolve();
                });
            });

            request.on('error', (err) => {
                fs.unlink(dest, () => {}); // Удаляем сломанный файл при ошибке
                reject(err);
            });
        });
    }

    // --- ЛОГИКА РАСПАКОВКИ АРХИВОВ ---
    private async extractArchive(archivePath: string, destDir: string): Promise<void> {
        if (archivePath.endsWith('.zip')) {
            // Извлекаем ZIP (Windows)
            await extractZip(archivePath, { dir: destDir });
        } else if (archivePath.endsWith('.tar.gz')) {
            // Извлекаем TAR.GZ (Mac / Linux)
            await tar.x({
                cwd: destDir,
                file: archivePath,
            });
        } else {
            throw new Error(`Unsupported archive format: ${archivePath}`);
        }
    }

    // --- ЛОГИКА ОПРЕДЕЛЕНИЯ ПРАВИЛЬНЫХ ССЫЛОК ---
    private getDownloadInfo(envName: string): {filename: string; url: string,} {
        const platform = os.platform(); // 'win32', 'darwin' (mac), 'linux'
        const arch = os.arch(); // 'x64', 'arm64'

        if (envName === 'node') {
            const version = 'v20.11.0';
            if (platform === 'win32') return { filename: 'node.zip', url: `https://nodejs.org/dist/${version}/node-${version}-win-x64.zip` };
            if (platform === 'darwin') return { filename: 'node.tar.gz', url: `https://nodejs.org/dist/${version}/node-${version}-darwin-x64.tar.gz` };
            return { filename: 'node.tar.gz', url: `https://nodejs.org/dist/${version}/node-${version}-linux-x64.tar.gz` };
        }

        if (envName === 'python') {
            // Для Windows используем официальный Embeddable package.
            // Для Mac/Linux качаем портативную сборку (indygreg), так как оф. сайт дает только исходники.
            const version = '3.11.7';
            if (platform === 'win32') return { filename: 'python.zip', url: `https://www.python.org/ftp/python/${version}/python-${version}-embed-amd64.zip` };
            if (platform === 'darwin') return { filename: 'python.tar.gz', url: `https://github.com/indygreg/python-build-standalone/releases/download/20240107/cpython-3.11.7+20240107-aarch64-apple-darwin-install_only.tar.gz` };
            return { filename: 'python.tar.gz', url: `https://github.com/indygreg/python-build-standalone/releases/download/20240107/cpython-3.11.7+20240107-x86_64-unknown-linux-gnu-install_only.tar.gz` };
        }

        if (envName === 'java') {
            // Используем API Adoptium (Eclipse Temurin) для получения последней Java 17
            const version = '17';
            const osName = platform === 'win32' ? 'windows' : (platform === 'darwin' ? 'mac' : 'linux');
            const ext = platform === 'win32' ? 'zip' : 'tar.gz';
            return { filename: `java.${ext}`, url: `https://api.adoptium.net/v3/binary/latest/${version}/ga/${osName}/x64/jdk/normal/eclipse` };
        }

        throw new Error('Unsupported environment');
    }
}