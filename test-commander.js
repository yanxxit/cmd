#!/usr/bin/env node

import { program } from 'commander';

program
  .command('test [size]')
  .option('-o, --output <path>')
  .option('-t, --title <title>')
  .action((size, options) => {
    console.log('Size:', size);
    console.log('Options:', options);
    console.log('Output:', options.output);
    console.log('Title:', options.title);
  });

program.parse(process.argv);