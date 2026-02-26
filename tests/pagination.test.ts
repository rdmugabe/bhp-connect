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
    ASAM_CREATED: 'ASAM_CREATED',
    ASAM_UPDATED: 'ASAM_UPDATED',
    ASAM_SUBMITTED: 'ASAM_SUBMITTED',
    EMPLOYEE_CREATED: 'EMPLOYEE_CREATED',
  },
}));

const mockIntakeFindMany = vi.fn();
const mockIntakeCount = vi.fn();
const mockASAMFindMany = vi.fn();
const mockASAMCount = vi.fn();
const mockEmployeeFindMany = vi.fn();
const mockEmployeeCount = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    bHRFProfile: {
      findUnique: vi.fn(),
    },
    bHPProfile: {
      findUnique: vi.fn(),
    },
    facility: {
      findFirst: vi.fn(),
    },
    intake: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    aSAMAssessment: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    employee: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// Helper to create mock GET request with query params
function createMockGETRequest(params: Record<string, string> = {}): NextRequest {
  const searchParams = new URLSearchParams(params);
  return {
    url: `http://localhost:3000/api/test?${searchParams.toString()}`,
    method: 'GET',
  } as unknown as NextRequest;
}

// Generate mock data
function generateMockIntakes(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `intake-${i + 1}`,
    residentName: `Resident ${i + 1}`,
    status: 'PENDING',
    createdAt: new Date(),
    facility: { id: 'facility-1', name: 'Test Facility' },
  }));
}

function generateMockASAMAssessments(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `asam-${i + 1}`,
    patientName: `Patient ${i + 1}`,
    status: 'PENDING',
    createdAt: new Date(),
    facility: { id: 'facility-1', name: 'Test Facility' },
    intake: { id: 'intake-1', residentName: 'Test Resident', dateOfBirth: new Date(), status: 'APPROVED' },
  }));
}

function generateMockEmployees(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `employee-${i + 1}`,
    firstName: `First${i + 1}`,
    lastName: `Last${i + 1}`,
    email: `employee${i + 1}@test.com`,
    isActive: true,
    employeeDocuments: [],
  }));
}

