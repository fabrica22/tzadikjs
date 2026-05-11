#!/usr/bin/env node
import { initProject } from './init.js';
import { generateReport } from './report.js';

export { initProject } from './init.js';
export { generateReport } from './report.js';

const [command, ...args] = process.argv.slice(2);

if (process.argv[1]?.endsWith('tzadik') || process.argv[1]?.endsWith('index.js')) {
  void run(command, args);
}

async function run(command = 'help', args: string[]): Promise<void> {
  try {
    switch (command) {
      case 'init': {
        const path = await initProject(args[0]);
        console.log(`tzadik config ready: ${path}`);
        break;
      }
      case 'report': {
        const path = await generateReport(args[0], args[1]);
        console.log(`tzadik report written: ${path}`);
        break;
      }
      case 'analyze':
        console.log('Run your Vite build with @tzadik/vite enabled, then run `tzadik report`.');
        break;
      case 'help':
      default:
        console.log(`tzadik commands:
  init [path]                 Create tzadik.config.ts
  analyze                     Print analysis instructions
  report [manifest] [output]  Generate a static HTML report`);
        break;
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
