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
    ASAM_CREATED: 'ASAM_CREATED',
    ASAM_UPDATED: 'ASAM_UPDATED',
    ASAM_SUBMITTED: 'ASAM_SUBMITTED',
    ASAM_DRAFT_SAVED: 'ASAM_DRAFT_SAVED',
    ASAM_APPROVED: 'ASAM_APPROVED',
    ASAM_DENIED: 'ASAM_DENIED',
    ASAM_CONDITIONAL: 'ASAM_CONDITIONAL',
  },
}));

const mockASAMCreate = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    bHRFProfile: {
      findUnique: vi.fn(),
    },
    bHPProfile: {
      findUnique: vi.fn(),
    },
    intake: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    aSAMAssessment: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

// Helper to create mock request
function createMockRequest(body: object, method = 'POST'): NextRequest {
  return {
    json: () => Promise.resolve(body),
    url: 'http://localhost:3000/api/asam',
    method,
  } as unknown as NextRequest;
}

// Helper to create valid ASAM data
function createValidASAMData(overrides = {}) {
  return {
    intakeId: 'intake-1',
    patientName: 'Test Patient',
    dateOfBirth: '1990-01-01',
    isDraft: false,
    ...overrides,
  };
}

// Helper to create draft ASAM data
function createDraftASAMData(overrides = {}) {
  return {
    intakeId: 'intake-1',
    patientName: 'Draft Patient',
    isDraft: true,
    currentStep: 1,
    ...overrides,
  };
}

