import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../core/database/prisma.service';
import { PdfRenderService } from '../pdf-render.service';
import { PdfTokenService } from '../pdf-token.service';
import { ChecklistePdfGenerator } from './checkliste-pdf.generator';

const mockPrisma = {
  checklistenSubmissions: {
    findUnique: jest.fn(),
  },
  pdfArchive: {
    create: jest.fn(),
  },
};

const mockRender = {
  logoBase64: '',
  loadFirma: jest.fn(),
  renderTemplate: jest.fn(),
  createPdfWithHeaderFooter: jest.fn(),
};

const mockToken = {
  createToken: jest.fn(),
};

function submissionRow(employeeId: bigint | null) {
  return {
    id: 41n,
    submitted_at: new Date('2026-05-01T10:00:00.000Z'),
    note: null,
    created_by_email: 'field@example.test',
    created_by_name: 'Field User',
    template_snapshot: {
      name: 'Daily Check',
      version: 1,
      fields: [{ fieldId: 'clean', label: 'Clean', type: 'boolean' }],
    },
    answers: [{ fieldId: 'clean', value: true }],
    objekt: {
      id: 7n,
      name: 'Object A',
      strasse: 'Main Street 1',
      ort: 'Berlin',
    },
    mitarbeiter: employeeId ? { id: employeeId, name: 'Worker' } : null,
    mitarbeiter_id: employeeId,
  };
}

describe('ChecklistePdfGenerator authorization', () => {
  let generator: ChecklistePdfGenerator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChecklistePdfGenerator,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PdfRenderService, useValue: mockRender },
        { provide: PdfTokenService, useValue: mockToken },
      ],
    }).compile();

    generator = module.get<ChecklistePdfGenerator>(ChecklistePdfGenerator);
    jest.resetAllMocks();
    mockRender.loadFirma.mockResolvedValue({});
    mockRender.renderTemplate.mockReturnValue('<html></html>');
    mockRender.createPdfWithHeaderFooter.mockResolvedValue(Buffer.from('pdf'));
    mockToken.createToken.mockReturnValue({ token: 'token', url: '/view' });
  });

  it('hides another employee checklist submission from employee PDF generation', async () => {
    mockPrisma.checklistenSubmissions.findUnique.mockResolvedValue(
      submissionRow(22n),
    );

    await expect(
      generator.createSubmissionPdf(41, {
        role: 'mitarbeiter',
        employeeId: 11,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(mockRender.loadFirma).not.toHaveBeenCalled();
    expect(mockPrisma.pdfArchive.create).not.toHaveBeenCalled();
  });

  it('requires employee mapping for employee checklist PDF generation', async () => {
    mockPrisma.checklistenSubmissions.findUnique.mockResolvedValue(
      submissionRow(11n),
    );

    await expect(
      generator.createSubmissionPdf(41, {
        role: 'mitarbeiter',
        employeeId: null,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('allows an employee to generate their own checklist submission PDF', async () => {
    mockPrisma.checklistenSubmissions.findUnique.mockResolvedValue(
      submissionRow(11n),
    );

    const result = await generator.createSubmissionPdf(41, {
      role: 'mitarbeiter',
      employeeId: 11,
    });

    expect(mockPrisma.pdfArchive.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          typ: 'checkliste',
          referenz_id: 41n,
        }),
      }),
    );
    expect(result).toEqual({ token: 'token', url: '/view' });
  });
});
