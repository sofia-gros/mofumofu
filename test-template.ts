
import { Compiler } from "./.mofuri/core/compiler";

async function test() {
  const compiler = new Compiler(process.cwd());
  // @ts-ignore
  const evalTemplate = compiler["renderTemplate"].bind(compiler);

  const sfc = {
    serverScript: `exports.name = "World"; exports.posts = ["A", "B"];`,
    template: `
      <h1>Hello \${name}!</h1>
      <p>Backticks test: \`literal backtick\`</p>
      <p>Backslash test: C:\\Users\\Name</p>
      <ul>
        \${posts.map(p => \`<li>\${p}</li>\`).join('')}
      </ul>
    `,
    style: "",
    clientScript: ""
  };

  const context = { siteName: "Test", post: {}, posts: [] };

  try {
    const result = await evalTemplate(sfc, context);
    console.log("--- Render Result ---");
    console.log(result);
    console.log("----------------------");
    
    if (result.includes("Hello World!") && 
        result.includes("literal backtick") && 
        result.includes("C:\\Users\\Name") &&
        result.includes("<li>A</li><li>B</li>")) {
      console.log("✅ Test Passed!");
    } else {
      console.log("❌ Test Failed: Result missing expected parts.");
    }
  } catch (e) {
    console.error("❌ Test Failed with error:", e);
  }
}

test();
