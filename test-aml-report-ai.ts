import "dotenv/config";
import { AnthropicFoundry } from "@anthropic-ai/foundry-sdk";
import * as fs from "fs";
import * as path from "path";

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
    // --- PII STRIPPING START ---
    const { contact_email, contact_phone, contact_role, ...minimalInputJson } = inputJson;

    const originalPII = {
      contact_name: inputJson.contact_name,
      contact_email: contact_email,
      contact_phone: contact_phone,
      contact_role: contact_role,
    };
    // --- PII STRIPPING END ---

    const userMessage = `ASSESSMENT DATA: ${JSON.stringify(minimalInputJson)}`;

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
          // Re-insert exact fields from input to save prompt tokens
          parsed.meta.inst_name = minimalInputJson.inst_name;
          parsed.meta.inst_type = minimalInputJson.inst_type;
          parsed.meta.cbn_risk = minimalInputJson.cbn_risk;
          parsed.meta.tx_vol = minimalInputJson.tx_vol;
          parsed.meta.geo = minimalInputJson.geo;
          parsed.meta.group_structure = minimalInputJson.group_structure;

          // Re-insert static constants
          parsed.meta.circular_ref = "BSD/DIR/PUB/LAB/019/002";
          parsed.meta.roadmap_deadline = "10 June 2026";

          parsed.meta.contact_name = originalPII.contact_name;
          parsed.meta.contact_email = originalPII.contact_email;
          parsed.meta.contact_phone = originalPII.contact_phone;
          parsed.meta.contact_role = originalPII.contact_role;

          // Set real report date (DD/MM/YYYY)
          const now = new Date();
          parsed.meta.report_date = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
        }
        // --- PII UNMASKING END ---
        
        // --- HYDRATION START ---
        const STATIC_PRODUCTS: any = {
          "RegPort": {
            "tagline": "Integrated AML Platform for CBN Baseline Standards Compliance",
            "description": "RegPort unifies CDD/KYC, sanctions/PEP screening, transaction monitoring, customer risk assessment, and regulatory reporting in a single platform. The platform is purpose-built for Nigerian financial institutions, featuring real-time BVN/NIN integration via NIBSS, automated goAML/NFIU filing, and AI-enabled fuzzy matching for international sanctions lists.",
            "standards_addressed": "5.1, 5.2, 5.3, 5.4, 5.5, 5.8, 5.10"
          },
          "RegGuard": {
            "tagline": "Real-Time Fraud Monitoring with Bidirectional Risk Feed",
            "description": "RegGuard provides real-time fraud monitoring for card issuance, mobile money, and agent network channels. It detects pattern-based fraud like SIM swap attacks and account takeover, with an automated feed that pushes fraud alerts directly into customer risk scores to identify money laundering disguised as fraud.",
            "standards_addressed": "5.6"
          },
          "RegComply": {
            "tagline": "Enterprise Case Management with Immutable Audit Trails",
            "description": "RegComply delivers the mandatory Case Management and Governance Audit layer. It enforces Maker-Checker workflows for investigation, provides role-based access for MLROs, and maintains tamper-proof audit logs of all configuration changes and alert dispositions required for CBN examination.",
            "standards_addressed": "5.7, 5.9, 5.12"
          },
          "RegLearn": {
            "tagline": "AML Training Programme with Documented Records",
            "description": "RegLearn provides role-specific AML/CFT/CPF training modules covering the 12 Baseline Standards. The platform tracks staff completion, assessment scores, and certification status, producing the documented training records specifically mandated under Section 6.7 of the Circular.",
            "standards_addressed": "6.7"
          }
        };

        const STATIC_ADVISORY = [
          { "title": "CBN Roadmap Template completion", "description": "End-to-end support in completing and validating the mandatory 12-section roadmap for June 10th submission." },
          { "title": "AML/CFT/CPF policy drafting", "description": "Development of Board-approved policies aligned with the new 2026 Baseline Standards and ISO 42001." },
          { "title": "MLRO appointment advisory", "description": "Guidance on role definition, reporting lines, and CBN notification for newly appointed MLROs." },
          { "title": "Evidence pack preparation", "description": "Compilation of all technical and governance documentation into an audit-ready format for CBN examination." },
          { "title": "ISO 27001 and 42001 alignment", "description": "Gap analysis and implementation support for international security and AI governance standards." },
          { "title": "Vendor due diligence", "description": "Structured evaluation of RegTech platform providers against CBN technical requirements." },
          { "title": "Governance framework drafting", "description": "Drafting of AML Solution Governance, Change Control, and Data Retention policies." }
        ];

        if (parsed.support_section) {
          // Hydrate Products
          if (Array.isArray(parsed.support_section.products)) {
            parsed.support_section.products = parsed.support_section.products.map((p: any) => {
              const staticData = STATIC_PRODUCTS[p.name];
              return staticData ? { ...p, ...staticData } : p;
            });
          }

          // Hydrate Advisory
          const dynamicAdvisory = Array.isArray(parsed.support_section.advisory_services) 
            ? parsed.support_section.advisory_services 
            : [];
          parsed.support_section.advisory_services = [...STATIC_ADVISORY, ...dynamicAdvisory];
        }

        // --- ROADMAP HYDRATION START ---
        if (parsed.roadmap && Array.isArray(parsed.roadmap.milestones)) {
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            const now = new Date();
            
            parsed.roadmap.milestones = parsed.roadmap.milestones.map((m: any) => {
                const milestoneDate = new Date(now.getFullYear(), now.getMonth() + (m.month_offset || 0), 1);
                const targetDateStr = `${monthNames[milestoneDate.getMonth()]} ${milestoneDate.getFullYear()}`;
                
                // Re-map month_offset to target_date for the final JSON
                const { month_offset, ...rest } = m;
                return { ...rest, target_date: targetDateStr };
            });
        }
        // --- ROADMAP HYDRATION END ---
        // --- HYDRATION END ---

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
