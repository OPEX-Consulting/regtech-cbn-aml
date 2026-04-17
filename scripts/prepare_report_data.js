import fs from 'fs';
import path from 'path';

const sourcePath = 'c:/Users/john9/Downloads/response_1776412832686.json';
const destPath = path.resolve('temp/last_ai_report_response.json');

try {
    const rawData = fs.readFileSync(sourcePath, 'utf-8');
    const jsonData = JSON.parse(rawData);
    
    const finalData = jsonData.report || jsonData;
    
    fs.writeFileSync(destPath, JSON.stringify(finalData, null, 2));
    console.log(`Successfully extracted and saved report to ${destPath}`);
} catch (error) {
    console.error(`Error processing JSON: ${error.message}`);
    process.exit(1);
}
