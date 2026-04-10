import {Args, Command, Flags} from '@oclif/core';
import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
    cleanupExtractedStructure,
    createSymlink,
    defaultPackage,
    downloadFile,
    extractArchive,
    linkExists,
    RuntimesRegistry
} from "../../../lib/env/runtime.ts";

export default class EnvInstall extends Command {
    static args = {
        envName: Args.string({
            default: defaultPackage.envName,
            description: `Which environment to install (e.g. ${defaultPackage.envName})`,
            options: Object.keys(RuntimesRegistry),
            required: false,
        }),
        version: Args.string({
            description: `Version to install (if not provided, default version is used) (e.g. ${RuntimesRegistry[defaultPackage.envName].defaultVersion})`,
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

        let targetVersion = args.version || provider.defaultVersion;
        targetVersion = targetVersion.replace(/^v/, '');

        const envBaseDir = path.join(this.config.dataDir, 'runtimes', envName);
        const runtimeDir = path.join(envBaseDir, targetVersion);
        const tempDir = path.join(this.config.dataDir, 'temp');
        const defaultLinkPath = path.join(envBaseDir, 'default');

        const shouldMakeDefault = !args.version || flags['set-default'] || !linkExists(defaultLinkPath);

        if (!fs.existsSync(envBaseDir)) fs.mkdirSync(envBaseDir, {recursive: true});
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, {recursive: true});

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
