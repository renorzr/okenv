import { textSync } from 'figlet';
const chalk = require('chalk');
import { program } from 'commander';
import { up } from './up';
import { config } from 'dotenv';


program
  .version('0.0.1')
  .description("Create OneBox Environment of Micro-services")
  .option('-s, --services <path>', 'Services description file', './services.yml')
  .option('-e, --env <path>', 'environment variables file', '.env')
  .parse(process.argv);

console.log(chalk.green(textSync('OneBox', { horizontalLayout: 'full' })));

const { services, env } = program.opts();

config({ path: env });
console.log("servicesFile=", services);
up(services);