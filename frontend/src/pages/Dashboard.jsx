import { useState } from 'react';
import { Plus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import GroupCard from '../components/GroupCard';
import CreateGroupModal from '../components/CreateGroupModal';
import { useAuth } from '../contexts/AuthContext';
import { useGroup } from '../contexts/GroupContext';

const Dashboard = () => {
  const { user } = useAuth();
  const { groups, loading, error, createGroup, joinGroupByCode, message, setError } = useGroup();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const navigate = useNavigate();
  const myId = String(user?.id ?? user?._id ?? '');
  const enterWithCode = async (event) => {
    event.preventDefault();
    const groupId = await joinGroupByCode(code);
    if (groupId) {
      setCode('');
      navigate(`/group/${groupId}`);
    }
  };

  return (
    <div className="min-h-dvh">
      <Header />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-muted">Hola, {user?.username}</p>
            <h1 className="font-display text-4xl font-extrabold sm:text-5xl">Tus grupos</h1>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <form onSubmit={enterWithCode} className="flex items-end gap-2">
              <label className="min-w-0">
                <span className="field-label">Código de Grupo</span>
                <input
                  aria-label="Código de Grupo"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  placeholder="123456"
                  required
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="field w-32 text-center font-mono tracking-widest"
                />
              </label>
              <button type="submit" disabled={loading || code.length !== 6} className="btn btn-quiet">{loading ? 'Entrando…' : 'Entrar'}</button>
            </form>
            <button onClick={() => { setError(''); setOpen(true); }} className="btn btn-primary"><Plus size={20} aria-hidden="true" /> Nuevo grupo</button>
          </div>
        </div>

        {(message || error) && (
          <div role={error ? 'alert' : 'status'} className={`mb-6 rounded-2xl p-4 text-sm font-medium ${error ? 'bg-danger-soft text-danger' : 'bg-accent-soft text-accent-text'}`}>{error || message}</div>
        )}

        {groups.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 p-12 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft text-accent-text"><Users size={30} aria-hidden="true" /></span>
            <h2 className="text-2xl font-bold">Todavía no tenés grupos</h2>
            <p className="max-w-sm text-muted">Creá uno para empezar a compartir fechas, o pedile a alguien que te mande su enlace de invitación.</p>
            <button onClick={() => setOpen(true)} className="btn btn-primary mt-2">Crear mi primer grupo</button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((g) => <GroupCard key={g._id} group={g} myId={myId} />)}
          </div>
        )}
      </main>
      <CreateGroupModal open={open} onClose={() => setOpen(false)} onCreate={async (d) => { if (await createGroup(d)) setOpen(false); }} loading={loading} error={open ? error : ''} />
    </div>
  );
};

export default Dashboard;
