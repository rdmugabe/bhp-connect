import { beforeEach, vi } from "vitest";

// Mock Next.js server components
vi.mock("next/server", () => ({
  NextRequest: class MockNextRequest {
    private body: string | null;
    private headers: Map<string, string>;
    public url: string;

    constructor(url: string, init?: { method?: string; body?: string; headers?: Record<string, string> }) {
      this.url = url;
      this.body = init?.body ?? null;
      this.headers = new Map(Object.entries(init?.headers ?? {}));
    }

    async json() {
      if (!this.body) {
        throw new TypeError("Body is unusable");
      }
      return JSON.parse(this.body);
    }
  },
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) => ({
      data,
      status: init?.status ?? 200,
      async json() {
        return data;
      },
    }),
  },
}));

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});
