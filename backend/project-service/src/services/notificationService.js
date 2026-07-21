const prisma = require('../config/db');
const { NotificationType } = require('../utils/enums');
const { sendNotificationEmail } = require('./emailService');
const env = require('../config/env');


async function notifyProject(projectId, { type, title, message, ctaPath }) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true },
  });
  if (!project || project.members.length === 0) return;

  const withAccount = project.members.filter((m) => m.userId);
  if (withAccount.length > 0) {
    await prisma.notification.createMany({
      data: withAccount.map((m) => ({ userId: m.userId, type, title, message, projectId })),
    });
  }

  const ctaUrl = ctaPath ? `${env.CLIENT_URL}${ctaPath}` : undefined;

  await Promise.allSettled(
    project.members
      .filter((m) => m.email)
      .map((m) =>
        sendNotificationEmail({
          to: m.email,
          subject: `${title} — ${project.name}`,
          title,
          message,
          ctaLabel: 'Open project',
          ctaUrl,
        })
      )
  );
}

async function notifyDeadlineRisks(projectId, overdueOrSoonTasks) {
  if (overdueOrSoonTasks.length === 0) return;
  await notifyProject(projectId, {
    type: NotificationType.DEADLINE,
    title: 'Upcoming or overdue deadlines',
    message: `${overdueOrSoonTasks.length} task(s) need attention: ${overdueOrSoonTasks
      .map((t) => t.title)
      .slice(0, 3)
      .join(', ')}`,
    ctaPath: `/projects/${projectId}/timeline`,
  });
}

async function notifyAIRisk(projectId, { title, message }) {
  await notifyProject(projectId, {
    type: NotificationType.AI_RISK,
    title,
    message,
    ctaPath: `/projects/${projectId}/insights`,
  });
}

async function notifyProjectEvent(projectId, { title, message }) {
  await notifyProject(projectId, {
    type: NotificationType.PROJECT_EVENT,
    title,
    message,
    ctaPath: `/projects/${projectId}/overview`,
  });
}

module.exports = { notifyProject, notifyDeadlineRisks, notifyAIRisk, notifyProjectEvent };
