// Todos los colores salen de variables CSS (index.css): cada tema define las suyas, en claro y oscuro.
const c = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: c('bg'), surface: c('surface'), 'surface-2': c('surface-2'),
        ink: c('ink'), muted: c('muted'), line: c('line'),
        accent: c('accent'), 'accent-ink': c('accent-ink'), 'accent-soft': c('accent-soft'), 'accent-text': c('accent-text'),
        danger: c('danger'), 'danger-soft': c('danger-soft'),
      },
      fontFamily: {
        sans: ['"Figtree Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Bricolage Grotesque Variable"', '"Figtree Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
