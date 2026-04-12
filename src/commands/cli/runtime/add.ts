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
    RuntimeRegistry
} from "../../../lib/runtime/runtime.ts";

export default class RuntimeAddCommand extends Command {
    static args = {
        runtimeName: Args.string({
            default: defaultPackage.runtimeName,
            description: `Which runtime to install (e.g. ${defaultPackage.runtimeName})`,
            options: Object.keys(RuntimeRegistry),
            required: false,
        }),
        version: Args.string({
            description: `Version to install (if not provided, default version is used) (e.g. ${RuntimeRegistry[defaultPackage.runtimeName].defaultVersion})`,
            required: false,
        }),
    };
    static description = `Downloads and installs isolated runtimes (${Object.keys(RuntimeRegistry)})`;
    static flags = {
        'set-default': Flags.boolean({
            char: 'd',
            default: false,
            description: 'Set this version as the default alias',
        }),
    };

    async run(): Promise<void> {
        const {args, flags} = await this.parse(RuntimeAddCommand);
        const {runtimeName} = args;

        const provider = RuntimeRegistry[runtimeName];

        let version = args.version || provider.defaultVersion;
        version = version.replace(/^v/, '');

        const downloadsDir = path.join(this.config.dataDir, 'cli', 'downloads');
        const runtimeDir = path.join(this.config.dataDir, 'cli', 'runtimes', runtimeName);
        const versionRuntimeDir = path.join(runtimeDir, version);
        const defaultRuntimeDir = path.join(runtimeDir, 'default');

        const shouldMakeDefault = !args.version || flags['set-default'] || !linkExists(defaultRuntimeDir);

        if (!fs.existsSync(runtimeDir)) fs.mkdirSync(runtimeDir, {recursive: true});
        if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, {recursive: true});

        if (fs.existsSync(versionRuntimeDir)) {
            this.log(`⚠️  ${runtimeName.toUpperCase()} v${version} is already installed.`);
            if (shouldMakeDefault) createSymlink(versionRuntimeDir, defaultRuntimeDir);
            return;
        }

        try {
            const platform = os.platform();
            const arch = os.arch();

            const downloadInfo = await provider.getDownloadInfo(version, platform, arch);
            const archivePath = path.join(downloadsDir, `${runtimeName}-${version}-${Date.now()}-${downloadInfo.filename}`);

            this.log(`⏳ Downloading ${runtimeName.toUpperCase()} v${version}...`);
            await downloadFile(downloadInfo.url, archivePath);

            this.log(`📦 Extracting...`);
            fs.mkdirSync(versionRuntimeDir, {recursive: true});
            await extractArchive(archivePath, versionRuntimeDir);
            await cleanupExtractedStructure(versionRuntimeDir);

            fs.unlinkSync(archivePath);

            this.log(`✅ ${runtimeName.toUpperCase()} v${version} installed in: 📂 ${versionRuntimeDir}`);

            if (shouldMakeDefault) {
                createSymlink(versionRuntimeDir, defaultRuntimeDir);
                this.log(`🔗 Created alias: 'default' -> v${version}`);
            }

        } catch (error) {
            if (fs.existsSync(versionRuntimeDir)) fs.rmSync(versionRuntimeDir, {force: true, recursive: true});
            const message = error instanceof Error ? error.message : String(error);
            this.error(`❌ Error installing runtime: ${message}`);
        }
    }
}
