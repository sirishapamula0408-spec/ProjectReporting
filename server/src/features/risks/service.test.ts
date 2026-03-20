import { jest, describe, it, expect, beforeEach, beforeAll } from '@jest/globals';

const mockFindMany = jest.fn<any>();
const mockCreate = jest.fn<any>();
const mockUpdate = jest.fn<any>();
const mockFindFirst = jest.fn<any>();
const mockProjectFindUnique = jest.fn<any>();

jest.unstable_mockModule('../../config/database.js', () => ({
  prisma: {
    project: { findUnique: mockProjectFindUnique },
    risk: { findMany: mockFindMany, create: mockCreate, update: mockUpdate, findFirst: mockFindFirst },
  },
}));

let listRisks: any;
let createRisk: any;

beforeAll(async () => {
  const service = await import('./service.js');
  listRisks = service.listRisks;
  createRisk = service.createRisk;
});

const mockUser = { id: 1, username: 'pm1', role: 'PM' as const, businessUnit: 'BU1', displayName: 'PM One' };
const mockProject = { id: 1, managerId: 1, businessUnit: 'BU1' };

describe('listRisks', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('returns risks for a project', async () => {
    mockProjectFindUnique.mockResolvedValue(mockProject);
    mockFindMany.mockResolvedValue([
      { id: 1, projectId: 1, description: 'Risk 1', probability: 'HIGH', costImpact: { toString: () => '50000.00' }, status: 'OPEN', mitigationPlan: null, createdAt: new Date(), updatedAt: new Date() },
    ]);

    const result = await listRisks(1, mockUser);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].costImpact).toBe('50000.00');
  });

  it('throws 403 for unauthorized access', async () => {
    mockProjectFindUnique.mockResolvedValue({ ...mockProject, managerId: 99 });
    await expect(listRisks(1, mockUser)).rejects.toMatchObject({ statusCode: 403 });
  });
});

describe('Validation schemas', () => {
  let createRiskSchema: any;
  let updateRiskStatusSchema: any;

  beforeAll(async () => {
    const v = await import('./validation.js');
    createRiskSchema = v.createRiskSchema;
    updateRiskStatusSchema = v.updateRiskStatusSchema;
  });

  it('accepts valid risk', () => {
    expect(createRiskSchema.safeParse({
      description: 'Vendor delay', probability: 'MEDIUM', costImpact: '50000.00',
    }).success).toBe(true);
  });

  it('rejects empty description', () => {
    expect(createRiskSchema.safeParse({
      description: '', probability: 'LOW', costImpact: '100.00',
    }).success).toBe(false);
  });

  it('validates risk status enum', () => {
    expect(updateRiskStatusSchema.safeParse({ status: 'MITIGATED' }).success).toBe(true);
    expect(updateRiskStatusSchema.safeParse({ status: 'INVALID' }).success).toBe(false);
  });
});
