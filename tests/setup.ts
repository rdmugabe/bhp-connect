import { vi } from "vitest";

// Mock NextAuth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
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
    fireDrillReport: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    evacuationDrillReport: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    aRTMeeting: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    oversightTrainingReport: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    intake: {
      findMany: vi.fn(),
    },
  },
}));

// Mock audit logging
vi.mock("@/lib/audit", () => ({
  createAuditLog: vi.fn(),
  AuditActions: {
    FIRE_DRILL_SUBMITTED: "FIRE_DRILL_SUBMITTED",
    EVACUATION_DRILL_SUBMITTED: "EVACUATION_DRILL_SUBMITTED",
    ART_MEETING_CREATED: "ART_MEETING_CREATED",
    ART_MEETING_SUBMITTED: "ART_MEETING_SUBMITTED",
    OVERSIGHT_TRAINING_SUBMITTED: "OVERSIGHT_TRAINING_SUBMITTED",
  },
}));