describe('Pagination Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.intake.findMany as ReturnType<typeof vi.fn>).mockImplementation(mockIntakeFindMany);
    (prisma.intake.count as ReturnType<typeof vi.fn>).mockImplementation(mockIntakeCount);
    (prisma.aSAMAssessment.findMany as ReturnType<typeof vi.fn>).mockImplementation(mockASAMFindMany);
    (prisma.aSAMAssessment.count as ReturnType<typeof vi.fn>).mockImplementation(mockASAMCount);
    (prisma.employee.findMany as ReturnType<typeof vi.fn>).mockImplementation(mockEmployeeFindMany);
    (prisma.employee.count as ReturnType<typeof vi.fn>).mockImplementation(mockEmployeeCount);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ==================== INTAKES PAGINATION TESTS ====================
  describe('Intakes Pagination', () => {
    beforeEach(() => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
        user: { id: 'user-1', role: 'BHRF' },
      });
      (prisma.bHRFProfile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'bhrf-1',
        facilityId: 'facility-1',
      });
    });

    it('should return default pagination (page 1, limit 20)', async () => {
      mockIntakeFindMany.mockResolvedValue(generateMockIntakes(20));
      mockIntakeCount.mockResolvedValue(100);

      const { GET } = await import('@/app/api/intakes/route');
      const request = createMockGETRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 100,
        totalPages: 5,
      });
      expect(data.intakes).toHaveLength(20);
    });

    it('should respect custom page parameter', async () => {
      mockIntakeFindMany.mockResolvedValue(generateMockIntakes(20));
      mockIntakeCount.mockResolvedValue(100);

      const { GET } = await import('@/app/api/intakes/route');
      const request = createMockGETRequest({ page: '3' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.page).toBe(3);
      expect(mockIntakeFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 40, // (3-1) * 20
          take: 20,
        })
      );
    });

    it('should respect custom limit parameter', async () => {
      mockIntakeFindMany.mockResolvedValue(generateMockIntakes(50));
      mockIntakeCount.mockResolvedValue(200);

      const { GET } = await import('@/app/api/intakes/route');
      const request = createMockGETRequest({ limit: '50' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.limit).toBe(50);
      expect(data.pagination.totalPages).toBe(4);
      expect(mockIntakeFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        })
      );
    });

    it('should enforce maximum limit of 100', async () => {
      mockIntakeFindMany.mockResolvedValue(generateMockIntakes(100));
      mockIntakeCount.mockResolvedValue(500);

      const { GET } = await import('@/app/api/intakes/route');
      const request = createMockGETRequest({ limit: '500' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.limit).toBe(100);
      expect(mockIntakeFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        })
      );
    });

    it('should enforce minimum limit of 1', async () => {
      mockIntakeFindMany.mockResolvedValue(generateMockIntakes(1));
      mockIntakeCount.mockResolvedValue(50);

      const { GET } = await import('@/app/api/intakes/route');
      const request = createMockGETRequest({ limit: '0' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.limit).toBe(1);
    });

    it('should enforce minimum page of 1', async () => {
      mockIntakeFindMany.mockResolvedValue(generateMockIntakes(20));
      mockIntakeCount.mockResolvedValue(100);

      const { GET } = await import('@/app/api/intakes/route');
      const request = createMockGETRequest({ page: '-5' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.page).toBe(1);
      expect(mockIntakeFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
        })
      );
    });

    it('should handle invalid page parameter gracefully', async () => {
      mockIntakeFindMany.mockResolvedValue(generateMockIntakes(20));
      mockIntakeCount.mockResolvedValue(100);

      const { GET } = await import('@/app/api/intakes/route');
      const request = createMockGETRequest({ page: 'invalid' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.page).toBe(1);
    });

    it('should handle invalid limit parameter gracefully', async () => {
      mockIntakeFindMany.mockResolvedValue(generateMockIntakes(20));
      mockIntakeCount.mockResolvedValue(100);

      const { GET } = await import('@/app/api/intakes/route');
      const request = createMockGETRequest({ limit: 'invalid' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.limit).toBe(20);
    });

    it('should calculate totalPages correctly', async () => {
      mockIntakeFindMany.mockResolvedValue(generateMockIntakes(10));
      mockIntakeCount.mockResolvedValue(55);

      const { GET } = await import('@/app/api/intakes/route');
      const request = createMockGETRequest({ limit: '10' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.totalPages).toBe(6); // ceil(55/10) = 6
    });

    it('should return empty results with proper pagination for no data', async () => {
      mockIntakeFindMany.mockResolvedValue([]);
      mockIntakeCount.mockResolvedValue(0);

      const { GET } = await import('@/app/api/intakes/route');
      const request = createMockGETRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(data.intakes).toHaveLength(0);
      expect(data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      });
    });

    it('should return proper pagination when last page has fewer items', async () => {
      mockIntakeFindMany.mockResolvedValue(generateMockIntakes(5));
      mockIntakeCount.mockResolvedValue(45);

      const { GET } = await import('@/app/api/intakes/route');
      const request = createMockGETRequest({ page: '3', limit: '20' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.intakes).toHaveLength(5);
      expect(data.pagination.totalPages).toBe(3);
    });

    it('should work with status filter and pagination', async () => {
      mockIntakeFindMany.mockResolvedValue(generateMockIntakes(10));
      mockIntakeCount.mockResolvedValue(30);

      const { GET } = await import('@/app/api/intakes/route');
      const request = createMockGETRequest({ status: 'PENDING', page: '2', limit: '10' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.total).toBe(30);
      expect(mockIntakeFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PENDING',
          }),
          skip: 10,
          take: 10,
        })
      );
    });

    it('should return pagination info for BHP user with no profile', async () => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
        user: { id: 'user-1', role: 'BHP' },
      });
      (prisma.bHPProfile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const { GET } = await import('@/app/api/intakes/route');
      const request = createMockGETRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(data.intakes).toEqual([]);
      expect(data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      });
    });

    it('should return pagination info for BHRF user with no profile', async () => {
      (prisma.bHRFProfile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const { GET } = await import('@/app/api/intakes/route');
      const request = createMockGETRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(data.intakes).toEqual([]);
      expect(data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      });
    });

    it('should handle page beyond available data', async () => {
      mockIntakeFindMany.mockResolvedValue([]);
      mockIntakeCount.mockResolvedValue(20);

      const { GET } = await import('@/app/api/intakes/route');
      const request = createMockGETRequest({ page: '100' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.intakes).toHaveLength(0);
      expect(data.pagination.page).toBe(100);
      expect(data.pagination.totalPages).toBe(1);
    });

    it('should execute findMany and count in parallel', async () => {
      let findManyCallTime = 0;
      let countCallTime = 0;

      mockIntakeFindMany.mockImplementation(async () => {
        findManyCallTime = Date.now();
        return generateMockIntakes(20);
      });
      mockIntakeCount.mockImplementation(async () => {
        countCallTime = Date.now();
        return 100;
      });

      const { GET } = await import('@/app/api/intakes/route');
      const request = createMockGETRequest();
      await GET(request);

      // Both should be called nearly simultaneously (within 50ms)
      expect(Math.abs(findManyCallTime - countCallTime)).toBeLessThan(50);
    });
  });

  // ==================== ASAM PAGINATION TESTS ====================
  describe('ASAM Pagination', () => {
    beforeEach(() => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
        user: { id: 'user-1', role: 'BHRF' },
      });
      (prisma.bHRFProfile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'bhrf-1',
        facilityId: 'facility-1',
      });
    });

    it('should return default pagination (page 1, limit 20)', async () => {
      mockASAMFindMany.mockResolvedValue(generateMockASAMAssessments(20));
      mockASAMCount.mockResolvedValue(100);

      const { GET } = await import('@/app/api/asam/route');
      const request = createMockGETRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 100,
        totalPages: 5,
      });
      expect(data.assessments).toHaveLength(20);
    });

    it('should respect custom page parameter', async () => {
      mockASAMFindMany.mockResolvedValue(generateMockASAMAssessments(20));
      mockASAMCount.mockResolvedValue(100);

      const { GET } = await import('@/app/api/asam/route');
      const request = createMockGETRequest({ page: '2' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.page).toBe(2);
      expect(mockASAMFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 20,
        })
      );
    });

    it('should respect custom limit parameter', async () => {
      mockASAMFindMany.mockResolvedValue(generateMockASAMAssessments(30));
      mockASAMCount.mockResolvedValue(90);

      const { GET } = await import('@/app/api/asam/route');
      const request = createMockGETRequest({ limit: '30' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.limit).toBe(30);
      expect(data.pagination.totalPages).toBe(3);
    });

    it('should enforce maximum limit of 100', async () => {
      mockASAMFindMany.mockResolvedValue(generateMockASAMAssessments(100));
      mockASAMCount.mockResolvedValue(1000);

      const { GET } = await import('@/app/api/asam/route');
      const request = createMockGETRequest({ limit: '1000' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.limit).toBe(100);
    });

    it('should enforce minimum limit of 1', async () => {
      mockASAMFindMany.mockResolvedValue(generateMockASAMAssessments(1));
      mockASAMCount.mockResolvedValue(50);

      const { GET } = await import('@/app/api/asam/route');
      const request = createMockGETRequest({ limit: '-10' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.limit).toBe(1);
    });

    it('should enforce minimum page of 1', async () => {
      mockASAMFindMany.mockResolvedValue(generateMockASAMAssessments(20));
      mockASAMCount.mockResolvedValue(100);

      const { GET } = await import('@/app/api/asam/route');
      const request = createMockGETRequest({ page: '0' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.page).toBe(1);
    });

    it('should return empty results with proper pagination for no data', async () => {
      mockASAMFindMany.mockResolvedValue([]);
      mockASAMCount.mockResolvedValue(0);

      const { GET } = await import('@/app/api/asam/route');
      const request = createMockGETRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(data.assessments).toHaveLength(0);
      expect(data.pagination.total).toBe(0);
      expect(data.pagination.totalPages).toBe(0);
    });

    it('should work with status filter and pagination', async () => {
      mockASAMFindMany.mockResolvedValue(generateMockASAMAssessments(5));
      mockASAMCount.mockResolvedValue(15);

      const { GET } = await import('@/app/api/asam/route');
      const request = createMockGETRequest({ status: 'APPROVED', page: '2', limit: '5' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.total).toBe(15);
      expect(mockASAMFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'APPROVED',
          }),
        })
      );
    });

    it('should return pagination info for BHRF user with no profile', async () => {
      (prisma.bHRFProfile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const { GET } = await import('@/app/api/asam/route');
      const request = createMockGETRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(data.assessments).toEqual([]);
      expect(data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      });
    });

    it('should return pagination info for BHP user with no profile', async () => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
        user: { id: 'user-1', role: 'BHP' },
      });
      (prisma.bHPProfile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const { GET } = await import('@/app/api/asam/route');
      const request = createMockGETRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(data.assessments).toEqual([]);
      expect(data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      });
    });

    it('should calculate skip correctly for different pages', async () => {
      mockASAMFindMany.mockResolvedValue(generateMockASAMAssessments(10));
      mockASAMCount.mockResolvedValue(100);

      const { GET } = await import('@/app/api/asam/route');
      const request = createMockGETRequest({ page: '5', limit: '10' });
      await GET(request);

      expect(mockASAMFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 40, // (5-1) * 10
          take: 10,
        })
      );
    });

    it('should handle large page numbers', async () => {
      mockASAMFindMany.mockResolvedValue([]);
      mockASAMCount.mockResolvedValue(10);

      const { GET } = await import('@/app/api/asam/route');
      const request = createMockGETRequest({ page: '9999' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.page).toBe(9999);
      expect(data.assessments).toHaveLength(0);
    });
  });

  // ==================== EMPLOYEES PAGINATION TESTS ====================
  describe('Employees Pagination', () => {
    beforeEach(() => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
        user: { id: 'user-1', role: 'BHRF' },
      });
      (prisma.bHRFProfile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'bhrf-1',
        facilityId: 'facility-1',
        facility: {
          bhp: {
            user: { email: 'bhp@test.com' },
          },
        },
      });
    });

    it('should return default pagination (page 1, limit 20)', async () => {
      mockEmployeeFindMany.mockResolvedValue(generateMockEmployees(20));
      mockEmployeeCount.mockResolvedValue(100);

      const { GET } = await import('@/app/api/employees/route');
      const request = createMockGETRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 100,
        totalPages: 5,
      });
      expect(data.employees).toHaveLength(20);
    });

    it('should respect custom page parameter', async () => {
      mockEmployeeFindMany.mockResolvedValue(generateMockEmployees(20));
      mockEmployeeCount.mockResolvedValue(100);

      const { GET } = await import('@/app/api/employees/route');
      const request = createMockGETRequest({ page: '4' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.page).toBe(4);
      expect(mockEmployeeFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 60, // (4-1) * 20
          take: 20,
        })
      );
    });

    it('should respect custom limit parameter', async () => {
      mockEmployeeFindMany.mockResolvedValue(generateMockEmployees(25));
      mockEmployeeCount.mockResolvedValue(75);

      const { GET } = await import('@/app/api/employees/route');
      const request = createMockGETRequest({ limit: '25' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.limit).toBe(25);
      expect(data.pagination.totalPages).toBe(3);
    });

    it('should enforce maximum limit of 100', async () => {
      mockEmployeeFindMany.mockResolvedValue(generateMockEmployees(100));
      mockEmployeeCount.mockResolvedValue(500);

      const { GET } = await import('@/app/api/employees/route');
      const request = createMockGETRequest({ limit: '200' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.limit).toBe(100);
    });

    it('should enforce minimum limit of 1', async () => {
      mockEmployeeFindMany.mockResolvedValue(generateMockEmployees(1));
      mockEmployeeCount.mockResolvedValue(50);

      const { GET } = await import('@/app/api/employees/route');
      const request = createMockGETRequest({ limit: '0' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.limit).toBe(1);
    });

    it('should enforce minimum page of 1', async () => {
      mockEmployeeFindMany.mockResolvedValue(generateMockEmployees(20));
      mockEmployeeCount.mockResolvedValue(100);

      const { GET } = await import('@/app/api/employees/route');
      const request = createMockGETRequest({ page: '-1' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.page).toBe(1);
    });

    it('should return empty results with proper pagination for no employees', async () => {
      mockEmployeeFindMany.mockResolvedValue([]);
      mockEmployeeCount.mockResolvedValue(0);

      const { GET } = await import('@/app/api/employees/route');
      const request = createMockGETRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(data.employees).toHaveLength(0);
      expect(data.pagination.total).toBe(0);
      expect(data.pagination.totalPages).toBe(0);
    });

    it('should work with includeInactive filter and pagination', async () => {
      mockEmployeeFindMany.mockResolvedValue(generateMockEmployees(15));
      mockEmployeeCount.mockResolvedValue(45);

      const { GET } = await import('@/app/api/employees/route');
      const request = createMockGETRequest({ includeInactive: 'true', page: '2', limit: '15' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.total).toBe(45);
      expect(mockEmployeeFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 15,
          take: 15,
        })
      );
    });

    it('should return pagination info for BHRF user with no profile', async () => {
      (prisma.bHRFProfile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const { GET } = await import('@/app/api/employees/route');
      const request = createMockGETRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(data.employees).toEqual([]);
      expect(data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      });
    });

    it('should return pagination info for BHP user with no profile', async () => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
        user: { id: 'user-1', role: 'BHP' },
      });
      (prisma.bHPProfile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const { GET } = await import('@/app/api/employees/route');
      const request = createMockGETRequest({ facilityId: 'facility-1' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.employees).toEqual([]);
      expect(data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      });
    });

    it('should include bhpEmail in response along with pagination', async () => {
      mockEmployeeFindMany.mockResolvedValue(generateMockEmployees(10));
      mockEmployeeCount.mockResolvedValue(10);

      const { GET } = await import('@/app/api/employees/route');
      const request = createMockGETRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(data.bhpEmail).toBe('bhp@test.com');
      expect(data.pagination).toBeDefined();
    });

    it('should calculate compliance status correctly with pagination', async () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 86400000); // Yesterday
      const futureDate = new Date(now.getTime() + 86400000 * 15); // 15 days from now

      mockEmployeeFindMany.mockResolvedValue([
        {
          id: 'emp-1',
          firstName: 'Test',
          lastName: 'User',
          employeeDocuments: [
            { expiresAt: pastDate, noExpiration: false, documentType: {} },
          ],
        },
        {
          id: 'emp-2',
          firstName: 'Test2',
          lastName: 'User2',
          employeeDocuments: [
            { expiresAt: futureDate, noExpiration: false, documentType: {} },
          ],
        },
      ]);
      mockEmployeeCount.mockResolvedValue(2);

      const { GET } = await import('@/app/api/employees/route');
      const request = createMockGETRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(data.employees[0].complianceStatus).toBe('EXPIRED');
      expect(data.employees[1].complianceStatus).toBe('EXPIRING_SOON');
      expect(data.pagination).toBeDefined();
    });

    it('should handle BHP user with valid facility', async () => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
        user: { id: 'user-1', role: 'BHP' },
      });
      (prisma.bHPProfile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'bhp-1',
        user: { email: 'bhp@test.com' },
      });
      (prisma.facility.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'facility-1',
        name: 'Test Facility',
      });
      mockEmployeeFindMany.mockResolvedValue(generateMockEmployees(10));
      mockEmployeeCount.mockResolvedValue(10);

      const { GET } = await import('@/app/api/employees/route');
      const request = createMockGETRequest({ facilityId: 'facility-1' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.employees).toHaveLength(10);
      expect(data.pagination.total).toBe(10);
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

    it('should handle floating point page numbers', async () => {
      mockIntakeFindMany.mockResolvedValue(generateMockIntakes(20));
      mockIntakeCount.mockResolvedValue(100);

      const { GET } = await import('@/app/api/intakes/route');
      const request = createMockGETRequest({ page: '2.7' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.page).toBe(2);
    });

    it('should handle floating point limit numbers', async () => {
      mockIntakeFindMany.mockResolvedValue(generateMockIntakes(15));
      mockIntakeCount.mockResolvedValue(100);

      const { GET } = await import('@/app/api/intakes/route');
      const request = createMockGETRequest({ limit: '15.9' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.limit).toBe(15);
    });

    it('should handle very large total counts', async () => {
      mockIntakeFindMany.mockResolvedValue(generateMockIntakes(20));
      mockIntakeCount.mockResolvedValue(1000000);

      const { GET } = await import('@/app/api/intakes/route');
      const request = createMockGETRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.total).toBe(1000000);
      expect(data.pagination.totalPages).toBe(50000);
    });

    it('should handle single item total', async () => {
      mockIntakeFindMany.mockResolvedValue(generateMockIntakes(1));
      mockIntakeCount.mockResolvedValue(1);

      const { GET } = await import('@/app/api/intakes/route');
      const request = createMockGETRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.total).toBe(1);
      expect(data.pagination.totalPages).toBe(1);
    });

    it('should handle exactly one page of results', async () => {
      mockIntakeFindMany.mockResolvedValue(generateMockIntakes(20));
      mockIntakeCount.mockResolvedValue(20);

      const { GET } = await import('@/app/api/intakes/route');
      const request = createMockGETRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.totalPages).toBe(1);
    });

    it('should handle page and limit as strings with leading zeros', async () => {
      mockIntakeFindMany.mockResolvedValue(generateMockIntakes(10));
      mockIntakeCount.mockResolvedValue(50);

      const { GET } = await import('@/app/api/intakes/route');
      const request = createMockGETRequest({ page: '002', limit: '010' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.pagination.page).toBe(2);
      expect(data.pagination.limit).toBe(10);
    });

    it('should handle combined page and limit at boundary', async () => {
      mockIntakeFindMany.mockResolvedValue(generateMockIntakes(100));
      mockIntakeCount.mockResolvedValue(10000);

      const { GET } = await import('@/app/api/intakes/route');
      const request = createMockGETRequest({ page: '100', limit: '100' });
      const response = await GET(request);
      const data = await response.json();

      expect(mockIntakeFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 9900, // (100-1) * 100
          take: 100,
        })
      );
    });
  });

  // ==================== ERROR HANDLING ====================
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

    it('should return 500 on database error during findMany', async () => {
      mockIntakeFindMany.mockRejectedValue(new Error('Database error'));
      mockIntakeCount.mockResolvedValue(100);

      const { GET } = await import('@/app/api/intakes/route');
      const request = createMockGETRequest();
      const response = await GET(request);

      expect(response.status).toBe(500);
    });

    it('should return 500 on database error during count', async () => {
      mockIntakeFindMany.mockResolvedValue(generateMockIntakes(20));
      mockIntakeCount.mockRejectedValue(new Error('Database error'));

      const { GET } = await import('@/app/api/intakes/route');
      const request = createMockGETRequest();
      const response = await GET(request);

      expect(response.status).toBe(500);
    });

    it('should return 401 for unauthorized user', async () => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const { GET } = await import('@/app/api/intakes/route');
      const request = createMockGETRequest();
      const response = await GET(request);

      expect(response.status).toBe(401);
    });
  });
});
