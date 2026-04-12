@razomy/cli
=================

A new CLI generated with oclif


[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@razomy/cli.svg)](https://npmjs.org/package/@razomy/cli)
[![Downloads/week](https://img.shields.io/npm/dw/@razomy/cli.svg)](https://npmjs.org/package/@razomy/cli)


<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @razomy/cli
$ razomy COMMAND
running command...
$ razomy (--version)
@razomy/cli/0.0.0-alpha.4 darwin-arm64 node-v24.14.0
$ razomy --help [COMMAND]
USAGE
  $ razomy COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`razomy cli add PACKAGENAME`](#razomy-cli-add-packagename)
* [`razomy cli list`](#razomy-cli-list)
* [`razomy cli remove PACKAGENAME`](#razomy-cli-remove-packagename)
* [`razomy cli runtime add [RUNTIMENAME] [VERSION]`](#razomy-cli-runtime-add-runtimename-version)
* [`razomy cli runtime list`](#razomy-cli-runtime-list)
* [`razomy cli runtime remove RUNTIMENAME [VERSION]`](#razomy-cli-runtime-remove-runtimename-version)
* [`razomy di`](#razomy-di)
* [`razomy io [MODULEPATH]`](#razomy-io-modulepath)

## `razomy cli add PACKAGENAME`

Installs a package

```
USAGE
  $ razomy cli add PACKAGENAME [-r python|node|rust|java]

ARGUMENTS
  PACKAGENAME  Name of the package (e.g. @razomy/string-case)

FLAGS
  -r, --runtime=<option>  [default: node] Target runtime (e.g. node)
                          <options: python|node|rust|java>

DESCRIPTION
  Installs a package
```

_See code: [src/commands/cli/add.ts](https://github.com/razomy/cli/blob/v0.0.0-alpha.4/src/commands/cli/add.ts)_

## `razomy cli list`

Lists all installed packages across all workspaces

```
USAGE
  $ razomy cli list

DESCRIPTION
  Lists all installed packages across all workspaces
```

_See code: [src/commands/cli/list.ts](https://github.com/razomy/cli/blob/v0.0.0-alpha.4/src/commands/cli/list.ts)_

## `razomy cli remove PACKAGENAME`

Uninstalls a package from the workspace

```
USAGE
  $ razomy cli remove PACKAGENAME [-r python|node|rust|java]

FLAGS
  -r, --runtime=<option>  [default: node] Target runtime (e.g. node)
                          <options: python|node|rust|java>

DESCRIPTION
  Uninstalls a package from the workspace
```

_See code: [src/commands/cli/remove.ts](https://github.com/razomy/cli/blob/v0.0.0-alpha.4/src/commands/cli/remove.ts)_

## `razomy cli runtime add [RUNTIMENAME] [VERSION]`

Downloads and installs isolated runtimes (python,node,rust,java)

```
USAGE
  $ razomy cli runtime add [RUNTIMENAME] [VERSION] [-d]

ARGUMENTS
  [RUNTIMENAME]  (python|node|rust|java) [default: node] Which runtime to install (e.g. node)
  [VERSION]      Version to install (if not provided, default version is used) (e.g. 25.9.0)

FLAGS
  -d, --set-default  Set this version as the default alias

DESCRIPTION
  Downloads and installs isolated runtimes (python,node,rust,java)
```

_See code: [src/commands/cli/runtime/add.ts](https://github.com/razomy/cli/blob/v0.0.0-alpha.4/src/commands/cli/runtime/add.ts)_

## `razomy cli runtime list`

Lists all installed runtimes and their versions

```
USAGE
  $ razomy cli runtime list

DESCRIPTION
  Lists all installed runtimes and their versions
```

_See code: [src/commands/cli/runtime/list.ts](https://github.com/razomy/cli/blob/v0.0.0-alpha.4/src/commands/cli/runtime/list.ts)_

## `razomy cli runtime remove RUNTIMENAME [VERSION]`

Removes an installed runtime or a specific version

```
USAGE
  $ razomy cli runtime remove RUNTIMENAME [VERSION]

ARGUMENTS
  RUNTIMENAME  (python|node|rust|java) Which runtime to remove (e.g. node)
  [VERSION]    Specific version to remove (e.g. 25.9.0). If not provided, completely removes the runtime.

DESCRIPTION
  Removes an installed runtime or a specific version
```

_See code: [src/commands/cli/runtime/remove.ts](https://github.com/razomy/cli/blob/v0.0.0-alpha.4/src/commands/cli/runtime/remove.ts)_

## `razomy di`

```
USAGE
  $ razomy di
```

_See code: [src/commands/di/index.ts](https://github.com/razomy/cli/blob/v0.0.0-alpha.4/src/commands/di/index.ts)_

## `razomy io [MODULEPATH]`

Dynamically executes a function from a any module with autocomplete and prompts

```
USAGE
  $ razomy io [MODULEPATH...]

ARGUMENTS
  [MODULEPATH...]  Path to package name with function path

DESCRIPTION
  Dynamically executes a function from a any module with autocomplete and prompts
```

_See code: [src/commands/io/index.ts](https://github.com/razomy/cli/blob/v0.0.0-alpha.4/src/commands/io/index.ts)_
<!-- commandsstop -->
