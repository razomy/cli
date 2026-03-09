#!/usr/bin/env node

process.argv.splice(2, 0, 'run');

import { execute } from '@oclif/core';

await execute({ dir: import.meta.url });