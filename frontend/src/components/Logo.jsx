// Marca en SVG dentro del código (no depende de archivos .png) y con los colores del tema elegido.
const Logo = ({ size = 36, className = '' }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} className={className} role="img" aria-label="TCalendar">
    <rect width="40" height="40" rx="11" style={{ fill: 'rgb(var(--accent))' }} />
    <path d="M0 12V11A11 11 0 0 1 11 0H29A11 11 0 0 1 40 11V12Z" fill="#000" opacity=".18" />
    <rect x="11" y="4" width="4" height="8" rx="2" style={{ fill: 'rgb(var(--accent-ink))' }} opacity=".92" />
    <rect x="25" y="4" width="4" height="8" rx="2" style={{ fill: 'rgb(var(--accent-ink))' }} opacity=".92" />
    <text x="20" y="33" textAnchor="middle" fontFamily="'Bricolage Grotesque Variable', system-ui, sans-serif" fontWeight="800" fontSize="21" style={{ fill: 'rgb(var(--accent-ink))' }}>t</text>
  </svg>
);

export default Logo;
