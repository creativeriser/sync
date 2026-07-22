import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, ListChecks, CalendarClock, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { HEALTH_META } from '../../utils/taskMeta';
import { deadlineLabel } from '../../utils/format';
import { projectService } from '../../services/projectService';
import { useConfirm } from '../common/Common';

export default function ProjectCard({ project, onDeleted }) {
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const { confirm, dialog } = useConfirm();

  function handleDelete(e) {
    e.preventDefault();
    e.stopPropagation();
    confirm({
      title: 'Delete this project?',
      description: 'This permanently deletes all tasks, conversations, and insights. This cannot be undone.',
      confirmLabel: 'Delete project',
      danger: true,
      onConfirm: async () => {
        setDeleting(true);
        try {
          await projectService.remove(project.id);
          toast.success('Project deleted');
          onDeleted?.(project.id);
        } catch (err) {
          toast.error(err.message || 'Could not delete project');
        } finally {
          setDeleting(false);
        }
      },
    });
  }

  return (
    <>
      <div className="card p-5 flex flex-col hover:border-signal/40 transition-colors group relative">
        <Link to={`/projects/${project.id}`} className="absolute inset-0 rounded-xl z-0" aria-label={`Open ${project.name}`} />

        <div className="flex items-start justify-between mb-3 relative z-10">
          <h3 className="font-display font-semibold text-[15px] leading-snug pr-2 group-hover:text-signal transition-colors">
            {project.name}
          </h3>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`badge ${HEALTH_META[project.health]?.className}`}>{HEALTH_META[project.health]?.label}</span>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              title="Delete project"
              className="p-1.5 rounded-lg text-ink2-faint hover:text-alert hover:bg-alert-dim transition-colors disabled:opacity-50"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {project.description && <p className="text-sm text-ink2-muted line-clamp-2 mb-4 relative z-10">{project.description}</p>}

        <div className="mt-auto relative z-10">
          <div className="flex items-center justify-between text-xs text-ink2-muted mb-1.5">
            <span>Progress</span>
            <span>{project.completedTasks}/{project.totalTasks} tasks</span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-raised overflow-hidden mb-4">
            <div className="h-full bg-signal rounded-full transition-all" style={{ width: `${project.progress}%` }} />
          </div>

          <div className="flex items-center gap-4 text-xs text-ink2-muted">
            <span className="flex items-center gap-1"><Users size={13} /> {project.teamSize}</span>
            <span className="flex items-center gap-1"><ListChecks size={13} /> {project.totalTasks}</span>
            {project.upcomingDeadline && (
              <span className="flex items-center gap-1"><CalendarClock size={13} /> {deadlineLabel(project.upcomingDeadline)}</span>
            )}
          </div>
        </div>
      </div>
      {dialog}
    </>
  );
}
