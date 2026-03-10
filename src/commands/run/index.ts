/* eslint-disable no-return-await,@typescript-eslint/no-explicit-any */
import {input, search, select} from '@inquirer/prompts';
import {Args, Command} from '@oclif/core';
import {existsSync, readFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

export interface FunctionSpecification {
  description: string;
  examples: { code: string; expected: string; }[];
  name: string;
  parameters: { description: string; name: string; type: string; }[];
  performance: { history: never[]; memoryDataSizeComplexityFn: string; timeDataSizeComplexityFn: string; };
  returns: { description: string; type: string; };
  title: string;
}

export default class RunCommand extends Command {
  static args = {
    modulePath: Args.string({
      description: 'Path to a local file or npm package name',
      required: false // Changed to false so we can trigger the autocomplete prompt
    }),
  };
  static description = 'Dynamically executes a function from a JS module with autocomplete and prompts';
  static strict = false; // Allow any number of arguments

  async run(): Promise<void> {
    const {args, argv} = await this.parse(RunCommand);
    const dynamicArgs = argv.slice(1) as string[];

    try {
      // 1. Get the target module (Either from args or Interactive Autocomplete)
      const targetModulePath = await this.determineModulePath(args.modulePath);

      this.log(`\n📦 Preparing module: ${targetModulePath}...`);

      // 2. Resolve paths
      const {importPath, moduleDir} = this.resolveModulePaths(targetModulePath);

      // 3. Read specifications
      const specs = this.loadSpecifications(moduleDir);

      // 4. Select function
      const {functionNameToRun, remainingArgs, selectedSpec} = await this.selectFunction(specs, dynamicArgs);

      // 5. Collect parameters
      const finalParams = await this.collectParameters(selectedSpec, remainingArgs);

      // 6. Execute
      await this.executeFunction(importPath, functionNameToRun, finalParams);
    } catch (error: unknown) {
      // Pass a default string if targetModulePath wasn't determined yet
      this.handleExecutionError(error, args.modulePath || 'Unknown Module');
    }
  }

  // --- 5. PARAMETER COLLECTION ---
  private async collectParameters(spec: FunctionSpecification | undefined, args: string[]): Promise<string[]> {
    const finalParams: string[] = [];

    if (spec && spec.parameters.length > 0) {
      this.log('⚙️  Collecting parameters:');

     for (let i = 0; i < spec.parameters.length; i++) {
        const paramDef = spec.parameters[i];

        if (args[i]) {
          this.log(`✔ ${paramDef.name} = ${args[i]}`);
          finalParams.push(args[i]);
        } else {
          // eslint-disable-next-line no-await-in-loop
          const answer = await input({
            message: `${paramDef.description} Type "${paramDef.type}".\n Enter <${paramDef.name}>:`
          });
          finalParams.push(answer);
        }
      }
    } else if (args.length > 0) {
      finalParams.push(...args);
    }

    return finalParams;
  }

  private async determineModulePath(providedArg?: string): Promise<string> {
    // Simulate `npm list` by reading the local package.json
    const installedPackages = this.getInstalledPackages();

    // If the user provided the argument in the CLI (e.g. `mycli run express`), use it directly
    if (providedArg) {
      const filteredPackages = installedPackages
        .find(pkg => pkg.toLowerCase().includes(providedArg));
      return filteredPackages || providedArg;
    }

    // Trigger an interactive searchable prompt using `@inquirer/prompts` built-in 'search'
    return await search({
      message: 'Select an npm package or type a local file path:',
      async source(searchTerm) {
        const term = (searchTerm || '').toLowerCase();

        // Filter packages based on what the user types
        const filteredPackages = installedPackages
          .filter(pkg => pkg.toLowerCase().includes(term))
          .map(pkg => ({name: `📦 ${pkg}`, value: pkg}));

        // Allow arbitrary local file paths. If they type something,
        // add what they typed as the very first option.
        if (term.length > 0) {
          filteredPackages.unshift({
            name: `📄 Use local path: ${term}`,
            value: term
          });
        }

        return filteredPackages;
      }
    });
  }

  // --- 6. EXECUTION ---
  private async executeFunction(importPath: string, functionNameToRun: string, finalParams: string[]): Promise<void> {
    const dynamicModule = await import(importPath);

    this.log('🚀 Executing...');

    const executionContext = {cli: this, params: finalParams};
    let result: unknown = null;
    if (functionNameToRun && typeof dynamicModule[functionNameToRun] === 'function') {
      result = await dynamicModule[functionNameToRun](...finalParams);
    } else if (typeof dynamicModule.default === 'function') {
      result = await dynamicModule.default(executionContext);
    } else if (typeof dynamicModule.run === 'function') {
      result = await dynamicModule.run(executionContext);
    } else {
      this.error(`Function "${functionNameToRun}" or "default()" not found in the module.`);
    }

    this.log('✅ Execution completed successfully!');
    this.log('Result:');
    this.log(result as never);
  }

  // --- HELPER: SIMULATE `npm list` ---
  private getInstalledPackages(): string[] {
    const packages = new Set<string>();
    try {
      const pkgPath = join(process.cwd(), 'package.json');
      if (existsSync(pkgPath)) {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
        // Grab standard and dev dependencies
        for (const dep of Object.keys(pkg.dependencies || {})) packages.add(dep);
        for (const dep of Object.keys(pkg.devDependencies || {})) packages.add(dep);
      }
    } catch {
      // Silently fail if package.json is missing or malformed
    }

    return [...packages];
  }

  // --- ERROR HANDLING ---
  private handleExecutionError(error: any, modulePath: string): void {
    if (error.isTtyError) {
      this.error('Interactive mode is not supported in the current terminal.');
    } else if (error.code === 'MODULE_NOT_FOUND' || error.code === 'ERR_MODULE_NOT_FOUND') {
      this.error(`Module "${modulePath}" not found.`);
    } else {
      this.error(`Execution error: ${error.message}`);
    }
  }

  // --- 3. READING SPECIFICATIONS ---
  private loadSpecifications(moduleDir: string): FunctionSpecification[] {
    const specPath1 = join(moduleDir, 'specifications.json');
    const actualSpecPath = existsSync(specPath1) ? specPath1 : null;

    if (actualSpecPath) {
      return JSON.parse(readFileSync(actualSpecPath, 'utf8')) as FunctionSpecification[];
    }

    return [];
  }

  // --- PRINT SPECIFICATION INFO ---
  private printSpecificationInfo(spec: FunctionSpecification): void {
    const params = spec.parameters.map(i => `${i.name}: ${i.type}`).join(', ')

    const m = `--- 📘 Selected function: ${spec.name}(${params}): ${spec.returns.type} ---`;
    this.log(m);
    this.log(`⏎ Returns: ${spec.returns.description}`);

    if (spec.examples && spec.examples.length > 0) {
      this.log(`💡 Example: ${spec.examples[0].code} ➔ ${spec.examples[0].expected}`);
    }

    this.log('-'.repeat(m.length));
  }

  // --- 2. PATH RESOLUTION ---
  private resolveModulePaths(modulePath: string): { importPath: string; moduleDir: string } {
    let importPath = modulePath;
    let moduleDir = '';

    if (importPath.startsWith('.') || importPath.startsWith('/')) {
      const absolutePath = resolve(process.cwd(), importPath);
      importPath = pathToFileURL(absolutePath).href;
      moduleDir = dirname(absolutePath);
    } else {
      try {
        // eslint-disable-next-line no-undef
        const packageJsonPath = require.resolve(`${modulePath}/package.json`, {paths: [process.cwd()]});
        moduleDir = dirname(packageJsonPath);
      } catch {
        moduleDir = resolve(process.cwd(), 'node_modules', modulePath);
      }
    }

    return {importPath, moduleDir};
  }

  // --- 4. FUNCTION SELECTION ---
  private async selectFunction(specs: FunctionSpecification[], args: string[]) {
    if (specs.length === 0) {
      return {functionNameToRun: '', remainingArgs: args, selectedSpec: undefined};
    }

    const passedFuncName = args[0];
    let selectedSpec = specs.find(s => s.name === passedFuncName);
    let remainingArgs = args;

    if (selectedSpec) {
      remainingArgs = args.slice(1);
    } else {
      selectedSpec = await select({
        choices: specs.map(s => {
          const params = s.parameters.map(i => `${i.name}: ${i.type}`).join(', ')
          return ({
            name: `${s.name}(${params}): ${s.returns.type}`,
            value: s
          })
        }),
        message: 'Multiple functions available in the module. Select one:'
      });
    }

    this.printSpecificationInfo(selectedSpec);
    return {functionNameToRun: selectedSpec.name, remainingArgs, selectedSpec};
  }
}