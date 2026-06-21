import { X } from 'lucide-react';
import { useState } from 'react';
import { updateEventColor } from '../services/api';

const PASTEL_COLORS = [
  { hex: '#FFD1DC', name: 'Rosa pastel' },
  { hex: '#A2CFFE', name: 'Azul pastel' },
  { hex: '#AAF0D1', name: 'Verde menta' },
  { hex: '#E3E4FA', name: 'Lavanda suave' },
  { hex: '#FFFACD', name: 'Amarillo claro' },
  { hex: '#FFDAB9', name: 'Durazno claro' },
  { hex: '#DCD0FF', name: 'Lila pastel' },
  { hex: '#B0E0E6', name: 'Celeste suave' },
];

const getTextColor = (hex) => {
  if (!hex) return '#1e293b';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#1e293b' : '#f8fafc';
};

const EventDetailsModal = ({ open, onClose, event, onDelete, canDelete, loading, error }) => {
  const [selectedColor, setSelectedColor] = useState(event?.color || '#A2CFFE');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [updatingColor, setUpdatingColor] = useState(false);
  const [colorError, setColorError] = useState(''); // ✅ NUEVO

  if (!open || !event) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Sin fecha';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // ✅ Manejar cambio de color con mensajes amigables
  const handleColorChange = async (newColor) => {
    // ✅ Si no tiene permisos, mostrar mensaje y salir
    if (!canDelete) {
      setColorError('⚠️ No tienes permiso para cambiar el color de este evento');
      setTimeout(() => setColorError(''), 3000);
      return;
    }

    setSelectedColor(newColor);
    setUpdatingColor(true);
    setColorError('');
    
    try {
      await updateEventColor(event._id, newColor);
      window.location.reload();
    } catch (error) {
      console.error('Error al actualizar color:', error);
      
      // ✅ Mensajes amigables según el tipo de error
      if (error.response?.status === 403) {
        setColorError('⚠️ No tienes permiso para cambiar el color de este evento');
      } else if (error.response?.status === 401) {
        setColorError('🔑 Tu sesión ha expirado. Inicia sesión nuevamente.');
      } else if (error.response?.status === 404) {
        setColorError('📅 El evento ya no existe.');
      } else {
        setColorError('❌ Error al actualizar el color. Intenta nuevamente.');
      }
      
      setTimeout(() => setColorError(''), 4000);
    } finally {
      setUpdatingColor(false);
    }
  };

  // ✅ Manejar clic en "Cambiar color" sin permisos
  const handleToggleColorPicker = () => {
    if (!canDelete) {
      setColorError('⚠️ Solo el creador del evento o del grupo puede cambiar el color');
      setTimeout(() => setColorError(''), 3000);
      return;
    }
    setShowColorPicker(!showColorPicker);
    setColorError('');
  };

  const currentColor = event.color || selectedColor;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-800">
        {/* HEADER */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Detalles del evento
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <X size={22} />
          </button>
        </div>

        {/* TÍTULO CON COLOR */}
        <div className="mb-4 flex items-center gap-3">
          <div
            className="h-6 w-6 rounded-full border"
            style={{ backgroundColor: currentColor }}
          />
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
            {event.title || 'Sin título'}
          </h3>
        </div>

        {/* DESCRIPCIÓN */}
        {event.description && (
          <div className="mb-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-700">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Descripción</p>
            <p className="text-slate-900 dark:text-white">{event.description}</p>
          </div>
        )}

        {/* TEMAS */}
        {event.topics && (
          <div className="mb-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-700">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Temas / Propuesta</p>
            <p className="text-slate-900 dark:text-white">{event.topics}</p>
          </div>
        )}

        {/* FECHA */}
        <div className="mb-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-700">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Fecha de entrega</p>
          <p className="text-slate-900 dark:text-white">{formatDate(event.dueDate)}</p>
        </div>

        {/* CREADOR */}
        <div className="mb-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-700">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Creado por</p>
          <p className="text-slate-900 dark:text-white">
            {event.createdBy?.username || 'Usuario desconocido'}
          </p>
        </div>

        {/* SELECTOR DE COLOR - SIEMPRE VISIBLE PERO CON MENSAJE SI NO TIENE PERMISOS */}
        <div className="mb-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-700">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Color del evento</p>
            <button
              onClick={handleToggleColorPicker}
              className={`rounded-lg px-3 py-1 text-sm hover:bg-slate-200 dark:hover:bg-slate-600 ${
                !canDelete ? 'opacity-60 cursor-not-allowed' : ''
              }`}
              disabled={updatingColor}
            >
              {updatingColor ? 'Guardando...' : showColorPicker ? 'Ocultar colores' : 'Cambiar color'}
            </button>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">Color actual:</span>
            <div
              className="h-6 w-6 rounded-full border"
              style={{ backgroundColor: currentColor }}
            />
            {!canDelete && (
              <span className="text-xs text-slate-400 dark:text-slate-500">
                (solo creadores)
              </span>
            )}
          </div>

          {/* ✅ MENSAJE DE ERROR AMIGABLE */}
          {colorError && (
            <div className="mt-2 rounded-lg bg-amber-50 p-2 text-sm text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              {colorError}
            </div>
          )}

          {/* Selector de colores - Solo si tiene permisos */}
          {showColorPicker && canDelete && (
            <div className="mt-3 flex flex-wrap gap-2">
              {PASTEL_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  title={c.name}
                  onClick={() => handleColorChange(c.hex)}
                  style={{ backgroundColor: c.hex }}
                  disabled={updatingColor}
                  className={`h-8 w-8 rounded-full transition-transform hover:scale-110 ${
                    selectedColor === c.hex ? 'ring-2 ring-offset-2 ring-slate-500 scale-110' : ''
                  } ${updatingColor ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* ERROR GENERAL */}
        {error && (
          <div className="mb-4 rounded-xl bg-rose-100 p-3 text-sm text-rose-700 dark:bg-rose-900 dark:text-rose-200">
            {error}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-2xl border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Cerrar
          </button>
          {canDelete && (
            <button
              onClick={() => onDelete(event)}
              disabled={loading || updatingColor}
              className="rounded-2xl bg-rose-600 px-5 py-2 text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? 'Eliminando...' : 'Eliminar evento'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;