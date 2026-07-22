import { useMemo, useState } from 'react';
import { Plus, ListChecks, BookOpen, BookMarked } from 'lucide-react';
import toast from 'react-hot-toast';
import { useProjectContext } from '../context/ProjectContext';
import { Avatar, EmptyState } from '../components/common/Common';
import TaskModal from '../components/tasks/TaskModal';
import { PRIORITY_META, STATUS_META } from '../utils/taskMeta';
import { deadlineLabel, isOverdue } from '../utils/format';
import { taskService } from '../services/projectService';

export default function Tasks() {
  const { tasks, members, refreshTasks } = useProjectContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [filters, setFilters] = useState({ status: 'ALL', ownerId: 'ALL' });
  const [togglingId, setTogglingId] = useState(null);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (filters.status !== 'ALL' && t.status !== filters.status) return false;
      if (filters.ownerId !== 'ALL') {
        if (filters.ownerId === 'UNASSIGNED' && t.owner) return false;
        if (filters.ownerId !== 'UNASSIGNED' && t.owner?.id !== filters.ownerId) return false;
      }
      return true;
    });
  }, [tasks, filters]);

  function openEdit(task) {
    setActiveTask(task);
    setModalOpen(true);
  }

  async function handleToggleRead(e, task) {
    e.stopPropagation();
    setTogglingId(task.id);
    try {
      await taskService.toggleRead(task.id);
      await refreshTasks();
      toast.success(task.isRead ? 'Marked as unread' : 'Marked as read');
    } catch (err) {
      toast.error(err.message || 'Could not update task');
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <select className="input !w-auto" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="ALL">All statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
          <select className="input !w-auto" value={filters.ownerId} onChange={(e) => setFilters({ ...filters, ownerId: e.target.value })}>
            <option value="ALL">All owners</option>
            <option value="UNASSIGNED">Unassigned</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <button className="btn-primary" onClick={() => { setActiveTask(null); setModalOpen(true); }}>
          <Plus size={16} /> New task
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="card"><EmptyState icon={ListChecks} title="No tasks match these filters" /></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-ink2-muted uppercase tracking-wide">
                <th className="px-4 py-3 font-medium">Task</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Deadline</th>
                <th className="px-4 py-3 font-medium text-center">Read</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr
                  key={t.id}
                  className={`border-b border-border-soft last:border-0 hover:bg-surface-raised cursor-pointer transition-colors ${!t.isRead ? 'bg-signal/5' : ''}`}
                  onClick={() => openEdit(t)}
                >
                  <td className="px-4 py-3 font-medium text-ink2-primary">
                    <div className="flex items-center gap-2">
                      {!t.isRead && <span className="w-2 h-2 rounded-full bg-signal shrink-0" title="Unread" />}
                      {t.title}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {t.owner ? (
                      <div className="flex items-center gap-2"><Avatar name={t.owner.name} size={22} /> {t.owner.name}</div>
                    ) : (
                      <span className="text-ink2-faint">Unassigned</span>
                    )}
                  </td>
                  <td className={`px-4 py-3 ${STATUS_META[t.status]?.className}`}>{STATUS_META[t.status]?.label}</td>
                  <td className="px-4 py-3"><span className={`badge ${PRIORITY_META[t.priority]?.className}`}>{PRIORITY_META[t.priority]?.label}</span></td>
                  <td className={`px-4 py-3 ${isOverdue(t.deadline, t.status) ? 'text-alert font-medium' : 'text-ink2-muted'}`}>
                    {t.deadline ? deadlineLabel(t.deadline) : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      disabled={togglingId === t.id}
                      onClick={(e) => handleToggleRead(e, t)}
                      title={t.isRead ? 'Mark as unread' : 'Mark as read'}
                      className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${t.isRead ? 'text-signal hover:text-ink2-muted hover:bg-surface-raised' : 'text-ink2-muted hover:text-signal hover:bg-signal/10'}`}
                    >
                      {t.isRead ? <BookMarked size={15} /> : <BookOpen size={15} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TaskModal open={modalOpen} onClose={() => setModalOpen(false)} task={activeTask} />
    </div>
  );
}
