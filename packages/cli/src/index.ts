/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';
import { generateUdevRules, listPrinters, openPrinter } from '@thermal-label/labelmanager-node';

export function createProgram(): Command {
  const program = new Command();
  program.name('dymo').description('DYMO LabelManager CLI');

  program
    .command('list')
    .description('List connected DYMO printers')
    .action(async () => {
      const printers = await listPrinters();
      if (printers.length === 0) {
        console.log(chalk.yellow('No compatible DYMO printers detected.'));
        return;
      }

      for (const printer of printers) {
        console.log(
          `${printer.device.name} (${printer.path}) ${printer.serialNumber ?? ''}`.trim(),
        );
      }
    });

  const print = program.command('print').description('Print text or images');

  print
    .command('text')
    .argument('<text>', 'Text to print')
    .option('-t, --tape <width>', 'Tape width in mm (6, 9, 12, 19)', '12')
    .option('-i, --invert', 'White text on black background')
    .option('-d, --density <level>', 'Print density: normal | high', 'normal')
    .option('-s, --serial <sn>', 'Target a specific printer by serial number')
    .action(async (text: string, options) => {
      const spinner = ora('Printing text label...').start();
      try {
        const printer = await openPrinter({ serialNumber: options.serial });
        await printer.printText(text, {
          tapeWidth: Number(options.tape),
          invert: Boolean(options.invert),
          density: options.density,
        });
        printer.close();
        spinner.succeed('Printed text label.');
      } catch (error) {
        spinner.fail(error instanceof Error ? error.message : 'Failed to print text label.');
        throw error;
      }
    });

  print
    .command('image')
    .argument('<file>', 'Image file path')
    .option('-t, --tape <width>', 'Tape width in mm', '12')
    .option('--dither', 'Use Floyd-Steinberg dithering', false)
    .option('--threshold <value>', 'Threshold for B&W conversion', '128')
    .option('-i, --invert', 'Invert image')
    .action(async (file: string, options) => {
      const spinner = ora('Printing image label...').start();
      try {
        const printer = await openPrinter();
        await printer.printImage(file, {
          tapeWidth: Number(options.tape),
          dither: Boolean(options.dither),
          threshold: Number(options.threshold),
          invert: Boolean(options.invert),
        });
        printer.close();
        spinner.succeed('Printed image label.');
      } catch (error) {
        spinner.fail(error instanceof Error ? error.message : 'Failed to print image label.');
        throw error;
      }
    });

  program
    .command('status')
    .description('Show printer status')
    .action(async () => {
      const printer = await openPrinter();
      const status = await printer.getStatus();
      printer.close();
      console.log(JSON.stringify(status, null, 2));
    });

  const setup = program.command('setup').description('Setup helpers');
  setup
    .command('linux')
    .description('Print Linux setup instructions')
    .action(() => {
      console.log('Install usb_modeswitch and udev rules:');
      console.log(generateUdevRules());
    });

  return program;
}

/**
 * Execute the CLI.
 *
 * @param argv Process argument vector.
 */
export async function run(argv = process.argv): Promise<void> {
  const program = createProgram();
  await program.parseAsync(argv);
}
