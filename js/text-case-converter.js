const inputText = document.getElementById("inputText");
const outputText = document.getElementById("outputText");

const inputStats = document.getElementById("inputStats");
const outputStats = document.getElementById("outputStats");
const statusMessage = document.getElementById("statusMessage");

const actionButtons = document.querySelectorAll("[data-action]");

function getStats(text) {
    const words = text.trim()
        ? text.trim().split(/\s+/).length
        : 0;

    return `${words} words · ${text.length} characters`;
}

function updateStats() {
    inputStats.textContent = getStats(inputText.value);
    outputStats.textContent = getStats(outputText.value);
}

function convertText(type) {
    const text = inputText.value;

    if (!text.trim()) {
        showMessage("Please enter some text first.");
        return;
    }

    let result = text;

    switch (type) {

        case "upper":
            result = text.toUpperCase();
            break;

        case "lower":
            result = text.toLowerCase();
            break;

        case "title":
            result = text.toLowerCase().replace(
                /(^|[\s-])([a-z])/g,
                (match, separator, letter) =>
                    separator + letter.toUpperCase()
            );
            break;

        case "sentence":
            result = text.toLowerCase().replace(
                /(^\s*[a-z]|[.!?]\s+[a-z])/g,
                match => match.toUpperCase()
            );
            break;

        case "capitalize":
            result = text.toLowerCase().replace(
                /(^|\s)([a-z])/g,
                (match, separator, letter) =>
                    separator + letter.toUpperCase()
            );
            break;

        case "spaces":
            result = text.replace(/\s+/g, " ").trim();
            break;
    }

    outputText.value = result;
    updateStats();
    showMessage("Text converted successfully!");
}

function showMessage(message) {
    statusMessage.textContent = message;
}

actionButtons.forEach(button => {
    button.addEventListener("click", () => {
        convertText(button.dataset.action);
    });
});

inputText.addEventListener("input", updateStats);

document.getElementById("copyBtn").addEventListener("click", async () => {
    const text = outputText.value;

    if (!text) {
        showMessage("Nothing to copy!");
        return;
    }

    try {
        await navigator.clipboard.writeText(text);
        showMessage("Text copied successfully!");
    } catch (error) {
        outputText.removeAttribute("readonly");
        outputText.select();

        const copied = document.execCommand("copy");

        outputText.setAttribute("readonly", true);
        window.getSelection()?.removeAllRanges();

        showMessage(copied ? "Text copied successfully!" : "Copy failed. Select and copy manually.");
    }
});

document.getElementById("downloadBtn").addEventListener("click", () => {
    const text = outputText.value;

    if (!text) {
        showMessage("Nothing to download!");
        return;
    }

    const blob = new Blob([text], {
        type: "text/plain;charset=utf-8"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "toolnex-converted-text.txt";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    showMessage("Text downloaded successfully!");
});

document.getElementById("clearBtn").addEventListener("click", () => {
    inputText.value = "";
    outputText.value = "";

    updateStats();
    showMessage("All text cleared.");
});

updateStats();