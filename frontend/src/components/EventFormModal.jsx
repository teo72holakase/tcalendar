import { X } from 'lucide-react';
import { useState, useEffect } from 'react';

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
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#1e293b' : '#f8fafc';
};

const emptyEvent = {
  title: '',
  description: '',
  topics: '',
  dueDate: '',
  color: '#A2CFFE',
};

const EventFormModal = ({ open, onClose, onSave, loading, error, initialData }) => {
  const [form, setForm] = useState(emptyEvent);

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title || '',
        description: initialData.description || '',
        topics: initialData.topics || '',
        color: initialData.color || '#A2CFFE',
        dueDate: initialData.dueDate
          ? new Date(initialData.dueDate).toISOString().split('T')[0]
          : '',
      });
    } else {
      setForm(emptyEvent);
    }
  }, [initialData, open]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleColorSelect = (color) => {
    setForm({ ...form, color });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // ✅ Asegurar que el color esté en form
    const adjustedDate = new Date(`${form.dueDate}T12:00:00.000Z`);
    const eventData = {
      ...form,
      dueDate: adjustedDate.toISOString(),
      color: form.color || '#A2CFFE',
    };
    
    console.log('📤 Evento a guardar:', eventData); // ← LOG PARA VERIFICAR
    onSave(eventData);
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-800">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {initialData?.title ? 'Editar evento' : 'Nuevo evento'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {initialData?.title ? 'Modifica los datos del evento.' : 'Completa los datos y guarda tu tarea.'}
            </p>
          </div>
          <button className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white" onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Título</span>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Fecha de entrega</span>
              <input
                name="dueDate"
                type="date"
                value={form.dueDate}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Temas / Propuesta</span>
            <input
              name="topics"
              value={form.topics}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Descripción</span>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="3"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </label>

          {/* ✅ COLOR PICKER */}
          <div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Color del evento</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {PASTEL_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  title={c.name}
                  onClick={() => handleColorSelect(c.hex)}
                  style={{ backgroundColor: c.hex }}
                  className={`h-8 w-8 rounded-full transition-transform hover:scale-110 ${
                    form.color === c.hex ? 'ring-2 ring-offset-2 ring-slate-500 scale-110' : ''
                  }`}
                />
              ))}
            </div>
            {/* Vista previa */}
            <div
              className="mt-2 inline-flex items-center rounded-xl px-3 py-1 text-sm font-medium"
              style={{ backgroundColor: form.color, color: getTextColor(form.color) }}
            >
              {form.title || 'Vista previa'}
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-rose-100 p-3 text-sm text-rose-700 dark:bg-rose-900 dark:text-rose-200">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-brand-600 px-5 py-2 text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {loading ? 'Guardando...' : 'Guardar evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventFormModal;