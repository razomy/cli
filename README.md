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
@razomy/cli/0.0.0-alpha.3 darwin-arm64 node-v24.14.0
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
* [`razomy run [MODULEPATH]`](#razomy-run-modulepath)

## `razomy cli add PACKAGENAME`

Installs an npm package for dynamic use

```
USAGE
  $ razomy cli add PACKAGENAME

ARGUMENTS
  PACKAGENAME  The npm package name

DESCRIPTION
  Installs an npm package for dynamic use
```

_See code: [src/commands/cli/add.ts](https://github.com/razomy/cli/blob/v0.0.0-alpha.3/src/commands/cli/add.ts)_

## `razomy cli list`

List an npm packages

```
USAGE
  $ razomy cli list

DESCRIPTION
  List an npm packages
```

_See code: [src/commands/cli/list.ts](https://github.com/razomy/cli/blob/v0.0.0-alpha.3/src/commands/cli/list.ts)_

## `razomy cli remove PACKAGENAME`

Uninstalls an npm package

```
USAGE
  $ razomy cli remove PACKAGENAME

ARGUMENTS
  PACKAGENAME  Name of the npm package

DESCRIPTION
  Uninstalls an npm package
```

_See code: [src/commands/cli/remove.ts](https://github.com/razomy/cli/blob/v0.0.0-alpha.3/src/commands/cli/remove.ts)_

## `razomy run [MODULEPATH]`

Dynamically executes a function from a JS module with autocomplete and prompts

```
USAGE
  $ razomy run [MODULEPATH...]

ARGUMENTS
  [MODULEPATH...]  Path to a local file or npm package name

DESCRIPTION
  Dynamically executes a function from a JS module with autocomplete and prompts
```

_See code: [src/commands/run/index.ts](https://github.com/razomy/cli/blob/v0.0.0-alpha.3/src/commands/run/index.ts)_
<!-- commandsstop -->
