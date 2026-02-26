import { describe, it, expect, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { parseJsonBody, parseJsonObjectBody } from "@/lib/api-utils";

// Mock request factory for various scenarios
function createMockRequest(body: string | null = null): NextRequest {
  return {
    url: "http://localhost:3000/api/test",
    json: async () => {
      if (body === null) {
        throw new TypeError("Body is unusable");
      }
      return JSON.parse(body);
    },
    headers: new Map(),
  } as unknown as NextRequest;
}

function createSyntaxErrorRequest(invalidJson: string): NextRequest {
  return {
    url: "http://localhost:3000/api/test",
    json: async () => {
      JSON.parse(invalidJson); // This will throw SyntaxError
    },
    headers: new Map(),
  } as unknown as NextRequest;
}

describe("API Route Integration Patterns", () => {
  describe("Employee API patterns", () => {
    it("parses employee create request", async () => {
      const body = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        position: "Nurse",
        hireDate: "2024-01-15",
      };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody<Record<string, unknown>>(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.firstName).toBe("John");
        expect(result.data.lastName).toBe("Doe");
      }
    });

    it("parses employee update request", async () => {
      const body = {
        firstName: "Jane",
        isActive: true,
      };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
    });
  });

  describe("Intake API patterns", () => {
    it("parses intake create request with medications", async () => {
      const body = {
        residentName: "John Smith",
        dateOfBirth: "1990-05-15",
        ssn: "123-45-6789",
        isDraft: false,
        medications: [
          { name: "Aspirin", dosage: "100mg", frequency: "daily" },
          { name: "Vitamin D", dosage: "1000IU", frequency: "daily" },
        ],
      };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody<Record<string, unknown>>(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.residentName).toBe("John Smith");
        expect(Array.isArray(result.data.medications)).toBe(true);
      }
    });

    it("parses intake draft request", async () => {
      const body = {
        residentName: "Draft Patient",
        isDraft: true,
        currentStep: 3,
      };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
    });
  });

  describe("Message API patterns", () => {
    it("parses message create request", async () => {
      const body = {
        content: "Hello, this is a test message",
        linkedType: "INTAKE",
        linkedId: "abc123",
      };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).content).toBe("Hello, this is a test message");
      }
    });

    it("parses mark messages read request", async () => {
      const body = {
        messageIds: ["msg1", "msg2", "msg3"],
      };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
    });
  });

  describe("Facility API patterns", () => {
    it("parses facility create request", async () => {
      const body = {
        name: "Test Facility",
        address: "123 Main St",
        phone: "555-1234",
      };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
    });

    it("parses facility update request", async () => {
      const body = {
        name: "Updated Facility Name",
        phone: "555-5678",
      };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
    });
  });

  describe("Document API patterns", () => {
    it("parses document upload request", async () => {
      const body = {
        documentTypeId: "type123",
        issuedAt: "2024-01-01",
        expiresAt: "2025-01-01",
        noExpiration: false,
        notes: "Test document",
      };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
    });

    it("parses employee document request with fileUrl", async () => {
      const body = {
        employeeId: "emp123",
        fileUrl: "https://example.com/file.pdf",
        documentTypeId: "type456",
        issuedAt: "2024-01-01",
        noExpiration: true,
      };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody<Record<string, unknown>>(request);

      expect(result.success).toBe(true);
      if (result.success) {
        const { employeeId, fileUrl, ...rest } = result.data as { employeeId?: string; fileUrl?: string; [key: string]: unknown };
        expect(employeeId).toBe("emp123");
        expect(fileUrl).toBe("https://example.com/file.pdf");
      }
    });
  });

  describe("Meeting API patterns", () => {
    it("parses meeting create request", async () => {
      const body = {
        title: "Team Meeting",
        scheduledAt: "2024-03-15T10:00:00Z",
        duration: 60,
        notes: "Weekly sync",
      };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
    });

    it("parses meeting end request", async () => {
      const body = {
        endTime: "2024-03-15T11:00:00Z",
        notes: "Meeting concluded successfully",
      };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
    });
  });

  describe("ART Meeting API patterns", () => {
    it("parses ART meeting create request", async () => {
      const body = {
        intakeId: "intake123",
        meetingMonth: 3,
        meetingYear: 2024,
        isDraft: false,
        meetingDate: "2024-03-15",
        presentDuringMeeting: ["Resident", "Case Manager", "BHP"],
        focusOfMeeting: "Review treatment progress",
      };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody<Record<string, unknown>>(request);

      expect(result.success).toBe(true);
      if (result.success) {
        const { intakeId, meetingMonth, meetingYear, isDraft, ...meetingData } = result.data as {
          intakeId?: string;
          meetingMonth?: number;
          meetingYear?: number;
          isDraft?: boolean;
          [key: string]: unknown;
        };
        expect(intakeId).toBe("intake123");
        expect(meetingMonth).toBe(3);
        expect(meetingYear).toBe(2024);
      }
    });

    it("parses ART meeting skip request", async () => {
      const body = {
        skipReason: "Patient was hospitalized during the scheduled meeting time and could not participate",
      };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
    });
  });

  describe("ASAM Assessment API patterns", () => {
    it("parses ASAM create request", async () => {
      const body = {
        intakeId: "intake123",
        isDraft: true,
        currentStep: 1,
        patientName: "John Doe",
        dateOfBirth: "1990-05-15",
      };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody<Record<string, unknown>>(request);

      expect(result.success).toBe(true);
      if (result.success) {
        const { isDraft, currentStep, intakeId, ...assessmentData } = result.data as {
          isDraft?: boolean;
          currentStep?: number;
          intakeId?: string;
          [key: string]: unknown;
        };
        expect(isDraft).toBe(true);
        expect(currentStep).toBe(1);
        expect(intakeId).toBe("intake123");
      }
    });

    it("parses ASAM decision request", async () => {
      const body = {
        status: "APPROVED",
        decisionReason: "Assessment meets all criteria for approved level of care",
      };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
    });
  });

  describe("Discharge Summary API patterns", () => {
    it("parses discharge summary create request", async () => {
      const body = {
        intakeId: "intake123",
        isDraft: false,
        dischargeDate: "2024-03-15",
        dischargeType: "Planned",
        dischargeSummaryNarrative: "Patient successfully completed treatment program",
      };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody<Record<string, unknown>>(request);

      expect(result.success).toBe(true);
    });
  });

  describe("Incident Report API patterns", () => {
    it("parses incident report create request", async () => {
      const body = {
        status: "DRAFT",
        incidentDate: "2024-03-15",
        incidentType: "Fall",
        description: "Patient fell while walking to bathroom",
      };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody<Record<string, unknown>>(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("DRAFT");
      }
    });
  });

  describe("Fire Drill Report API patterns", () => {
    it("parses fire drill report create request", async () => {
      const body = {
        drillDate: "2024-03-15",
        startTime: "10:00",
        endTime: "10:15",
        evacuationTime: 5,
        participants: 12,
        notes: "All procedures followed correctly",
      };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
    });
  });

  describe("Notification API patterns", () => {
    it("parses mark notifications read request", async () => {
      const body = {
        notificationIds: ["msg-abc123", "prescreen-def456"],
        type: "message",
      };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
    });
  });

  describe("Admin Approval API patterns", () => {
    it("parses user approval request", async () => {
      const body = {
        status: "APPROVED",
        reason: "User meets all requirements for access",
      };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
    });

    it("parses user rejection request", async () => {
      const body = {
        status: "REJECTED",
        reason: "Incomplete documentation submitted for verification",
      };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
    });
  });

  describe("PDF Generation API patterns", () => {
    it("parses onboarding PDF request", async () => {
      const body = {
        residentName: "John Doe",
      };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody<{ residentName?: string }>(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.residentName).toBe("John Doe");
      }
    });

    it("parses ROI PDF request", async () => {
      const body = {
        patientName: "John Doe",
        dateOfBirth: "1990-05-15",
        phone: "555-1234",
        discloseFromName: "Previous Provider",
        discloseFromContact: "555-5678",
      };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody<{
        patientName?: string;
        dateOfBirth?: string;
        phone?: string;
        discloseFromName?: string;
        discloseFromContact?: string;
      }>(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.patientName).toBe("John Doe");
        expect(result.data.dateOfBirth).toBe("1990-05-15");
      }
    });

    it("parses employee onboarding PDF request", async () => {
      const body = {
        employeeName: "Jane Smith",
        hireDate: "2024-03-01",
      };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody<{ employeeName?: string; hireDate?: string }>(request);

      expect(result.success).toBe(true);
    });
  });

  describe("Email API patterns", () => {
    it("parses enrollment email request", async () => {
      const body = {
        additionalRecipients: ["manager@example.com", "supervisor@example.com"],
      };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
    });

    it("parses employee email request", async () => {
      const body = {
        additionalRecipients: [],
      };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody(request);

      expect(result.success).toBe(true);
    });
  });

  describe("Auth API patterns", () => {
    it("parses MFA verify request", async () => {
      const body = {
        code: "123456",
      };
      const request = createMockRequest(JSON.stringify(body));
      const result = await parseJsonBody<{ code?: string }>(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.code).toBe("123456");
      }
    });
  });
});

