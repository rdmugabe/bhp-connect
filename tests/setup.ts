import { vi } from 'vitest';

// Mock NextAuth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    bHPProfile: {
      findUnique: vi.fn(),
    },
    bHRFProfile: {
      findUnique: vi.fn(),
    },
    facility: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    document: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    documentCategory: {
      findFirst: vi.fn(),
    },
    employee: {
      findFirst: vi.fn(),
    },
    intake: {
      findFirst: vi.fn(),
    },
  },
}));

// Mock audit logging
vi.mock('@/lib/audit', () => ({
  createAuditLog: vi.fn(),
  AuditActions: {
    DOCUMENT_UPLOADED: 'DOCUMENT_UPLOADED',
    DOCUMENT_REQUESTED: 'DOCUMENT_REQUESTED',
  },
}));