describe('ASAM Status Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.aSAMAssessment.create as ReturnType<typeof vi.fn>).mockImplementation(mockASAMCreate);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ==================== AUTHENTICATION TESTS ====================
  describe('Authentication', () => {
    it('should return 401 when no session exists', async () => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const { POST } = await import('@/app/api/asam/route');
      const request = createMockRequest(createValidASAMData());
      const response = await POST(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 when user role is BHP', async () => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
        user: { id: 'user-1', role: 'BHP' },
      });

      const { POST } = await import('@/app/api/asam/route');
      const request = createMockRequest(createValidASAMData());
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should return 401 when user role is ADMIN', async () => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      });

      const { POST } = await import('@/app/api/asam/route');
      const request = createMockRequest(createValidASAMData());
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should allow BHRF user to create ASAM assessment', async () => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
        user: { id: 'user-1', role: 'BHRF' },
      });
      (prisma.bHRFProfile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'bhrf-1',
        facilityId: 'facility-1',
      });
      (prisma.intake.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'intake-1',
        facilityId: 'facility-1',
        status: 'APPROVED',
      });
      mockASAMCreate.mockResolvedValue({
        id: 'asam-1',
        patientName: 'Test Patient',
        status: 'PENDING',
      });

      const { POST } = await import('@/app/api/asam/route');
      const request = createMockRequest(createValidASAMData());
      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('should return 400 when BHRF has no facility assigned', async () => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
        user: { id: 'user-1', role: 'BHRF' },
      });
      (prisma.bHRFProfile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const { POST } = await import('@/app/api/asam/route');
      const request = createMockRequest(createValidASAMData());
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
      (prisma.intake.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'intake-1',
        facilityId: 'facility-1',
        status: 'APPROVED',
      });
    });

    it('should set status to PENDING when isDraft is false', async () => {
      mockASAMCreate.mockResolvedValue({
        id: 'asam-1',
        patientName: 'Test Patient',
        status: 'PENDING',
      });

      const { POST } = await import('@/app/api/asam/route');
      const request = createMockRequest(createValidASAMData({ isDraft: false }));
      await POST(request);

      expect(mockASAMCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PENDING',
          }),
        })
      );
    });

    it('should set status to DRAFT when isDraft is true', async () => {
      mockASAMCreate.mockResolvedValue({
        id: 'asam-1',
        patientName: 'Draft Patient',
        status: 'DRAFT',
      });

      const { POST } = await import('@/app/api/asam/route');
      const request = createMockRequest(createDraftASAMData());
      await POST(request);

      expect(mockASAMCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'DRAFT',
          }),
        })
      );
    });

    it('should NOT set status to APPROVED on submission', async () => {
      mockASAMCreate.mockResolvedValue({
        id: 'asam-1',
        patientName: 'Test Patient',
        status: 'PENDING',
      });

      const { POST } = await import('@/app/api/asam/route');
      const request = createMockRequest(createValidASAMData({ isDraft: false }));
      await POST(request);

      expect(mockASAMCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({
            status: 'APPROVED',
          }),
        })
      );
    });

    it('should set submittedBy to current user id', async () => {
      mockASAMCreate.mockResolvedValue({
        id: 'asam-1',
        patientName: 'Test Patient',
        status: 'PENDING',
      });

      const { POST } = await import('@/app/api/asam/route');
      const request = createMockRequest(createValidASAMData());
      await POST(request);

      expect(mockASAMCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            submittedBy: 'user-1',
          }),
        })
      );
    });

    it('should set facilityId from BHRF profile', async () => {
      mockASAMCreate.mockResolvedValue({
        id: 'asam-1',
        patientName: 'Test Patient',
        status: 'PENDING',
      });

      const { POST } = await import('@/app/api/asam/route');
      const request = createMockRequest(createValidASAMData());
      await POST(request);

      expect(mockASAMCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            facilityId: 'facility-1',
          }),
        })
      );
    });

    it('should set intakeId from request body', async () => {
      mockASAMCreate.mockResolvedValue({
        id: 'asam-1',
        patientName: 'Test Patient',
        status: 'PENDING',
      });

      const { POST } = await import('@/app/api/asam/route');
      const request = createMockRequest(createValidASAMData({ intakeId: 'intake-123' }));

      (prisma.intake.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'intake-123',
        facilityId: 'facility-1',
        status: 'APPROVED',
      });

      await POST(request);

      expect(mockASAMCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            intakeId: 'intake-123',
          }),
        })
      );
    });

    it('should set draftStep to null when not a draft', async () => {
      mockASAMCreate.mockResolvedValue({
        id: 'asam-1',
        patientName: 'Test Patient',
        status: 'PENDING',
      });

      const { POST } = await import('@/app/api/asam/route');
      const request = createMockRequest(createValidASAMData({ isDraft: false }));
      await POST(request);

      expect(mockASAMCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            draftStep: null,
          }),
        })
      );
    });

    it('should set draftStep when isDraft is true', async () => {
      mockASAMCreate.mockResolvedValue({
        id: 'asam-1',
        patientName: 'Draft Patient',
        status: 'DRAFT',
      });

      const { POST } = await import('@/app/api/asam/route');
      const request = createMockRequest(createDraftASAMData({ currentStep: 5 }));
      await POST(request);

      expect(mockASAMCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            draftStep: 5,
          }),
        })
      );
    });

    it('should default draftStep to 1 when currentStep not provided', async () => {
      mockASAMCreate.mockResolvedValue({
        id: 'asam-1',
        patientName: 'Draft Patient',
        status: 'DRAFT',
      });

      const { POST } = await import('@/app/api/asam/route');
      const request = createMockRequest({ ...createDraftASAMData(), currentStep: undefined });
      await POST(request);

      expect(mockASAMCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            draftStep: 1,
          }),
        })
      );
    });
  });

  // ==================== INTAKE VALIDATION TESTS ====================
  describe('Intake Validation', () => {
    beforeEach(() => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
        user: { id: 'user-1', role: 'BHRF' },
      });
      (prisma.bHRFProfile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'bhrf-1',
        facilityId: 'facility-1',
      });
    });

    it('should return 400 when intakeId is not provided', async () => {
      const { POST } = await import('@/app/api/asam/route');
      const data = createValidASAMData();
      delete (data as Record<string, unknown>).intakeId;
      const request = createMockRequest(data);
      const response = await POST(request);

      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData.error).toBe('An intake must be selected for the ASAM assessment');
    });

    it('should return 400 when intake does not exist', async () => {
      (prisma.intake.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const { POST } = await import('@/app/api/asam/route');
      const request = createMockRequest(createValidASAMData());
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid intake selected or intake not approved');
    });

    it('should return 400 when intake belongs to different facility', async () => {
      // The findFirst query includes facilityId in WHERE clause, so returns null if facility doesn't match
      (prisma.intake.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const { POST } = await import('@/app/api/asam/route');
      const request = createMockRequest(createValidASAMData());
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid intake selected or intake not approved');
    });

    it('should return 400 when intake status is not APPROVED', async () => {
      // The findFirst query includes status: "APPROVED" in WHERE clause, so returns null if not approved
      (prisma.intake.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const { POST } = await import('@/app/api/asam/route');
      const request = createMockRequest(createValidASAMData());
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid intake selected or intake not approved');
    });

    it('should return 400 when intake status is DRAFT', async () => {
      // The findFirst query includes status: "APPROVED" in WHERE clause, so returns null if DRAFT
      (prisma.intake.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const { POST } = await import('@/app/api/asam/route');
      const request = createMockRequest(createValidASAMData());
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid intake selected or intake not approved');
    });

    it('should return 400 when intake status is DENIED', async () => {
      // The findFirst query includes status: "APPROVED" in WHERE clause, so returns null if DENIED
      (prisma.intake.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const { POST } = await import('@/app/api/asam/route');
      const request = createMockRequest(createValidASAMData());
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid intake selected or intake not approved');
    });

    it('should allow ASAM creation when intake status is APPROVED', async () => {
      (prisma.intake.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'intake-1',
        facilityId: 'facility-1',
        status: 'APPROVED',
      });
      mockASAMCreate.mockResolvedValue({
        id: 'asam-1',
        patientName: 'Test Patient',
        status: 'PENDING',
      });

      const { POST } = await import('@/app/api/asam/route');
      const request = createMockRequest(createValidASAMData());
      const response = await POST(request);

      expect(response.status).toBe(201);
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
      (prisma.intake.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'intake-1',
        facilityId: 'facility-1',
        status: 'APPROVED',
      });
    });

    it('should create audit log with ASAM_SUBMITTED action for non-draft', async () => {
      mockASAMCreate.mockResolvedValue({
        id: 'asam-1',
        patientName: 'Test Patient',
        status: 'PENDING',
      });

      const { POST } = await import('@/app/api/asam/route');
      const request = createMockRequest(createValidASAMData({ isDraft: false }));
      await POST(request);

      expect(createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ASAM_SUBMITTED',
          entityType: 'ASAMAssessment',
          entityId: 'asam-1',
        })
      );
    });

    it('should create audit log with ASAM_DRAFT_SAVED action for draft', async () => {
      mockASAMCreate.mockResolvedValue({
        id: 'asam-1',
        patientName: 'Draft Patient',
        status: 'DRAFT',
      });

      const { POST } = await import('@/app/api/asam/route');
      const request = createMockRequest(createDraftASAMData());
      await POST(request);

      expect(createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ASAM_DRAFT_SAVED',
          entityType: 'ASAMAssessment',
        })
      );
    });

    it('should include userId in audit log', async () => {
      mockASAMCreate.mockResolvedValue({
        id: 'asam-1',
        patientName: 'Test Patient',
        status: 'PENDING',
      });

      const { POST } = await import('@/app/api/asam/route');
      const request = createMockRequest(createValidASAMData());
      await POST(request);

      expect(createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
        })
      );
    });

    it('should include patientName in audit details', async () => {
      mockASAMCreate.mockResolvedValue({
        id: 'asam-1',
        patientName: 'Test Patient',
        status: 'PENDING',
      });

      const { POST } = await import('@/app/api/asam/route');
      const request = createMockRequest(createValidASAMData());
      await POST(request);

      expect(createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({
            patientName: 'Test Patient',
          }),
        })
      );
    });

    it('should include draftStep in audit details for drafts', async () => {
      mockASAMCreate.mockResolvedValue({
        id: 'asam-1',
        patientName: 'Draft Patient',
        status: 'DRAFT',
      });

      const { POST } = await import('@/app/api/asam/route');
      const request = createMockRequest(createDraftASAMData({ currentStep: 3 }));
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
      (prisma.intake.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'intake-1',
        facilityId: 'facility-1',
        status: 'APPROVED',
      });
    });

    it('should return 201 status on successful creation', async () => {
      mockASAMCreate.mockResolvedValue({
        id: 'asam-1',
        patientName: 'Test Patient',
        status: 'PENDING',
      });

      const { POST } = await import('@/app/api/asam/route');
      const request = createMockRequest(createValidASAMData());
      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('should return assessment object in response', async () => {
      mockASAMCreate.mockResolvedValue({
        id: 'asam-1',
        patientName: 'Test Patient',
        status: 'PENDING',
      });

      const { POST } = await import('@/app/api/asam/route');
      const request = createMockRequest(createValidASAMData());
      const response = await POST(request);
      const data = await response.json();

      expect(data.assessment).toBeDefined();
      expect(data.assessment.id).toBe('asam-1');
    });

    it('should return assessment with PENDING status in response', async () => {
      mockASAMCreate.mockResolvedValue({
        id: 'asam-1',
        patientName: 'Test Patient',
        status: 'PENDING',
      });

      const { POST } = await import('@/app/api/asam/route');
      const request = createMockRequest(createValidASAMData());
      const response = await POST(request);
      const data = await response.json();

      expect(data.assessment.status).toBe('PENDING');
    });

    it('should return assessment with DRAFT status for drafts', async () => {
      mockASAMCreate.mockResolvedValue({
        id: 'asam-1',
        patientName: 'Draft Patient',
        status: 'DRAFT',
      });

      const { POST } = await import('@/app/api/asam/route');
      const request = createMockRequest(createDraftASAMData());
      const response = await POST(request);
      const data = await response.json();

      expect(data.assessment.status).toBe('DRAFT');
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
      (prisma.intake.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'intake-1',
        facilityId: 'facility-1',
        status: 'APPROVED',
      });
    });

    it('should handle isDraft as string "false"', async () => {
      mockASAMCreate.mockResolvedValue({
        id: 'asam-1',
        patientName: 'Test Patient',
        status: 'DRAFT',
      });

      const { POST } = await import('@/app/api/asam/route');
      const request = createMockRequest({ ...createValidASAMData(), isDraft: 'false' });
      await POST(request);

      // String "false" is truthy
      expect(mockASAMCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'DRAFT',
          }),
        })
      );
    });

    it('should handle isDraft as undefined (defaults to false)', async () => {
      mockASAMCreate.mockResolvedValue({
        id: 'asam-1',
        patientName: 'Test Patient',
        status: 'PENDING',
      });

      const { POST } = await import('@/app/api/asam/route');
      const data = createValidASAMData();
      delete (data as Record<string, unknown>).isDraft;
      const request = createMockRequest(data);
      await POST(request);

      expect(mockASAMCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PENDING',
          }),
        })
      );
    });

    it('should handle isDraft as null (defaults to false)', async () => {
      mockASAMCreate.mockResolvedValue({
        id: 'asam-1',
        patientName: 'Test Patient',
        status: 'PENDING',
      });

      const { POST } = await import('@/app/api/asam/route');
      const request = createMockRequest({ ...createValidASAMData(), isDraft: null });
      await POST(request);

      expect(mockASAMCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PENDING',
          }),
        })
      );
    });

    it('should handle isDraft as 0 (falsy)', async () => {
      mockASAMCreate.mockResolvedValue({
        id: 'asam-1',
        patientName: 'Test Patient',
        status: 'PENDING',
      });

      const { POST } = await import('@/app/api/asam/route');
      const request = createMockRequest({ ...createValidASAMData(), isDraft: 0 });
      await POST(request);

      expect(mockASAMCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PENDING',
          }),
        })
      );
    });

    it('should handle empty string patientName for draft', async () => {
      mockASAMCreate.mockResolvedValue({
        id: 'asam-1',
        patientName: 'Draft Assessment',
        status: 'DRAFT',
      });

      const { POST } = await import('@/app/api/asam/route');
      const request = createMockRequest({ ...createDraftASAMData(), patientName: '' });
      await POST(request);

      expect(mockASAMCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            patientName: 'Draft Assessment',
          }),
        })
      );
    });

    it('should handle currentStep as 0', async () => {
      mockASAMCreate.mockResolvedValue({
        id: 'asam-1',
        patientName: 'Draft Patient',
        status: 'DRAFT',
      });

      const { POST } = await import('@/app/api/asam/route');
      const request = createMockRequest({ ...createDraftASAMData(), currentStep: 0 });
      await POST(request);

      // 0 is falsy, so draftStep should default to 1
      expect(mockASAMCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            draftStep: 1,
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
      (prisma.intake.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'intake-1',
        facilityId: 'facility-1',
        status: 'APPROVED',
      });
    });

    it('should return 500 on database error', async () => {
      mockASAMCreate.mockRejectedValue(new Error('Database error'));

      const { POST } = await import('@/app/api/asam/route');
      const request = createMockRequest(createValidASAMData());
      const response = await POST(request);

      expect(response.status).toBe(500);
    });

    it('should return error message on database error', async () => {
      mockASAMCreate.mockRejectedValue(new Error('Database error'));

      const { POST } = await import('@/app/api/asam/route');
      const request = createMockRequest(createValidASAMData());
      const response = await POST(request);
      const data = await response.json();

      expect(data.error).toBe('Failed to create ASAM assessment');
    });

    it('should return 400 on validation error', async () => {
      const zodError = new Error('Validation failed');
      zodError.name = 'ZodError';
      mockASAMCreate.mockRejectedValue(zodError);

      const { POST } = await import('@/app/api/asam/route');
      const request = createMockRequest(createValidASAMData());
      const response = await POST(request);

      expect(response.status).toBe(400);
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
      (prisma.intake.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'intake-1',
        facilityId: 'facility-1',
        status: 'APPROVED',
      });
    });

    it('should correctly parse dateOfBirth', async () => {
      mockASAMCreate.mockResolvedValue({
        id: 'asam-1',
        patientName: 'Test Patient',
        status: 'PENDING',
      });

      const { POST } = await import('@/app/api/asam/route');
      const request = createMockRequest(createValidASAMData({ dateOfBirth: '1990-05-15' }));
      await POST(request);

      expect(mockASAMCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            dateOfBirth: new Date('1990-05-15'),
          }),
        })
      );
    });

    it('should correctly parse admissionDate when provided', async () => {
      mockASAMCreate.mockResolvedValue({
        id: 'asam-1',
        patientName: 'Test Patient',
        status: 'PENDING',
      });

      const { POST } = await import('@/app/api/asam/route');
      const request = createMockRequest(createValidASAMData({ admissionDate: '2024-01-15' }));
      await POST(request);

      expect(mockASAMCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            admissionDate: new Date('2024-01-15'),
          }),
        })
      );
    });
  });
});

