import { useEffect, useRef } from 'react';

// Lee los colores actuales (tema + paleta) sin recalcular estilos en cada fotograma.
const readColors = () => {
  const root = document.documentElement;
  const dark = root.classList.contains('dark');
  const rgb = getComputedStyle(root).getPropertyValue(dark ? '--brand-400' : '--brand-600').trim().split(/\s+/).join(',');
  return { dark, rgb: rgb || '47,90,200' };
};

const AnimatedBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const MAX_DIST = 160;
    const SPEED = 0.4;
    const points = [];
    let w = 0, h = 0, raf = 0, colors = readColors();

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2); // nítido en pantallas retina sin gastar de más
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const init = () => {
      points.length = 0;
      const count = w < 640 ? 35 : 70; // menos puntos en celular: el costo crece al cuadrado
      for (let i = 0; i < count; i++) {
        points.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * SPEED, vy: (Math.random() - 0.5) * SPEED, r: Math.random() * 2.5 + 1.5 });
      }
    };

    const paint = () => {
      ctx.fillStyle = colors.dark ? '#0f172a' : '#f8fafc';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const dx = points[i].x - points[j].x;
          const dy = points[i].y - points[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < MAX_DIST) {
            ctx.beginPath();
            ctx.moveTo(points[i].x, points[i].y);
            ctx.lineTo(points[j].x, points[j].y);
            ctx.strokeStyle = `rgba(${colors.rgb},${(1 - dist / MAX_DIST) * 0.5})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }
      ctx.fillStyle = `rgba(${colors.rgb},0.75)`;
      for (const p of points) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const frame = () => {
      for (const p of points) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
      paint();
      raf = requestAnimationFrame(frame);
    };

    // En el celular, la barra del navegador cambia el alto al hacer scroll: solo reiniciar si cambia el ANCHO.
    let lastWidth = window.innerWidth;
    const onResize = () => {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      size();
      init();
      if (reduceMotion) paint();
    };

    // Si cambia el tema o la paleta, actualizar colores
    const observer = new MutationObserver(() => { colors = readColors(); if (reduceMotion) paint(); });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-palette'] });

    size();
    init();
    if (reduceMotion) paint(); // con "reducir movimiento" se dibuja una sola imagen fija
    else frame();

    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none', display: 'block' }}
    />
  );
};

export default AnimatedBackground;
