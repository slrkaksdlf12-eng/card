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
// 언어 로드 (API 방식)
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
// UI 렌더링 (WebView 안정화)
// -----------------------
function renderUI() {

    if (!document.body) return;

    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (dict[key]) {
            el.innerText = dict[key];
        }
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.getAttribute("data-i18n-placeholder");
        if (dict[key]) {
            el.placeholder = dict[key];
        }
    });

    const title = document.getElementById("title");
    if (title) {
        title.innerText =
            dict.login_title ||
            dict.register_title ||
            dict.lobby_title ||
            dict.gacha_title ||
            "App";
    }

    const btn = document.getElementById("btn");
    if (btn) {
        btn.innerText =
            dict.login_btn ||
            dict.register_btn ||
            dict.start_btn ||
            dict.draw_btn ||
            "";
    }

    const subtitle = document.getElementById("subtitle");
    if (subtitle) subtitle.innerText = dict.subtitle || "";

    const resultLabel = document.getElementById("resultLabel");
    if (resultLabel) resultLabel.innerText = dict.result || "";

    const username = document.getElementById("username");
    if (username && dict.username) username.placeholder = dict.username;

    const password = document.getElementById("password");
    if (password && dict.password) password.placeholder = dict.password;
}

// ======================================================
// 🔥 CARD DRAW (여기 "저장 기능" 추가)
// ======================================================
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

        // 🔥 여기가 핵심 추가
        saveToCollection(result);

        setTimeout(() => {
            el.style.transform = "scale(1)";
        }, 300);
    }, 800);
}

// ======================================================
// 🔥 COLLECTION 저장 추가 (핵심)
// ======================================================
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