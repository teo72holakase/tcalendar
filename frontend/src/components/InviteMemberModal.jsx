import { useEffect, useState } from 'react';
import Modal from './Modal';
import Field from './Field';

const InviteMemberModal = ({ open, onClose, onInvite, loading, error }) => {
  const [username, setUsername] = useState('');
  useEffect(() => { if (!open) setUsername(''); }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Invitar por usuario" subtitle="Escribí el usuario de quien ya tiene cuenta." titleId="invite-member-title">
      <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); onInvite({ username }); }}>
        <Field data-autofocus label="Nombre de usuario" placeholder="ej. valentina" autoCapitalize="none" autoCorrect="off" spellCheck={false} value={username} onChange={(e) => setUsername(e.target.value)} error={error} />
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="btn btn-quiet">Cancelar</button>
          <button disabled={loading || !username.trim()} className="btn btn-primary">{loading ? 'Invitando…' : 'Invitar'}</button>
        </div>
      </form>
    </Modal>
  );
};

export default InviteMemberModal;
