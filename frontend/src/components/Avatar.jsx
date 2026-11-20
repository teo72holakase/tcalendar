import { Crown } from 'lucide-react';
import { avatarColor, initials } from '../lib/ui';
import { avatarSrc } from '../lib/profile';

// Retrato elegido por la persona; si no eligió uno, cae a la inicial con su color.
// El creador del grupo lleva una corona.
export const Avatar = ({ name, avatar, size = 36, creator = false, className = '' }) => {
  const src = avatarSrc(avatar);
  return (
    <span
      role="img"
      aria-label={`${name}${creator ? ' (creador del grupo)' : ''}`}
      className={`relative inline-flex shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {src ? (
        <img src={src} alt="" loading="lazy" decoding="async" className="h-full w-full rounded-full object-cover" />
      ) : (
        <span
          aria-hidden="true"
          className="flex h-full w-full items-center justify-center rounded-full font-display font-bold"
          style={{ background: avatarColor(name), color: '#1a1a1a', fontSize: size * 0.38 }}
        >
          {initials(name)}
        </span>
      )}
      {creator && (
        <span
          aria-hidden="true"
          className="absolute -right-1 -top-1.5 flex items-center justify-center rounded-full bg-accent text-accent-ink ring-2 ring-surface"
          style={{ width: size * 0.46, height: size * 0.46 }}
        >
          <Crown size={size * 0.27} strokeWidth={2.4} />
        </span>
      )}
    </span>
  );
};

export const AvatarStack = ({ members = [], creatorId, max = 4, size = 34 }) => {
  const shown = members.slice(0, max);
  const extra = members.length - shown.length;
  return (
    <span className="inline-flex items-center">
      {shown.map((m, i) => (
        <span key={m._id} className="rounded-full ring-2 ring-surface" style={{ marginLeft: i ? -size * 0.28 : 0 }}>
          <Avatar name={m.username} avatar={m.avatar} size={size} creator={String(m._id) === String(creatorId)} />
        </span>
      ))}
      {extra > 0 && (
        <span
          className="flex items-center justify-center rounded-full bg-surface-2 text-xs font-bold text-muted ring-2 ring-surface"
          style={{ width: size, height: size, marginLeft: -size * 0.28 }}
        >
          +{extra}
        </span>
      )}
    </span>
  );
};
