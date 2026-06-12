let lang = localStorage.getItem("lang") || "ko";
let dict = {};

async function loadLang() {
  const res = await fetch(`/api/lang/${lang}`);
  dict = await res.json();

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    if (dict[key]) el.innerText = dict[key];
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadLang();

  const area = document.getElementById("cardArea");
  if (!area) {
    console.error("cardArea not found");
    return;
  }

  const pool = Array.from({ length: 10 });

  let locked = false;
  let ssrMode = false;

  /* =========================================================
     🎲 RARITY SYSTEM (SSR 5% / SR 15% / N 80%)
  ========================================================= */
  function getRarity() {
    const r = Math.random() * 100;

    if (r < 5) return "SSR";
    if (r < 20) return "SR";
    return "N";
  }

  const IMAGE_POOL = {
    N: 30,
    SR: 15,
    SSR: 5
  };

  function getImage(rarity) {
    const count = IMAGE_POOL[rarity];

    const folder =
      rarity === "N" ? "a" :
      rarity === "SR" ? "b" :
      "c";

    const idx = Math.floor(Math.random() * count) + 1;

    return `/static/assets/images/${folder}/${folder}${idx}.png`;
  }

  function saveToCollection(card) {
    const list = JSON.parse(localStorage.getItem("collection") || "[]");
    list.push(card);
    localStorage.setItem("collection", JSON.stringify(list));
  }

  function getCollectionSet() {
    const list = JSON.parse(localStorage.getItem("collection") || "[]");
    return new Set(list.map(c => c.img));
  }

  function isNew(img) {
    return !getCollectionSet().has(img);
  }

  function createCard() {

    const rarity = getRarity();
    const img = getImage(rarity);

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="card-inner">
        <div class="card-front"><div class="question">?</div></div>
        <div class="card-back">
          <img class="img"/>
          <div class="badge"></div>
        </div>
      </div>
    `;

    const imgEl = card.querySelector(".img");
    const badgeEl = card.querySelector(".badge");

    let revealed = false;

    card.addEventListener("click", () => {

      if (card.classList.contains("active-card")) {
        location.href = "/collection";
        return;
      }

      if (locked || revealed) return;

      locked = true;
      revealed = true;

      document.querySelectorAll(".card").forEach(c => {
        c.classList.remove("active-card");
        c.classList.add("dim");
      });

      card.classList.add("active-card");

      // =========================
      // 🔥 SSR 분기
      // =========================
      if (rarity === "SSR" && window.ssr?.play) {

        ssrMode = true;

        window.ssr.play(card, rarity, () => {

          setTimeout(() => {

            const finalImg = getImage(rarity);

            const imgEl = card.querySelector(".img");
            const badgeEl = card.querySelector(".badge");

            if (imgEl) imgEl.src = finalImg;
            if (badgeEl) badgeEl.textContent = rarity;

            card.style.transition = "transform 0.6s ease, opacity 0.6s ease";
            card.style.transform = `
              translate(-50%, -50%)
              translate3d(0px, 0px, 200px)
              scale(1.4)
            `;
            card.style.opacity = "1";

            requestAnimationFrame(() => {
              card.classList.add("flip");
            });

            if (isNew(finalImg)) {
              const tag = document.createElement("div");
              tag.className = "new-badge";
              tag.innerText = "NEW";
              card.appendChild(tag);
            }

            saveToCollection({
              rarity,
              img: finalImg,
              time: Date.now()
            });

            ssrMode = false;
            render();

          }, 3000);

        });

        return;
      }

      // =========================
      // 일반 카드
      // =========================
      imgEl.src = img;
      badgeEl.textContent = rarity;

      card.classList.add("flip");

      if (isNew(img)) {
        const tag = document.createElement("div");
        tag.className = "new-badge";
        tag.innerText = "NEW";
        card.appendChild(tag);
      }

      saveToCollection({ rarity, img, time: Date.now() });

      render();
    });

    return card;
  }

  pool.forEach(() => area.appendChild(createCard()));

  const radius = 260;
  const angleStep = 360 / 10;

  let rotation = 0;
  let isDown = false;
  let lastX = 0;
  let velocity = 0;
  let inertiaId = null;

  function layout() {
    document.querySelectorAll(".card").forEach(card => {
      card.style.position = "absolute";
      card.style.left = "50%";
      card.style.top = "50%";
      card.style.transformOrigin = "center center";
      card.style.transformStyle = "preserve-3d";
      card.style.transition = "transform 0.5s ease, opacity 0.3s ease";
    });

    area.style.transformStyle = "preserve-3d";
  }

  function render() {

    if (ssrMode) return;

    const cards = document.querySelectorAll(".card");
    const hasSelection = document.querySelector(".active-card");

    cards.forEach((card, i) => {

      if (hasSelection) {
        if (card.classList.contains("active-card")) {
          card.style.transform = `
            translate(-50%, -50%)
            translate3d(0px, 0px, 200px)
            scale(1.6)
          `;
          card.style.zIndex = 999;
          card.style.opacity = "1";
        } else {
          card.style.opacity = "0";
          card.style.pointerEvents = "none";
        }
        return;
      }

      const angle = i * angleStep + rotation;
      const rad = angle * Math.PI / 180;

      const x = Math.sin(rad) * radius;
      const z = Math.cos(rad) * radius;

      card.style.opacity = "1";
      card.style.pointerEvents = "auto";

      card.style.transform = `
        translate(-50%, -50%)
        translate3d(${x}px, 0, ${z}px)
        rotateY(${-angle}deg)
      `;

      card.style.zIndex = Math.floor(z + radius);
    });
  }

  layout();
  render();

  area.addEventListener("touchstart", (e) => {
    isDown = true;
    lastX = e.touches[0].clientX;

    cancelAnimationFrame(inertiaId);
    velocity = 0;
  });

  area.addEventListener("touchmove", (e) => {
    if (!isDown) return;

    const x = e.touches[0].clientX;
    const diff = x - lastX;
    lastX = x;

    rotation += diff * 0.25;
    velocity = diff;

    render();
  });

  area.addEventListener("touchend", () => {
    isDown = false;

    function inertia() {
      if (Math.abs(velocity) < 0.1) return;

      rotation += velocity * 0.15;
      velocity *= 0.85;

      render();

      inertiaId = requestAnimationFrame(inertia);
    }

    inertia();
  });
});