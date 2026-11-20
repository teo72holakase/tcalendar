import { useRef, useState } from 'react';
import { Check, Copy, Share2 } from 'lucide-react';
import Modal from './Modal';
import api from '../services/api';

const EXPIRY = [['1 día', '1'], ['3 días', '3'], ['7 días', '7'], ['Sin límite', 'unlimited']];
const USES = [1, 5, 10, 20, 50];

const Option = ({ active, ...props }) => (
  <button type="button" aria-pressed={active} className={`chip min-h-11 px-4 text-sm ${active ? 'chip-strong' : ''}`} {...props} />
);

const CreateInviteModal = ({ groupId, open, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [expiresInDays, setExpires] = useState('unlimited');
  const [maxUses, setMaxUses] = useState(1);
  const linkRef = useRef(null);

  const create = async () => {
    try {
      setLoading(true); setError('');
      const { data } = await api.post('/invites', { groupId, expiresInDays, maxUses });
      setLink(data.inviteLink);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear la invitación');
    } finally { setLoading(false); }
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(link); }
    catch { linkRef.current?.select(); if (!document.execCommand?.('copy')) return; } // sin HTTPS no hay clipboard: copia manual
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const close = () => { setLink(''); setError(''); setCopied(false); setExpires('unlimited'); setMaxUses(1); onClose(); };

  return (
    <Modal open={open} onClose={close} title="Invitar con un enlace" subtitle="Cualquiera con el enlace puede unirse, hasta el límite que elijas." titleId="create-invite-title">
      {error && <p role="alert" className="mb-4 rounded-2xl bg-danger-soft p-3.5 text-sm font-medium text-danger">{error}</p>}
      {!link ? (
        <div className="space-y-6">
          <fieldset><legend className="field-label">Dura</legend><div className="flex flex-wrap gap-2">{EXPIRY.map(([l, v]) => <Option key={v} active={expiresInDays === v} onClick={() => setExpires(v)}>{l}</Option>)}</div></fieldset>
          <fieldset><legend className="field-label">Personas que pueden usarlo</legend><div className="flex flex-wrap gap-2">{USES.map((n) => <Option key={n} active={maxUses === n} onClick={() => setMaxUses(n)}>{n}</Option>)}</div></fieldset>
          <button onClick={create} disabled={loading} className="btn btn-primary w-full">{loading ? 'Creando…' : 'Generar enlace'}</button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input ref={linkRef} aria-label="Enlace de invitación" readOnly value={link} onFocus={(e) => e.target.select()} className="field min-w-0 flex-1 text-sm" />
            <button onClick={copy} aria-label="Copiar enlace" className="btn btn-primary w-12 px-0">{copied ? <Check size={20} /> : <Copy size={20} />}</button>
            {typeof navigator !== 'undefined' && navigator.share && <button onClick={() => navigator.share({ title: 'Invitación a TCalendar', url: link }).catch(() => {})} aria-label="Compartir enlace" className="btn btn-quiet w-12 px-0"><Share2 size={20} /></button>}
          </div>
          <p className="text-sm text-muted">{expiresInDays === 'unlimited' ? 'Sin vencimiento' : `Vence en ${expiresInDays} día${expiresInDays === '1' ? '' : 's'}`} · {maxUses} {maxUses === 1 ? 'uso' : 'usos'}</p>
          <button onClick={close} className="btn btn-quiet w-full">Listo</button>
        </div>
      )}
    </Modal>
  );
};

export default CreateInviteModal;
