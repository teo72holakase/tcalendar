import { useEffect, useRef } from 'react';

const AnimatedBackground = ({ darkMode }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animFrameId;

    const POINT_COUNT = 70;
    const MAX_DIST = 160;
    const SPEED = 0.4;
    const points = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const init = () => {
      points.length = 0;
      for (let i = 0; i < POINT_COUNT; i++) {
        points.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * SPEED,
          vy: (Math.random() - 0.5) * SPEED,
          r: Math.random() * 2.5 + 1.5,
        });
      }
    };

    const draw = () => {
      // ✅ PRIMERO: PINTAR EL FONDO DEL CANVAS
      const dark = darkMode;
      const bgColor = dark ? '#0f172a' : '#f8fafc'; // slate-900 o slate-50
      
      // Limpiar y pintar fondo
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Colores de partículas según tema
      const dot  = dark ? 'rgba(99,144,255,'  : 'rgba(47,90,200,';
      const line = dark ? 'rgba(99,144,255,'  : 'rgba(47,90,200,';

      // Mover partículas
      for (const p of points) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      }

      // Dibujar líneas
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const dx = points[i].x - points[j].x;
          const dy = points[i].y - points[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            const alpha = (1 - dist / MAX_DIST) * 0.5;
            ctx.beginPath();
            ctx.moveTo(points[i].x, points[i].y);
            ctx.lineTo(points[j].x, points[j].y);
            ctx.strokeStyle = line + alpha + ')';
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Dibujar puntos
      for (const p of points) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = dot + '0.75)';
        ctx.fill();
      }

      animFrameId = requestAnimationFrame(draw);
    };

    const onResize = () => { resize(); init(); };

    resize();
    init();
    draw();

    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', onResize);
    };
  }, [darkMode]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0, // ← Cambiar a 0 (no -1)
        pointerEvents: 'none',
        display: 'block',
      }}
    />
  );
};

export default AnimatedBackground;