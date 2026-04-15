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
    // --- PII MASKING START ---
    const originalPII = {
      contact_name: inputJson.contact_name,
      contact_email: inputJson.contact_email,
      contact_phone: inputJson.contact_phone,
    };

    const maskedInputJson = {
      ...inputJson,
      contact_name: "[REDACTED_NAME]",
      contact_email: "[REDACTED_EMAIL]",
      contact_phone: "[REDACTED_PHONE]",
    };
    // --- PII MASKING END ---

    const userMessage = `ASSESSMENT DATA: ${JSON.stringify(maskedInputJson)}`;

    // Log Full Prompt to File
    const promptLogPath = path.resolve(process.cwd(), "temp/last_ai_prompt_sent.log");
    const fullPromptLog = `═══════════════ SYSTEM PROMPT ═══════════════\n${systemPrompt}\n\n═══════════════ USER MESSAGE ═══════════════\n${userMessage}\n`;
    fs.writeFileSync(promptLogPath, fullPromptLog);
    console.log(`📝 Full prompt logged to ${promptLogPath} (PII Masked)`);

    const client = new AnthropicFoundry({ apiKey, baseURL });
    const stream = client.messages.stream({
        model: deployment,
        max_tokens: 32000,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
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

        // --- PII UNMASKING START ---
        if (parsed.meta) {
          parsed.meta.contact_name = originalPII.contact_name;
          parsed.meta.contact_email = originalPII.contact_email;
          parsed.meta.contact_phone = originalPII.contact_phone;

          // Set real report date (DD/MM/YYYY)
          const now = new Date();
          parsed.meta.report_date = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
        }
        // --- PII UNMASKING END ---

        const outputPath = path.resolve(process.cwd(), "temp/last_ai_report_response.json");
        fs.writeFileSync(outputPath, JSON.stringify(parsed, null, 2));
        console.log(`✅ Success! Full regulatory report saved to ${outputPath}`);
    }

  } catch (error: any) {
    console.error("\n❌ AI Test Failed:", error.message);
    const errorLogPath = path.resolve(process.cwd(), "temp/test_error.log");
    fs.writeFileSync(errorLogPath, `[${new Date().toISOString()}] ERROR:\n${error.message}\n\nSTACK:\n${error.stack}`);
    console.log(`📝 Error details logged to ${errorLogPath}`);
  }
}

main().catch(err => {
    console.error("FATAL UNCAUGHT ERROR:", err);
    const errorLogPath = path.resolve(process.cwd(), "temp/test_error.log");
    fs.appendFileSync(errorLogPath, `\n\n[${new Date().toISOString()}] FATAL UNCAUGHT:\n${err.message}\n${err.stack}`);
});
