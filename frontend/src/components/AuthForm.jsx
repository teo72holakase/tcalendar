import { useState, useEffect } from 'react';

const AuthForm = ({ title, submitLabel, onSubmit, error, loading, fields }) => {
  const [form, setForm] = useState({ username: '', password: '' });

  useEffect(() => {
    setForm({ username: '', password: '' });
  }, [title]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/70">
      <h1 className="mb-4 text-3xl font-semibold text-slate-900">{title}</h1>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Usuario</span>
          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="ej. miguel123"
            className="mt-1 w-full"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Contraseña</span>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="********"
            className="mt-1 w-full"
          />
        </label>
        {error && <div className="rounded-xl bg-rose-100 p-3 text-sm text-rose-700">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-brand-600 px-4 py-3 text-white shadow hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading ? 'Cargando...' : submitLabel}
        </button>
      </form>
    </div>
  );
};

export default AuthForm;
