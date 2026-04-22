import * as fs from 'fs';
import * as path from 'path';
import { chromium } from 'playwright';

/**
 * TEST SCRIPT: BUILD PDF REPORT
 * 
 * This script takes the AI response JSON, injects it into the HTML template,
 * and uses Playwright to generate a professional A4 PDF.
 */

async function main() {
    console.log("🚀 Starting PDF Generation Test...");

    const aiRespPath = path.resolve(process.cwd(), 'temp/last_ai_report_response.json');
    const templatePath = path.resolve(process.cwd(), 'public/temp/cbn_aml_report_template.html');
    const outputHtmlPath = path.resolve(process.cwd(), 'temp/test_report_populated.html');
    const outputPdfPath = path.resolve(process.cwd(), 'temp/test_report_final.pdf');

    // 1. Validate inputs
    if (!fs.existsSync(aiRespPath)) {
        console.error(`❌ AI Response file not found: ${aiRespPath}`);
        return;
    }
    if (!fs.existsSync(templatePath)) {
        console.error(`❌ Template file not found: ${templatePath}`);
        return;
    }

    // 2. Load the JSON data
    let aiResp;
    try {
        aiResp = JSON.parse(fs.readFileSync(aiRespPath, 'utf-8'));
        console.log("✅ AI Response JSON loaded.");
    } catch (e) {
        console.error("❌ Failed to parse AI Response JSON. Check for truncation or syntax errors.");
        return;
    }

    // 3. Load the HTML template
    let templateHtml = fs.readFileSync(templatePath, 'utf-8');
    console.log("✅ HTML template loaded.");

    // 4. Inject the actual data into the template
    // The template has a 'const DEMO_REPORT = { ... };' block we will overwrite.
    const escapedJson = JSON.stringify(aiResp);
    const scriptToInject = `const DEMO_REPORT = ${escapedJson};`;
    
    // Replace the DEMO_REPORT variable in the built-in script
    let updatedHtml = templateHtml.replace(/const DEMO_REPORT\s*=\s*\{[\s\S]*?\};/, scriptToInject);

    if (updatedHtml === templateHtml) {
        console.warn("⚠️ Could not find DEMO_REPORT block in template, injecting as fallback script.");
        updatedHtml = templateHtml.replace('</body>', `<script>window.addEventListener('load', () => render(${escapedJson}));</script></body>`);
    }

    fs.writeFileSync(outputHtmlPath, updatedHtml);
    console.log(`✅ Populated HTML saved to: ${outputHtmlPath}`);

    // 5. Use Playwright (Chromium) to render the PDF
    try {
        console.log("🎨 Opening Playwright browser...");
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        
        // Load the local HTML file
        // We use absolute path for file:// protocol
        const fileUrl = `file://${outputHtmlPath.replace(/\\/g, '/')}`;
        console.log(`📡 Loading: ${fileUrl}`);
        
        await page.goto(fileUrl, { waitUntil: 'networkidle' });
        
        // Wait for fonts and layout to settle
        console.log("⏳ Waiting for rendering to complete...");
        await page.waitForTimeout(2000);

        // Generate PDF
        console.log("📄 Exporting PDF...");
        await page.pdf({
            path: outputPdfPath,
            format: 'A4',
            printBackground: true,
            displayHeaderFooter: false,
            margin: {
                top: '0cm',
                right: '0cm',
                bottom: '0cm',
                left: '0cm'
            }
        });

        await browser.close();
        console.log("\n---");
        console.log(`🎉 SUCCESS! PDF generated.`);
        console.log(`📂 Location: ${outputPdfPath}`);
        console.log("---");

    } catch (pwError: any) {
        console.error("❌ Playwright Error:", pwError.message);
    }
}

main().catch(err => {
    console.error("❌ Fatal Error in script:", err);
});
