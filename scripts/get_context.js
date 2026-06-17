const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const RULES_FILES = ['GEMINI.md', 'TECHNICAL_STACK.md', 'SECURITY_STANDARDS.md'];

async function getContext() {
    const targetPaths = process.argv.slice(2);
    
    if (targetPaths.length === 0) {
        console.error('Usage: node scripts/get_context.js <file_or_dir_path>');
        process.exit(1);
    }

    let contextText = `### SYSTEM INSTRUCTIONS FOR CHATGPT ###
You are an expert software architect and security auditor. 
I am providing you with my project's core rules and specific code files.

YOUR TASK:
1. Analyze the provided code files for flaws, security vulnerabilities, or deviations from the PROJECT RULES provided below.
2. Based on your analysis, generate a concise, high-signal PROMPT that I can paste into my "Gemini CLI" to fix these issues or implement the next feature.
3. The generated prompt for Gemini CLI must be specific, mentioning file paths and exact changes needed.

### PROJECT RULES & STANDARDS ###\n`;

    // 1. Read Rule Files
    for (const ruleFile of RULES_FILES) {
        const fullPath = path.join(PROJECT_ROOT, ruleFile);
        if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf8');
            contextText += `\n--- FILE: ${ruleFile} ---\n${content}\n`;
        }
    }

    contextText += `\n### TARGET CODE FOR ANALYSIS ###\n`;

    // 2. Read Target Files
    for (const targetPath of targetPaths) {
        const fullPath = path.resolve(PROJECT_ROOT, targetPath);
        if (fs.existsSync(fullPath)) {
            const stats = fs.statSync(fullPath);
            if (stats.isFile()) {
                const content = fs.readFileSync(fullPath, 'utf8');
                contextText += `\n--- FILE: ${targetPath} ---\n${content}\n`;
            } else if (stats.isDirectory()) {
                // For simplicity, just list files if it's a directory, 
                // but usually, we want specific files for ChatGPT context limits.
                contextText += `\n--- DIRECTORY: ${targetPath} (List of files) ---\n`;
                const files = fs.readdirSync(fullPath);
                contextText += files.join('\n') + '\n';
            }
        } else {
            console.warn(`Warning: Path not found: ${targetPath}`);
        }
    }

    contextText += `\n### USER REQUEST ###\n[DESCRIBE WHAT YOU WANT TO DO HERE OR LEAVE BLANK FOR GENERAL AUDIT]\n`;

    // 3. Copy to Clipboard
    const tempFile = path.join(PROJECT_ROOT, 'scripts', 'temp_context.txt');
    fs.writeFileSync(tempFile, contextText);

    exec(`clip < "${tempFile}"`, (error) => {
        if (error) {
            console.error('Error copying to clipboard:', error);
        } else {
            console.log('✅ Success! Context gathered and copied to clipboard.');
            console.log('Now go to ChatGPT, press Ctrl+V, and add your specific request at the bottom.');
            // Clean up temp file
            fs.unlinkSync(tempFile);
        }
    });
}

getContext();