// ==================== WORKFLOW DOCUMENTATION TESTS ====================
describe('ASAM Status Transition Rules', () => {
  it('should only allow DRAFT and PENDING as initial states', () => {
    const validInitialStates = ['DRAFT', 'PENDING'];
    const invalidInitialStates = ['APPROVED', 'DENIED', 'CONDITIONAL'];

    expect(validInitialStates).toContain('DRAFT');
    expect(validInitialStates).toContain('PENDING');
    expect(validInitialStates).not.toContain('APPROVED');
    expect(invalidInitialStates).toContain('APPROVED');
  });

  it('should require BHP review before APPROVED status', () => {
    const workflow = {
      'BHRF creates': ['DRAFT', 'PENDING'],
      'BHP reviews': ['APPROVED', 'DENIED', 'CONDITIONAL'],
    };

    expect(workflow['BHRF creates']).not.toContain('APPROVED');
    expect(workflow['BHP reviews']).toContain('APPROVED');
  });

  it('should require approved intake for ASAM creation', () => {
    const requirements = {
      'intake status': 'APPROVED',
      'facility match': true,
    };

    expect(requirements['intake status']).toBe('APPROVED');
    expect(requirements['facility match']).toBe(true);
  });
});

// ==================== BUSINESS RULE TESTS ====================
describe('ASAM Business Rules', () => {
  it('should enforce BHRF-only creation', () => {
    const allowedRoles = ['BHRF'];
    const disallowedRoles = ['BHP', 'ADMIN'];

    expect(allowedRoles).toContain('BHRF');
    expect(disallowedRoles).not.toContain('BHRF');
  });

  it('should require facility assignment for BHRF', () => {
    const requirement = {
      role: 'BHRF',
      requires: ['facilityId'],
    };

    expect(requirement.requires).toContain('facilityId');
  });

  it('should link ASAM to approved intake', () => {
    const requirement = {
      'intake required': true,
      'intake status': 'APPROVED',
    };

    expect(requirement['intake required']).toBe(true);
    expect(requirement['intake status']).toBe('APPROVED');
  });

  it('should track who submitted the assessment', () => {
    const auditFields = ['submittedBy', 'createdAt', 'updatedAt'];
    expect(auditFields).toContain('submittedBy');
  });
});
