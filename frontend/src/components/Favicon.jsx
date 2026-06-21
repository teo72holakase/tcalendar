import { useEffect } from 'react';

const Favicon = () => {
  useEffect(() => {
    // ✅ Crear el elemento link para el favicon
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    link.href = '/favicon.png'; // ← Asegúrate que este archivo exista en public/
    
    // ✅ Agregar al head del documento
    document.head.appendChild(link);
    
    // ✅ Limpiar al desmontar el componente
    return () => {
      document.head.removeChild(link);
    };
  }, []); // Solo se ejecuta una vez

  return null; // No renderiza nada visible
};

export default Favicon;