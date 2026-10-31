
const textInput = document.getElementById("textInput");

const wordCount = document.getElementById("wordCount");
const charCount = document.getElementById("charCount");
const charNoSpace = document.getElementById("charNoSpace");
const sentenceCount = document.getElementById("sentenceCount");
const paragraphCount = document.getElementById("paragraphCount");
const readingTime = document.getElementById("readingTime");
const textStatus = document.getElementById("textStatus");

function updateStats() {
    const text = textInput.value;

    // Word count
    const words = text.trim()
        ? text.trim().split(/\s+/u).length
        : 0;

    // Character count
    const characters = text.length;
    const charactersWithoutSpaces = text.replace(/\s/g, "").length;

    // Sentence count
    const sentences = text.trim()
        ? text.split(/[.!?]+/).filter(s => s.trim().length > 0).length
        : 0;

    // Paragraph count
    const paragraphs = text.trim()
        ? text.split(/\n+/).filter(p => p.trim().length > 0).length
        : 0;

    // Reading time (200 words per minute)
    const minutes = words === 0
        ? 0
        : Math.ceil(words / 200);

    wordCount.textContent = words;
    charCount.textContent = characters;
    charNoSpace.textContent = charactersWithoutSpaces;
    sentenceCount.textContent = sentences;
    paragraphCount.textContent = paragraphs;
    readingTime.textContent = minutes + " min";

    textStatus.textContent = text.length > 0 ? "Analyzing..." : "Ready";
}

textInput.addEventListener("input", updateStats);

// Copy text
document.getElementById("copyBtn").addEventListener("click", async () => {
    const text = textInput.value;

    if (!text.trim()) {
        alert("Please enter some text first.");
        return;
    }

    try {
        await navigator.clipboard.writeText(text);
        alert("Text copied successfully!");
    } catch (error) {
        textInput.select();
        const copied = document.execCommand("copy");
        alert(copied ? "Text copied successfully!" : "Could not copy text.");
    }
});

// Clear text
document.getElementById("clearBtn").addEventListener("click", () => {
    textInput.value = "";
    updateStats();
    textInput.focus();
});

// Initial calculation
updateStats();
