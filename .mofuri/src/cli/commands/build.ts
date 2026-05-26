import { Compiler } from "../../core/compiler";

export async function buildAction() {
  const compiler = new Compiler();
  try {
    await compiler.build();
  } catch (error) {
    console.error("❌ Build failed:", error);
    process.exit(1);
  }
}
