// ssr.js
window.ssr = (() => {

  let ssrLayer;
  let cardArea;
  let state = "idle";

  let glState = {
    canvas: null,
    gl: null,
    running: false,
    raf: null
  };

  function init() {
    ssrLayer = document.getElementById("ssrLayer");
    cardArea = document.getElementById("cardArea");

    if (!ssrLayer) {
      ssrLayer = document.createElement("div");
      ssrLayer.id = "ssrLayer";
      document.body.appendChild(ssrLayer);
    }
  }

  function play(card, rarity, onComplete) {
    if (state !== "idle") return;

    state = "playing";
    init();

    if (cardArea) cardArea.style.display = "none";

    ssrLayer.style.display = "block";
    ssrLayer.innerHTML = `
      <canvas id="sakura"></canvas>
      <div class="ssr-hint"></div>
    `;

    startSakura();

    setTimeout(() => {
      reveal(card, rarity, onComplete);
    }, 3000);
  }

  function reveal(card, rarity, onComplete) {
    state = "reveal";

    const img = card.querySelector(".img");
    const badge = card.querySelector(".badge");

    img.style.display = "block";
    badge.textContent = rarity;

    card.classList.add("ssr-reveal");

    state = "done";

    card.addEventListener("click", () => {
      location.href = "/collection";
    });

    if (onComplete) onComplete();
  }

  // =========================
  // 🌸 WEBGL (CodePen 구조 복원)
  // =========================
  function startSakura() {

    const canvas = document.getElementById("sakura");
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: false
    });

    if (!gl) return;

    glState.canvas = canvas;
    glState.gl = gl;

    // =========================
    // FBO SETUP (핵심)
    // =========================
    const fbo = gl.createFramebuffer();
    const colorTex = gl.createTexture();
    const depthBuffer = gl.createRenderbuffer();

    function initFBO() {

      gl.bindTexture(gl.TEXTURE_2D, colorTex);
      gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA,
        canvas.width, canvas.height,
        0, gl.RGBA, gl.UNSIGNED_BYTE, null
      );

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTex, 0);

      gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, canvas.width, canvas.height);

      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    // =========================
    // resize
    // =========================
    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
      initFBO();
    }

    window.addEventListener("resize", resize);
    resize();

    // =========================
    // shader utils
    // =========================
    function get(id) {
      const el = document.getElementById(id);
      return el ? el.textContent : "";
    }

    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }

    function program(vs, fs) {
      const p = gl.createProgram();
      gl.attachShader(p, compile(gl.VERTEX_SHADER, get(vs)));
      gl.attachShader(p, compile(gl.FRAGMENT_SHADER, get(fs)));
      gl.linkProgram(p);
      return p;
    }

    // =========================
    // PROGRAMS
    // =========================
    const mainProgram   = program("sakura_point_vsh", "sakura_point_fsh");
    const brightProgram  = program("fx_common_vsh", "fx_brightbuf_fsh");
    const blurProgram    = program("fx_common_vsh", "fx_dirblur_r4_fsh");
    const finalProgram   = program("pp_final_vsh", "pp_final_fsh");

    // =========================
    // QUAD
    // =========================
    const quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1,-1,  1,-1,  -1,1,  1,1
    ]), gl.STATIC_DRAW);

    // =========================
    // PARTICLES
    // =========================
    const particleCount = 800;

    const positions = new Float32Array(particleCount * 3);
    const eulers = new Float32Array(particleCount * 3);
    const misc = new Float32Array(particleCount * 2);

    for (let i = 0; i < particleCount; i++) {
      positions[i*3+0] = (Math.random()-0.5)*20;
      positions[i*3+1] = Math.random()*10;
      positions[i*3+2] = (Math.random()-0.5)*20;

      eulers[i*3+0] = Math.random()*Math.PI;
      eulers[i*3+1] = Math.random()*Math.PI;
      eulers[i*3+2] = Math.random()*Math.PI;

      misc[i*2+0] = Math.random()*2+1;
      misc[i*2+1] = Math.random();
    }

    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const eurBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, eurBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, eulers, gl.STATIC_DRAW);

    const miscBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, miscBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, misc, gl.STATIC_DRAW);

    // =========================
    // DRAW LOOP (FBO → BLUR → FINAL)
    // =========================
    const uResolution = gl.getUniformLocation(mainProgram, "uResolution");

    function draw() {

      // 1. SCENE → FBO
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(mainProgram);

      gl.uniform3f(uResolution, canvas.width, canvas.height, canvas.width/canvas.height);

      const aPos = gl.getAttribLocation(mainProgram, "aPosition");
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);

      const aEuler = gl.getAttribLocation(mainProgram, "aEuler");
      gl.bindBuffer(gl.ARRAY_BUFFER, eurBuffer);
      gl.enableVertexAttribArray(aEuler);
      gl.vertexAttribPointer(aEuler, 3, gl.FLOAT, false, 0, 0);

      const aMisc = gl.getAttribLocation(mainProgram, "aMisc");
      gl.bindBuffer(gl.ARRAY_BUFFER, miscBuffer);
      gl.enableVertexAttribArray(aMisc);
      gl.vertexAttribPointer(aMisc, 2, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.POINTS, 0, particleCount);

      // 2. SCREEN PASS
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      gl.useProgram(finalProgram);

      const a1 = gl.getAttribLocation(finalProgram, "aPosition");
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
      gl.enableVertexAttribArray(a1);
      gl.vertexAttribPointer(a1, 2, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      glState.raf = requestAnimationFrame(draw);
    }

    draw();
  }

  function reset() {
    state = "idle";
    if (glState.raf) cancelAnimationFrame(glState.raf);

    if (cardArea) cardArea.style.display = "block";

    if (ssrLayer) {
      ssrLayer.style.display = "none";
      ssrLayer.innerHTML = "";
    }
  }

  return { play, reset };

})();