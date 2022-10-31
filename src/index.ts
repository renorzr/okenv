#!/usr/bin/env node

import { textSync } from 'figlet';
const chalk = require('chalk');
import { program } from 'commander';
import { up } from './up';
import { config } from 'dotenv';


program
  .version('0.0.1')
  .description("Create One-Key Environment of Micro-services")
  .option('-s, --services <path>', 'Services description file', './services.yml')
  .option('-e, --env <path>', 'environment variables file', '.env')
  .parse(process.argv);

console.log(chalk.green(textSync('OKENV', { horizontalLayout: 'full' })));

const { services, env } = program.opts();

config({ path: env });
console.log("servicesFile=", services);
up(services);
