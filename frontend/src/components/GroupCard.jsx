import { Link } from 'react-router-dom';
import { Crown } from 'lucide-react';
import { AvatarStack } from './Avatar';
import { hashIndex } from '../lib/ui';
import { groupIcon } from '../lib/groupIcons';

const COVERS = [['g1', 'g2'], ['g2', 'g3'], ['g3', 'g1']]; // tokens de degradado del tema activo

const GroupCard = ({ group, myId }) => {
  const [a, b] = COVERS[hashIndex(group._id, COVERS.length)];
  const { Icon } = groupIcon(group.icon);
  const creatorId = String(group.creator?._id ?? group.creator ?? '');
  const mine = creatorId === myId;
  const n = group.members?.length || 0;
  return (
    <Link to={`/group/${group._id}`} className="card card-lift block overflow-hidden">
      <div className="flex h-28 items-center justify-between p-4" style={{ background: `linear-gradient(135deg, rgb(var(--${a})), rgb(var(--${b})))` }}>
        <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface/85 text-accent-text">
          <Icon size={26} strokeWidth={1.8} />
        </span>
        <span className={`chip ${mine ? 'chip-strong' : ''}`}>{mine && <Crown size={13} aria-hidden="true" />}{mine ? 'Creador' : 'Miembro'}</span>
      </div>
      <div className="p-5">
        <h3 className="truncate text-xl font-bold">{group.name}</h3>
        <p className="mt-1 line-clamp-2 min-h-[3rem] text-muted">{group.description || 'Sin descripción'}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <AvatarStack members={group.members || []} creatorId={creatorId} />
          <span className="text-sm text-muted">{n} {n === 1 ? 'miembro' : 'miembros'}</span>
        </div>
      </div>
    </Link>
  );
};

export default GroupCard;
