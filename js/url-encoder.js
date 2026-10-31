const inputText = document.getElementById("inputText");
const outputText = document.getElementById("outputText");
const resultStats = document.getElementById("resultStats");
const statusMessage = document.getElementById("statusMessage");

function showStatus(message, type = "") {
    statusMessage.textContent = message;
    statusMessage.className = type;
}

function updateStats() {
    resultStats.textContent =
        `${outputText.value.length} characters`;
}

// Encode URL
document.getElementById("encodeBtn").addEventListener("click", () => {
    const text = inputText.value;

    if (!text) {
        showStatus("Please enter text or URL first.", "error");
        return;
    }

    try {
        outputText.value = encodeURIComponent(text);
        updateStats();

        showStatus("URL encoded successfully!", "success");
    } catch (error) {
        showStatus("Encoding failed: " + error.message, "error");
    }
});

// Decode URL
document.getElementById("decodeBtn").addEventListener("click", () => {
    const text = inputText.value;

    if (!text) {
        showStatus("Please enter encoded URL first.", "error");
        return;
    }

    try {
        outputText.value = decodeURIComponent(text);
        updateStats();

        showStatus("URL decoded successfully!", "success");
    } catch (error) {
        showStatus("Invalid encoded URL. Please check your input.", "error");
    }
});

// Copy result
document.getElementById("copyBtn").addEventListener("click", async () => {
    if (!outputText.value) {
        showStatus("Nothing to copy.", "error");
        return;
    }

    try {
        await navigator.clipboard.writeText(outputText.value);

        showStatus("Result copied successfully!", "success");
    } catch (error) {
        outputText.select();

        const copied = document.execCommand("copy");

        window.getSelection()?.removeAllRanges();

        showStatus(
            copied ? "Result copied successfully!" : "Copy failed. Copy manually.",
            copied ? "success" : "error"
        );
    }
});

// Download result
document.getElementById("downloadBtn").addEventListener("click", () => {
    if (!outputText.value) {
        showStatus("Nothing to download.", "error");
        return;
    }

    const blob = new Blob([outputText.value], {
        type: "text/plain;charset=utf-8"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "toolnex-url-result.txt";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    showStatus("File downloaded successfully!", "success");
});

// Clear all
document.getElementById("clearBtn").addEventListener("click", () => {
    inputText.value = "";
    outputText.value = "";

    updateStats();
    showStatus("All fields cleared.");
});

updateStats();