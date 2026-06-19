import { X } from 'lucide-react';
import { useState, useEffect } from 'react';

const emptyEvent = {
  title: '',
  description: '',
  topics: '',
  dueDate: '',
};

const EventFormModal = ({ open, onClose, onSave, loading, error, initialData }) => {
  const [form, setForm] = useState(emptyEvent);

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title || '',
        description: initialData.description || '',
        topics: initialData.topics || '',
        dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : '',
      });
    } else {
      setForm(emptyEvent);
    }
  }, [initialData, open]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Nuevo evento</h2>
            <p className="text-sm text-slate-500">Completa los datos y guarda tu tarea.</p>
          </div>
          <button className="text-slate-500 hover:text-slate-900" onClick={onClose}>
            <X size={22} />
          </button>
        </div>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Título</span>
              <input name="title" value={form.title} onChange={handleChange} required className="mt-1 w-full" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Fecha de entrega</span>
              <input name="dueDate" type="date" value={form.dueDate} onChange={handleChange} required className="mt-1 w-full" />
            </label>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Temas / Propuesta</span>
            <input name="topics" value={form.topics} onChange={handleChange} className="mt-1 w-full" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Descripción</span>
            <textarea name="description" value={form.description} onChange={handleChange} rows="4" className="mt-1 w-full" />
          </label>
          {error && <div className="rounded-xl bg-rose-100 p-3 text-sm text-rose-700">{error}</div>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-2xl border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-100">
              Cancelar
            </button>
            <button disabled={loading} className="rounded-2xl bg-brand-600 px-5 py-2 text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300">
              {loading ? 'Guardando...' : 'Guardar evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventFormModal;
