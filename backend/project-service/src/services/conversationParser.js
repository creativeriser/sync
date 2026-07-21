const prisma = require('../config/db');

function matchOwner(ownerName, members) {
  if (!ownerName) return null;
  const needle = ownerName.trim().toLowerCase();
  if (!needle) return null;

  const exact = members.find((m) => m.name.trim().toLowerCase() === needle);
  if (exact) return exact.id;

  const partial = members.find(
    (m) => m.name.toLowerCase().includes(needle) || needle.includes(m.name.toLowerCase())
  );
  return partial ? partial.id : null;
}


async function generateProjectFromAnalysis({ projectId, analysis }) {
  const members = await prisma.projectMember.findMany({ where: { projectId } });

  return prisma.$transaction(async (tx) => {

    const titleToId = new Map();
    const createdTasks = [];

    for (const t of analysis.tasks) {
      const ownerId = matchOwner(t.owner, members);
      const created = await tx.task.create({
        data: {
          projectId,
          title: t.title,
          description: t.description || null,
          ownerId,
          priority: t.priority,
          status: 'TODO',
          deadline: t.deadline ? new Date(t.deadline) : null,
          confidence: t.confidence,
          source: 'AI',
        },
      });
      titleToId.set(t.title.trim().toLowerCase(), created.id);
      createdTasks.push(created);
    }

    for (const t of analysis.tasks) {
      const taskId = titleToId.get(t.title.trim().toLowerCase());
      for (const depTitle of t.dependencies || []) {
        const dependsOnTaskId = titleToId.get(depTitle.trim().toLowerCase());
        if (dependsOnTaskId && dependsOnTaskId !== taskId) {
          await tx.taskDependency.upsert({
            where: { taskId_dependsOnTaskId: { taskId, dependsOnTaskId } },
            update: {},
            create: { taskId, dependsOnTaskId },
          });
        }
      }
    }

    for (const d of analysis.decisions) {
      await tx.decision.create({
        data: { projectId, summary: d.summary, context: d.context || null },
      });
    }

    await tx.activityLog.create({
      data: {
        projectId,
        action: 'AI_ANALYSIS_CONFIRMED',
        metadata: JSON.stringify({ taskCount: createdTasks.length, decisionCount: analysis.decisions.length }),
      },
    });

    return { tasks: createdTasks, decisionsCreated: analysis.decisions.length };
  });
}

module.exports = { generateProjectFromAnalysis, matchOwner };
