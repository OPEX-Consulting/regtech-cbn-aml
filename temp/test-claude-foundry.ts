// Claude on Azure AI Foundry - API Key Test
//
// SETUP:
// 1. npm install @anthropic-ai/foundry-sdk
// 2. npm install -D @types/node tsx
// 3. Copy your .env values into your shell:
//      export AZURE_CLAUDE_ENDPOINT="https://regtech365-claude-model-resource.services.ai.azure.com/anthropic/"
//      export AZURE_CLAUDE_API_KEY="your_key_here"
//      export AZURE_CLAUDE_DEPLOYMENT="claude-sonnet-4-5"
// 4. npx tsx test-claude-foundry.ts
import "dotenv/config";
import { AnthropicFoundry } from "@anthropic-ai/foundry-sdk";

async function main() {
  // ── Read environment variables ────────────────────────────────────────────
  const apiKey     = process.env["AZURE_CLAUDE_API_KEY"];
  const baseURL    = process.env["AZURE_CLAUDE_ENDPOINT"];
  const deployment = process.env["AZURE_CLAUDE_DEPLOYMENT"] ?? "claude-sonnet-4-5";

  if (!apiKey) {
    console.error("❌ AZURE_CLAUDE_API_KEY is not set.");
    console.log('   Run: export AZURE_CLAUDE_API_KEY="your_key_here"');
    process.exit(1);
  }

  if (!baseURL) {
    console.error("❌ AZURE_CLAUDE_ENDPOINT is not set.");
    console.log(
      '   Run: export AZURE_CLAUDE_ENDPOINT="https://<resource>.services.ai.azure.com/anthropic/"'
    );
    process.exit(1);
  }

  console.log("✅ Credentials found.");
  console.log(`   Endpoint  : ${baseURL}`);
  console.log(`   Deployment: ${deployment}`);
  console.log("\n📡 Sending request to Claude on Foundry...\n");

  // ── Build the AnthropicFoundry client ─────────────────────────────────────
  // The SDK accepts either:
  //   • resource  – just the resource name, e.g. "regtech365-claude-model-resource"
  //   • baseURL   – the full endpoint URL (mutually exclusive with resource)
  // We use baseURL here so the value maps directly from AZURE_CLAUDE_ENDPOINT.
  const client = new AnthropicFoundry({
    apiKey,
    baseURL,
  });

  // ── Call the Messages API (streaming) ────────────────────────────────────
  try {
    const stream = client.messages.stream({
      model: deployment,          // deployment name = model parameter on Foundry
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content:
            "Hello! Please confirm you are working correctly. Tell me today's date and a fun fact.",
        },
      ],
    });

    console.log("🤖 Claude response (streaming):\n");

    // Stream text chunks as they arrive
    stream.on("text", (text) => {
      process.stdout.write(text);
    });

    // Wait for the full response to finish
    const finalMessage = await stream.finalMessage();

    console.log("\n");
    console.log("─────────────────────────────────────");
    console.log("✅ Connection successful!");
    console.log(`   Stop reason : ${finalMessage.stop_reason}`);
    console.log(`   Input tokens : ${finalMessage.usage.input_tokens}`);
    console.log(`   Output tokens: ${finalMessage.usage.output_tokens}`);
  } catch (error: unknown) {
    console.error("\n❌ API call failed.");

    if (error instanceof Error) {
      console.error("   Message:", error.message);

      const msg = error.message.toLowerCase();

      if (msg.includes("401") || msg.includes("unauthorized") || msg.includes("api_key")) {
        console.log(
          "\n👉 Your API key looks invalid.\n" +
          "   Get a fresh key from:\n" +
          "   Azure Portal → Your Foundry resource → Keys and Endpoint"
        );
      } else if (msg.includes("403") || msg.includes("forbidden")) {
        console.log(
          "\n👉 Permission denied.\n" +
          "   Check that your Azure account has the correct RBAC role\n" +
          "   (e.g. 'Cognitive Services OpenAI User') on the resource."
        );
      } else if (msg.includes("404") || msg.includes("not found")) {
        console.log(
          "\n👉 Endpoint or deployment not found.\n" +
          `   Verify the endpoint URL and deployment name:\n` +
          `   Endpoint  : ${baseURL}\n` +
          `   Deployment: ${deployment}`
        );
      } else if (msg.includes("quota") || msg.includes("rate")) {
        console.log(
          "\n👉 Rate limit or quota exceeded.\n" +
          "   Check your usage in Azure Portal → Cost Management."
        );
      }
    } else {
      console.error("   Unknown error:", error);
    }

    process.exit(1);
  }
}

main();
