const FLAKE_DENSITY = 18000;
const MAX_FLAKES = 160;

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

/** Снег на canvas: не перехватывает клики и подстраивается под тему. */
export function createSnowfall() {
  let canvas = null;
  let context = null;
  let flakes = [];
  let frameId = null;
  let resizeHandler = null;
  let width = 0;
  let height = 0;
  let lastTime = 0;

  function createFlake() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      radius: randomBetween(1, 3.2),
      speed: randomBetween(18, 55),
      drift: randomBetween(-12, 12),
      phase: Math.random() * Math.PI * 2,
      opacity: randomBetween(0.45, 0.95),
    };
  }

  function resize() {
    if (!canvas || !context) return;

    width = window.innerWidth;
    height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.min(
      MAX_FLAKES,
      Math.max(30, Math.round((width * height) / FLAKE_DENSITY)),
    );
    if (flakes.length > count) flakes.length = count;
    while (flakes.length < count) flakes.push(createFlake());
  }

  function flakeColor() {
    return document.documentElement.dataset.theme === 'dark' ? '#ffffff' : '#8fc6f0';
  }

  function drawStatic() {
    if (!context) return;
    context.clearRect(0, 0, width, height);
    context.fillStyle = flakeColor();
    flakes.forEach((flake) => {
      context.globalAlpha = flake.opacity;
      context.beginPath();
      context.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
      context.fill();
    });
    context.globalAlpha = 1;
  }

  function draw(timestamp) {
    if (!context) return;

    const delta = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.05) : 0;
    lastTime = timestamp;

    context.clearRect(0, 0, width, height);
    context.fillStyle = flakeColor();

    flakes.forEach((flake) => {
      flake.y += flake.speed * delta;
      flake.phase += delta;
      flake.x += (flake.drift + Math.sin(flake.phase) * 8) * delta;

      if (flake.y - flake.radius > height) {
        flake.y = -flake.radius;
        flake.x = Math.random() * width;
      }
      if (flake.x < -flake.radius) flake.x = width + flake.radius;
      if (flake.x > width + flake.radius) flake.x = -flake.radius;

      context.globalAlpha = flake.opacity;
      context.beginPath();
      context.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
      context.fill();
    });

    context.globalAlpha = 1;
    frameId = window.requestAnimationFrame(draw);
  }

  function start() {
    if (canvas) return;

    canvas = document.createElement('canvas');
    canvas.className = 'snowfall';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);

    context = canvas.getContext('2d');
    flakes = [];
    resize();

    resizeHandler = () => resize();
    window.addEventListener('resize', resizeHandler);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      drawStatic();
      return;
    }

    lastTime = 0;
    frameId = window.requestAnimationFrame(draw);
  }

  function stop() {
    if (frameId) {
      window.cancelAnimationFrame(frameId);
      frameId = null;
    }

    if (canvas) {
      canvas.remove();
      canvas = null;
      context = null;
    }

    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler);
      resizeHandler = null;
    }

    flakes = [];
    lastTime = 0;
  }

  return { start, stop, destroy: stop };
}
