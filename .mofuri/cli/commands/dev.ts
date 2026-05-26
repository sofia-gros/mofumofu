import { DevServer } from "../../core/server";

export async function devAction(options: { port: string }) {
  const server = new DevServer(parseInt(options.port));
  try {
    await server.start();
  } catch (error) {
    console.error("❌ Dev server failed to start:", error);
    process.exit(1);
  }
}
