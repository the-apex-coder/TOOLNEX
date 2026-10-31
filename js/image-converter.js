
const imageInput = document.getElementById("imageInput");
const uploadArea = document.getElementById("uploadArea");
const browseBtn = document.getElementById("browseBtn");

const workspace = document.getElementById("converterWorkspace");
const originalPreview = document.getElementById("originalPreview");
const originalInfo = document.getElementById("originalInfo");

const outputFormat = document.getElementById("outputFormat");
const qualitySlider = document.getElementById("qualitySlider");
const qualityValue = document.getElementById("qualityValue");
const qualitySection = document.getElementById("qualitySection");

const convertBtn = document.getElementById("convertBtn");
const resetBtn = document.getElementById("resetBtn");
const downloadBtn = document.getElementById("downloadBtn");

const resultPanel = document.getElementById("resultPanel");
const convertedPreview = document.getElementById("convertedPreview");
const convertedInfo = document.getElementById("convertedInfo");
const errorMessage = document.getElementById("errorMessage");

let selectedImage = null;
let originalURL = null;
let convertedURL = null;
let convertedBlob = null;
let downloadName = "converted-image";

const MAX_SIZE = 20 * 1024 * 1024;

function formatSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) {
        return (bytes / 1024).toFixed(1) + " KB";
    }
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function clearConvertedImage() {
    if (convertedURL) {
        URL.revokeObjectURL(convertedURL);
    }

    convertedURL = null;
    convertedBlob = null;
    convertedPreview.removeAttribute("src");
    resultPanel.hidden = true;
}

function loadImage(file) {
    errorMessage.textContent = "";

    if (!file) return;

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
        errorMessage.textContent = "Please select a JPG, PNG or WebP image.";
        return;
    }

    if (file.size > MAX_SIZE) {
        errorMessage.textContent = "Image must be smaller than 20 MB.";
        return;
    }

    if (file.size === 0) {
        errorMessage.textContent = "This image file is empty.";
        return;
    }

    if (originalURL) {
        URL.revokeObjectURL(originalURL);
    }

    clearConvertedImage();

    selectedImage = file;
    originalURL = URL.createObjectURL(file);

    originalPreview.src = originalURL;
    originalInfo.textContent =
        `${file.name} · ${formatSize(file.size)}`;

    uploadArea.hidden = true;
    workspace.hidden = false;

    const isJpeg = outputFormat.value === "image/jpeg";
    qualitySection.hidden = !isJpeg && outputFormat.value !== "image/webp";
}

browseBtn.addEventListener("click", () => {
    imageInput.click();
});

imageInput.addEventListener("change", event => {
    loadImage(event.target.files[0]);
});

["dragenter", "dragover"].forEach(eventName => {
    uploadArea.addEventListener(eventName, event => {
        event.preventDefault();
        uploadArea.classList.add("drag-active");
    });
});

["dragleave", "drop"].forEach(eventName => {
    uploadArea.addEventListener(eventName, event => {
        event.preventDefault();
        uploadArea.classList.remove("drag-active");
    });
});

uploadArea.addEventListener("drop", event => {
    const file = event.dataTransfer.files[0];
    loadImage(file);
});

outputFormat.addEventListener("change", () => {
    const format = outputFormat.value;
    qualitySection.hidden = format === "image/png";
    clearConvertedImage();
});

qualitySlider.addEventListener("input", () => {
    qualityValue.textContent = qualitySlider.value + "%";
});

convertBtn.addEventListener("click", async () => {
    if (!selectedImage) return;

    errorMessage.textContent = "";
    clearConvertedImage();

    convertBtn.disabled = true;
    convertBtn.textContent = "Converting...";

    try {
        const image = new Image();

        image.src = originalURL;

        await new Promise((resolve, reject) => {
            image.onload = resolve;
            image.onerror = () => reject(
                new Error("Could not read this image.")
            );
        });

        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;

        const context = canvas.getContext("2d");

        if (!context) {
            throw new Error("Your browser does not support image conversion.");
        }

        // JPG does not support transparency.
        if (outputFormat.value === "image/jpeg") {
            context.fillStyle = "#ffffff";
            context.fillRect(0, 0, canvas.width, canvas.height);
        }

        context.drawImage(image, 0, 0);

        const quality = Number(qualitySlider.value) / 100;

        convertedBlob = await new Promise(resolve => {
            canvas.toBlob(
                resolve,
                outputFormat.value,
                quality
            );
        });

        if (!convertedBlob) {
            throw new Error("Conversion failed. Please try another format.");
        }

        convertedURL = URL.createObjectURL(convertedBlob);
        convertedPreview.src = convertedURL;

        const extension = {
            "image/jpeg": "jpg",
            "image/png": "png",
            "image/webp": "webp"
        }[outputFormat.value];

        const originalName = selectedImage.name.replace(/\.[^.]+$/, "");
        downloadName = `${originalName}-converted.${extension}`;

        convertedInfo.textContent =
            `${extension.toUpperCase()} · ${formatSize(convertedBlob.size)} · ${canvas.width} × ${canvas.height}`;

        resultPanel.hidden = false;

        canvas.width = 0;
        canvas.height = 0;

    } catch (error) {
        errorMessage.textContent = error.message;
    } finally {
        convertBtn.disabled = false;
        convertBtn.textContent = "Convert Image";
    }
});

downloadBtn.addEventListener("click", () => {
    if (!convertedURL || !convertedBlob) return;

    const link = document.createElement("a");
    link.href = convertedURL;
    link.download = downloadName;

    document.body.appendChild(link);
    link.click();
    link.remove();
});

resetBtn.addEventListener("click", () => {
    if (originalURL) {
        URL.revokeObjectURL(originalURL);
    }

    clearConvertedImage();

    selectedImage = null;
    originalURL = null;

    originalPreview.removeAttribute("src");
    originalInfo.textContent = "";
    imageInput.value = "";

    errorMessage.textContent = "";
    workspace.hidden = true;
    uploadArea.hidden = false;

    convertBtn.disabled = false;
    convertBtn.textContent = "Convert Image";
});

// Clean up temporary image URLs when leaving the page.
window.addEventListener("beforeunload", () => {
    if (originalURL) URL.revokeObjectURL(originalURL);
    if (convertedURL) URL.revokeObjectURL(convertedURL);
});
