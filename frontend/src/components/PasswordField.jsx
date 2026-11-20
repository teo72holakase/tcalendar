// Campo de contraseña (6–64 caracteres). Se usa en "Mi cuenta".
const PasswordField = ({ id, label, value, onChange, autoComplete }) => (
  <div>
    <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
    <input
      id={id}
      type="password"
      maxLength={64}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      autoComplete={autoComplete}
      required
      className="mt-1 w-full"
    />
  </div>
);

export default PasswordField;
