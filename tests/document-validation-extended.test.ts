import { describe, it, expect } from 'vitest';
import {
  bhrfDocumentUploadSchema,
  documentRequestSchema,
} from '@/lib/validations';

describe('bhrfDocumentUploadSchema - Extended URL validation', () => {
  it('should accept localhost URLs', () => {
    const result = bhrfDocumentUploadSchema.safeParse({
      name: 'Document',
      fileUrl: 'http://localhost:3000/file.pdf',
    });
    expect(result.success).toBe(true);
  });

  it('should accept IP address URLs', () => {
    const result = bhrfDocumentUploadSchema.safeParse({
      name: 'Document',
      fileUrl: 'http://192.168.1.1/file.pdf',
    });
    expect(result.success).toBe(true);
  });

  it('should accept file URLs with multiple path segments', () => {
    const result = bhrfDocumentUploadSchema.safeParse({
      name: 'Document',
      fileUrl: 'https://example.com/a/b/c/d/e/file.pdf',
    });
    expect(result.success).toBe(true);
  });

  it('should accept URLs with fragments', () => {
    const result = bhrfDocumentUploadSchema.safeParse({
      name: 'Document',
      fileUrl: 'https://example.com/file.pdf#page=1',
    });
    expect(result.success).toBe(true);
  });

  it('should accept URLs with ports', () => {
    const result = bhrfDocumentUploadSchema.safeParse({
      name: 'Document',
      fileUrl: 'https://example.com:8080/file.pdf',
    });
    expect(result.success).toBe(true);
  });

  // Note: Zod's url() validator accepts various URL schemes including javascript:, data:, file://
  // These should be validated/sanitized at the application layer if needed
  it('should accept javascript: protocol URLs (schema only validates URL format)', () => {
    const result = bhrfDocumentUploadSchema.safeParse({
      name: 'Document',
      fileUrl: 'javascript:alert(1)',
    });
    // Zod url() validates format, not protocol safety
    expect(result.success).toBe(true);
  });

  it('should accept data: URLs (schema only validates URL format)', () => {
    const result = bhrfDocumentUploadSchema.safeParse({
      name: 'Document',
      fileUrl: 'data:text/plain,Hello',
    });
    expect(result.success).toBe(true);
  });

  it('should accept file:// protocol URLs (schema only validates URL format)', () => {
    const result = bhrfDocumentUploadSchema.safeParse({
      name: 'Document',
      fileUrl: 'file:///etc/passwd',
    });
    expect(result.success).toBe(true);
  });
});

describe('bhrfDocumentUploadSchema - Extended name validation', () => {
  it('should accept name with leading spaces', () => {
    const result = bhrfDocumentUploadSchema.safeParse({
      name: '  Document',
      fileUrl: 'https://example.com/file.pdf',
    });
    expect(result.success).toBe(true);
  });

  it('should accept name with trailing spaces', () => {
    const result = bhrfDocumentUploadSchema.safeParse({
      name: 'Document  ',
      fileUrl: 'https://example.com/file.pdf',
    });
    expect(result.success).toBe(true);
  });

  it('should accept name with newlines', () => {
    const result = bhrfDocumentUploadSchema.safeParse({
      name: 'Document\nName',
      fileUrl: 'https://example.com/file.pdf',
    });
    expect(result.success).toBe(true);
  });

  it('should accept name with tabs', () => {
    const result = bhrfDocumentUploadSchema.safeParse({
      name: 'Document\tName',
      fileUrl: 'https://example.com/file.pdf',
    });
    expect(result.success).toBe(true);
  });

  it('should accept name with emojis', () => {
    const result = bhrfDocumentUploadSchema.safeParse({
      name: 'Document 📄',
      fileUrl: 'https://example.com/file.pdf',
    });
    expect(result.success).toBe(true);
  });

  it('should accept name with HTML-like content (not sanitized at schema level)', () => {
    const result = bhrfDocumentUploadSchema.safeParse({
      name: '<script>alert(1)</script>',
      fileUrl: 'https://example.com/file.pdf',
    });
    // Schema doesn't sanitize, just validates structure
    expect(result.success).toBe(true);
  });

  it('should accept name with SQL-like content (not sanitized at schema level)', () => {
    const result = bhrfDocumentUploadSchema.safeParse({
      name: "'; DROP TABLE documents;--",
      fileUrl: 'https://example.com/file.pdf',
    });
    // Schema doesn't sanitize, just validates structure
    expect(result.success).toBe(true);
  });
});

