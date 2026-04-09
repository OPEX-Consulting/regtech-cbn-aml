import fs from "fs";
import path from "path";
import "dotenv/config";

/**
 * SCRATCH TEST: GEMMA 4 STRUCTURED OUTPUT
 * 
 * This script isolates the Gemma 4 API call to find the exact 
 * working configuration for JSON mode.
 */

async function testGemmaJSON() {
  const geminiKey = process.env.GEMINI_API_KEY;
  const model = "gemma-4-26b-a4b-it";
  console.log(`🚀 Testing ${model} with Structured JSON...`);

  // A minimal schema to test connectivity
  const schema = {
    type: "OBJECT",
    properties: {
      institution_name: { type: "STRING" },
      overall_risk: { type: "STRING" },
      key_findings: { 
        type: "ARRAY", 
        items: { type: "STRING" } 
      }
    },
    required: ["institution_name", "overall_risk"]
  };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: "You are a JSON generator. Return only the requested object." }] },
          contents: [{
            role: "user",
            parts: [{ text: "Generate a mock AML report for 'Test Bank Ltd'." }],
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024,
            responseMimeType: "application/json",
            responseSchema: schema
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ API Error:", JSON.stringify(data, null, 2));
      return;
    }

    console.log("✅ SUCCESS!");
    console.log("🤖 Response Text:", data.candidates[0].content.parts[0].text);

  } catch (error: any) {
    console.error("❌ Request Failed:", error.message);
  }
}

testGemmaJSON();
