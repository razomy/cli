import {createRequire} from 'node:module';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

export async function createExecutor(importPath: string, moduleDir: string) {
  let exactFileUrl: string;

  try {
    const customRequire = createRequire(path.resolve(moduleDir, 'executor.js'));
    const exactFilePath = customRequire.resolve(importPath);
    exactFileUrl = pathToFileURL(exactFilePath).href;
  } catch {
    const absolutePath = path.resolve(moduleDir, importPath);
    exactFileUrl = pathToFileURL(absolutePath).href;
  }

  return exactFileUrl;
}
