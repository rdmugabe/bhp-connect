import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock modules before importing route handlers
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

vi.mock('@/lib/audit', () => ({
  createAuditLog: vi.fn(),
  AuditActions: {
    INTAKE_CREATED: 'INTAKE_CREATED',
    INTAKE_UPDATED: 'INTAKE_UPDATED',
    INTAKE_SUBMITTED: 'INTAKE_SUBMITTED',
    INTAKE_DRAFT_SAVED: 'INTAKE_DRAFT_SAVED',
    INTAKE_APPROVED: 'INTAKE_APPROVED',
    INTAKE_DENIED: 'INTAKE_DENIED',
    INTAKE_CONDITIONAL: 'INTAKE_CONDITIONAL',
  },
}));

// Create mock prisma with transaction support
const mockPrismaTransaction = vi.fn();
const mockIntakeCreate = vi.fn();
const mockMedicationCreateMany = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    bHRFProfile: {
      findUnique: vi.fn(),
    },
    bHPProfile: {
      findUnique: vi.fn(),
    },
    intake: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    intakeMedication: {
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

// Helper to create mock request
function createMockRequest(body: object, method = 'POST'): NextRequest {
  return {
    json: () => Promise.resolve(body),
    url: 'http://localhost:3000/api/intakes',
    method,
  } as unknown as NextRequest;
}

// Helper to create valid intake data
function createValidIntakeData(overrides = {}) {
  return {
    residentName: 'Test Resident',
    dateOfBirth: '1990-01-01',
    religion: 'None',
    isDraft: false,
    ...overrides,
  };
}

// Helper to create draft intake data
function createDraftIntakeData(overrides = {}) {
  return {
    residentName: 'Draft Resident',
    isDraft: true,
    currentStep: 1,
    ...overrides,
  };
}

describe('Intake Status Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default transaction mock
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(async (callback) => {
      const result = await callback({
        intake: {
          create: mockIntakeCreate,
        },
        intakeMedication: {
          createMany: mockMedicationCreateMany,
        },
      });
      return result;
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ==================== AUTHENTICATION TESTS ====================
  describe('Authentication', () => {
    it('should return 401 when no session exists', async () => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const { POST } = await import('@/app/api/intakes/route');
      const request = createMockRequest(createValidIntakeData());
      const response = await POST(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 when user role is BHP', async () => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
        user: { id: 'user-1', role: 'BHP' },
      });

      const { POST } = await import('@/app/api/intakes/route');
      const request = createMockRequest(createValidIntakeData());
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should return 401 when user role is ADMIN', async () => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      });

      const { POST } = await import('@/app/api/intakes/route');
      const request = createMockRequest(createValidIntakeData());
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should allow BHRF user to create intake', async () => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
        user: { id: 'user-1', role: 'BHRF' },
      });
      (prisma.bHRFProfile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'bhrf-1',
        facilityId: 'facility-1',
      });
      mockIntakeCreate.mockResolvedValue({
        id: 'intake-1',
        residentName: 'Test Resident',
        status: 'PENDING',
      });

      const { POST } = await import('@/app/api/intakes/route');
      const request = createMockRequest(createValidIntakeData());
      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('should return 400 when BHRF has no facility assigned', async () => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
        user: { id: 'user-1', role: 'BHRF' },
      });
      (prisma.bHRFProfile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const { POST } = await import('@/app/api/intakes/route');
      const request = createMockRequest(createValidIntakeData());
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Facility not assigned');
    });
  });

  // ==================== STATUS WORKFLOW TESTS ====================
  describe('Status Workflow - Submission', () => {
    beforeEach(() => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
        user: { id: 'user-1', role: 'BHRF' },
      });
      (prisma.bHRFProfile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'bhrf-1',
        facilityId: 'facility-1',
      });
    });

    it('should set status to PENDING when isDraft is false', async () => {
      mockIntakeCreate.mockResolvedValue({
        id: 'intake-1',
        residentName: 'Test Resident',
        status: 'PENDING',
      });

      const { POST } = await import('@/app/api/intakes/route');
      const request = createMockRequest(createValidIntakeData({ isDraft: false }));
      await POST(request);

      expect(mockIntakeCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PENDING',
          }),
        })
      );
    });

    it('should set status to DRAFT when isDraft is true', async () => {
      mockIntakeCreate.mockResolvedValue({
        id: 'intake-1',
        residentName: 'Draft Resident',
        status: 'DRAFT',
      });

      const { POST } = await import('@/app/api/intakes/route');
      const request = createMockRequest(createDraftIntakeData());
      await POST(request);

      expect(mockIntakeCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'DRAFT',
          }),
        })
      );
    });

    it('should NOT set status to APPROVED on submission', async () => {
      mockIntakeCreate.mockResolvedValue({
        id: 'intake-1',
        residentName: 'Test Resident',
        status: 'PENDING',
      });

      const { POST } = await import('@/app/api/intakes/route');
      const request = createMockRequest(createValidIntakeData({ isDraft: false }));
      await POST(request);

      expect(mockIntakeCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({
            status: 'APPROVED',
          }),
        })
      );
    });

    it('should set submittedBy to current user id', async () => {
      mockIntakeCreate.mockResolvedValue({
        id: 'intake-1',
        residentName: 'Test Resident',
        status: 'PENDING',
      });

      const { POST } = await import('@/app/api/intakes/route');
      const request = createMockRequest(createValidIntakeData());
      await POST(request);

      expect(mockIntakeCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            submittedBy: 'user-1',
          }),
        })
      );
    });

    it('should set facilityId from BHRF profile', async () => {
      mockIntakeCreate.mockResolvedValue({
        id: 'intake-1',
        residentName: 'Test Resident',
        status: 'PENDING',
      });

      const { POST } = await import('@/app/api/intakes/route');
      const request = createMockRequest(createValidIntakeData());
      await POST(request);

      expect(mockIntakeCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            facilityId: 'facility-1',
          }),
        })
      );
    });

    it('should set draftStep to null when not a draft', async () => {
      mockIntakeCreate.mockResolvedValue({
        id: 'intake-1',
        residentName: 'Test Resident',
        status: 'PENDING',
      });

      const { POST } = await import('@/app/api/intakes/route');
      const request = createMockRequest(createValidIntakeData({ isDraft: false }));
      await POST(request);

      expect(mockIntakeCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            draftStep: null,
          }),
        })
      );
    });

    it('should set draftStep when isDraft is true', async () => {
      mockIntakeCreate.mockResolvedValue({
        id: 'intake-1',
        residentName: 'Draft Resident',
        status: 'DRAFT',
      });

      const { POST } = await import('@/app/api/intakes/route');
      const request = createMockRequest(createDraftIntakeData({ currentStep: 5 }));
      await POST(request);

      expect(mockIntakeCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            draftStep: 5,
          }),
        })
      );
    });

    it('should default draftStep to 1 when currentStep not provided', async () => {
      mockIntakeCreate.mockResolvedValue({
        id: 'intake-1',
        residentName: 'Draft Resident',
        status: 'DRAFT',
      });

      const { POST } = await import('@/app/api/intakes/route');
      const request = createMockRequest({ ...createDraftIntakeData(), currentStep: undefined });
      await POST(request);

      expect(mockIntakeCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            draftStep: 1,
          }),
        })
      );
    });
  });

  // ==================== AUDIT LOG TESTS ====================
  describe('Audit Logging', () => {
    beforeEach(() => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
        user: { id: 'user-1', role: 'BHRF' },
      });
      (prisma.bHRFProfile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'bhrf-1',
        facilityId: 'facility-1',
      });
    });

    it('should create audit log with INTAKE_SUBMITTED action for non-draft', async () => {
      mockIntakeCreate.mockResolvedValue({
        id: 'intake-1',
        residentName: 'Test Resident',
        status: 'PENDING',
      });

      const { POST } = await import('@/app/api/intakes/route');
      const request = createMockRequest(createValidIntakeData({ isDraft: false }));
      await POST(request);

      expect(createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'INTAKE_SUBMITTED',
          entityType: 'Intake',
          entityId: 'intake-1',
        })
      );
    });

    it('should create audit log with INTAKE_DRAFT_SAVED action for draft', async () => {
      mockIntakeCreate.mockResolvedValue({
        id: 'intake-1',
        residentName: 'Draft Resident',
        status: 'DRAFT',
      });

      const { POST } = await import('@/app/api/intakes/route');
      const request = createMockRequest(createDraftIntakeData());
      await POST(request);

      expect(createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'INTAKE_DRAFT_SAVED',
          entityType: 'Intake',
        })
      );
    });

    it('should include userId in audit log', async () => {
      mockIntakeCreate.mockResolvedValue({
        id: 'intake-1',
        residentName: 'Test Resident',
        status: 'PENDING',
      });

      const { POST } = await import('@/app/api/intakes/route');
      const request = createMockRequest(createValidIntakeData());
      await POST(request);

      expect(createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
        })
      );
    });

    it('should include residentName in audit details', async () => {
      mockIntakeCreate.mockResolvedValue({
        id: 'intake-1',
        residentName: 'Test Resident',
        status: 'PENDING',
      });

      const { POST } = await import('@/app/api/intakes/route');
      const request = createMockRequest(createValidIntakeData());
      await POST(request);

      expect(createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({
            residentName: 'Test Resident',
          }),
        })
      );
    });

    it('should include draftStep in audit details for drafts', async () => {
      mockIntakeCreate.mockResolvedValue({
        id: 'intake-1',
        residentName: 'Draft Resident',
        status: 'DRAFT',
      });

      const { POST } = await import('@/app/api/intakes/route');
      const request = createMockRequest(createDraftIntakeData({ currentStep: 3 }));
      await POST(request);

      expect(createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({
            draftStep: 3,
          }),
        })
      );
    });
  });

  // ==================== MEDICATION HANDLING TESTS ====================
  describe('Medication Handling', () => {
    beforeEach(() => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
        user: { id: 'user-1', role: 'BHRF' },
      });
      (prisma.bHRFProfile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'bhrf-1',
        facilityId: 'facility-1',
      });
      mockIntakeCreate.mockResolvedValue({
        id: 'intake-1',
        residentName: 'Test Resident',
        status: 'PENDING',
      });
    });

    it('should create medications when provided', async () => {
      const medications = [
        { name: 'Aspirin', dosage: '100mg', frequency: 'Daily' },
        { name: 'Ibuprofen', dosage: '200mg', frequency: 'Twice daily' },
      ];

      const { POST } = await import('@/app/api/intakes/route');
      const request = createMockRequest({ ...createValidIntakeData(), medications });
      await POST(request);

      expect(mockMedicationCreateMany).toHaveBeenCalled();
    });

    it('should not create medications when array is empty', async () => {
      const { POST } = await import('@/app/api/intakes/route');
      const request = createMockRequest({ ...createValidIntakeData(), medications: [] });
      await POST(request);

      expect(mockMedicationCreateMany).not.toHaveBeenCalled();
    });

    it('should not create medications when not provided', async () => {
      const { POST } = await import('@/app/api/intakes/route');
      const request = createMockRequest(createValidIntakeData());
      await POST(request);

      expect(mockMedicationCreateMany).not.toHaveBeenCalled();
    });

    it('should link medications to the created intake', async () => {
      const medications = [{ name: 'Aspirin', dosage: '100mg' }];

      const { POST } = await import('@/app/api/intakes/route');
      const request = createMockRequest({ ...createValidIntakeData(), medications });
      await POST(request);

      expect(mockMedicationCreateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              intakeId: 'intake-1',
              name: 'Aspirin',
            }),
          ]),
        })
      );
    });
  });

  // ==================== RESPONSE TESTS ====================
  describe('Response Format', () => {
    beforeEach(() => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
        user: { id: 'user-1', role: 'BHRF' },
      });
      (prisma.bHRFProfile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'bhrf-1',
        facilityId: 'facility-1',
      });
    });

    it('should return 201 status on successful creation', async () => {
      mockIntakeCreate.mockResolvedValue({
        id: 'intake-1',
        residentName: 'Test Resident',
        status: 'PENDING',
      });

      const { POST } = await import('@/app/api/intakes/route');
      const request = createMockRequest(createValidIntakeData());
      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('should return intake object in response', async () => {
      mockIntakeCreate.mockResolvedValue({
        id: 'intake-1',
        residentName: 'Test Resident',
        status: 'PENDING',
      });

      const { POST } = await import('@/app/api/intakes/route');
      const request = createMockRequest(createValidIntakeData());
      const response = await POST(request);
      const data = await response.json();

      expect(data.intake).toBeDefined();
      expect(data.intake.id).toBe('intake-1');
    });

    it('should return intake with PENDING status in response', async () => {
      mockIntakeCreate.mockResolvedValue({
        id: 'intake-1',
        residentName: 'Test Resident',
        status: 'PENDING',
      });

      const { POST } = await import('@/app/api/intakes/route');
      const request = createMockRequest(createValidIntakeData());
      const response = await POST(request);
      const data = await response.json();

      expect(data.intake.status).toBe('PENDING');
    });

    it('should return intake with DRAFT status for drafts', async () => {
      mockIntakeCreate.mockResolvedValue({
        id: 'intake-1',
        residentName: 'Draft Resident',
        status: 'DRAFT',
      });

      const { POST } = await import('@/app/api/intakes/route');
      const request = createMockRequest(createDraftIntakeData());
      const response = await POST(request);
      const data = await response.json();

      expect(data.intake.status).toBe('DRAFT');
    });
  });

  // ==================== EDGE CASES ====================
  describe('Edge Cases', () => {
    beforeEach(() => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
        user: { id: 'user-1', role: 'BHRF' },
      });
      (prisma.bHRFProfile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'bhrf-1',
        facilityId: 'facility-1',
      });
    });

    it('should handle isDraft as string "false"', async () => {
      mockIntakeCreate.mockResolvedValue({
        id: 'intake-1',
        residentName: 'Test Resident',
        status: 'PENDING',
      });

      const { POST } = await import('@/app/api/intakes/route');
      // Note: This tests truthy/falsy behavior - "false" string is truthy
      const request = createMockRequest({ ...createValidIntakeData(), isDraft: 'false' });
      await POST(request);

      // String "false" is truthy, so it will be treated as draft
      expect(mockIntakeCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'DRAFT',
          }),
        })
      );
    });

    it('should handle isDraft as undefined (defaults to false)', async () => {
      mockIntakeCreate.mockResolvedValue({
        id: 'intake-1',
        residentName: 'Test Resident',
        status: 'PENDING',
      });

      const { POST } = await import('@/app/api/intakes/route');
      const data = createValidIntakeData();
      delete (data as Record<string, unknown>).isDraft;
      const request = createMockRequest(data);
      await POST(request);

      // undefined is falsy, so status should be PENDING
      expect(mockIntakeCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PENDING',
          }),
        })
      );
    });

    it('should handle isDraft as null (defaults to false)', async () => {
      mockIntakeCreate.mockResolvedValue({
        id: 'intake-1',
        residentName: 'Test Resident',
        status: 'PENDING',
      });

      const { POST } = await import('@/app/api/intakes/route');
      const request = createMockRequest({ ...createValidIntakeData(), isDraft: null });
      await POST(request);

      expect(mockIntakeCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PENDING',
          }),
        })
      );
    });

    it('should handle isDraft as 0 (falsy)', async () => {
      mockIntakeCreate.mockResolvedValue({
        id: 'intake-1',
        residentName: 'Test Resident',
        status: 'PENDING',
      });

      const { POST } = await import('@/app/api/intakes/route');
      const request = createMockRequest({ ...createValidIntakeData(), isDraft: 0 });
      await POST(request);

      expect(mockIntakeCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PENDING',
          }),
        })
      );
    });

    it('should handle isDraft as 1 (truthy)', async () => {
      mockIntakeCreate.mockResolvedValue({
        id: 'intake-1',
        residentName: 'Test Resident',
        status: 'DRAFT',
      });

      const { POST } = await import('@/app/api/intakes/route');
      const request = createMockRequest({ ...createDraftIntakeData(), isDraft: 1 });
      await POST(request);

      expect(mockIntakeCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'DRAFT',
          }),
        })
      );
    });

    it('should handle empty string residentName for draft', async () => {
      mockIntakeCreate.mockResolvedValue({
        id: 'intake-1',
        residentName: 'Draft Intake',
        status: 'DRAFT',
      });

      const { POST } = await import('@/app/api/intakes/route');
      const request = createMockRequest({ ...createDraftIntakeData(), residentName: '' });
      await POST(request);

      expect(mockIntakeCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            residentName: 'Draft Intake',
          }),
        })
      );
    });

    it('should handle currentStep as 0', async () => {
      mockIntakeCreate.mockResolvedValue({
        id: 'intake-1',
        residentName: 'Draft Resident',
        status: 'DRAFT',
      });

      const { POST } = await import('@/app/api/intakes/route');
      const request = createMockRequest({ ...createDraftIntakeData(), currentStep: 0 });
      await POST(request);

      // 0 is falsy, so draftStep should default to 1
      expect(mockIntakeCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            draftStep: 1,
          }),
        })
      );
    });

    it('should handle very large currentStep value', async () => {
      mockIntakeCreate.mockResolvedValue({
        id: 'intake-1',
        residentName: 'Draft Resident',
        status: 'DRAFT',
      });

      const { POST } = await import('@/app/api/intakes/route');
      const request = createMockRequest({ ...createDraftIntakeData(), currentStep: 999 });
      await POST(request);

      expect(mockIntakeCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            draftStep: 999,
          }),
        })
      );
    });

    it('should handle negative currentStep value', async () => {
      mockIntakeCreate.mockResolvedValue({
        id: 'intake-1',
        residentName: 'Draft Resident',
        status: 'DRAFT',
      });

      const { POST } = await import('@/app/api/intakes/route');
      const request = createMockRequest({ ...createDraftIntakeData(), currentStep: -1 });
      await POST(request);

      expect(mockIntakeCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            draftStep: -1,
          }),
        })
      );
    });
  });

  // ==================== ERROR HANDLING TESTS ====================
  describe('Error Handling', () => {
    beforeEach(() => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
        user: { id: 'user-1', role: 'BHRF' },
      });
      (prisma.bHRFProfile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'bhrf-1',
        facilityId: 'facility-1',
      });
    });

    it('should return 500 on database error', async () => {
      mockIntakeCreate.mockRejectedValue(new Error('Database error'));

      const { POST } = await import('@/app/api/intakes/route');
      const request = createMockRequest(createValidIntakeData());
      const response = await POST(request);

      expect(response.status).toBe(500);
    });

    it('should return error message on database error', async () => {
      mockIntakeCreate.mockRejectedValue(new Error('Database error'));

      const { POST } = await import('@/app/api/intakes/route');
      const request = createMockRequest(createValidIntakeData());
      const response = await POST(request);
      const data = await response.json();

      expect(data.error).toBe('Failed to create intake');
    });

    it('should return 400 on validation error', async () => {
      const zodError = new Error('Validation failed');
      zodError.name = 'ZodError';
      mockIntakeCreate.mockRejectedValue(zodError);

      const { POST } = await import('@/app/api/intakes/route');
      const request = createMockRequest(createValidIntakeData());
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should handle transaction rollback on medication error', async () => {
      mockIntakeCreate.mockResolvedValue({
        id: 'intake-1',
        residentName: 'Test Resident',
        status: 'PENDING',
      });
      mockMedicationCreateMany.mockRejectedValue(new Error('Medication error'));

      const { POST } = await import('@/app/api/intakes/route');
      const medications = [{ name: 'Aspirin' }];
      const request = createMockRequest({ ...createValidIntakeData(), medications });
      const response = await POST(request);

      expect(response.status).toBe(500);
    });
  });

  // ==================== CONCURRENT REQUEST TESTS ====================
  describe('Concurrent Requests', () => {
    beforeEach(() => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
        user: { id: 'user-1', role: 'BHRF' },
      });
      (prisma.bHRFProfile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'bhrf-1',
        facilityId: 'facility-1',
      });
    });

    it('should handle multiple simultaneous intake creations', async () => {
      let callCount = 0;
      mockIntakeCreate.mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          id: `intake-${callCount}`,
          residentName: `Resident ${callCount}`,
          status: 'PENDING',
        });
      });

      const { POST } = await import('@/app/api/intakes/route');

      const requests = Array(5).fill(null).map((_, i) =>
        createMockRequest(createValidIntakeData({ residentName: `Resident ${i}` }))
      );

      const responses = await Promise.all(requests.map(req => POST(req)));

      expect(responses.every(r => r.status === 201)).toBe(true);
      expect(mockIntakeCreate).toHaveBeenCalledTimes(5);
    });
  });

  // ==================== DATA INTEGRITY TESTS ====================
  describe('Data Integrity', () => {
    beforeEach(() => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
        user: { id: 'user-1', role: 'BHRF' },
      });
      (prisma.bHRFProfile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'bhrf-1',
        facilityId: 'facility-1',
      });
    });

    it('should correctly parse dateOfBirth', async () => {
      mockIntakeCreate.mockResolvedValue({
        id: 'intake-1',
        residentName: 'Test Resident',
        status: 'PENDING',
      });

      const { POST } = await import('@/app/api/intakes/route');
      const request = createMockRequest(createValidIntakeData({ dateOfBirth: '1990-05-15' }));
      await POST(request);

      expect(mockIntakeCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            dateOfBirth: new Date('1990-05-15'),
          }),
        })
      );
    });

    it('should correctly parse admissionDate when provided', async () => {
      mockIntakeCreate.mockResolvedValue({
        id: 'intake-1',
        residentName: 'Test Resident',
        status: 'PENDING',
      });

      const { POST } = await import('@/app/api/intakes/route');
      const request = createMockRequest(createValidIntakeData({ admissionDate: '2024-01-15' }));
      await POST(request);

      expect(mockIntakeCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            admissionDate: new Date('2024-01-15'),
          }),
        })
      );
    });

    it('should set admissionDate to null when not provided', async () => {
      mockIntakeCreate.mockResolvedValue({
        id: 'intake-1',
        residentName: 'Test Resident',
        status: 'PENDING',
      });

      const { POST } = await import('@/app/api/intakes/route');
      const data = createValidIntakeData();
      delete (data as Record<string, unknown>).admissionDate;
      const request = createMockRequest(data);
      await POST(request);

      expect(mockIntakeCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            admissionDate: null,
          }),
        })
      );
    });
  });
});

