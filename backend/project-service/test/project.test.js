const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/db');
const jwtUtils = require('../src/utils/jwt');

jest.mock('../src/config/db', () => {
  const txMock = {
    project: { create: jest.fn(), update: jest.fn() },
    projectMember: { create: jest.fn() },
    activityLog: { create: jest.fn() },
    task: { create: jest.fn() },
    aIInsight: { deleteMany: jest.fn(), createMany: jest.fn() },
  };
  return {
    $transaction: jest.fn(async (cb) => cb(txMock)),
    projectMember: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    aIInsight: {
      deleteMany: jest.fn().mockResolvedValue({}),
      createMany: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
    },
    project: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    task: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
    }
  };
});

jest.mock('../src/utils/jwt', () => ({
  verifyToken: jest.fn(),
}));

describe('Project API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jwtUtils.verifyToken.mockReturnValue({
      sub: 'user-123',
      name: 'Test User',
      email: 'test@example.com'
    });
  });

  describe('POST /projects', () => {
    it('should create a new project', async () => {
      prisma.$transaction.mockImplementationOnce(async (cb) => {
        const txMock = {
          project: { create: jest.fn().mockResolvedValue({ id: 'proj-1', name: 'New Project' }), update: jest.fn() },
          projectMember: { create: jest.fn().mockResolvedValue({}) },
          activityLog: { create: jest.fn().mockResolvedValue({}) },
          task: { create: jest.fn().mockResolvedValue({ id: 'task-1', title: 'New Task' }) },
        };
        return cb(txMock);
      });

      prisma.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        name: 'New Project',
        description: 'Test Description',
        ownerId: 'user-123',
        members: [],
        tasks: []
      });

      const res = await request(app)
        .post('/projects')
        .set('Authorization', 'Bearer fake-token')
        .send({
          name: 'New Project',
          description: 'Test Description'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.name).toBe('New Project'); // Assuming summarize() returns the top level object
    });
  });

  describe('POST /projects/:id/tasks', () => {
    it('should create a task in a project', async () => {
      // Mock requireProjectAccess logic
      prisma.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        ownerId: 'user-123',
        members: []
      });

      // The task creation is mocked in the global txMock or we can mock it here via prisma.$transaction
      prisma.$transaction.mockImplementationOnce(async (cb) => {
        const txMock = {
          task: { create: jest.fn().mockResolvedValue({ id: 'task-1', title: 'New Task', projectId: 'proj-1', status: 'TODO' }) },
          activityLog: { create: jest.fn().mockResolvedValue({}) },
          aIInsight: { deleteMany: jest.fn().mockResolvedValue({}), createMany: jest.fn().mockResolvedValue({}) },
        };
        return cb(txMock);
      });

      prisma.task.findUnique.mockResolvedValue({
        id: 'task-1',
        title: 'New Task',
        projectId: 'proj-1',
        status: 'TODO',
        dependsOn: [],
        dependedOnBy: []
      });

      const res = await request(app)
        .post('/projects/proj-1/tasks')
        .set('Authorization', 'Bearer fake-token')
        .send({
          title: 'New Task',
          status: 'TODO'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.title).toBe('New Task');
    });
  });
});
