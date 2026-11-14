import { execFileSync } from "node:child_process";
import path from "node:path";

// Playwright runs from the project root.
const root = process.cwd();

/**
 * Loads the demo data before the suite runs.
 *
 * The local stack is started by the web server, which also exports its keys.
 * The demo data gives the tests providers, jobs and an offer to work with.
 */
export default function globalSetup() {
  const demoData = path.join(root, "scripts", "local-demo-data.sh");

  try {
    execFileSync(demoData, [], { stdio: "pipe" });
  } catch (error) {
    const output = [
      (error as { stdout?: string }).stdout ?? "",
      (error as { stderr?: string }).stderr ?? "",
    ].join("");

    // A stack that is not running yet is started by the web server, so the
    // demo data is loaded there instead. Anything else is a real failure.
    if (/could not connect|Connection refused|does not exist/i.test(output)) {
      console.log("The local stack is not up yet; the demo data loads with it.");
      return;
    }

    throw new Error(`The demo data could not be loaded.\n${output}`);
  }
}
