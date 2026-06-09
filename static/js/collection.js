document.addEventListener("DOMContentLoaded", async () => {

  const area = document.getElementById("collectionArea");
  let list = JSON.parse(localStorage.getItem("collection") || "[]");

  let lang = localStorage.getItem("lang") || "ko";
  let dict = {};

  try {
    const res = await fetch(`/api/lang/${lang}`);
    dict = await res.json();
  } catch (e) {
    console.warn("lang load failed");
  }

  function getRarity(img) {
    if (!img) return null;
    if (img.includes("/a/")) return "N";
    if (img.includes("/b/")) return "SR";
    if (img.includes("/c/")) return "SSR";
    return null;
  }

  // =========================
  // NEW 체크
  // =========================
  const seenSet = new Set(JSON.parse(localStorage.getItem("seenCards") || "[]"));

  function markSeen(img) {
    seenSet.add(img);
    localStorage.setItem("seenCards", JSON.stringify([...seenSet]));
  }

  // =========================
  // 중복 합치기
  // =========================
  const mergedMap = new Map();

  list.forEach(item => {
    if (!item || !item.img) return;

    if (mergedMap.has(item.img)) {
      mergedMap.get(item.img).count += 1;
    } else {
      mergedMap.set(item.img, {
        img: item.img,
        count: 1
      });
    }
  });

  const mergedList = Array.from(mergedMap.values());

  const nList = [];
  const srList = [];
  const ssrList = [];

  mergedList.forEach(item => {
    const r = getRarity(item.img);

    if (r === "N") nList.push(item);
    else if (r === "SR") srList.push(item);
    else if (r === "SSR") ssrList.push(item);
  });

  // =========================
  // 도감 완성률
  // =========================
  const totalSlots = 50;
  const collected = mergedList.length;
  const percent = Math.floor((collected / totalSlots) * 100);

  const progress = document.createElement("div");
  progress.className = "progress";
  progress.innerText = `도감 완성률: ${percent}% (${collected}/${totalSlots})`;

  area.appendChild(progress);

  // =========================
  // 모달
  // =========================
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `<img />`;

  document.body.appendChild(modal);

  modal.addEventListener("click", () => {
    modal.classList.remove("show");
  });

  function openModal(src) {
    modal.querySelector("img").src = src;
    modal.classList.add("show");
  }

  // =========================
  // 카드 생성 (NEW 수정 완료)
  // =========================
  function createCard(data) {

    const card = document.createElement("div");
    card.className = "card";

    // 빈칸
    if (!data) {
      card.innerHTML = `<div class="question">?</div>`;
      return card;
    }

    const isNew = !seenSet.has(data.img);

    // 카드 구조
    card.innerHTML = `
      <img src="${data.img}" />
      ${isNew ? `<div class="new-badge">NEW</div>` : ""}
      ${data.count > 1 ? `<div class="count-badge">${data.count}</div>` : ""}
    `;

    card.addEventListener("click", () => {
      openModal(data.img);
      markSeen(data.img);

      const newTag = card.querySelector(".new-badge");
      if (newTag) newTag.remove();
    });

    return card;
  }

  // =========================
  // 섹션
  // =========================
  function createSection(titleKey, cols, max, dataList) {
    const section = document.createElement("div");
    section.className = "section";

    const title = document.createElement("div");
    title.className = "section-title";
    title.textContent = dict[titleKey] || titleKey;

    const grid = document.createElement("div");
    grid.className = "grid cols-" + cols;

    for (let i = 0; i < max; i++) {
      grid.appendChild(createCard(dataList[i]));
    }

    section.appendChild(title);
    section.appendChild(grid);
    area.appendChild(section);
  }

  createSection("collection_n", 6, 30, nList);
  createSection("collection_sr", 3, 15, srList);
  createSection("collection_ssr", 1, 5, ssrList);

});