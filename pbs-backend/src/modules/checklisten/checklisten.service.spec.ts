import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import {
  ChecklistenService,
  validateAndNormalizeAnswers,
} from './checklisten.service';
import { PrismaService } from '../../core/database/prisma.service';
import { TasksService } from '../tasks/tasks.service';
import { AccessPolicyService } from '../access-policy/access-policy.service';

const mockPrisma = {
  $transaction: jest.fn(),
  objekte: { findUnique: jest.fn() },
  checklistenTemplates: { findUnique: jest.fn() },
  checklistenTemplateObjekte: {
    count: jest.fn(),
    findUnique: jest.fn(),
  },
  checklistenSubmissions: {
    count: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  benachrichtigungen: { create: jest.fn() },
};

const mockAccessPolicy = {
  assertCanAccessObject: jest.fn(),
  accessibleObjectIds: jest.fn(),
};

const mockTasksService = {
  upsertFromChecklistSubmission: jest.fn(),
};

describe('ChecklistenService helpers', () => {
  describe('validateAndNormalizeAnswers()', () => {
    it('normalizes answers and enforces required', () => {
      const result = validateAndNormalizeAnswers({
        fields: [
          {
            fieldId: 'cleared',
            label: 'Geräumt',
            type: 'boolean',
            required: true,
          },
          { fieldId: 'note', label: 'Notiz', type: 'text', required: false },
        ],
        answers: [{ fieldId: 'cleared', value: true }],
      });

      expect(result.normalized).toEqual([
        { fieldId: 'cleared', value: true },
        { fieldId: 'note', value: null },
      ]);
    });

    it('rejects unknown fields', () => {
      expect(() =>
        validateAndNormalizeAnswers({
          fields: [{ fieldId: 'a', label: 'A', type: 'text', required: false }],
          answers: [{ fieldId: 'b', value: 'x' }],
        }),
      ).toThrow();
    });
  });
});

describe('ChecklistenService authorization', () => {
  let service: ChecklistenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChecklistenService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: TasksService, useValue: mockTasksService },
        { provide: AccessPolicyService, useValue: mockAccessPolicy },
      ],
    }).compile();

    service = module.get<ChecklistenService>(ChecklistenService);
    jest.resetAllMocks();
  });

  it('checks object authorization before accepting a submission', async () => {
    mockPrisma.objekte.findUnique.mockResolvedValue({ id: 7n, name: 'Objekt' });
    mockPrisma.checklistenTemplates.findUnique.mockResolvedValue({
      id: 3n,
      name: 'Template',
      description: null,
      version: 1,
      fields: [],
      is_active: true,
    });
    mockAccessPolicy.assertCanAccessObject.mockRejectedValue(
      new Error('blocked'),
    );

    await expect(
      service.submissionCreate(
        { objectId: 7, templateId: 3, answers: [] },
        {
          role: 'mitarbeiter',
          employeeId: 11,
          user: { email: 'field@example.test', fullName: 'Field User' },
        },
      ),
    ).rejects.toThrow('blocked');

    expect(mockAccessPolicy.assertCanAccessObject).toHaveBeenCalledWith(
      { role: 'mitarbeiter', employeeId: 11 },
      7,
    );
    expect(mockPrisma.checklistenSubmissions.create).not.toHaveBeenCalled();
  });

  it('checks object authorization before listing submissions for an object filter', async () => {
    mockAccessPolicy.assertCanAccessObject.mockRejectedValue(
      new Error('blocked'),
    );

    await expect(
      service.submissionsList(
        { page: 1, pageSize: 20, objectId: 7 },
        { role: 'mitarbeiter', employeeId: 11 },
      ),
    ).rejects.toThrow('blocked');

    expect(mockAccessPolicy.assertCanAccessObject).toHaveBeenCalledWith(
      { role: 'mitarbeiter', employeeId: 11 },
      7,
    );
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('filters employee submission lists to currently accessible objects', async () => {
    mockAccessPolicy.accessibleObjectIds.mockResolvedValue([7n, 9n]);
    mockPrisma.$transaction.mockResolvedValue([[], 0]);

    await service.submissionsList(
      { page: 1, pageSize: 20 },
      { role: 'mitarbeiter', employeeId: 11 },
    );

    expect(mockPrisma.checklistenSubmissions.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          mitarbeiter_id: 11n,
          objekt_id: { in: [7n, 9n] },
        },
      }),
    );
  });

  it('checks object authorization before returning a submission detail', async () => {
    mockPrisma.checklistenSubmissions.findUnique.mockResolvedValue({
      id: 31n,
      submitted_at: new Date('2026-05-01T10:00:00.000Z'),
      created_by_email: 'field@example.test',
      created_by_name: 'Field User',
      note: null,
      template_snapshot: {},
      answers: [],
      objekt: { id: 7n, name: 'Objekt' },
      template: { id: 3n, name: 'Template', version: 1 },
      mitarbeiter: { id: 11n, name: 'Field User' },
      mitarbeiter_id: 11n,
    });
    mockAccessPolicy.assertCanAccessObject.mockRejectedValue(
      new Error('blocked'),
    );

    await expect(
      service.submissionGet(31, { role: 'mitarbeiter', employeeId: 11 }),
    ).rejects.toThrow('blocked');

    expect(mockAccessPolicy.assertCanAccessObject).toHaveBeenCalledWith(
      { role: 'mitarbeiter', employeeId: 11 },
      7,
    );
  });

  it('rejects submissions when the template is assigned to other objects only', async () => {
    mockPrisma.objekte.findUnique.mockResolvedValue({ id: 7n, name: 'Objekt' });
    mockPrisma.checklistenTemplates.findUnique.mockResolvedValue({
      id: 3n,
      name: 'Template',
      description: null,
      version: 1,
      fields: [],
      is_active: true,
    });
    mockAccessPolicy.assertCanAccessObject.mockResolvedValue(undefined);
    mockPrisma.checklistenTemplateObjekte.count.mockResolvedValue(1);
    mockPrisma.checklistenTemplateObjekte.findUnique.mockResolvedValue(null);

    await expect(
      service.submissionCreate(
        { objectId: 7, templateId: 3, answers: [] },
        {
          role: 'mitarbeiter',
          employeeId: 11,
          user: { email: 'field@example.test', fullName: 'Field User' },
        },
      ),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: 'TEMPLATE_NOT_ASSIGNED_TO_OBJECT',
      }),
    });

    expect(mockPrisma.checklistenSubmissions.create).not.toHaveBeenCalled();
  });
});
