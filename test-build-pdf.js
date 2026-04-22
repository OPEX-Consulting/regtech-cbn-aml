"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var playwright_1 = require("playwright");
/**
 * TEST SCRIPT: BUILD PDF REPORT
 *
 * This script takes the AI response JSON, injects it into the HTML template,
 * and uses Playwright to generate a professional A4 PDF.
 */
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var aiRespPath, templatePath, outputHtmlPath, outputPdfPath, aiResp, templateHtml, escapedJson, scriptToInject, updatedHtml, browser, page, fileUrl, pwError_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("🚀 Starting PDF Generation Test...");
                    aiRespPath = path.resolve(process.cwd(), 'temp/last_ai_report_response.json');
                    templatePath = path.resolve(process.cwd(), 'public/temp/cbn_aml_report_template.html');
                    outputHtmlPath = path.resolve(process.cwd(), 'temp/test_report_populated.html');
                    outputPdfPath = path.resolve(process.cwd(), 'temp/test_report_final.pdf');
                    // 1. Validate inputs
                    if (!fs.existsSync(aiRespPath)) {
                        console.error("\u274C AI Response file not found: ".concat(aiRespPath));
                        return [2 /*return*/];
                    }
                    if (!fs.existsSync(templatePath)) {
                        console.error("\u274C Template file not found: ".concat(templatePath));
                        return [2 /*return*/];
                    }
                    try {
                        aiResp = JSON.parse(fs.readFileSync(aiRespPath, 'utf-8'));
                        console.log("✅ AI Response JSON loaded.");
                    }
                    catch (e) {
                        console.error("❌ Failed to parse AI Response JSON. Check for truncation or syntax errors.");
                        return [2 /*return*/];
                    }
                    templateHtml = fs.readFileSync(templatePath, 'utf-8');
                    console.log("✅ HTML template loaded.");
                    escapedJson = JSON.stringify(aiResp);
                    scriptToInject = "const DEMO_REPORT = ".concat(escapedJson, ";");
                    updatedHtml = templateHtml.replace(/const DEMO_REPORT = \{[\s\S]*?\};/, scriptToInject);
                    if (updatedHtml === templateHtml) {
                        console.warn("⚠️ Could not find DEMO_REPORT block in template, injecting as fallback script.");
                        updatedHtml = templateHtml.replace('</body>', "<script>window.addEventListener('load', () => renderReport(".concat(escapedJson, "));</script></body>"));
                    }
                    fs.writeFileSync(outputHtmlPath, updatedHtml);
                    console.log("\u2705 Populated HTML saved to: ".concat(outputHtmlPath));
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 8, , 9]);
                    console.log("🎨 Opening Playwright browser...");
                    return [4 /*yield*/, playwright_1.chromium.launch({ headless: true })];
                case 2:
                    browser = _a.sent();
                    return [4 /*yield*/, browser.newPage()];
                case 3:
                    page = _a.sent();
                    fileUrl = "file://".concat(outputHtmlPath.replace(/\\/g, '/'));
                    console.log("\uD83D\uDCE1 Loading: ".concat(fileUrl));
                    return [4 /*yield*/, page.goto(fileUrl, { waitUntil: 'networkidle' })];
                case 4:
                    _a.sent();
                    // Wait for fonts and layout to settle
                    console.log("⏳ Waiting for rendering to complete...");
                    return [4 /*yield*/, page.waitForTimeout(2000)];
                case 5:
                    _a.sent();
                    // Generate PDF
                    console.log("📄 Exporting PDF...");
                    return [4 /*yield*/, page.pdf({
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
                        })];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, browser.close()];
                case 7:
                    _a.sent();
                    console.log("\n---");
                    console.log("\uD83C\uDF89 SUCCESS! PDF generated.");
                    console.log("\uD83D\uDCC2 Location: ".concat(outputPdfPath));
                    console.log("---");
                    return [3 /*break*/, 9];
                case 8:
                    pwError_1 = _a.sent();
                    console.error("❌ Playwright Error:", pwError_1.message);
                    return [3 /*break*/, 9];
                case 9: return [2 /*return*/];
            }
        });
    });
}
main().catch(function (err) {
    console.error("❌ Fatal Error in script:", err);
});
