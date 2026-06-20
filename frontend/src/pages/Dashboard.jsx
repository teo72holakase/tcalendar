import { useState } from 'react';
import { useGroup } from '../contexts/GroupContext';
import { useTheme } from '../contexts/ThemeContext';
import Header from '../components/Header';
import GroupList from '../components/GroupList';
import CreateGroupModal from '../components/CreateGroupModal';

const Dashboard = () => {
  const { groups, loading, createGroup, message, error, setError, setMessage, loadGroups } = useGroup();
  const { isAnimatedBg } = useTheme();
  const [isModalOpen, setModalOpen] = useState(false);

  const handleCreate = async (groupData) => {
    if (!groupData.name.trim()) {
      setError('El nombre del grupo es obligatorio');
      return;
    }
    const created = await createGroup(groupData);
    if (created) {
      setModalOpen(false);
      loadGroups();
    }
  };

  return (
    <div className={`min-h-screen ${isAnimatedBg ? '' : 'bg-slate-50 dark:bg-slate-900'}`}>
      <Header title="Dashboard" />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {message && <div className="mb-4 rounded-3xl bg-emerald-100 p-4 text-sm text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">{message}</div>}
        {error && <div className="mb-4 rounded-3xl bg-rose-100 p-4 text-sm text-rose-800 dark:bg-rose-900 dark:text-rose-200">{error}</div>}
        <GroupList groups={groups} onOpenModal={() => setModalOpen(true)} loading={loading} />
        <CreateGroupModal open={isModalOpen} onClose={() => setModalOpen(false)} onCreate={handleCreate} loading={loading} error={error} />
      </main>
    </div>
  );
};

export default Dashboard;