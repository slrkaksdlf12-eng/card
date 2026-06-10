let currentLang = localStorage.getItem("lang") || "ko";
let dict = {};

// -----------------------
// 언어 변경
// -----------------------
async function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem("lang", lang);
    await loadLanguage();
}

// -----------------------
// 언어 로드
// -----------------------
async function loadLanguage() {
    try {
        const res = await fetch(`/api/lang/${currentLang}`);

        if (!res.ok) throw new Error("API not found");

        dict = await res.json();

        renderUI();

    } catch (err) {
        console.error("Language load failed:", err);
        dict = {};
        renderUI();
    }
}

// -----------------------
// UI 렌더링
// -----------------------
function renderUI() {
    if (!document.body) return;

    // 1) data-i18n
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (dict[key]) {
            el.innerText = dict[key];
        }
    });

    // 2) placeholder
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.getAttribute("data-i18n-placeholder");
        if (dict[key]) {
            el.placeholder = dict[key];
        }
    });

    // 3) ⭐ 페이지별 title (이제 자동추측 제거)
    const title = document.getElementById("title");
    if (title && title.dataset.key) {
        const key = title.dataset.key;
        if (dict[key]) title.innerText = dict[key];
    }

    // 4) ⭐ 버튼도 페이지에서 지정
    const btn = document.getElementById("btn");
    if (btn && btn.dataset.key) {
        const key = btn.dataset.key;
        if (dict[key]) btn.innerText = dict[key];
    }

    // 5) subtitle
    const subtitle = document.getElementById("subtitle");
    if (subtitle && dict.subtitle) {
        subtitle.innerText = dict.subtitle;
    }

    // 6) result
    const resultLabel = document.getElementById("resultLabel");
    if (resultLabel && dict.result) {
        resultLabel.innerText = dict.result;
    }
}

// -----------------------
// CARD DRAW
// -----------------------
function draw() {
    const cards = ["N", "SR", "SSR"];
    const result = cards[Math.floor(Math.random() * cards.length)];

    const el = document.getElementById("resultCard");
    if (!el) return;

    el.innerText = "";
    el.style.transform = "scale(1)";

    setTimeout(() => {
        el.innerText = result;
        el.style.transform = "scale(1.3)";

        saveToCollection(result);

        setTimeout(() => {
            el.style.transform = "scale(1)";
        }, 300);
    }, 800);
}

// -----------------------
// COLLECTION 저장
// -----------------------
function saveToCollection(rarity) {
    const list = JSON.parse(localStorage.getItem("collection") || "[]");

    list.push({
        rarity: rarity,
        time: Date.now()
    });

    localStorage.setItem("collection", JSON.stringify(list));
}

// -----------------------
// INIT
// -----------------------
document.addEventListener("DOMContentLoaded", async () => {
    await loadLanguage();
    document.body.classList.add("ready");
});