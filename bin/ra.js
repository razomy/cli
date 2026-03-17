#!/usr/bin/env node

process.argv.splice(2, 0, 'ai');

import { execute } from '@oclif/core';

await execute({ dir: import.meta.url });