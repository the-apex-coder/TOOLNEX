
const imageInput = document.getElementById("imageInput");
const uploadArea = document.getElementById("uploadArea");
const editor = document.getElementById("editor");

const originalPreview = document.getElementById("originalPreview");
const compressedPreview = document.getElementById("compressedPreview");

const originalInfo = document.getElementById("originalInfo");
const compressedInfo = document.getElementById("compressedInfo");

const quality = document.getElementById("quality");
const qualityValue = document.getElementById("qualityValue");
const format = document.getElementById("format");

const compressBtn = document.getElementById("compressBtn");
const downloadBtn = document.getElementById("downloadBtn");
const resetBtn = document.getElementById("resetBtn");
const statusMessage = document.getElementById("statusMessage");

let originalFile = null;
let compressedBlob = null;
let originalURL = null;
let compressedURL = null;

function formatBytes(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function cleanupURLs() {
    if (originalURL) URL.revokeObjectURL(originalURL);
    if (compressedURL) URL.revokeObjectURL(compressedURL);

    originalURL = null;
    compressedURL = null;
}

function loadImage(file) {
    if (!file) return;

    const supportedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!supportedTypes.includes(file.type)) {
        statusMessage.textContent = "Please select a JPG, PNG or WebP image.";
        return;
    }

    if (file.size > 20 * 1024 * 1024) {
        statusMessage.textContent = "Maximum image size is 20 MB.";
        return;
    }

    cleanupURLs();

    originalFile = file;
    compressedBlob = null;

    originalURL = URL.createObjectURL(file);

    originalPreview.src = originalURL;
    compressedPreview.removeAttribute("src");

    originalInfo.textContent = formatBytes(file.size);
    compressedInfo.textContent = "Not compressed yet";

    editor.hidden = false;
    uploadArea.hidden = true;

    downloadBtn.disabled = true;
    statusMessage.textContent = "Image ready to compress.";
}

imageInput.addEventListener("change", () => {
    loadImage(imageInput.files[0]);
});

// Drag and drop

uploadArea.addEventListener("dragover", event => {
    event.preventDefault();
    uploadArea.classList.add("dragging");
});

uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("dragging");
});

uploadArea.addEventListener("drop", event => {
    event.preventDefault();
    uploadArea.classList.remove("dragging");

    loadImage(event.dataTransfer.files[0]);
});

// Quality slider

quality.addEventListener("input", () => {
    qualityValue.textContent = quality.value + "%";
    downloadBtn.disabled = true;
});

// Compression

compressBtn.addEventListener("click", async () => {
    if (!originalFile) return;

    compressBtn.disabled = true;
    downloadBtn.disabled = true;
    statusMessage.textContent = "Compressing image...";

    try {
        const image = new Image();

        image.src = originalURL;

        await image.decode();

        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;

        const context = canvas.getContext("2d");

        if (!context) {
            throw new Error("Canvas is not supported by this browser.");
        }

        context.drawImage(image, 0, 0);

        const selectedFormat = format.value;

        compressedBlob = await new Promise((resolve, reject) => {
            canvas.toBlob(
                blob => {
                    if (blob) resolve(blob);
                    else reject(new Error("Compression failed."));
                },
                selectedFormat,
                Number(quality.value) / 100
            );
        });

        if (selectedFormat === "image/png" &&
            compressedBlob.size >= originalFile.size) {
            statusMessage.textContent =
                "PNG output is not smaller. Try WebP or JPG.";
        } else {
            const saved = (
                (1 - compressedBlob.size / originalFile.size) * 100
            ).toFixed(1);

            statusMessage.textContent = saved > 0
                ? `Success! Saved ${saved}% of the original file size.`
                : "Image converted. The output is larger than the original.";
        }

        if (compressedURL) URL.revokeObjectURL(compressedURL);

        compressedURL = URL.createObjectURL(compressedBlob);

        compressedPreview.src = compressedURL;
        compressedInfo.textContent = formatBytes(compressedBlob.size);

        downloadBtn.disabled = false;

    } catch (error) {
        console.error(error);
        statusMessage.textContent = error.message || "Something went wrong.";
    } finally {
        compressBtn.disabled = false;
    }
});

// Download

downloadBtn.addEventListener("click", () => {
    if (!compressedBlob) return;

    const extensions = {
        "image/webp": "webp",
        "image/jpeg": "jpg",
        "image/png": "png"
    };

    const link = document.createElement("a");

    link.href = compressedURL;
    link.download = "toolnex-compressed." + extensions[format.value];

    link.click();
});

// Reset

resetBtn.addEventListener("click", () => {
    cleanupURLs();

    originalFile = null;
    compressedBlob = null;

    imageInput.value = "";

    editor.hidden = true;
    uploadArea.hidden = false;

    quality.value = 70;
    qualityValue.textContent = "70%";

    format.value = "image/webp";

    downloadBtn.disabled = true;
    statusMessage.textContent = "";
});

// Clean up browser memory

window.addEventListener("beforeunload", cleanupURLs);
