import { X } from 'lucide-react';
import { useState } from 'react';

const InviteMemberModal = ({ open, onClose, onInvite, loading, error }) => {
  const [username, setUsername] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onInvite({ username });
    setUsername('');
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-800">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Invitar miembro</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Agrega a un usuario al grupo por su nombre de usuario.</p>
          </div>
          <button className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white" onClick={onClose}>
            <X size={22} />
          </button>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Nombre de usuario</span>
            <input name="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ej. usuario123" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400" />
          </label>
          {error && <div className="rounded-xl bg-rose-100 p-3 text-sm text-rose-700 dark:bg-rose-900 dark:text-rose-200">{error}</div>}
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="rounded-2xl border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
              Cancelar
            </button>
            <button disabled={loading} className="rounded-2xl bg-brand-600 px-5 py-2 text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300">
              {loading ? 'Enviando...' : 'Invitar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteMemberModal;
