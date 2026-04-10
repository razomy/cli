import extractZip from 'extract-zip';
import {execSync} from 'node:child_process';
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

    install(pkg: string, dir: string, runtimeDir: string): void;

    list(envDir: string, runtimeDir: string): string[];

    remove(packageName: string, envDir: string, runtimeDir: string): void;
}

export const defaultPackage = {
    envName: "node",
    packageName: "@razomy/string-case",
}

/* eslint-disable perfectionist/sort-objects */
export const RuntimesRegistry: Record<string, RuntimeProvider> = {
    python: {
        defaultVersion: '3.14.4',
        install(pkg: string, dir: string, runtimeDir: string) {
            const isWin = process.platform === 'win32';
            const binPath = isWin ? runtimeDir : path.join(runtimeDir, 'bin');
            const pythonExe = isWin ? 'python' : 'python3';
            const customEnv = {...process.env, PATH: `${binPath}${path.delimiter}${process.env.PATH}`};

            execSync(`${pythonExe} -m pip install ${pkg} --target .`, {cwd: dir, env: customEnv, stdio: 'inherit'});
        },
        remove(packageName: string, envDir: string, runtimeDir: string) {
            const isWin = process.platform === 'win32';
            const binPath = isWin ? runtimeDir : path.join(runtimeDir, 'bin');
            const pythonExe = isWin ? 'python' : 'python3';
            const customEnv = {
                ...process.env,
                PATH: `${binPath}${path.delimiter}${process.env.PATH}`,
                PYTHONPATH: envDir
            };

            execSync(`${pythonExe} -m pip uninstall -y ${packageName}`, {
                cwd: envDir,
                env: customEnv,
                stdio: 'inherit'
            });
        },
        list(envDir: string, runtimeDir: string): string[] {
            const isWin = process.platform === 'win32';
            const binPath = isWin ? runtimeDir : path.join(runtimeDir, 'bin');
            const pythonExe = isWin ? 'python' : 'python3';
            const customEnv = {...process.env, PATH: `${binPath}${path.delimiter}${process.env.PATH}`};

            try {
                const output = execSync(`${pythonExe} -m pip freeze --path .`, {
                    cwd: envDir,
                    env: customEnv,
                    encoding: 'utf8'
                });
                return output.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            } catch {
                return [];
            }
        },
        getDownloadInfo(version: string, platform: string, arch: string) {
            if (platform === 'win32') {
                const pyArch = arch === 'arm64' ? 'arm64' : 'amd64';
                return {
                    filename: 'python.zip',
                    url: `https://www.python.org/ftp/python/${version}/python-${version}-embed-${pyArch}.zip`
                };
            }

            return {
                filename: 'python.tar.gz',
                url: `https://www.python.org/ftp/python/${version}/Python-${version}.tgz`
            };
        }
    },
    node: {
        defaultVersion: '25.9.0',
        install(pkg: string, dir: string, runtimeDir: string) {
            const pkgJsonPath = path.join(dir, 'package.json');
            if (!fs.existsSync(pkgJsonPath)) {
                fs.writeFileSync(pkgJsonPath, JSON.stringify({name: '@razomy/cli-env', version: '1.0.0'}));
            }

            const isWin = process.platform === 'win32';
            const binPath = isWin ? runtimeDir : path.join(runtimeDir, 'bin');
            const customEnv = {...process.env, PATH: `${binPath}${path.delimiter}${process.env.PATH}`};

            execSync(`npm install ${pkg}`, {cwd: dir, env: customEnv, stdio: 'inherit'});
        },
        remove(packageName: string, envDir: string, runtimeDir: string) {
            const isWin = process.platform === 'win32';
            const binPath = isWin ? runtimeDir : path.join(runtimeDir, 'bin');
            const customEnv = {...process.env, PATH: `${binPath}${path.delimiter}${process.env.PATH}`};

            execSync(`npm uninstall ${packageName}`, {cwd: envDir, env: customEnv, stdio: 'inherit'});
        },
        list(envDir: string): string[] {
            try {
                const pkgJsonPath = path.join(envDir, 'package.json');
                if (!fs.existsSync(pkgJsonPath)) return [];

                const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
                const deps = pkg.dependencies || {};

                return Object.entries(deps).map(([name, ver]) => `${name} (${ver})`);
            } catch {
                return [];
            }
        },
        getDownloadInfo(version: string, platform: string, arch: string) {
            const v = version.startsWith('v') ? version : `v${version}`;
            const nodeArch = arch === 'arm64' ? 'arm64' : 'x64';
            if (platform === 'win32') return {
                filename: 'node.zip',
                url: `https://nodejs.org/dist/${v}/node-${v}-win-${nodeArch}.zip`
            };
            if (platform === 'darwin') return {
                filename: 'node.tar.gz',
                url: `https://nodejs.org/dist/${v}/node-${v}-darwin-${nodeArch}.tar.gz`
            };
            return {filename: 'node.tar.gz', url: `https://nodejs.org/dist/${v}/node-${v}-linux-${nodeArch}.tar.gz`};
        }
    },
    rust: {
        defaultVersion: '1.94.1',
        install(pkg: string, dir: string, runtimeDir: string) {
            const cargoBin = path.join(runtimeDir, 'cargo', 'bin');
            const rustcBin = path.join(runtimeDir, 'rustc', 'bin');
            const customEnv = {
                ...process.env,
                PATH: `${cargoBin}${path.delimiter}${rustcBin}${path.delimiter}${process.env.PATH}`
            };

            const cargoTomlPath = path.join(dir, 'Cargo.toml');
            if (!fs.existsSync(cargoTomlPath)) {
                execSync('cargo init --bin', {cwd: dir, env: customEnv, stdio: 'inherit'});
            }

            execSync(`cargo add ${pkg}`, {cwd: dir, env: customEnv, stdio: 'inherit'});
        },
        remove(packageName: string, envDir: string, runtimeDir: string) {
            const cargoBin = path.join(runtimeDir, 'cargo', 'bin');
            const rustcBin = path.join(runtimeDir, 'rustc', 'bin');
            const customEnv = {
                ...process.env,
                PATH: `${cargoBin}${path.delimiter}${rustcBin}${path.delimiter}${process.env.PATH}`
            };

            execSync(`cargo remove ${packageName}`, {cwd: envDir, env: customEnv, stdio: 'inherit'});
        },
        list(envDir: string): string[] {
            try {
                const cargoTomlPath = path.join(envDir, 'Cargo.toml');
                if (!fs.existsSync(cargoTomlPath)) return [];

                const content = fs.readFileSync(cargoTomlPath, 'utf8');
                const match = content.match(/\[dependencies\]([\s\S]*?)(?:\n\[|$)/);
                if (!match) return [];

                return match[1].split('\n')
                    .map(l => l.trim())
                    .filter(l => l && !l.startsWith('#')) // Исключаем пустые строки и комментарии
                    .map(l => l.replace(/=.*/, '').trim()); // Оставляем только имя пакета до знака '='
            } catch {
                return [];
            }
        },
        getDownloadInfo(version: string, platform: string, arch: string) {
            let target = '';
            if (platform === 'win32') target = arch === 'arm64' ? 'aarch64-pc-windows-msvc' : 'x86_64-pc-windows-msvc';
            else if (platform === 'darwin') target = arch === 'arm64' ? 'aarch64-apple-darwin' : 'x86_64-apple-darwin';
            else target = arch === 'arm64' ? 'aarch64-unknown-linux-gnu' : 'x86_64-unknown-linux-gnu';
            return {filename: 'rust.tar.gz', url: `https://static.rust-lang.org/dist/rust-${version}-${target}.tar.gz`};
        }
    },
    java: {
        defaultVersion: '25',
        install(pkg: string, dir: string, runtimeDir: string) {
            const binPath = path.join(runtimeDir, 'bin');
            const customEnv = {
                ...process.env,
                JAVA_HOME: runtimeDir,
                PATH: `${binPath}${path.delimiter}${process.env.PATH}`
            };
            execSync(`mvn dependency:get -Dartifact=${pkg} -Ddest=${dir}`, {
                cwd: dir,
                env: customEnv,
                stdio: 'inherit'
            });
        },
        remove(packageName: string, envDir: string) {
            const files = fs.readdirSync(envDir);
            const jarFile = files.find(f => f.includes(packageName) && f.endsWith('.jar'));
            if (jarFile) {
                fs.unlinkSync(path.join(envDir, jarFile));
            } else {
                console.warn(`⚠️ Java package ${packageName} not found.`);
            }
        },
        list(envDir: string): string[] {
            try {
                if (!fs.existsSync(envDir)) return [];
                return fs.readdirSync(envDir).filter(f => f.endsWith('.jar'));
            } catch {
                return [];
            }
        },
        getDownloadInfo(version: string, platform: string, arch: string) {
            const osName = platform === 'win32' ? 'windows' : (platform === 'darwin' ? 'macos' : 'linux');
            const javaArch = arch === 'arm64' ? 'aarch64' : 'x64';
            const ext = platform === 'win32' ? 'zip' : 'tar.gz';
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
};

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
    if (linkExists(linkPath)) {
        fs.rmSync(linkPath, {force: true, recursive: true});
    }

    const linkType = os.platform() === 'win32' ? 'junction' : 'dir';

    fs.symlinkSync(targetDir, linkPath, linkType);
}

export function linkExists(linkPath: string): boolean {
    try {
        return fs.lstatSync(linkPath).isSymbolicLink() || fs.existsSync(linkPath);
    } catch {
        return false;
    }
}

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
