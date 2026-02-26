import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock NextAuth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    bHPProfile: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    bHRFProfile: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    facility: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    intake: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    aSAMAssessment: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    intakeMedication: {
      findMany: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback({
      intake: {
        create: vi.fn(),
        update: vi.fn(),
      },
      intakeMedication: {
        deleteMany: vi.fn(),
        createMany: vi.fn(),
      },
    })),
  },
}));

// Mock audit logging
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
    ASAM_CREATED: 'ASAM_CREATED',
    ASAM_UPDATED: 'ASAM_UPDATED',
    ASAM_SUBMITTED: 'ASAM_SUBMITTED',
    ASAM_DRAFT_SAVED: 'ASAM_DRAFT_SAVED',
    ASAM_APPROVED: 'ASAM_APPROVED',
    ASAM_DENIED: 'ASAM_DENIED',
    ASAM_CONDITIONAL: 'ASAM_CONDITIONAL',
  },
}));

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});
