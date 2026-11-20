import { Crown, Link2, Trash2, UserMinus, UserPlus } from 'lucide-react';
import { Avatar } from './Avatar';

const MembersPanel = ({ members, creatorId, myId, isCreator, loading, onInvite, onLink, onRemove, onDelete }) => (
  <section id="miembros" aria-label="Miembros del grupo" className="card p-5">
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-xl font-bold">Miembros <span className="font-medium text-muted">{members.length}</span></h2>
      {isCreator && (
        <div className="flex gap-2">
          <button type="button" onClick={onLink} className="btn btn-quiet btn-sm"><Link2 size={16} aria-hidden="true" /> Enlace</button>
          <button type="button" onClick={onInvite} className="btn btn-primary btn-sm"><UserPlus size={16} aria-hidden="true" /> Invitar</button>
        </div>
      )}
    </div>
    <ul className="divide-y divide-line">
      {members.length === 0 && <li className="py-4 text-muted">{loading ? 'Cargando…' : 'Todavía no hay miembros.'}</li>}
      {members.map((m) => {
        const isOwner = String(m._id) === String(creatorId);
        const you = String(m._id) === myId;
        return (
          <li key={m._id} className="flex items-center gap-3 py-3">
            <Avatar name={m.username} avatar={m.avatar} size={40} creator={isOwner} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{m.username}</span>
              <span className="flex flex-wrap gap-1.5">
                {isOwner && <span className="chip chip-accent"><Crown size={12} aria-hidden="true" /> Creador</span>}
                {you && <span className="chip">Tú</span>}
              </span>
            </span>
            {isCreator && !you && (
              <button type="button" disabled={loading} onClick={() => onRemove(m)} aria-label={`Quitar a ${m.username}`} title="Quitar del grupo" className="flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-danger-soft hover:text-danger disabled:opacity-50">
                <UserMinus size={19} aria-hidden="true" />
              </button>
            )}
          </li>
        );
      })}
    </ul>
    {isCreator && (
      <button type="button" onClick={onDelete} className="btn btn-quiet btn-sm mt-3 w-full text-danger"><Trash2 size={16} aria-hidden="true" /> Borrar grupo</button>
    )}
  </section>
);

export default MembersPanel;
