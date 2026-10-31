const jsonInput = document.getElementById("jsonInput");
const jsonOutput = document.getElementById("jsonOutput");
const statusMessage = document.getElementById("statusMessage");

function showStatus(message, type = "") {
    statusMessage.textContent = message;
    statusMessage.className = type;
}

function parseJSON() {
    const input = jsonInput.value.trim();

    if (!input) {
        showStatus("Please enter JSON data first.", "error");
        return null;
    }

    try {
        return JSON.parse(input);
    } catch (error) {
        showStatus("Invalid JSON: " + error.message, "error");
        return null;
    }
}

// Format JSON
document.getElementById("formatBtn").addEventListener("click", () => {
    const data = parseJSON();

    if (data === null) {
        if (jsonInput.value.trim() === "null") {
            jsonOutput.value = "null";
            showStatus("Valid JSON formatted successfully.", "success");
        }
        return;
    }

    jsonOutput.value = JSON.stringify(data, null, 4);
    showStatus("JSON formatted successfully.", "success");
});

// Validate JSON
document.getElementById("validateBtn").addEventListener("click", () => {
    const input = jsonInput.value.trim();

    if (!input) {
        showStatus("Please enter JSON data first.", "error");
        return;
    }

    try {
        JSON.parse(input);
        showStatus("✓ Valid JSON. No syntax errors found.", "success");
    } catch (error) {
        showStatus("✕ Invalid JSON: " + error.message, "error");
    }
});

// Minify JSON
document.getElementById("minifyBtn").addEventListener("click", () => {
    const data = parseJSON();

    if (data === null) {
        if (jsonInput.value.trim() === "null") {
            jsonOutput.value = "null";
            showStatus("JSON minified successfully.", "success");
        }
        return;
    }

    jsonOutput.value = JSON.stringify(data);
    showStatus("JSON minified successfully.", "success");
});

// Copy output
document.getElementById("copyBtn").addEventListener("click", async () => {
    const output = jsonOutput.value;

    if (!output) {
        showStatus("Nothing to copy.", "error");
        return;
    }

    try {
        await navigator.clipboard.writeText(output);
        showStatus("Output copied successfully.", "success");
    } catch (error) {
        jsonOutput.select();

        const copied = document.execCommand("copy");

        window.getSelection()?.removeAllRanges();

        showStatus(
            copied ? "Output copied successfully." : "Copy failed. Please copy manually.",
            copied ? "success" : "error"
        );
    }
});

// Clear everything
document.getElementById("clearBtn").addEventListener("click", () => {
    jsonInput.value = "";
    jsonOutput.value = "";
    showStatus("Editor cleared.");
});