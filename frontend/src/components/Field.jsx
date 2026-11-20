import { useId } from 'react';

// Etiqueta siempre visible + ayuda + error bajo el propio campo.
const Field = ({ label, hint, error, multiline = false, className = '', inputClassName = '', ...props }) => {
  const id = useId();
  const Tag = multiline ? 'textarea' : 'input';
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">{label}</label>
      <Tag id={id} className={`field ${inputClassName}`} aria-invalid={Boolean(error)} aria-describedby={hint || error ? `${id}-d` : undefined} {...props} />
      {(error || hint) && (
        <p id={`${id}-d`} className={error ? 'mt-1.5 text-sm font-medium text-danger' : 'field-hint'}>{error || hint}</p>
      )}
    </div>
  );
};

export default Field;
