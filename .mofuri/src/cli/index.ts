import { Command } from "commander";
import packageJson from "../../package.json";
import { initAction } from "./commands/init";
import { devAction } from "./commands/dev";
import { buildAction } from "./commands/build";

const program = new Command();

program
  .name("mofuri")
  .description("Next-Gen Static Site Generator")
  .version(packageJson.version);

program
  .command("init")
  .description("Initialize a new mofuri project")
  .action(initAction);

program
  .command("dev")
  .description("Start the development server")
  .option("-p, --port <number>", "Port to run the server on", "3000")
  .action(devAction);

program
  .command("build")
  .description("Build the static site")
  .action(buildAction);

program.parse();