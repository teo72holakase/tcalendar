import { useState } from 'react';
import { X } from 'lucide-react';

const DeleteGroupModal = ({ open, onClose, onConfirm, groupName, loading }) => {
  const [input, setInput] = useState('');

  if (!open) return null;

  const handleClose = () => {
    setInput('');
    onClose();
  };

  const handleConfirm = () => {
    if (input.toLowerCase().trim() === groupName.toLowerCase().trim()) {
      onConfirm();
    }
  };

  const isMatch = input.toLowerCase().trim() === groupName.toLowerCase().trim();

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Borrar grupo</h2>
          <button
            onClick={handleClose}
            className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <X size={22} />
          </button>
        </div>

        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          ¿Seguro de borrar el grupo? Escribe el nombre del grupo para continuar:{' '}
          <strong className="text-slate-900 dark:text-white">{groupName}</strong>
        </p>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nombre del grupo"
          className={`w-full rounded-lg border px-3 py-2 text-slate-900 transition-colors dark:text-white ${
            input && isMatch
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
              : input && !isMatch
              ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20'
              : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-700'
          }`}
        />

        {input && !isMatch && (
          <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">
            El nombre no coincide. Por favor, escribe el nombre exacto del grupo.
          </p>
        )}

        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="rounded-2xl border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isMatch || loading}
            className="rounded-2xl bg-rose-600 px-5 py-2 text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? 'Borrando...' : 'Borrar grupo'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteGroupModal;