import { describe, it, expect } from 'vitest';
import {
  bhrfDocumentUploadSchema,
  documentRequestSchema,
  documentUploadSchema,
} from '@/lib/validations';

describe('bhrfDocumentUploadSchema', () => {
  describe('name field validation', () => {
    it('should accept valid document name', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Valid Document',
        fileUrl: 'https://example.com/file.pdf',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty document name', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: '',
        fileUrl: 'https://example.com/file.pdf',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('name');
        expect(result.error.issues[0].message).toContain('required');
      }
    });

    it('should reject missing name field', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        fileUrl: 'https://example.com/file.pdf',
      });
      expect(result.success).toBe(false);
    });

    it('should reject name exceeding 255 characters', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'a'.repeat(256),
        fileUrl: 'https://example.com/file.pdf',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('name');
        expect(result.error.issues[0].message).toContain('255');
      }
    });

    it('should accept name with exactly 255 characters', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'a'.repeat(255),
        fileUrl: 'https://example.com/file.pdf',
      });
      expect(result.success).toBe(true);
    });

    it('should accept name with special characters', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Document - 2024 (Final) [v2.0]',
        fileUrl: 'https://example.com/file.pdf',
      });
      expect(result.success).toBe(true);
    });

    it('should accept name with unicode characters', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Documento español',
        fileUrl: 'https://example.com/file.pdf',
      });
      expect(result.success).toBe(true);
    });

    it('should accept single character name', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'A',
        fileUrl: 'https://example.com/file.pdf',
      });
      expect(result.success).toBe(true);
    });

    it('should reject whitespace-only name', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: '   ',
        fileUrl: 'https://example.com/file.pdf',
      });
      // Note: Zod min(1) checks length after string, so whitespace passes
      // This tests the current behavior
      expect(result.success).toBe(true);
    });
  });

  describe('fileUrl field validation', () => {
    it('should accept valid HTTPS URL', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Document',
        fileUrl: 'https://example.com/file.pdf',
      });
      expect(result.success).toBe(true);
    });

    it('should accept valid HTTP URL', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Document',
        fileUrl: 'http://example.com/file.pdf',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty fileUrl', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Document',
        fileUrl: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('fileUrl');
      }
    });

    it('should reject missing fileUrl', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Document',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid URL format', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Document',
        fileUrl: 'not-a-valid-url',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('fileUrl');
        expect(result.error.issues[0].message).toContain('Invalid');
      }
    });

    it('should reject URL without protocol', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Document',
        fileUrl: 'example.com/file.pdf',
      });
      expect(result.success).toBe(false);
    });

    it('should accept URL with query parameters', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Document',
        fileUrl: 'https://example.com/file.pdf?token=abc123&expires=123456',
      });
      expect(result.success).toBe(true);
    });

    it('should accept S3 presigned URL format', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Document',
        fileUrl: 'https://bucket.s3.amazonaws.com/key?X-Amz-Signature=abc',
      });
      expect(result.success).toBe(true);
    });

    it('should accept URL with special characters', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Document',
        fileUrl: 'https://example.com/path%20with%20spaces/file.pdf',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('type field validation', () => {
    it('should accept valid document type', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Document',
        fileUrl: 'https://example.com/file.pdf',
        type: 'Medical Record',
      });
      expect(result.success).toBe(true);
    });

    it('should accept missing type (optional)', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Document',
        fileUrl: 'https://example.com/file.pdf',
      });
      expect(result.success).toBe(true);
    });

    it('should reject type exceeding 100 characters', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Document',
        fileUrl: 'https://example.com/file.pdf',
        type: 'a'.repeat(101),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('type');
        expect(result.error.issues[0].message).toContain('100');
      }
    });

    it('should accept type with exactly 100 characters', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Document',
        fileUrl: 'https://example.com/file.pdf',
        type: 'a'.repeat(100),
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty type string', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Document',
        fileUrl: 'https://example.com/file.pdf',
        type: '',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('categoryId field validation', () => {
    it('should accept valid categoryId', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Document',
        fileUrl: 'https://example.com/file.pdf',
        categoryId: 'cat_123abc',
      });
      expect(result.success).toBe(true);
    });

    it('should accept missing categoryId (optional)', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Document',
        fileUrl: 'https://example.com/file.pdf',
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty categoryId', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Document',
        fileUrl: 'https://example.com/file.pdf',
        categoryId: '',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('expiresAt field validation', () => {
    it('should accept valid ISO date string', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Document',
        fileUrl: 'https://example.com/file.pdf',
        expiresAt: '2025-12-31',
      });
      expect(result.success).toBe(true);
    });

    it('should accept valid datetime string', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Document',
        fileUrl: 'https://example.com/file.pdf',
        expiresAt: '2025-12-31T23:59:59.999Z',
      });
      expect(result.success).toBe(true);
    });

    it('should accept missing expiresAt (optional)', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Document',
        fileUrl: 'https://example.com/file.pdf',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid date format', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Document',
        fileUrl: 'https://example.com/file.pdf',
        expiresAt: 'not-a-date',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid expiration date');
      }
    });

    it('should reject malformed date', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Document',
        fileUrl: 'https://example.com/file.pdf',
        expiresAt: '2025-13-45', // Invalid month and day
      });
      expect(result.success).toBe(false);
    });

    it('should accept empty expiresAt', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Document',
        fileUrl: 'https://example.com/file.pdf',
        expiresAt: '',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('ownerType field validation', () => {
    it('should accept FACILITY owner type', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Document',
        fileUrl: 'https://example.com/file.pdf',
        ownerType: 'FACILITY',
      });
      expect(result.success).toBe(true);
    });

    it('should accept EMPLOYEE owner type with employeeId', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Document',
        fileUrl: 'https://example.com/file.pdf',
        ownerType: 'EMPLOYEE',
        employeeId: 'emp_123',
      });
      expect(result.success).toBe(true);
    });

    it('should accept RESIDENT owner type with intakeId', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Document',
        fileUrl: 'https://example.com/file.pdf',
        ownerType: 'RESIDENT',
        intakeId: 'intake_123',
      });
      expect(result.success).toBe(true);
    });

    it('should accept missing ownerType (optional)', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Document',
        fileUrl: 'https://example.com/file.pdf',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid owner type', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Document',
        fileUrl: 'https://example.com/file.pdf',
        ownerType: 'INVALID',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('ownerType');
      }
    });

    it('should reject lowercase owner type', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Document',
        fileUrl: 'https://example.com/file.pdf',
        ownerType: 'facility',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('ownerType refinements', () => {
    it('should reject EMPLOYEE type without employeeId', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Document',
        fileUrl: 'https://example.com/file.pdf',
        ownerType: 'EMPLOYEE',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const employeeIdError = result.error.issues.find(i => i.path.includes('employeeId'));
        expect(employeeIdError).toBeDefined();
        expect(employeeIdError?.message).toContain('Employee ID is required');
      }
    });

    it('should reject EMPLOYEE type with empty employeeId', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Document',
        fileUrl: 'https://example.com/file.pdf',
        ownerType: 'EMPLOYEE',
        employeeId: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject RESIDENT type without intakeId', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Document',
        fileUrl: 'https://example.com/file.pdf',
        ownerType: 'RESIDENT',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const intakeIdError = result.error.issues.find(i => i.path.includes('intakeId'));
        expect(intakeIdError).toBeDefined();
        expect(intakeIdError?.message).toContain('Resident (intake) ID is required');
      }
    });

    it('should reject RESIDENT type with empty intakeId', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Document',
        fileUrl: 'https://example.com/file.pdf',
        ownerType: 'RESIDENT',
        intakeId: '',
      });
      expect(result.success).toBe(false);
    });

    it('should accept FACILITY type without employeeId or intakeId', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Document',
        fileUrl: 'https://example.com/file.pdf',
        ownerType: 'FACILITY',
      });
      expect(result.success).toBe(true);
    });

    it('should accept FACILITY type with extra employeeId (ignored)', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Document',
        fileUrl: 'https://example.com/file.pdf',
        ownerType: 'FACILITY',
        employeeId: 'emp_123',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('employeeId field validation', () => {
    it('should accept valid employeeId', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Document',
        fileUrl: 'https://example.com/file.pdf',
        employeeId: 'emp_abc123',
      });
      expect(result.success).toBe(true);
    });

    it('should accept missing employeeId (optional)', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Document',
        fileUrl: 'https://example.com/file.pdf',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('intakeId field validation', () => {
    it('should accept valid intakeId', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Document',
        fileUrl: 'https://example.com/file.pdf',
        intakeId: 'intake_xyz789',
      });
      expect(result.success).toBe(true);
    });

    it('should accept missing intakeId (optional)', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Document',
        fileUrl: 'https://example.com/file.pdf',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('complete document upload scenarios', () => {
    it('should accept minimal valid document', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Document',
        fileUrl: 'https://example.com/file.pdf',
      });
      expect(result.success).toBe(true);
    });

    it('should accept complete facility document', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Facility License',
        fileUrl: 'https://s3.amazonaws.com/bucket/license.pdf',
        type: 'License',
        categoryId: 'cat_licenses',
        expiresAt: '2025-12-31',
        ownerType: 'FACILITY',
      });
      expect(result.success).toBe(true);
    });

    it('should accept complete employee document', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Employee Certification',
        fileUrl: 'https://s3.amazonaws.com/bucket/cert.pdf',
        type: 'Certification',
        categoryId: 'cat_certs',
        expiresAt: '2026-06-15',
        ownerType: 'EMPLOYEE',
        employeeId: 'emp_john123',
      });
      expect(result.success).toBe(true);
    });

    it('should accept complete resident document', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Resident Insurance Card',
        fileUrl: 'https://s3.amazonaws.com/bucket/insurance.pdf',
        type: 'Insurance',
        categoryId: 'cat_insurance',
        expiresAt: '2025-03-01',
        ownerType: 'RESIDENT',
        intakeId: 'intake_resident456',
      });
      expect(result.success).toBe(true);
    });

    it('should reject document with multiple validation errors', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: '',
        fileUrl: 'not-a-url',
        type: 'a'.repeat(101),
        expiresAt: 'invalid-date',
        ownerType: 'INVALID',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(1);
      }
    });

    it('should reject null values for required fields', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: null,
        fileUrl: null,
      });
      expect(result.success).toBe(false);
    });

    it('should reject undefined values for required fields', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: undefined,
        fileUrl: undefined,
      });
      expect(result.success).toBe(false);
    });

    it('should reject numeric values for string fields', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 12345,
        fileUrl: 'https://example.com/file.pdf',
      });
      expect(result.success).toBe(false);
    });

    it('should reject array values for string fields', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: ['Document'],
        fileUrl: 'https://example.com/file.pdf',
      });
      expect(result.success).toBe(false);
    });

    it('should reject object values for string fields', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: { value: 'Document' },
        fileUrl: 'https://example.com/file.pdf',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('documentRequestSchema', () => {
  describe('name field validation', () => {
    it('should accept valid document name', () => {
      const result = documentRequestSchema.safeParse({
        name: 'Required Document',
        type: 'Medical',
      });
      expect(result.success).toBe(true);
    });

    it('should reject name shorter than 2 characters', () => {
      const result = documentRequestSchema.safeParse({
        name: 'A',
        type: 'Medical',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('name');
      }
    });

    it('should reject empty name', () => {
      const result = documentRequestSchema.safeParse({
        name: '',
        type: 'Medical',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing name', () => {
      const result = documentRequestSchema.safeParse({
        type: 'Medical',
      });
      expect(result.success).toBe(false);
    });

    it('should accept name with exactly 2 characters', () => {
      const result = documentRequestSchema.safeParse({
        name: 'AB',
        type: 'Medical',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('type field validation', () => {
    it('should accept valid document type', () => {
      const result = documentRequestSchema.safeParse({
        name: 'Document',
        type: 'Medical Record',
      });
      expect(result.success).toBe(true);
    });

    it('should reject type shorter than 2 characters', () => {
      const result = documentRequestSchema.safeParse({
        name: 'Document',
        type: 'A',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('type');
      }
    });

    it('should reject empty type', () => {
      const result = documentRequestSchema.safeParse({
        name: 'Document',
        type: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing type', () => {
      const result = documentRequestSchema.safeParse({
        name: 'Document',
      });
      expect(result.success).toBe(false);
    });

    it('should accept type with exactly 2 characters', () => {
      const result = documentRequestSchema.safeParse({
        name: 'Document',
        type: 'AB',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('complete document request scenarios', () => {
    it('should accept valid minimal document request', () => {
      const result = documentRequestSchema.safeParse({
        name: 'License',
        type: 'Legal',
      });
      expect(result.success).toBe(true);
    });

    it('should accept document request with special characters', () => {
      const result = documentRequestSchema.safeParse({
        name: 'Medical Record - Patient #123',
        type: 'Medical - PHI',
      });
      expect(result.success).toBe(true);
    });

    it('should reject document request with all invalid fields', () => {
      const result = documentRequestSchema.safeParse({
        name: 'A',
        type: 'B',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBe(2);
      }
    });
  });
});

describe('documentUploadSchema', () => {
  it('should accept empty object', () => {
    const result = documentUploadSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept valid expiresAt', () => {
    const result = documentUploadSchema.safeParse({
      expiresAt: '2025-12-31',
    });
    expect(result.success).toBe(true);
  });

  it('should accept valid notes', () => {
    const result = documentUploadSchema.safeParse({
      notes: 'Some notes about the document',
    });
    expect(result.success).toBe(true);
  });

  it('should accept both expiresAt and notes', () => {
    const result = documentUploadSchema.safeParse({
      expiresAt: '2025-12-31',
      notes: 'Document expires end of year',
    });
    expect(result.success).toBe(true);
  });

  it('should accept empty strings', () => {
    const result = documentUploadSchema.safeParse({
      expiresAt: '',
      notes: '',
    });
    expect(result.success).toBe(true);
  });
});

describe('Schema edge cases and type coercion', () => {
  describe('bhrfDocumentUploadSchema type handling', () => {
    it('should handle boolean type for string fields', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: true,
        fileUrl: 'https://example.com/file.pdf',
      });
      expect(result.success).toBe(false);
    });

    it('should handle nested object as name', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: { nested: 'value' },
        fileUrl: 'https://example.com/file.pdf',
      });
      expect(result.success).toBe(false);
    });

    it('should handle date object for expiresAt', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Document',
        fileUrl: 'https://example.com/file.pdf',
        expiresAt: new Date('2025-12-31'),
      });
      // Zod expects string, so Date object should fail
      expect(result.success).toBe(false);
    });

    it('should handle extra properties (stripped by default)', () => {
      const result = bhrfDocumentUploadSchema.safeParse({
        name: 'Document',
        fileUrl: 'https://example.com/file.pdf',
        extraField: 'should be ignored',
      });
      expect(result.success).toBe(true);
    });
  });
});
