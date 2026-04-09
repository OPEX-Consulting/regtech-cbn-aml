/**
 * scripts/test-local-ai.ts
 *
 * A standalone, Docker-free script to verify the AML reporting logic locally.
 * This script imports the logic from the Edge Function but runs via Node/tsx.
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';

// Simulation of the Edge Function environment
const runTest = async () => {
    console.log("🚀 Starting Standalone AI Test (Docker-Free Mode)");

    // 1. Load your .env
    const apiKey = process.env.AZURE_CLAUDE_API_KEY;
    const endpoint = process.env.AZURE_CLAUDE_ENDPOINT;
    const deployment = process.env.AZURE_CLAUDE_DEPLOYMENT;

    if (!apiKey || !endpoint) {
        console.error("❌ ERROR: Missing Azure credentials in .env");
        return;
    }

    // 2. Load the Master Prompt
    const promptPath = path.resolve(process.cwd(), 'temp/cbn_aml_report_prompt.md');
    const systemPrompt = fs.readFileSync(promptPath, 'utf8');

    // 3. Simulated Input (Matching your Johnny MFB case)
    const inputJson = {
        inst_name: "Johnny MFB",
        inst_type: "MFB",
        tx_vol: "<1K",
        cust_base: "10K-100K",
        cbn_risk: "Not assessed",
        geo: "Single state",
        group_structure: "Standalone",
        products: ["Retail deposits", "Agent banking"],
        channels: ["Branch network", "USSD"],
        aml_status: "Manual",
        aml_functions: ["CDD/KYC/KYB"],
        aiml: "No",
        auto_close: "No",
        risk_factors: [],
        governance: {
            "mlro": "Yes",
            "board-policy": "No"
        },
        audit: "Annually",
        extra_context: "Testing the brief output."
    };

    console.log(`📡 Calling Azure Claude for ${inputJson.inst_name}...`);

    try {
        const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-05-01-preview`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': apiKey
            },
            body: JSON.stringify({
                messages: [
                    { role: "system", content: systemPrompt },
                    { 
                      role: "user", 
                      content: `Generate report JSON for: ${JSON.stringify(inputJson)}` 
                    }
                ],
                max_tokens: 32000,
                temperature: 0.1,
                stream: false // For this test, we'll wait for the full response
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`Azure Error: ${response.status} - ${errBody}`);
        }

        const data: any = await response.json();
        const content = data.choices[0].message.content;

        // Extract JSON
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const reportJson = JSON.parse(jsonMatch[0]);

        console.log("✅ SUCCESS! AI generated the report.");
        console.log(`Rating: ${reportJson.overall_rating.rating}`);
        console.log(`Word Count (Standard 5.1): ${reportJson.standards.find((s:any) => s.section === "5.1")?.finding.split(' ').length} words`);

        // Save for visual verification
        const outPath = path.resolve(process.cwd(), 'temp/test_local_output.json');
        fs.writeFileSync(outPath, JSON.stringify(reportJson, null, 2));
        console.log(`📂 Saved output to: ${outPath}`);

    } catch (err: any) {
        console.error("❌ Test Failed:", err.message);
    }
};

runTest();
