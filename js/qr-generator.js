
const qrType = document.getElementById("qrType");
const qrInput = document.getElementById("qrInput");

const qrColor = document.getElementById("qrColor");
const bgColor = document.getElementById("bgColor");

const qrOutput = document.getElementById("qrOutput");

const generateBtn = document.getElementById("generateBtn");
const downloadBtn = document.getElementById("downloadBtn");
const resetBtn = document.getElementById("resetBtn");

const qrStatus = document.getElementById("qrStatus");

let currentQR = null;

// Generate QR Code

function generateQR() {

    const content = qrInput.value.trim();

    if (!content) {
        qrStatus.textContent = "Please enter some content first.";
        return;
    }

    if (typeof QRCode === "undefined") {
        qrStatus.textContent = "QR library unavailable. Check your internet connection.";
        return;
    }

    let finalContent = content;

    if (qrType.value === "url") {

        try {
            const url = new URL(content);

            if (!["http:", "https:"].includes(url.protocol)) {
                throw new Error("Invalid protocol");
            }

        } catch {
            qrStatus.textContent = "Enter a valid URL starting with https:// or http://";
            return;
        }

    }

    if (qrType.value === "email") {

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(content)) {
            qrStatus.textContent = "Please enter a valid email address.";
            return;
        }

        finalContent = "mailto:" + content;

    }

    qrOutput.innerHTML = "";

    try {

        currentQR = new QRCode(qrOutput, {
            text: finalContent,
            width: 256,
            height: 256,
            colorDark: qrColor.value,
            colorLight: bgColor.value,
            correctLevel: QRCode.CorrectLevel.H
        });

        downloadBtn.disabled = false;

        qrStatus.textContent = "QR Code generated successfully!";

    } catch (error) {

        console.error(error);

        qrStatus.textContent = "Unable to generate QR code.";

        downloadBtn.disabled = true;

    }

}


// Generate button

generateBtn.addEventListener("click", generateQR);


// Download PNG

downloadBtn.addEventListener("click", () => {

    const canvas = qrOutput.querySelector("canvas");

    if (!canvas) {
        qrStatus.textContent = "Generate a QR code first.";
        return;
    }

    const link = document.createElement("a");

    link.download = "toolnex-qr-code.png";
    link.href = canvas.toDataURL("image/png");

    link.click();

    qrStatus.textContent = "QR code downloaded!";

});


// Enter content and generate

qrInput.addEventListener("keydown", event => {

    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        generateQR();
    }

});


// Reset

resetBtn.addEventListener("click", () => {

    qrInput.value = "";
    qrType.value = "url";

    qrColor.value = "#07131c";
    bgColor.value = "#ffffff";

    qrOutput.innerHTML = `
        <div class="qr-placeholder">
            <span>▦</span>
            <p>Your QR code will appear here</p>
        </div>
    `;

    currentQR = null;

    downloadBtn.disabled = true;
    qrStatus.textContent = "";

});

