import extractZip from 'extract-zip';
import {execSync} from 'node:child_process';
import {cli} from '@razomy/run';
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

    getDownloadInfo(version: string, platform: string, arch: string): Promise<DownloadInfo>;

    install(packageName: string, versionWorkspaceDir: string, versionRuntimeDir: string): void;

    list(versionWorkspaceDir: string, versionRuntimeDir: string): string[];

    remove(packageName: string, versionWorkspaceDir: string, versionRuntimeDir: string): void;

    run(versionWorkspaceDir: string, versionRuntimeDir: string, packageName: string, functionName: string, params: string): Promise<string>;

    setup(versionWorkspaceDir: string, runtime: string): void;
}

export const defaultPackage = {
    packageName: "@razomy/string-case",
    runtimeName: "node",
}

/* eslint-disable perfectionist/sort-objects */
export const RuntimeRegistry: Record<string, RuntimeProvider> = {
    python: {
        defaultVersion: '3.14.4',
        setup(versionWorkspaceDir) {
            const pyPath = path.join(versionWorkspaceDir, 'start_cli.py');
            const pyCode = `from razomy.run import cli\ncli.start()`;
            fs.writeFileSync(pyPath, pyCode);
        },
        run(versionWorkspaceDir, versionRuntimeDir, packageName, functionName, params) {
            const isWin = process.platform === 'win32';
            const binPath = isWin ? versionRuntimeDir : path.join(versionRuntimeDir, 'bin');
            const customEnv = {...process.env, PATH: `${binPath}${path.delimiter}${process.env.PATH}`};
            return cli.spawnProcess(`python`, ['start_cli.py', packageName, functionName, params], versionWorkspaceDir, customEnv);
        },
        install(packageName: string, versionWorkspaceDir: string, versionRuntimeDir: string) {
            const isWin = process.platform === 'win32';
            const binPath = isWin ? versionRuntimeDir : path.join(versionRuntimeDir, 'bin');
            const pythonExe = isWin ? 'python' : 'python3';
            const customEnv = {...process.env, PATH: `${binPath}${path.delimiter}${process.env.PATH}`};

            execSync(`${pythonExe} -m pip install ${packageName} --target .`, {
                cwd: versionWorkspaceDir,
                env: customEnv,
                stdio: 'inherit'
            });
        },
        remove(packageName: string, versionWorkspaceDir: string, versionRuntimeDir: string) {
            const isWin = process.platform === 'win32';
            const binPath = isWin ? versionRuntimeDir : path.join(versionRuntimeDir, 'bin');
            const pythonExe = isWin ? 'python' : 'python3';
            const customEnv = {
                ...process.env,
                PATH: `${binPath}${path.delimiter}${process.env.PATH}`,
                PYTHONPATH: versionWorkspaceDir
            };

            execSync(`${pythonExe} -m pip uninstall -y ${packageName}`, {
                cwd: versionWorkspaceDir,
                env: customEnv,
                stdio: 'inherit'
            });
        },
        list(versionWorkspaceDir: string, versionRuntimeDir: string): string[] {
            const isWin = process.platform === 'win32';
            const binPath = isWin ? versionRuntimeDir : path.join(versionRuntimeDir, 'bin');
            const pythonExe = isWin ? 'python' : 'python3';
            const customEnv = {...process.env, PATH: `${binPath}${path.delimiter}${process.env.PATH}`};

            try {
                const output = execSync(`${pythonExe} -m pip freeze --path .`, {
                    cwd: versionWorkspaceDir,
                    env: customEnv,
                    encoding: 'utf8'
                });
                return output.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            } catch {
                return [];
            }
        },
        async getDownloadInfo(version: string, platform: string, arch: string) {
            const archMap = {
                'x64': 'x86_64',
                'arm64': 'aarch64'
            };

            const platformMap = {
                'darwin': 'apple-darwin',
                'linux': 'unknown-linux-gnu',
                'win32': 'pc-windows-msvc-shared'
            };

            const targetArch = archMap[arch as keyof typeof archMap] || 'x86_64';
            const targetPlatform = platformMap[platform as keyof typeof platformMap];

            const apiUrl = 'https://api.github.com/repos/astral-sh/python-build-standalone/releases/latest';

            const response = await fetch(apiUrl, {
                headers: {'Accept': 'application/vnd.github.v3+json'}
            });
            const release = await response.json();

            const asset = release.assets.find((a: { name: string }) => {
                const {name} = a;
                return name.includes(`cpython-${version}`) &&
                    name.includes(targetArch) &&
                    name.includes(targetPlatform) &&
                    name.includes('install_only');
            });

            if (asset) {
                return {
                    filename: asset.name,
                    url: asset.browser_download_url,
                };
            }

            throw new Error(`Бинарник для Python ${version} (${platform} ${arch}) не найден.`);


        }
    },
    node: {
        defaultVersion: '25.9.0',
        setup(versionWorkspaceDir) {
            const nodePath = path.join(versionWorkspaceDir, 'start_cli.mjs');
            const nodeCode = `import {cli} from '@razomy/run';\ncli.start();`;
            fs.writeFileSync(nodePath, nodeCode);
        },
        run(versionWorkspaceDir, versionRuntimeDir, packageName, functionName, params) {
            const isWin = process.platform === 'win32';
            const binPath = isWin ? versionRuntimeDir : path.join(versionRuntimeDir, 'bin');
            const customEnv = {...process.env, PATH: `${binPath}${path.delimiter}${process.env.PATH}`};
            return cli.spawnProcess(`node`, ['start_cli.mjs', packageName, functionName, params], versionWorkspaceDir, customEnv);
        },
        install(packageName: string, versionWorkspaceDir: string, versionRuntimeDir: string) {
            const pkgJsonPath = path.join(versionWorkspaceDir, 'package.json');
            if (!fs.existsSync(pkgJsonPath)) {
                fs.writeFileSync(pkgJsonPath, JSON.stringify({name: '@razomy/cli-env', version: '1.0.0'}));
            }

            const isWin = process.platform === 'win32';
            const binPath = isWin ? versionRuntimeDir : path.join(versionRuntimeDir, 'bin');
            const customEnv = {...process.env, PATH: `${binPath}${path.delimiter}${process.env.PATH}`};

            execSync(`npm install ${packageName}`, {cwd: versionWorkspaceDir, env: customEnv, stdio: 'inherit'});
        },
        remove(packageName: string, versionWorkspaceDir: string, versionRuntimeDir: string) {
            const isWin = process.platform === 'win32';
            const binPath = isWin ? versionRuntimeDir : path.join(versionRuntimeDir, 'bin');
            const customEnv = {...process.env, PATH: `${binPath}${path.delimiter}${process.env.PATH}`};

            execSync(`npm uninstall ${packageName}`, {cwd: versionWorkspaceDir, env: customEnv, stdio: 'inherit'});
        },
        list(versionWorkspaceDir: string): string[] {
            try {
                const pkgJsonPath = path.join(versionWorkspaceDir, 'package.json');
                if (!fs.existsSync(pkgJsonPath)) return [];

                const packageName = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
                const deps = packageName.dependencies || {};

                return Object.entries(deps).map(([name, ver]) => `${name} (${ver})`);
            } catch {
                return [];
            }
        },
        async getDownloadInfo(version: string, platform: string, arch: string) {
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
        setup(versionWorkspaceDir) {
            const rustPath = path.join(versionWorkspaceDir, 'main.rs');
            const rustCode = `use razomy::run_cli;\nuse std::env;\n\nfunctionName main() {\n cli::start();\n}`;
            fs.writeFileSync(rustPath, rustCode);
            execSync(`rustc main.rs -o cli_runner`, {cwd: versionWorkspaceDir, stdio: 'inherit'});
        },
        run(versionWorkspaceDir, versionRuntimeDir, packageName, functionName, params) {
            const cargoBin = path.join(versionRuntimeDir, 'cargo', 'bin');
            const rustcBin = path.join(versionRuntimeDir, 'rustc', 'bin');
            const customEnv = {
                ...process.env,
                PATH: `${cargoBin}${path.delimiter}${rustcBin}${path.delimiter}${process.env.PATH}`
            };
            const executable = process.platform === 'win32' ? 'cli_runner.exe' : './cli_runner';
            return cli.spawnProcess(executable, [packageName, functionName, params], versionWorkspaceDir, customEnv);
        },
        install(packageName: string, versionWorkspaceDir: string, versionRuntimeDir: string) {
            const cargoBin = path.join(versionRuntimeDir, 'cargo', 'bin');
            const rustcBin = path.join(versionRuntimeDir, 'rustc', 'bin');
            const customEnv = {
                ...process.env,
                PATH: `${cargoBin}${path.delimiter}${rustcBin}${path.delimiter}${process.env.PATH}`
            };

            const cargoTomlPath = path.join(versionWorkspaceDir, 'Cargo.toml');
            if (!fs.existsSync(cargoTomlPath)) {
                execSync('cargo init --bin', {cwd: versionWorkspaceDir, env: customEnv, stdio: 'inherit'});
            }

            execSync(`cargo add ${packageName}`, {cwd: versionWorkspaceDir, env: customEnv, stdio: 'inherit'});
        },
        remove(packageName: string, versionWorkspaceDir: string, versionRuntimeDir: string) {
            const cargoBin = path.join(versionRuntimeDir, 'cargo', 'bin');
            const rustcBin = path.join(versionRuntimeDir, 'rustc', 'bin');
            const customEnv = {
                ...process.env,
                PATH: `${cargoBin}${path.delimiter}${rustcBin}${path.delimiter}${process.env.PATH}`
            };

            execSync(`cargo remove ${packageName}`, {cwd: versionWorkspaceDir, env: customEnv, stdio: 'inherit'});
        },
        list(versionWorkspaceDir: string): string[] {
            try {
                const cargoTomlPath = path.join(versionWorkspaceDir, 'Cargo.toml');
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
        async getDownloadInfo(version: string, platform: string, arch: string) {
            let target = '';
            if (platform === 'win32') target = arch === 'arm64' ? 'aarch64-pc-windows-msvc' : 'x86_64-pc-windows-msvc';
            else if (platform === 'darwin') target = arch === 'arm64' ? 'aarch64-apple-darwin' : 'x86_64-apple-darwin';
            else target = arch === 'arm64' ? 'aarch64-unknown-linux-gnu' : 'x86_64-unknown-linux-gnu';
            return {filename: 'rust.tar.gz', url: `https://static.rust-lang.org/dist/rust-${version}-${target}.tar.gz`};
        }
    },
    java: {
        defaultVersion: '25',
        setup(versionWorkspaceDir) {
            const javaPath = path.join(versionWorkspaceDir, 'StartCli.java');
            const javaCode = `import razomy.run.Cli;\n\npublic class StartCli {\n    public static void main(String[] args) {\n        Cli.start(args);\n    }\n}`;
            fs.writeFileSync(javaPath, javaCode);

            console.log("Compiling Java...");
            execSync(`javac StartCli.java`, {cwd: versionWorkspaceDir, stdio: 'inherit'});

            try {
                execSync(`native-image StartCli`, {cwd: versionWorkspaceDir, stdio: 'inherit'});
            } catch {
                console.warn("Native binary skipped. Using bytecode.");
            }
        },
        run(versionWorkspaceDir, versionRuntimeDir, packageName, functionName, params) {
            const binPath = (process.platform === 'darwin')
                ? path.join(versionRuntimeDir, 'Contents', 'Home', 'bin')
                : path.join(versionRuntimeDir, 'bin');
            const customEnv = {
                ...process.env,
                JAVA_HOME: versionRuntimeDir,
                PATH: `${binPath}${path.delimiter}${process.env.PATH}`
            };
            // Checks if native binary exists, otherwise uses java interpreter
            const cmd = fs.existsSync(path.join(versionWorkspaceDir, 'StartCli.exe')) || fs.existsSync(path.join(versionWorkspaceDir, 'StartCli'))
                ? `./StartCli`
                : `java StartCli`;
            return cli.spawnProcess(cmd, [packageName, functionName, params], versionWorkspaceDir, customEnv);
        },
        install(packageName: string, versionWorkspaceDir: string, versionRuntimeDir: string) {
            const binPath = (process.platform === 'darwin')
                ? path.join(versionRuntimeDir, 'Contents', 'Home', 'bin')
                : path.join(versionRuntimeDir, 'bin');
            const customEnv = {
                ...process.env,
                JAVA_HOME: versionRuntimeDir,
                PATH: `${binPath}${path.delimiter}${process.env.PATH}`
            };
            execSync(`mvn dependency:get -Dartifact=${packageName} -Ddest=${versionWorkspaceDir}`, {
                cwd: versionWorkspaceDir,
                env: customEnv,
                stdio: 'inherit'
            });
        },
        remove(packageName: string, versionWorkspaceDir: string) {
            const files = fs.readdirSync(versionWorkspaceDir);
            const jarFile = files.find(f => f.includes(packageName) && f.endsWith('.jar'));
            if (jarFile) {
                fs.unlinkSync(path.join(versionWorkspaceDir, jarFile));
            } else {
                console.warn(`⚠️ Java package ${packageName} not found.`);
            }
        },
        list(versionWorkspaceDir: string): string[] {
            try {
                if (!fs.existsSync(versionWorkspaceDir)) return [];
                return fs.readdirSync(versionWorkspaceDir).filter(f => f.endsWith('.jar'));
            } catch {
                return [];
            }
        },
        async getDownloadInfo(version: string, platform: string, arch: string) {
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
