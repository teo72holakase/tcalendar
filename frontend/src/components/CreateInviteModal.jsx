import { useState } from 'react';
import axios from 'axios';
import { Copy, Check, X } from 'lucide-react';

const CreateInviteModal = ({ groupId, open, onClose, onInviteCreated }) => {
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const handleCreate = async () => {
    try {
      setLoading(true);
      
      // ✅ CAMBIADO: usar tcalendar_token
      const token = localStorage.getItem('tcalendar_token');
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/invites`,
        { groupId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setInviteLink(response.data.inviteLink);
      if (onInviteCreated) onInviteCreated(response.data.invite);
    } catch (error) {
      console.error('Error al crear invitación:', error);
      alert(error.response?.data?.message || 'Error al crear invitación');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-800">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <X size={22} />
        </button>

        <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">
          Crear invitación
        </h2>

        {!inviteLink ? (
          <>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
              Genera un enlace para invitar a nuevos miembros al grupo.
              El enlace será válido hasta que lo elimines.
            </p>
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
              <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">
                Comparte este enlace:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="flex-1 rounded-lg bg-white px-3 py-2 text-sm dark:bg-slate-600"
                />
                <button
                  onClick={handleCopy}
                  className="rounded-lg bg-brand-600 p-2 text-white hover:bg-brand-700"
                >
                  {copied ? <Check size={20} /> : <Copy size={20} />}
                </button>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full rounded-xl bg-slate-200 py-3 font-semibold text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
            >
              Cerrar
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CreateInviteModal;