describe('bhrfDocumentUploadSchema - Extended expiresAt validation', () => {
  it('should accept past dates', () => {
    const result = bhrfDocumentUploadSchema.safeParse({
      name: 'Document',
      fileUrl: 'https://example.com/file.pdf',
      expiresAt: '2020-01-01',
    });
    expect(result.success).toBe(true);
  });

  it('should accept far future dates', () => {
    const result = bhrfDocumentUploadSchema.safeParse({
      name: 'Document',
      fileUrl: 'https://example.com/file.pdf',
      expiresAt: '2100-12-31',
    });
    expect(result.success).toBe(true);
  });

  it('should accept leap year dates', () => {
    const result = bhrfDocumentUploadSchema.safeParse({
      name: 'Document',
      fileUrl: 'https://example.com/file.pdf',
      expiresAt: '2024-02-29',
    });
    expect(result.success).toBe(true);
  });

  // Note: JavaScript's Date.parse() has lenient parsing - it accepts 2023-02-29 and rolls over to March
  it('should accept dates that Date.parse handles (including invalid calendar dates)', () => {
    const result = bhrfDocumentUploadSchema.safeParse({
      name: 'Document',
      fileUrl: 'https://example.com/file.pdf',
      expiresAt: '2023-02-29', // Date.parse accepts this and rolls over to March 1
    });
    // Date.parse doesn't reject this
    expect(result.success).toBe(true);
  });

  it('should accept timezone-aware dates', () => {
    const result = bhrfDocumentUploadSchema.safeParse({
      name: 'Document',
      fileUrl: 'https://example.com/file.pdf',
      expiresAt: '2025-12-31T23:59:59-05:00',
    });
    expect(result.success).toBe(true);
  });

  // Note: Date.parse() accepts partial dates like '2025-12' and '2025'
  it('should accept partial dates that Date.parse handles', () => {
    const result = bhrfDocumentUploadSchema.safeParse({
      name: 'Document',
      fileUrl: 'https://example.com/file.pdf',
      expiresAt: '2025-12',
    });
    // Date.parse accepts this format
    expect(result.success).toBe(true);
  });

  it('should accept year-only dates that Date.parse handles', () => {
    const result = bhrfDocumentUploadSchema.safeParse({
      name: 'Document',
      fileUrl: 'https://example.com/file.pdf',
      expiresAt: '2025',
    });
    // Date.parse accepts this format
    expect(result.success).toBe(true);
  });
});

describe('bhrfDocumentUploadSchema - Type combinations', () => {
  it('should accept FACILITY with all optional fields set', () => {
    const result = bhrfDocumentUploadSchema.safeParse({
      name: 'Document',
      fileUrl: 'https://example.com/file.pdf',
      type: 'License',
      categoryId: 'cat_123',
      expiresAt: '2025-12-31',
      ownerType: 'FACILITY',
      employeeId: 'emp_123',
      intakeId: 'intake_123',
    });
    expect(result.success).toBe(true);
  });

  it('should accept EMPLOYEE with intakeId also set', () => {
    const result = bhrfDocumentUploadSchema.safeParse({
      name: 'Document',
      fileUrl: 'https://example.com/file.pdf',
      ownerType: 'EMPLOYEE',
      employeeId: 'emp_123',
      intakeId: 'intake_123',
    });
    expect(result.success).toBe(true);
  });

  it('should accept RESIDENT with employeeId also set', () => {
    const result = bhrfDocumentUploadSchema.safeParse({
      name: 'Document',
      fileUrl: 'https://example.com/file.pdf',
      ownerType: 'RESIDENT',
      intakeId: 'intake_123',
      employeeId: 'emp_123',
    });
    expect(result.success).toBe(true);
  });

  it('should accept no ownerType with employeeId set', () => {
    const result = bhrfDocumentUploadSchema.safeParse({
      name: 'Document',
      fileUrl: 'https://example.com/file.pdf',
      employeeId: 'emp_123',
    });
    expect(result.success).toBe(true);
  });

  it('should accept no ownerType with intakeId set', () => {
    const result = bhrfDocumentUploadSchema.safeParse({
      name: 'Document',
      fileUrl: 'https://example.com/file.pdf',
      intakeId: 'intake_123',
    });
    expect(result.success).toBe(true);
  });
});

