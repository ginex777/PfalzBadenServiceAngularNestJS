import { Readable } from 'stream';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { NachweiseService } from './nachweise.service';
import { PrismaService } from '../../core/database/prisma.service';
import { AccessPolicyService } from '../access-policy/access-policy.service';

const mockPrisma = {
  $transaction: jest.fn(),
  objekte: { findUnique: jest.fn() },
  nachweise: {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
};

const mockAccessPolicy = {
  accessibleObjectIds: jest.fn(),
  assertCanAccessObject: jest.fn(),
  requireEmployeeMapping: jest.fn(),
};

function createUploadFile(
  buffer: Buffer,
  mimetype = 'image/png',
): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname: 'upload.png',
    encoding: '7bit',
    mimetype,
    size: buffer.length,
    stream: Readable.from(buffer),
    destination: '',
    filename: '',
    path: '',
    buffer,
  };
}

describe('NachweiseService', () => {
  let service: NachweiseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NachweiseService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AccessPolicyService, useValue: mockAccessPolicy },
      ],
    }).compile();

    service = module.get<NachweiseService>(NachweiseService);
    jest.resetAllMocks();
  });

  it('rejects files with image MIME but unsupported bytes', async () => {
    await expect(
      service.upload({
        file: createUploadFile(Buffer.from('not-an-image')),
        dto: { objectId: 1 },
        createdBy: { email: 'admin@example.test', fullName: 'Admin' },
        employeeId: null,
        auth: { role: 'admin', employeeId: null },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(mockPrisma.objekte.findUnique).not.toHaveBeenCalled();
    expect(mockAccessPolicy.assertCanAccessObject).not.toHaveBeenCalled();
  });

  it('rejects non-image MIME before signature validation', async () => {
    await expect(
      service.upload({
        file: createUploadFile(Buffer.from('%PDF'), 'application/pdf'),
        dto: { objectId: 1 },
        createdBy: { email: 'admin@example.test', fullName: 'Admin' },
        employeeId: null,
        auth: { role: 'admin', employeeId: null },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('scopes evidence list for employees to accessible objects or own uploads', async () => {
    mockAccessPolicy.accessibleObjectIds.mockResolvedValue([7n, 9n]);
    mockPrisma.nachweise.findMany.mockResolvedValue([
      {
        id: 1n,
        objekt_id: 7n,
        mitarbeiter_id: 11n,
        filename: 'proof.png',
        mimetype: 'image/png',
        filesize: 123,
        sha256: 'hash',
        notiz: null,
        erstellt_am: new Date('2026-05-01T00:00:00.000Z'),
        erstellt_von: 'field@example.test',
        erstellt_von_name: 'Field User',
      },
    ]);
    mockPrisma.nachweise.count.mockResolvedValue(1);
    mockPrisma.$transaction.mockImplementation(
      async (operations: Array<Promise<unknown>>) => Promise.all(operations),
    );

    const result = await service.list(
      { page: 1, pageSize: 20 },
      { role: 'mitarbeiter', employeeId: 11 },
    );

    expect(mockPrisma.nachweise.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [{ objekt_id: { in: [7n, 9n] } }, { mitarbeiter_id: 11n }],
        },
      }),
    );
    expect(result.total).toBe(1);
    expect(result.data[0]?.id).toBe(1);
  });

  it('does not re-check object access when an employee loads their own evidence', async () => {
    mockPrisma.nachweise.findUnique.mockResolvedValue({
      id: 4n,
      objekt_id: 99n,
      mitarbeiter_id: 11n,
      filename: 'own.png',
      mimetype: 'image/png',
      filesize: 123,
      sha256: 'hash',
      notiz: null,
      erstellt_am: new Date('2026-05-01T00:00:00.000Z'),
      erstellt_von: 'field@example.test',
      erstellt_von_name: 'Field User',
    });

    const result = await service.get(4, {
      role: 'mitarbeiter',
      employeeId: 11,
    });

    expect(mockAccessPolicy.assertCanAccessObject).not.toHaveBeenCalled();
    expect(result.mitarbeiter_id).toBe(11);
  });

  it('checks object access before evidence download for other employee evidence', async () => {
    mockPrisma.nachweise.findUnique.mockResolvedValue({
      objekt_id: 99n,
      mitarbeiter_id: 22n,
      filename: 'other.png',
      mimetype: 'image/png',
      data: Buffer.from('png'),
    });
    mockAccessPolicy.assertCanAccessObject.mockRejectedValue(
      new Error('blocked'),
    );

    await expect(
      service.download(4, { role: 'mitarbeiter', employeeId: 11 }),
    ).rejects.toThrow('blocked');

    expect(mockAccessPolicy.assertCanAccessObject).toHaveBeenCalledWith(
      { role: 'mitarbeiter', employeeId: 11 },
      99,
    );
  });
});