describe("Error Handling in API Patterns", () => {
  it("handles completely empty request", async () => {
    const request = createMockRequest(null);
    const result = await parseJsonBody(request);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.status).toBe(400);
    }
  });

  it("handles request with only whitespace", async () => {
    const request = createSyntaxErrorRequest("   ");
    const result = await parseJsonBody(request);

    expect(result.success).toBe(false);
  });

  it("handles malformed JSON in employee request", async () => {
    const request = createSyntaxErrorRequest('{"firstName": "John", lastName: "Doe"}');
    const result = await parseJsonBody(request);

    expect(result.success).toBe(false);
    if (!result.success) {
      const data = await result.error.json();
      expect(data.error).toBe("Invalid JSON in request body");
    }
  });

  it("handles truncated JSON payload", async () => {
    const request = createSyntaxErrorRequest('{"name": "John", "data":');
    const result = await parseJsonBody(request);

    expect(result.success).toBe(false);
  });

  it("handles double-encoded JSON", async () => {
    // Double-encoded JSON is valid JSON (just a string)
    const request = createMockRequest('"{\\"name\\": \\"John\\"}"');
    const result = await parseJsonBody(request);

    // This is valid - it's a string containing escaped JSON
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('{"name": "John"}');
    }
  });
});

describe("parseJsonObjectBody with API patterns", () => {
  it("validates employee request is an object", async () => {
    const request = createMockRequest('{"firstName": "John"}');
    const result = await parseJsonObjectBody(request);

    expect(result.success).toBe(true);
  });

  it("rejects array of employees", async () => {
    const request = createMockRequest('[{"firstName": "John"}, {"firstName": "Jane"}]');
    const result = await parseJsonObjectBody(request);

    expect(result.success).toBe(false);
    if (!result.success) {
      const data = await result.error.json();
      expect(data.error).toBe("Request body must be a JSON object");
    }
  });

  it("rejects primitive values", async () => {
    const request = createMockRequest('"just a string"');
    const result = await parseJsonObjectBody(request);

    expect(result.success).toBe(false);
  });
});
