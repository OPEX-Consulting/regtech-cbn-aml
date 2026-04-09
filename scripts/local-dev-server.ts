/**
 * scripts/local-dev-server.ts
 *
 * A lightweight Express server that mocks the Supabase Edge Function environment.
 * Use this to test the Frontend End-to-End without Docker.
 */

import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 54321; // The default Supabase Edge Function port

app.use(cors()); // Allow your Frontend (localhost:5173) to connect
app.use(express.json());

app.post('/functions/v1/generate-aml-report', async (req, res) => {
    console.log("📥 RECEIVED: Request from Frontend Assessment Form");

    const inputJson = req.body.inputJson;
    const apiKey = process.env.AZURE_CLAUDE_API_KEY;
    const endpoint = process.env.AZURE_CLAUDE_ENDPOINT;
    const deployment = process.env.AZURE_CLAUDE_DEPLOYMENT;
    const promptPath = path.resolve(process.cwd(), 'temp/cbn_aml_report_prompt.md');
    const systemPrompt = fs.readFileSync(promptPath, 'utf8');

    console.log(`📡 DIALING: Azure Claude for institution: ${inputJson?.inst_name || 'Unknown'}`);

    try {
        const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-05-01-preview`;
        
        const azureRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'api-key': apiKey as string },
            body: JSON.stringify({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Generate report JSON for: ${JSON.stringify(inputJson)}` }
                ],
                max_tokens: 32000,
                temperature: 0.1
            })
        });

        if (!azureRes.ok) {
            const errBody = await azureRes.text();
            console.error("❌ AZURE ERROR:", azureRes.status, errBody);
            return res.status(500).json({ error: `Azure Claude failed: ${azureRes.status}` });
        }

        const data: any = await azureRes.json();
        const content = data.choices[0].message.content;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const reportJson = JSON.parse(jsonMatch[0]);

        console.log("✅ SUCCESS: Report generated. Sending to frontend...");
        res.json({ report: reportJson });

    } catch (err: any) {
        console.error("❌ SERVER ERROR:", err.message);
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`
🚀 READY: Local End-to-End Docker-Bypass Server
📡 URL: http://localhost:54321/functions/v1/generate-aml-report
📖 Listening for frontend requests...
    `);
});
