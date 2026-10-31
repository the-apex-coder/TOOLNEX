
// =====================================
// TOOLNEX - MAIN JAVASCRIPT
// =====================================


// 1. MOBILE MENU

const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");

menuBtn.addEventListener("click", () => {
    navLinks.classList.toggle("active");

    menuBtn.textContent =
        navLinks.classList.contains("active") ? "✕" : "☰";
});

// Close mobile menu after clicking a link

document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", () => {
        navLinks.classList.remove("active");
        menuBtn.textContent = "☰";
    });
});


// 2. DARK / LIGHT THEME

const themeBtn = document.getElementById("themeBtn");

const savedTheme = localStorage.getItem("toolnex-theme");

if (savedTheme === "light") {
    document.body.classList.add("light-theme");
    themeBtn.textContent = "☾";
}

themeBtn.addEventListener("click", () => {

    document.body.classList.toggle("light-theme");

    const isLight =
        document.body.classList.contains("light-theme");

    themeBtn.textContent = isLight ? "☾" : "☼";

    localStorage.setItem(
        "toolnex-theme",
        isLight ? "light" : "dark"
    );

});


// 3. LIVE TOOL SEARCH

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

const toolCards = document.querySelectorAll(".tool-card");
const noResults = document.getElementById("noResults");

function searchTools() {

    const query = searchInput.value
        .trim()
        .toLowerCase();

    let visibleCount = 0;

    toolCards.forEach(card => {

        const toolName =
            card.dataset.name.toLowerCase();

        const toolText =
            card.innerText.toLowerCase();

        const matches =
            toolName.includes(query) ||
            toolText.includes(query);

        card.style.display = matches ? "block" : "none";

        if (matches) {
            visibleCount++;
        }

    });

    noResults.hidden = visibleCount !== 0;

    // Show tools section when searching

    if (query.length > 0) {
        document.getElementById("tools").scrollIntoView({
            behavior: "smooth"
        });
    }

}


// Search button

searchBtn.addEventListener("click", searchTools);


// Search while typing

searchInput.addEventListener("input", searchTools);


// Enter key search

searchInput.addEventListener("keydown", event => {

    if (event.key === "Enter") {
        searchTools();
    }

});


// 4. POPULAR SEARCH LINKS

document.querySelectorAll(".popular-searches a").forEach(link => {

    link.addEventListener("click", event => {

        event.preventDefault();

        const searchTerm = link.textContent.trim();

        searchInput.value = searchTerm;

        searchTools();

    });

});


// 5. INITIALIZATION

console.log("TOOLNEX initialized successfully!");
console.log("All frontend systems loaded.");