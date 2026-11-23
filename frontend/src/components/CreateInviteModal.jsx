import { useRef, useState } from 'react';
import { Check, Copy, Link2, UserPlus, Users } from 'lucide-react';
import Modal from './Modal';
import Field from './Field';
import api, { generateGroupCode } from '../services/api';

const EXPIRY = [['1 día', '1'], ['3 días', '3'], ['7 días', '7'], ['Sin límite', 'unlimited']];
const USES = [1, 5, 10, 20, 50];

const Option = ({ active, ...props }) => (
  <button type="button" aria-pressed={active} className={`chip min-h-11 px-4 text-sm ${active ? 'chip-strong' : ''}`} {...props} />
);

const CreateInviteModal = ({ groupId, open, onClose, onInvite, loading, error }) => {
  const [mode, setMode] = useState('choose');
  const [username, setUsername] = useState('');
  const [link, setLink] = useState('');
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [localError, setLocalError] = useState('');
  const [creating, setCreating] = useState(false);
  const [expiresInDays, setExpires] = useState('unlimited');
  const [maxUses, setMaxUses] = useState(1);
  const linkRef = useRef(null);
  const codeRef = useRef(null);

  const createLink = async () => {
    try {
      setCreating(true);
      setLocalError('');
      const { data } = await api.post('/invites', { groupId, expiresInDays, maxUses });
      setLink(data.inviteLink);
    } catch (err) {
      setLocalError(err.response?.data?.message || 'Error al crear la invitación');
    } finally { setCreating(false); }
  };

  const createCode = async () => {
    try {
      setCreating(true);
      setLocalError('');
      const { data } = await generateGroupCode(groupId);
      setCode(data.code);
    } catch (err) {
      setLocalError(err.response?.data?.message || 'Error al generar el código');
    } finally { setCreating(false); }
  };

  const copy = async (value, inputRef) => {
    try { await navigator.clipboard.writeText(value); }
    catch {
      inputRef.current?.select();
      if (!document.execCommand?.('copy')) return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const close = () => {
    setMode('choose');
    setUsername('');
    setLink('');
    setCode('');
    setCopied(false);
    setLocalError('');
    setExpires('unlimited');
    setMaxUses(1);
    onClose();
  };

  const goBack = () => {
    setMode('choose');
    setLink('');
    setCode('');
    setCopied(false);
    setLocalError('');
  };

  const visibleError = localError || error;

  return (
    <Modal open={open} onClose={close} title="Invitar al grupo" subtitle="Elegí cómo querés sumar a alguien." titleId="create-invite-title">
      {visibleError && <p role="alert" className="mb-4 rounded-2xl bg-danger-soft p-3.5 text-sm font-medium text-danger">{visibleError}</p>}
      {mode === 'choose' ? (
        <div className="space-y-3">
          <button type="button" onClick={() => setMode('username')} className="btn btn-quiet w-full justify-start"><UserPlus size={18} aria-hidden="true" /> Invitar por nombre</button>
          <button type="button" onClick={() => setMode('link')} className="btn btn-quiet w-full justify-start"><Link2 size={18} aria-hidden="true" /> Generar enlace</button>
          <button type="button" onClick={() => setMode('code')} className="btn btn-quiet w-full justify-start"><Users size={18} aria-hidden="true" /> Generar código de 6 números</button>
        </div>
      ) : (
        <div className="space-y-5">
          {mode === 'username' && (
            <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); onInvite({ username }); }}>
              <Field data-autofocus label="Nombre de usuario" placeholder="ej. valentina" autoCapitalize="none" autoCorrect="off" spellCheck={false} value={username} onChange={(e) => setUsername(e.target.value)} />
              <button disabled={loading || !username.trim()} className="btn btn-primary w-full">{loading ? 'Invitando…' : 'Invitar'}</button>
            </form>
          )}

          {mode === 'link' && !link && (
            <>
              <fieldset><legend className="field-label">Dura</legend><div className="flex flex-wrap gap-2">{EXPIRY.map(([label, value]) => <Option key={value} active={expiresInDays === value} onClick={() => setExpires(value)}>{label}</Option>)}</div></fieldset>
              <fieldset><legend className="field-label">Personas que pueden usarlo</legend><div className="flex flex-wrap gap-2">{USES.map((number) => <Option key={number} active={maxUses === number} onClick={() => setMaxUses(number)}>{number}</Option>)}</div></fieldset>
              <button type="button" onClick={createLink} disabled={creating} className="btn btn-primary w-full">{creating ? 'Generando…' : 'Generar enlace'}</button>
            </>
          )}

          {mode === 'link' && link && (
            <>
              <div className="flex items-center gap-2">
                <input ref={linkRef} aria-label="Enlace de invitación" readOnly value={link} onFocus={(e) => e.target.select()} className="field min-w-0 flex-1 text-sm" />
                <button type="button" onClick={() => copy(link, linkRef)} aria-label="Copiar enlace" className="btn btn-primary w-12 px-0">{copied ? <Check size={20} /> : <Copy size={20} />}</button>
                {typeof navigator !== 'undefined' && navigator.share && <button type="button" onClick={() => navigator.share({ title: 'Invitación a TCalendar', url: link }).catch(() => {})} aria-label="Compartir enlace" className="btn btn-quiet w-12 px-0"><Link2 size={20} /></button>}
              </div>
              <p className="text-sm text-muted">{expiresInDays === 'unlimited' ? 'Sin vencimiento' : `Vence en ${expiresInDays} día${expiresInDays === '1' ? '' : 's'}`} · {maxUses} {maxUses === 1 ? 'uso' : 'usos'}</p>
            </>
          )}

          {mode === 'code' && !code && (
            <>
              <p className="text-sm text-muted">Compartí este código para que la otra persona se una desde la página principal.</p>
              <button type="button" onClick={createCode} disabled={creating} className="btn btn-primary w-full">{creating ? 'Generando…' : 'Generar código'}</button>
            </>
          )}

          {mode === 'code' && code && (
            <div className="flex items-center gap-2">
              <input ref={codeRef} aria-label="Código de grupo" readOnly value={code} onFocus={(e) => e.target.select()} className="field min-w-0 flex-1 text-center font-mono text-2xl font-bold tracking-[0.3em]" />
              <button type="button" onClick={() => copy(code, codeRef)} aria-label="Copiar código" className="btn btn-primary w-12 px-0">{copied ? <Check size={20} /> : <Copy size={20} />}</button>
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={goBack} className="btn btn-quiet flex-1">Volver</button>
            {(link || code) && <button type="button" onClick={close} className="btn btn-primary flex-1">Listo</button>}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default CreateInviteModal;
