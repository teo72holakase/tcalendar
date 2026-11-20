import { useEffect, useState } from 'react';
import Modal from './Modal';
import Field from './Field';

const DeleteGroupModal = ({ open, onClose, onConfirm, groupName, loading }) => {
  const [input, setInput] = useState('');
  useEffect(() => { if (!open) setInput(''); }, [open]);
  const match = input.trim().toLowerCase() === groupName.trim().toLowerCase();

  return (
    <Modal open={open} onClose={onClose} title="Borrar grupo" titleId="delete-group-title">
      <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); if (match) onConfirm(); }}>
        <p className="text-muted">Se borran el grupo y todos sus eventos, y no se puede deshacer. Para confirmar, escribí <strong className="text-ink">{groupName}</strong>.</p>
        <Field data-autofocus label="Nombre del grupo" autoCapitalize="none" autoCorrect="off" spellCheck={false} value={input} onChange={(e) => setInput(e.target.value)} error={input && !match ? 'El nombre no coincide.' : undefined} />
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="btn btn-quiet">Cancelar</button>
          <button disabled={!match || loading} className="btn btn-danger">{loading ? 'Borrando…' : 'Borrar grupo'}</button>
        </div>
      </form>
    </Modal>
  );
};

export default DeleteGroupModal;