describe('documentRequestSchema - Extended validation', () => {
  it('should accept name with exactly 100 characters', () => {
    const result = documentRequestSchema.safeParse({
      name: 'a'.repeat(100),
      type: 'Medical',
    });
    expect(result.success).toBe(true);
  });

  it('should accept type with exactly 100 characters', () => {
    const result = documentRequestSchema.safeParse({
      name: 'Document',
      type: 'a'.repeat(100),
    });
    expect(result.success).toBe(true);
  });

  it('should accept long name and type', () => {
    const result = documentRequestSchema.safeParse({
      name: 'Very Long Document Name That Describes Everything In Great Detail',
      type: 'Medical Record With Extended Classification',
    });
    expect(result.success).toBe(true);
  });

  it('should accept numeric string name', () => {
    const result = documentRequestSchema.safeParse({
      name: '12345',
      type: 'ID',
    });
    expect(result.success).toBe(true);
  });

  it('should accept unicode name', () => {
    const result = documentRequestSchema.safeParse({
      name: '文件名称',
      type: '医疗',
    });
    expect(result.success).toBe(true);
  });

  it('should reject null name', () => {
    const result = documentRequestSchema.safeParse({
      name: null,
      type: 'Medical',
    });
    expect(result.success).toBe(false);
  });

  it('should reject null type', () => {
    const result = documentRequestSchema.safeParse({
      name: 'Document',
      type: null,
    });
    expect(result.success).toBe(false);
  });

  it('should reject undefined name', () => {
    const result = documentRequestSchema.safeParse({
      name: undefined,
      type: 'Medical',
    });
    expect(result.success).toBe(false);
  });

  it('should reject undefined type', () => {
    const result = documentRequestSchema.safeParse({
      name: 'Document',
      type: undefined,
    });
    expect(result.success).toBe(false);
  });

  it('should reject number for name', () => {
    const result = documentRequestSchema.safeParse({
      name: 12345,
      type: 'Medical',
    });
    expect(result.success).toBe(false);
  });

  it('should reject number for type', () => {
    const result = documentRequestSchema.safeParse({
      name: 'Document',
      type: 12345,
    });
    expect(result.success).toBe(false);
  });

  it('should reject boolean for name', () => {
    const result = documentRequestSchema.safeParse({
      name: true,
      type: 'Medical',
    });
    expect(result.success).toBe(false);
  });

  it('should reject object for name', () => {
    const result = documentRequestSchema.safeParse({
      name: { value: 'Document' },
      type: 'Medical',
    });
    expect(result.success).toBe(false);
  });

  it('should reject array for name', () => {
    const result = documentRequestSchema.safeParse({
      name: ['Document'],
      type: 'Medical',
    });
    expect(result.success).toBe(false);
  });
});

describe('Schema parsing output', () => {
  it('bhrfDocumentUploadSchema should return parsed data on success', () => {
    const input = {
      name: 'Test Document',
      fileUrl: 'https://example.com/test.pdf',
      type: 'Medical',
      ownerType: 'FACILITY' as const,
    };
    const result = bhrfDocumentUploadSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Test Document');
      expect(result.data.fileUrl).toBe('https://example.com/test.pdf');
      expect(result.data.type).toBe('Medical');
      expect(result.data.ownerType).toBe('FACILITY');
    }
  });

  it('bhrfDocumentUploadSchema should not include extra fields in output', () => {
    const input = {
      name: 'Test Document',
      fileUrl: 'https://example.com/test.pdf',
      extraField: 'should not be in output',
    };
    const result = bhrfDocumentUploadSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).extraField).toBeUndefined();
    }
  });

  it('documentRequestSchema should return parsed data on success', () => {
    const input = {
      name: 'Test Document',
      type: 'Medical',
    };
    const result = documentRequestSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Test Document');
      expect(result.data.type).toBe('Medical');
    }
  });

  it('should provide detailed error messages on validation failure', () => {
    const result = bhrfDocumentUploadSchema.safeParse({
      name: '',
      fileUrl: 'invalid',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThanOrEqual(1);
      expect(result.error.issues[0]).toHaveProperty('path');
      expect(result.error.issues[0]).toHaveProperty('message');
    }
  });

  it('should provide error path for nested validation failures', () => {
    const result = bhrfDocumentUploadSchema.safeParse({
      name: 'Document',
      fileUrl: 'https://example.com/file.pdf',
      ownerType: 'EMPLOYEE',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const employeeIdError = result.error.issues.find(i =>
        i.path.includes('employeeId')
      );
      expect(employeeIdError).toBeDefined();
    }
  });
});
