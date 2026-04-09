import "dotenv/config";
import { AnthropicFoundry } from "@anthropic-ai/foundry-sdk";
import fs from "fs";
import path from "path";

/**
 * MASTER REGULATORY TEST: AZURE CLAUDE STREAMING
 */

async function main() {
  console.log("🚀 Initializing Master Regulatory Test (32k Token Limit)...");

  // 1. Data
  const dummyDataPath = path.resolve(process.cwd(), "temp/dummy_assessment_data.json");
  const inputJson = JSON.parse(fs.readFileSync(dummyDataPath, "utf-8"));

  // 2. Setup
  const apiKey = process.env.AZURE_CLAUDE_API_KEY;
  const baseURL = process.env.AZURE_CLAUDE_ENDPOINT;
  const deployment = process.env.AZURE_CLAUDE_DEPLOYMENT || "claude-sonnet-4-5";

  if (!apiKey || !baseURL) throw new Error("Azure credentials missing.");

  const indexTsPath = path.resolve(process.cwd(), "supabase/functions/generate-aml-report/index.ts");
  const indexContent = fs.readFileSync(indexTsPath, "utf-8");
  const promptMatch = indexContent.match(/const SYSTEM_PROMPT = `([\s\S]*?)`;/);
  const systemPrompt = promptMatch ? promptMatch[1] : "";

  console.log(`📡 Streaming master response from Claude on Azure...`);
  const startTime = Date.now();
  let rawResponseText = "";

  try {
    const client = new AnthropicFoundry({ apiKey, baseURL });
    const stream = client.messages.stream({
        model: deployment,
        max_tokens: 32000,
        system: systemPrompt,
        messages: [{ role: "user", content: `ASSESSMENT DATA: ${JSON.stringify(inputJson)}` }],
        temperature: 0.1,
    });

    stream.on("text", (text) => {
        rawResponseText += text;
        process.stdout.write(".");
    });

    await stream.finalMessage();
    const duration = (Date.now() - startTime) / 1000;
    console.log(`\n✅ Received response in ${duration.toFixed(2)}s`);

    // Parse & Save
    let cleanJson = rawResponseText.trim();
    const jsonStart = cleanJson.indexOf('{');
    const jsonEnd = cleanJson.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
        cleanJson = cleanJson.substring(jsonStart, jsonEnd + 1);
        const parsed = JSON.parse(cleanJson);
        const outputPath = path.resolve(process.cwd(), "temp/last_ai_report_response.json");
        fs.writeFileSync(outputPath, JSON.stringify(parsed, null, 2));
        console.log(`✅ Success! Full regulatory report saved to ${outputPath}`);
    }

  } catch (error: any) {
    console.error("\n❌ AI Test Failed:", error.message);
  }
}

main();
