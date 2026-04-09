import fs from "fs";
import path from "path";

/**
 * TEST SCRIPT: INVOKE SUPABASE EDGE FUNCTION LOCALLY
 * 
 * Assumes you have the Supabase CLI serving functions:
 *   supabase functions serve generate-aml-report --no-verify-jwt --env-file .env
 */

async function testFunction() {
  console.log("🚀 Testing Supabase Edge Function: generate-aml-report");
  
  const dummyDataPath = path.resolve(process.cwd(), "temp/dummy_assessment_data.json");
  
  if (!fs.existsSync(dummyDataPath)) {
      console.error("❌ Dummy data file not found at temp/dummy_assessment_data.json");
      return;
  }

  const dummyData = JSON.parse(fs.readFileSync(dummyDataPath, "utf-8"));

  // The default local port for Supabase Edge Functions
  const FUNCTION_URL = "http://127.0.0.1:54321/functions/v1/generate-aml-report";
  
  console.log(`📡 Sending POST request to ${FUNCTION_URL}...`);
  console.log("⏳ This may take up to 30-60 seconds as the AI generates the full report.");
  
  try {
    const response = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(dummyData),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("❌ Function error:", result.error || response.statusText);
      if (result.rawResponse) {
        console.log("🔍 Raw AI Response was:", result.rawResponse);
      }
      return;
    }

    console.log("\n---");
    console.log("✅ SUCCESS: Function returned a valid report!");
    console.log(`🏢 Institution: ${result.report.meta.inst_name}`);
    console.log(`🚩 Overall Rating: ${result.report.overall_rating.rating}`);
    console.log(`📉 Standards Assessed: ${result.report.standards.length}`);
    console.log("---");
    
    // Save the result to a file for inspection
    const outputPath = path.resolve(process.cwd(), "temp/edge_function_test_result.json");
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`💾 Full report saved to: ${outputPath}`);

  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.log("\n💡 Troubleshooting:");
    console.log("1. Ensure Supabase CLI is running the function:");
    console.log("   supabase functions serve generate-aml-report --no-verify-jwt --env-file .env");
    console.log("2. Check if the AI provider in .env is correctly configured.");
  }
}

testFunction();