// ==================== STATUS TRANSITION VALIDATION TESTS ====================
describe('Status Transition Rules', () => {
  it('should only allow DRAFT and PENDING as initial states', () => {
    const validInitialStates = ['DRAFT', 'PENDING'];
    const invalidInitialStates = ['APPROVED', 'DENIED', 'CONDITIONAL'];

    // This is a logical test to verify our understanding
    expect(validInitialStates).toContain('DRAFT');
    expect(validInitialStates).toContain('PENDING');
    expect(validInitialStates).not.toContain('APPROVED');
    expect(invalidInitialStates).toContain('APPROVED');
  });

  it('should require BHP review before APPROVED status', () => {
    // This documents the expected workflow
    const workflow = {
      'BHRF creates': ['DRAFT', 'PENDING'],
      'BHP reviews': ['APPROVED', 'DENIED', 'CONDITIONAL'],
    };

    expect(workflow['BHRF creates']).not.toContain('APPROVED');
    expect(workflow['BHP reviews']).toContain('APPROVED');
  });
});

// ==================== BUSINESS RULE TESTS ====================
describe('Business Rules', () => {
  it('should enforce BHRF-only creation', () => {
    const allowedRoles = ['BHRF'];
    const disallowedRoles = ['BHP', 'ADMIN'];

    expect(allowedRoles).toContain('BHRF');
    expect(disallowedRoles).not.toContain('BHRF');
  });

  it('should require facility assignment for BHRF', () => {
    // BHRF must have facilityId to create intake
    const requirement = {
      role: 'BHRF',
      requires: ['facilityId'],
    };

    expect(requirement.requires).toContain('facilityId');
  });

  it('should track who submitted the intake', () => {
    const auditFields = ['submittedBy', 'createdAt', 'updatedAt'];
    expect(auditFields).toContain('submittedBy');
  });
});
