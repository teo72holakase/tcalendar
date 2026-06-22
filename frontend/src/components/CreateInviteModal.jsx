import { useState } from 'react';
import { Copy, Check, X } from 'lucide-react';
import api from '../services/api';

const EXPIRY_OPTIONS = [
  { label: '1 día', value: '1' },
  { label: '2 días', value: '2' },
  { label: '3 días', value: '3' },
  { label: '5 días', value: '5' },
  { label: '7 días', value: '7' },
  { label: 'Ilimitado', value: 'unlimited' },
];

const USE_OPTIONS = [1, 5, 10, 20, 30, 40, 50];

const CreateInviteModal = ({ groupId, open, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('unlimited');
  const [maxUses, setMaxUses] = useState(1);

  if (!open) return null;

  const handleCreate = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.post('/invites', { groupId, expiresInDays, maxUses });
      setInviteLink(data.inviteLink);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear invitación');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setInviteLink('');
    setError('');
    setCopied(false);
    setExpiresInDays('unlimited');
    setMaxUses(1);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-800">
        <button onClick={handleClose} className="absolute right-4 top-4 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
          <X size={22} />
        </button>
        <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">Crear invitación</h2>

        {error && <p className="mb-3 rounded-xl bg-rose-100 px-4 py-2 text-sm text-rose-700 dark:bg-rose-900 dark:text-rose-300">{error}</p>}

        {!inviteLink ? (
          <>
            {/* EXPIRACIÓN */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Duración del enlace
              </label>
              <div className="flex flex-wrap gap-2">
                {EXPIRY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setExpiresInDays(opt.value)}
                    className={`rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${
                      expiresInDays === opt.value
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* USOS */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Número de usos
              </label>
              <div className="flex flex-wrap gap-2">
                {USE_OPTIONS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setMaxUses(n)}
                    className={`rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${
                      maxUses === n
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full rounded-xl bg-brand-600 py-3 font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Creando...' : '🔗 Generar enlace'}
            </button>
          </>
        ) : (
          <>
            <div className="mb-4 rounded-xl bg-slate-100 p-4 dark:bg-slate-700">
              <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">Comparte este enlace:</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="flex-1 rounded-lg bg-white px-3 py-2 text-sm dark:bg-slate-600 dark:text-white"
                />
                <button onClick={handleCopy} className="rounded-lg bg-brand-600 p-2 text-white hover:bg-brand-700">
                  {copied ? <Check size={20} /> : <Copy size={20} />}
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {expiresInDays === 'unlimited' ? 'Sin expiración' : `Expira en ${expiresInDays} día${expiresInDays === '1' ? '' : 's'}`}
                {' · '}
                {maxUses} uso{maxUses > 1 ? 's' : ''}
              </p>
            </div>
            <button onClick={handleClose} className="w-full rounded-xl bg-slate-200 py-3 font-semibold text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600">
              Cerrar
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CreateInviteModal;