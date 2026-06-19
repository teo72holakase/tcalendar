import { PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GroupList = ({ groups, onOpenModal, loading }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-600 dark:bg-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Tus grupos</p>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Administra tus calendarios</h2>
        </div>
        <button
          onClick={onOpenModal}
          className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 text-white hover:bg-brand-700"
        >
          <PlusCircle size={18} /> Nuevo grupo
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading && <div className="rounded-3xl bg-white p-8 text-slate-500 shadow-sm dark:bg-slate-800 dark:text-slate-400">Cargando grupos...</div>}
        {!loading && groups.length === 0 && (
          <div className="rounded-3xl bg-white p-8 text-slate-500 shadow-sm dark:bg-slate-800 dark:text-slate-400">Aún no tienes grupos. Crea uno para empezar.</div>
        )}
        {groups.map((group) => (
          <button
            key={group._id}
            onClick={() => navigate(`/group/${group._id}`)}
            className="w-full rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-600 dark:bg-slate-800"
          >
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Grupo</p>
            <h3 className="mt-3 text-xl font-semibold text-slate-900 dark:text-white">{group.name}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{group.description || 'Sin descripción'}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default GroupList;
