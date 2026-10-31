
const { PDFDocument } = PDFLib;

pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const MAX_PDF_SIZE = 50 * 1024 * 1024;

const pdfStatus = document.getElementById("pdfStatus");
const downloadArea = document.getElementById("downloadArea");
const downloadLink = document.getElementById("downloadLink");
const downloadMessage = document.getElementById("downloadMessage");

let downloadURL = null;

// -----------------------------
// COMMON FUNCTIONS
// -----------------------------

function formatSize(bytes) {
    if (bytes < 1024 * 1024) {
        return (bytes / 1024).toFixed(1) + " KB";
    }

    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function showStatus(message) {
    pdfStatus.textContent = message;
}

function clearDownload() {
    if (downloadURL) {
        URL.revokeObjectURL(downloadURL);
    }

    downloadURL = null;
    downloadArea.hidden = true;
    downloadLink.removeAttribute("href");
}

function prepareDownload(blob, filename, message) {
    clearDownload();

    downloadURL = URL.createObjectURL(blob);

    downloadLink.href = downloadURL;
    downloadLink.download = filename;
    downloadMessage.textContent = message;

    downloadArea.hidden = false;
}

function validatePDF(file) {
    if (!file) {
        throw new Error("Please select a PDF file.");
    }

    if (file.type !== "application/pdf" &&
        !file.name.toLowerCase().endsWith(".pdf")) {
        throw new Error("Please select a valid PDF file.");
    }

    if (file.size > MAX_PDF_SIZE) {
        throw new Error("Each PDF must be smaller than 50 MB.");
    }

    if (file.size === 0) {
        throw new Error("This PDF file is empty.");
    }
}

function showFiles(container, files) {
    if (!files.length) {
        container.textContent = "No files selected.";
        return;
    }

    container.replaceChildren();

    files.forEach((file, index) => {
        const item = document.createElement("div");
        item.className = "file-item";

        const name = document.createElement("span");
        name.textContent = `${index + 1}. ${file.name}`;

        const size = document.createElement("small");
        size.textContent = formatSize(file.size);

        item.append(name, size);
        container.appendChild(item);
    });
}

function setButtonLoading(button, loading, originalText) {
    button.disabled = loading;
    button.textContent = loading ? "Processing..." : originalText;
}

// -----------------------------
// TAB SWITCHING
// -----------------------------

const tabButtons = document.querySelectorAll(".tab-btn");
const toolContents = document.querySelectorAll(".tool-content");

tabButtons.forEach(button => {
    button.addEventListener("click", () => {
        tabButtons.forEach(tab => tab.classList.remove("active"));
        toolContents.forEach(panel => panel.classList.remove("active"));

        button.classList.add("active");

        const panel = document.getElementById(
            button.dataset.tool + "Panel"
        );

        panel.classList.add("active");

        showStatus("");
        clearDownload();
    });
});

// Browse buttons
document.querySelectorAll(".browse-btn").forEach(button => {
    button.addEventListener("click", () => {
        document.getElementById(button.dataset.input).click();
    });
});

// -----------------------------
// MERGE PDF
// -----------------------------

const mergeInput = document.getElementById("mergeInput");
const mergeFileList = document.getElementById("mergeFileList");
const mergeBtn = document.getElementById("mergeBtn");

let mergeFiles = [];

mergeInput.addEventListener("change", () => {
    mergeFiles = Array.from(mergeInput.files);

    showFiles(mergeFileList, mergeFiles);
    showStatus("");
    clearDownload();
});

mergeBtn.addEventListener("click", async () => {
    try {
        clearDownload();

        if (mergeFiles.length < 2) {
            throw new Error("Please select at least two PDF files.");
        }

        mergeFiles.forEach(validatePDF);

        const totalSize = mergeFiles.reduce(
            (sum, file) => sum + file.size, 0
        );

        if (totalSize > 150 * 1024 * 1024) {
            throw new Error("Combined PDF files must be smaller than 150 MB.");
        }

        setButtonLoading(mergeBtn, true, "Merge PDF Files");
        showStatus("Merging PDF files...");

        const mergedPDF = await PDFDocument.create();

        for (const file of mergeFiles) {
            const bytes = await file.arrayBuffer();
            const pdf = await PDFDocument.load(bytes);

            const pages = await mergedPDF.copyPages(
                pdf,
                pdf.getPageIndices()
            );

            pages.forEach(page => mergedPDF.addPage(page));
        }

        const result = await mergedPDF.save();

        prepareDownload(
            new Blob([result], { type: "application/pdf" }),
            "toolnex-merged.pdf",
            "Your merged PDF is ready!"
        );

        showStatus("PDF files merged successfully.");

    } catch (error) {
        showStatus(error.message);
    } finally {
        setButtonLoading(mergeBtn, false, "Merge PDF Files");
    }
});

// -----------------------------
// SPLIT PDF
// -----------------------------

const splitInput = document.getElementById("splitInput");
const splitFileInfo = document.getElementById("splitFileInfo");
const pageRange = document.getElementById("pageRange");
const splitBtn = document.getElementById("splitBtn");

let splitFile = null;

splitInput.addEventListener("change", () => {
    splitFile = splitInput.files[0] || null;

    if (splitFile) {
        splitFileInfo.textContent =
            `${splitFile.name} · ${formatSize(splitFile.size)}`;
    } else {
        splitFileInfo.textContent = "No PDF selected.";
    }

    showStatus("");
    clearDownload();
});

function parsePageRange(value, totalPages) {
    if (!value.trim()) {
        throw new Error("Please enter a page range.");
    }

    const pages = new Set();
    const parts = value.split(",");

    for (const part of parts) {
        const item = part.trim();

        if (/^\d+$/.test(item)) {
            const page = Number(item);

            if (page < 1 || page > totalPages) {
                throw new Error(`Page ${page} does not exist.`);
            }

            pages.add(page - 1);

        } else if (/^\d+\s*-\s*\d+$/.test(item)) {
            const [start, end] = item.split("-").map(Number);

            if (
                start < 1 ||
                end > totalPages ||
                start > end
            ) {
                throw new Error("Invalid page range: " + item);
            }

            for (let page = start; page <= end; page++) {
                pages.add(page - 1);
            }

        } else {
            throw new Error("Invalid page range format.");
        }
    }

    return Array.from(pages).sort((a, b) => a - b);
}

splitBtn.addEventListener("click", async () => {
    try {
        clearDownload();

        validatePDF(splitFile);

        setButtonLoading(splitBtn, true, "Extract Pages");
        showStatus("Reading PDF...");

        const bytes = await splitFile.arrayBuffer();
        const sourcePDF = await PDFDocument.load(bytes);

        const selectedPages = parsePageRange(
            pageRange.value,
            sourcePDF.getPageCount()
        );

        const newPDF = await PDFDocument.create();

        const pages = await newPDF.copyPages(
            sourcePDF,
            selectedPages
        );

        pages.forEach(page => newPDF.addPage(page));

        const result = await newPDF.save();

        prepareDownload(
            new Blob([result], { type: "application/pdf" }),
            "toolnex-split.pdf",
            `${selectedPages.length} page(s) extracted successfully!`
        );

        showStatus("PDF pages extracted successfully.");

    } catch (error) {
        showStatus(error.message);
    } finally {
        setButtonLoading(splitBtn, false, "Extract Pages");
    }
});

// -----------------------------
// IMAGES TO PDF
// -----------------------------

const imagesInput = document.getElementById("imagesInput");
const imagesFileList = document.getElementById("imagesFileList");
const imagesBtn = document.getElementById("imagesBtn");

let selectedImages = [];

imagesInput.addEventListener("change", () => {
    selectedImages = Array.from(imagesInput.files);

    showFiles(imagesFileList, selectedImages);
    showStatus("");
    clearDownload();
});

imagesBtn.addEventListener("click", async () => {
    try {
        clearDownload();

        if (selectedImages.length === 0) {
            throw new Error("Please select at least one image.");
        }

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        for (const file of selectedImages) {
            if (!allowedTypes.includes(file.type)) {
                throw new Error("Only JPG, PNG and WebP images are supported.");
            }

            if (file.size > 20 * 1024 * 1024) {
                throw new Error(`${file.name} is larger than 20 MB.`);
            }
        }

        setButtonLoading(imagesBtn, true, "Convert Images to PDF");
        showStatus("Creating PDF from images...");

        const pdf = await PDFDocument.create();

        for (const file of selectedImages) {
            let imageBytes = await file.arrayBuffer();
            let embeddedImage;

            if (file.type === "image/jpeg") {
                embeddedImage = await pdf.embedJpg(imageBytes);

            } else if (file.type === "image/png") {
                embeddedImage = await pdf.embedPng(imageBytes);

            } else {
                const bitmap = await createImageBitmap(file);
                const canvas = document.createElement("canvas");

                canvas.width = bitmap.width;
                canvas.height = bitmap.height;

                const context = canvas.getContext("2d");
                context.drawImage(bitmap, 0, 0);

                bitmap.close();

                const jpegBlob = await new Promise(resolve => {
                    canvas.toBlob(resolve, "image/jpeg", 0.92);
                });

                if (!jpegBlob) {
                    throw new Error(`Could not process ${file.name}.`);
                }

                imageBytes = await jpegBlob.arrayBuffer();
                embeddedImage = await pdf.embedJpg(imageBytes);

                canvas.width = 0;
                canvas.height = 0;
            }

            const page = pdf.addPage([
                embeddedImage.width,
                embeddedImage.height
            ]);

            page.drawImage(embeddedImage, {
                x: 0,
                y: 0,
                width: embeddedImage.width,
                height: embeddedImage.height
            });
        }

        const result = await pdf.save();

        prepareDownload(
            new Blob([result], { type: "application/pdf" }),
            "toolnex-images.pdf",
            "Your images have been converted into a PDF!"
        );

        showStatus("Images converted successfully.");

    } catch (error) {
        showStatus(error.message);
    } finally {
        setButtonLoading(imagesBtn, false, "Convert Images to PDF");
    }
});

// -----------------------------
// PDF TO IMAGES
// -----------------------------

const convertInput = document.getElementById("convertInput");
const convertFileInfo = document.getElementById("convertFileInfo");
const convertBtn = document.getElementById("convertBtn");
const imageResults = document.getElementById("imageResults");

let convertFile = null;
let imageURLs = [];

convertInput.addEventListener("change", () => {
    convertFile = convertInput.files[0] || null;

    if (convertFile) {
        convertFileInfo.textContent =
            `${convertFile.name} · ${formatSize(convertFile.size)}`;
    } else {
        convertFileInfo.textContent = "No PDF selected.";
    }

    imageResults.replaceChildren();
    imageURLs.forEach(url => URL.revokeObjectURL(url));
    imageURLs = [];

    showStatus("");
    clearDownload();
});

convertBtn.addEventListener("click", async () => {
    try {
        clearDownload();

        validatePDF(convertFile);

        setButtonLoading(convertBtn, true, "Convert PDF to Images");

        imageResults.replaceChildren();

        imageURLs.forEach(url => URL.revokeObjectURL(url));
        imageURLs = [];

        showStatus("Loading PDF...");

        const data = new Uint8Array(
            await convertFile.arrayBuffer()
        );

        const pdf = await pdfjsLib.getDocument({
            data,
            isEvalSupported: false
        }).promise;

        if (pdf.numPages > 100) {
            throw new Error("Maximum 100 pages supported per conversion.");
        }

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
            showStatus(`Converting page ${pageNumber} of ${pdf.numPages}...`);

            const page = await pdf.getPage(pageNumber);

            const viewport = page.getViewport({ scale: 1.5 });

            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");

            canvas.width = Math.floor(viewport.width);
            canvas.height = Math.floor(viewport.height);

            await page.render({
                canvasContext: context,
                viewport
            }).promise;

            const blob = await new Promise(resolve => {
                canvas.toBlob(resolve, "image/png");
            });

            if (!blob) {
                throw new Error(`Could not convert page ${pageNumber}.`);
            }

            const url = URL.createObjectURL(blob);
            imageURLs.push(url);

            const card = document.createElement("div");
            card.className = "image-result";

            const preview = document.createElement("img");
            preview.src = url;
            preview.alt = `PDF page ${pageNumber}`;

            const label = document.createElement("p");
            label.textContent = `Page ${pageNumber} · ${formatSize(blob.size)}`;

            const download = document.createElement("a");
            download.href = url;
            download.download = `toolnex-page-${pageNumber}.png`;
            download.textContent = "Download PNG";

            card.append(preview, label, download);
            imageResults.appendChild(card);

            canvas.width = 0;
            canvas.height = 0;

            page.cleanup();
        }

        showStatus(
            `${pdf.numPages} PDF page(s) converted successfully.`
        );

        await pdf.destroy();

    } catch (error) {
        showStatus(error.message);
    } finally {
        setButtonLoading(convertBtn, false, "Convert PDF to Images");
    }
});

// Clean up temporary download links and previews.
window.addEventListener("beforeunload", () => {
    if (downloadURL) URL.revokeObjectURL(downloadURL);

    imageURLs.forEach(url => URL.revokeObjectURL(url));
});
