import extractZip from 'extract-zip';
import * as fs from 'node:fs';
import * as https from 'node:https';
import os from 'node:os';
import path from 'node:path';
import * as tar from 'tar';


interface DownloadInfo {
    filename: string;
    url: string;
}

interface RuntimeProvider {
    defaultVersion: string;

    getDownloadInfo(version: string, platform: string, arch: string): DownloadInfo;
}

export const RuntimesRegistry: Record<string, RuntimeProvider> = {
    java: {
        defaultVersion: '25',
        getDownloadInfo(version: string, platform: string, arch: string) {
            // Адаптировано под официальный Oracle JDK
            const osName = platform === 'win32' ? 'windows' : (platform === 'darwin' ? 'macos' : 'linux');
            const javaArch = arch === 'arm64' ? 'aarch64' : 'x64';
            const ext = platform === 'win32' ? 'zip' : 'tar.gz'; // Oracle отдает .zip для Windows

            // У Oracle разные пути: для '25' -> /latest/, для точных версий '21.0.2' -> /archive/
            const isMajorOnly = !version.includes('.');
            const basePath = isMajorOnly
                ? `java/${version}/latest/jdk-${version}`
                : `java/${version.split('.')[0]}/archive/jdk-${version}`;

            return {
                filename: `java.${ext}`,
                url: `https://download.oracle.com/${basePath}_${osName}-${javaArch}_bin.${ext}`
            };
        }
    },
    node: {
        defaultVersion: '25.9.0',
        getDownloadInfo(version: string, platform: string, arch: string) {
            const v = version.startsWith('v') ? version : `v${version}`;
            const nodeArch = arch === 'arm64' ? 'arm64' : 'x64';

            // URL структуры Node.js стабильны, менять не нужно
            if (platform === 'win32') return {
                filename: 'node.zip',
                url: `https://nodejs.org/dist/${v}/node-${v}-win-${nodeArch}.zip`
            };
            if (platform === 'darwin') return {
                filename: 'node.tar.gz',
                url: `https://nodejs.org/dist/${v}/node-${v}-darwin-${nodeArch}.tar.gz`
            };
            return {
                filename: 'node.tar.gz',
                url: `https://nodejs.org/dist/${v}/node-${v}-linux-${nodeArch}.tar.gz`
            };
        }
    },
    python: {
        defaultVersion: '3.14.4',
        getDownloadInfo(version: string, platform: string, arch: string) {
            // Для Windows официальный сайт предоставляет готовый портативный архив (.zip)
            if (platform === 'win32') {
                const pyArch = arch === 'arm64' ? 'arm64' : 'amd64';
                return {
                    filename: 'python.zip',
                    url: `https://www.python.org/ftp/python/${version}/python-${version}-embed-${pyArch}.zip`
                };
            }

            // ВАЖНО: Для Mac и Linux это скачает ИСХОДНЫЙ КОД (.tgz), так как официальных
            // готовых бинарников (standalone) python.org не предоставляет.
            return {
                filename: 'python.tar.gz',
                url: `https://www.python.org/ftp/python/${version}/Python-${version}.tgz`
            };

            /*
            // АЛЬТЕРНАТИВА (если вам нужны ГОТОВЫЕ бинарники для Mac/Linux без компиляции исходников):
            // Проект indygreg переехал в astral-sh. Вам нужно будет только подставлять
            // правильную дату релиза (buildDate), когда выйдет версия 3.14.4:

            const buildDate = '20240107'; // <- нужно будет обновить на дату релиза под вашу версию
            const nixArch = arch === 'arm64' ? 'aarch64' : 'x86_64';
            const osSuffix = platform === 'darwin' ? 'apple-darwin' : 'unknown-linux-gnu';

            return {
                filename: 'python.tar.gz',
                url: `https://github.com/astral-sh/python-build-standalone/releases/download/${buildDate}/cpython-${version}+${buildDate}-${nixArch}-${osSuffix}-install_only.tar.gz`
            };
            */
        }
    },
    rust: {
        defaultVersion: '1.94.1',
        getDownloadInfo(version: string, platform: string, arch: string) {
            let target = '';

            // URL структуры Rust стабильны, менять не нужно
            if (platform === 'win32') {
                target = arch === 'arm64' ? 'aarch64-pc-windows-msvc' : 'x86_64-pc-windows-msvc';
            } else if (platform === 'darwin') {
                target = arch === 'arm64' ? 'aarch64-apple-darwin' : 'x86_64-apple-darwin';
            } else {
                target = arch === 'arm64' ? 'aarch64-unknown-linux-gnu' : 'x86_64-unknown-linux-gnu';
            }

            return {
                filename: 'rust.tar.gz',
                url: `https://static.rust-lang.org/dist/rust-${version}-${target}.tar.gz`
            };
        }
    }
};

// ==========================================
// 3. УТИЛИТЫ ДЛЯ SYMLINK / ФАЙЛОВ
// ==========================================

export async function cleanupExtractedStructure(destDir: string): Promise<void> {
    const items = await fs.promises.readdir(destDir);
    if (items.length === 1) {
        const rootItemPath = path.join(destDir, items[0]);
        const stat = await fs.promises.stat(rootItemPath);

        if (stat.isDirectory()) {
            const subItems = await fs.promises.readdir(rootItemPath);
            for (const subItem of subItems) {
                const oldPath = path.join(rootItemPath, subItem);
                const newPath = path.join(destDir, subItem);
                // eslint-disable-next-line no-await-in-loop
                await fs.promises.rename(oldPath, newPath);
            }

            await fs.promises.rmdir(rootItemPath);
        }
    }
}

export function createSymlink(targetDir: string, linkPath: string) {
    // Удаляем старый симлинк, если он есть (даже сломанный)
    if (linkExists(linkPath)) {
        fs.rmSync(linkPath, {force: true, recursive: true});
    }

    // В Windows используем 'junction' (не требует прав админа), в Unix — 'dir'
    const linkType = os.platform() === 'win32' ? 'junction' : 'dir';

    fs.symlinkSync(targetDir, linkPath, linkType);
}

// ==========================================
// 4. СКАЧИВАНИЕ И РАСПАКОВКА
// ==========================================

export function downloadFile(url: string, dest: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const request = https.get(url, (response) => {
            if ((response.statusCode === 301 || response.statusCode === 302) && response.headers.location) {
                return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
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
            if (fs.existsSync(dest)) fs.unlinkSync(dest);
            reject(err);
        });
    });
}

export async function extractArchive(archivePath: string, destDir: string): Promise<void> {
    if (archivePath.endsWith('.zip')) {
        await extractZip(archivePath, {dir: destDir});
    } else if (archivePath.endsWith('.tar.gz')) {
        await tar.x({cwd: destDir, file: archivePath});
    } else {
        throw new Error(`Unsupported archive format: ${archivePath}`);
    }
}

export function linkExists(linkPath: string): boolean {
    try {
        // lstatSync проверяет сам симлинк, а не то, куда он ссылается (existsSync упадет, если симлинк сломан)
        return fs.lstatSync(linkPath).isSymbolicLink() || fs.existsSync(linkPath);
    } catch {
        return false;
    }
}
