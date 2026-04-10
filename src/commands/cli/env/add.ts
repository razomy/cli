import {Args, Command, Flags} from '@oclif/core';
import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
    cleanupExtractedStructure,
    createSymlink,
    downloadFile,
    extractArchive,
    linkExists,
    RuntimesRegistry
} from "../../../lib/env/runtime.ts";

// ==========================================
// 2. ОСНОВНОЙ КЛАСС КОМАНДЫ
// ==========================================

export default class EnvInstall extends Command {
    static args = {
        envName: Args.string({
            description: 'Which environment to install',
            options: Object.keys(RuntimesRegistry),
            required: true,
        }),
        version: Args.string({
            description: 'Version to install (if not provided, default version is used)',
            required: false,
        }),
    };
    static description = `Downloads and installs isolated runtimes (${Object.keys(RuntimesRegistry)})`;
    static flags = {
        'set-default': Flags.boolean({
            char: 'd',
            default: false,
            description: 'Set this version as the default alias',
        }),
    };

    async run(): Promise<void> {
        const {args, flags} = await this.parse(EnvInstall);
        const {envName} = args;

        const provider = RuntimesRegistry[envName];

        // Если версия не указана - берем дефолтную
        const targetVersion = args.version || provider.defaultVersion;

        // Базовые пути
        const envBaseDir = path.join(this.config.dataDir, 'runtimes', envName);
        const runtimeDir = path.join(envBaseDir, targetVersion);
        const tempDir = path.join(this.config.dataDir, 'temp');
        const defaultLinkPath = path.join(envBaseDir, 'default'); // Путь для алиаса 'default'

        // Флаг: делаем ли мы эту версию дефолтной?
        // Делаем если: 1) не передали версию руками, 2) передали флаг --set-default, 3) симлинка default еще не существует
        const shouldMakeDefault = !args.version || flags['set-default'] || !linkExists(defaultLinkPath);

        if (!fs.existsSync(envBaseDir)) fs.mkdirSync(envBaseDir, {recursive: true});
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, {recursive: true});

        // Если версия уже установлена
        if (fs.existsSync(runtimeDir)) {
            this.log(`⚠️  ${envName.toUpperCase()} v${targetVersion} is already installed.`);
            if (shouldMakeDefault) createSymlink(runtimeDir, defaultLinkPath);
            return;
        }

        try {
            const platform = os.platform();
            const arch = os.arch();

            const downloadInfo = provider.getDownloadInfo(targetVersion, platform, arch);
            const archivePath = path.join(tempDir, `${envName}-${targetVersion}-${Date.now()}-${downloadInfo.filename}`);

            this.log(`⏳ Downloading ${envName.toUpperCase()} v${targetVersion}...`);
            await downloadFile(downloadInfo.url, archivePath);

            this.log(`📦 Extracting...`);
            fs.mkdirSync(runtimeDir, {recursive: true});
            await extractArchive(archivePath, runtimeDir);
            await cleanupExtractedStructure(runtimeDir);

            fs.unlinkSync(archivePath);

            this.log(`✅ ${envName.toUpperCase()} v${targetVersion} installed in: 📂 ${runtimeDir}`);

            // Создаем алиас "default", если нужно
            if (shouldMakeDefault) {
                createSymlink(runtimeDir, defaultLinkPath);
                this.log(`🔗 Created alias: 'default' -> v${targetVersion}`);
            }

        } catch (error) {
            if (fs.existsSync(runtimeDir)) fs.rmSync(runtimeDir, {force: true, recursive: true});
            const msg = error instanceof Error ? error.message : String(error);
            this.error(`❌ Error installing runtime: ${msg}`);
        }
    }
}