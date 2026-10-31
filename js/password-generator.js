
const passwordOutput = document.getElementById("passwordOutput");
const lengthSlider = document.getElementById("lengthSlider");
const lengthValue = document.getElementById("lengthValue");
const generateBtn = document.getElementById("generateBtn");
const copyBtn = document.getElementById("copyBtn");
const errorMessage = document.getElementById("errorMessage");

const strengthText = document.getElementById("strengthText");
const strengthFill = document.getElementById("strengthFill");

const characterSets = {
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    numbers: "0123456789",
    symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?"
};

lengthSlider.addEventListener("input", () => {
    lengthValue.textContent = lengthSlider.value;
});

function secureRandom(max) {
    const random = new Uint32Array(1);
    const limit = Math.floor(4294967296 / max) * max;

    do {
        crypto.getRandomValues(random);
    } while (random[0] >= limit);

    return random[0] % max;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = secureRandom(i + 1);
        [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
}

function calculateStrength(password, selectedSets) {
    const length = password.length;
    let score = 0;

    if (length >= 8) score++;
    if (length >= 12) score++;
    if (length >= 16) score++;
    if (selectedSets >= 2) score++;
    if (selectedSets >= 3) score++;
    if (selectedSets === 4) score++;

    if (score <= 2) {
        return { label: "Weak", width: "25%", color: "#ff5252" };
    }

    if (score <= 4) {
        return { label: "Medium", width: "55%", color: "#ffb020" };
    }

    if (score <= 5) {
        return { label: "Strong", width: "80%", color: "#00d9ff" };
    }

    return { label: "Very Strong", width: "100%", color: "#19d68c" };
}

function generatePassword() {
    errorMessage.textContent = "";

    const length = Number(lengthSlider.value);

    const options = [
        { id: "uppercase", key: "uppercase" },
        { id: "lowercase", key: "lowercase" },
        { id: "numbers", key: "numbers" },
        { id: "symbols", key: "symbols" }
    ];

    const selected = options.filter(option =>
        document.getElementById(option.id).checked
    );

    if (selected.length === 0) {
        passwordOutput.value = "";
        strengthText.textContent = "Not Generated";
        strengthFill.style.width = "0%";
        errorMessage.textContent = "Please select at least one character type.";
        return;
    }

    const excludeSimilar = document.getElementById("excludeSimilar").checked;

    const similarCharacters = "iIlL1oO0";

    const sets = selected.map(option => {
        let characters = characterSets[option.key];

        if (excludeSimilar) {
            characters = [...characters]
                .filter(char => !similarCharacters.includes(char))
                .join("");
        }

        return characters;
    });

    // Ensure every selected character type is included.
    let passwordCharacters = sets.map(set =>
        set[secureRandom(set.length)]
    );

    const allCharacters = sets.join("");

    // Fill the remaining password length.
    while (passwordCharacters.length < length) {
        passwordCharacters.push(
            allCharacters[secureRandom(allCharacters.length)]
        );
    }

    passwordCharacters = shuffleArray(passwordCharacters);

    const password = passwordCharacters.join("");

    passwordOutput.value = password;

    const strength = calculateStrength(password, selected.length);

    strengthText.textContent = strength.label;
    strengthFill.style.width = strength.width;
    strengthFill.style.background = strength.color;
}

generateBtn.addEventListener("click", generatePassword);

copyBtn.addEventListener("click", async () => {
    if (!passwordOutput.value) {
        errorMessage.textContent = "Generate a password first.";
        return;
    }

    try {
        await navigator.clipboard.writeText(passwordOutput.value);
        copyBtn.textContent = "Copied!";
        setTimeout(() => {
            copyBtn.textContent = "Copy";
        }, 1500);
    } catch (error) {
        passwordOutput.select();
        const copied = document.execCommand("copy");
        copyBtn.textContent = copied ? "Copied!" : "Copy Failed";
    }
});

// Generate one password when the page opens.
generatePassword();
