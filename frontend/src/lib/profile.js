// Los IDs son persistentes; el orden del selector corresponde a tortuga, zorro, palmera, gato, oso, pingüino, flor y cohete.
export const AVATARS = ['01', '02', '03', '04', '05', '06', '07', '08'];

export const AVATAR_LABELS = {
  '01': 'Tortuga',
  '02': 'Zorro',
  '03': 'Palmera',
  '04': 'Gato',
  '05': 'Oso',
  '06': 'Pingüino',
  '07': 'Flor',
  '08': 'Cohete',
};

export const avatarSrc = (id) => (AVATARS.includes(id) ? `/avatars/${id}.svg` : null);
