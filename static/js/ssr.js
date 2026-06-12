window.ssr = (() => {

  function getOverlay() {
    return document.getElementById("ssrOverlay");
  }

  function getBgLayer(overlay) {
    let el = overlay.querySelector(".bg-layer");
    if (!el) {
      el = document.createElement("div");
      el.className = "bg-layer";
      overlay.appendChild(el);
    }
    return el;
  }

  function getCardLayer(overlay) {
    let el = overlay.querySelector(".card-layer");
    if (!el) {
      el = document.createElement("div");
      el.className = "card-layer";
      overlay.appendChild(el);
    }
    return el;
  }

  /* =========================================================
     🌪 CAMERA 3 STAGE ZOOM + PULSE
  ========================================================= */
  function cameraSequence(overlay) {

    const cam = overlay.querySelector(".camera");
    if (!cam) return;

    cam.classList.remove("zoom-wide", "zoom-mid", "zoom-close");
    void cam.offsetWidth;

    overlay.style.transform = "scale(1.02)";

    cam.classList.add("zoom-wide");

    setTimeout(() => {
      cam.classList.add("zoom-mid");
    }, 150);

    setTimeout(() => {
      cam.classList.add("zoom-close");
    }, 320);

    setTimeout(() => {
      overlay.style.transform = "";
    }, 600);
  }

  /* =========================================================
     🌫 UI DISTORTION (가챠 UI 왜곡)
  ========================================================= */
  function uiWarpStart(overlay) {
    overlay.style.filter = "brightness(1.15) contrast(1.2) saturate(1.3) blur(0.2px)";
    overlay.style.transform = "scale(1.01) skewX(-0.6deg)";
  }

  function uiWarpEnd(overlay) {
    overlay.style.filter = "";
    overlay.style.transform = "";
  }

  /* =========================================================
     💓 SSR HEARTBEAT BURST
  ========================================================= */
  function heartbeatBurst(overlay) {
    overlay.classList.add("heartbeat");
    setTimeout(() => overlay.classList.remove("heartbeat"), 900);
  }

  /* =========================================================
     🌸 FLIP 이후 4단계 시스템
     stick → slide → burst → drift
  ========================================================= */
  function spawnFlipSakuraBurst(card, overlay) {

    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const layer = overlay.querySelector(".bg-layer");

    const count = 140;

    const petals = [];

    for (let i = 0; i < count; i++) {

      const p = document.createElement("div");
      p.className = "sakura hit";

      const angle = Math.random() * Math.PI * 2;

      const stick = 15 + Math.random() * 40;
      const slide = 80 + Math.random() * 220;
      const burst = 220 + Math.random() * 420;

      const x = Math.cos(angle) * (stick + slide + burst);
      const y = Math.sin(angle) * (stick + slide + burst);

      p.style.left = cx + "px";
      p.style.top = cy + "px";

      p.style.setProperty("--x", x + "px");
      p.style.setProperty("--y", y + "px");

      p.style.animationDuration = (0.7 + Math.random() * 1.2) + "s";
      p.style.animationDelay = (Math.random() * 0.12) + "s";

      layer.appendChild(p);
      petals.push(p);
    }

    /* =========================================================
       🌸 1단: 충돌 → 2단: 부착 → 3단: 미끄러짐 → 4단: 폭발
       + 마지막: 자유 흩날림 (drift)
    ========================================================= */

    setTimeout(() => {
      petals.forEach(p => {
        p.classList.remove("hit");
        p.classList.add("stick");
      });
    }, 120);

    setTimeout(() => {
      petals.forEach(p => {
        p.classList.remove("stick");
        p.classList.add("slide");
      });
    }, 350);

    setTimeout(() => {
      petals.forEach(p => {
        p.classList.remove("slide");
        p.classList.add("burst");
      });
    }, 700);

    /* =========================================================
       🌪 FINAL: 자유 흩날림 (핵심 추가)
    ========================================================= */
    setTimeout(() => {

      petals.forEach(p => {
        p.className = "sakura post-flip";

        const rx = (Math.random() - 0.5) * 800;
        const ry = (Math.random() - 0.5) * 600;

        p.style.setProperty("--x", rx + "px");
        p.style.setProperty("--y", ry + "px");

        p.style.animationDuration = (3 + Math.random() * 4) + "s";
      });

    }, 1000);

    setTimeout(() => {
      petals.forEach(p => p.remove());
    }, 6000);
  }

  /* =========================================================
     🌸 BACKGROUND VORTEX
  ========================================================= */
  function createSakuraVortex(bgLayer) {

    const camera = document.createElement("div");
    camera.className = "camera -x";

    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.inset = "0";

    camera.appendChild(container);

    const count = 200;

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    const turns = 5.2;

    for (let i = 0; i < count; i++) {

      const p = document.createElement("div");
      p.className = "sakura";

      const t = i / count;
      const angle = t * Math.PI * 2 * turns;

      const r = window.innerWidth * (1.0 - t * 0.92);

      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;

      p.style.left = cx + "px";
      p.style.top = cy + "px";

      p.style.setProperty("--x", x + "px");
      p.style.setProperty("--y", y + "px");

      p.style.animationDelay = (i * 0.002) + "s";

      container.appendChild(p);
    }

    bgLayer.replaceChildren(camera);

    cameraSequence(camera);
  }

  /* =========================================================
     🎴 SSR CARD FX
  ========================================================= */
  function applySSRCardFX(card) {

    card.style.position = "absolute";
    card.style.top = "50%";
    card.style.left = "50%";
    card.style.transform = "translate(-50%, -50%) scale(1.42)";
    card.style.zIndex = "999999";

    card.style.boxShadow =
      "0 0 140px rgba(255,80,120,0.75), 0 0 240px rgba(120,80,255,0.5)";

    card.style.filter =
      "brightness(1.35) contrast(1.2) saturate(1.4)";

    card.style.animation =
      "cardFloat 3s ease-in-out infinite, glow 2s ease-in-out infinite";
  }

  /* =========================================================
     💥 SSR PLAY CORE
  ========================================================= */
  function play(card, rarity, done) {

    const overlay = getOverlay();
    if (!overlay) return;

    const bgLayer = getBgLayer(overlay);
    const cardLayer = getCardLayer(overlay);

    overlay.style.display = "block";

    overlay.classList.add("time-freeze");
    uiWarpStart(overlay);

    setTimeout(() => {
      overlay.classList.remove("time-freeze");
      uiWarpEnd(overlay);
    }, 220);

    if (rarity === "SSR") heartbeatBurst(overlay);

    overlay.classList.remove("shake", "flash");
    void overlay.offsetWidth;

    overlay.classList.add("shake");

    setTimeout(() => overlay.classList.add("flash"), 120);

    bgLayer.replaceChildren();
    createSakuraVortex(bgLayer);

    setTimeout(() => {

      cardLayer.replaceChildren();
      cardLayer.appendChild(card);

      applySSRCardFX(card);

      card.dataset.flipped = "false";

      let locked = false;

      card.onclick = (e) => {
        e.stopPropagation();
        if (locked) return;
        locked = true;

        if (card.dataset.flipped === "false") {

          card.classList.add("flip");
          card.dataset.flipped = "true";

          spawnFlipSakuraBurst(card, overlay);

          overlay.classList.add("shake");
          setTimeout(() => overlay.classList.remove("shake"), 280);

          uiWarpStart(overlay);
          setTimeout(() => uiWarpEnd(overlay), 300);

          heartbeatBurst(overlay);

          window.ssrBurst?.(card);

          setTimeout(() => locked = false, 260);
          return;
        }

        window.location.href = "/collection.html";
      };

      if (done) done();

    }, 650);
  }

  return { play };

})();