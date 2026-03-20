import { jest, describe, it, expect, beforeEach, beforeAll } from '@jest/globals';

const mockFindMany = jest.fn<any>();
const mockFindUnique = jest.fn<any>();
const mockFindFirst = jest.fn<any>();
const mockUpsert = jest.fn<any>();
const mockCount = jest.fn<any>();
const mockCreate = jest.fn<any>();
const mockUpdate = jest.fn<any>();
const mockTransaction = jest.fn<any>();

jest.unstable_mockModule('../../config/database.js', () => ({
  prisma: {
    project: { findUnique: jest.fn<any>() },
    costCategory: { findMany: mockFindMany, findFirst: mockFindFirst },
    plannedAmount: { findMany: jest.fn<any>(), upsert: mockUpsert },
    costEntry: { findMany: jest.fn<any>(), findUnique: jest.fn<any>(), findFirst: jest.fn<any>(), create: mockCreate, update: mockUpdate },
    costEntryAudit: { findMany: jest.fn<any>(), create: jest.fn<any>() },
    $transaction: mockTransaction,
  },
}));

let listCostCategories: any;
let getVariance: any;
let getBurnRate: any;
let getDashboard: any;
let prisma: any;

beforeAll(async () => {
  const service = await import('./service.js');
  listCostCategories = service.listCostCategories;
  getVariance = service.getVariance;
  getBurnRate = service.getBurnRate;
  getDashboard = service.getDashboard;
  const db = await import('../../config/database.js');
  prisma = db.prisma;
});

const mockUser = { id: 1, username: 'pm1', role: 'PM' as const, businessUnit: 'BU1', displayName: 'PM One' };
const mockProject = { id: 1, managerId: 1, businessUnit: 'BU1', contractValue: { toString: () => '1000000.00' } };

describe('listCostCategories', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('returns categories for a project', async () => {
    (prisma.project.findUnique as any).mockResolvedValue(mockProject);
    mockFindMany.mockResolvedValue([
      { id: 1, projectId: 1, categoryType: 'EMPLOYEE_SALARY', createdAt: new Date() },
      { id: 2, projectId: 1, categoryType: 'TRAVEL', createdAt: new Date() },
    ]);

    const result = await listCostCategories(1, mockUser);
    expect(result.data).toHaveLength(2);
    expect(result.data[0].categoryType).toBe('EMPLOYEE_SALARY');
  });

  it('throws 404 for missing project', async () => {
    (prisma.project.findUnique as any).mockResolvedValue(null);
    await expect(listCostCategories(999, mockUser)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 for unauthorized access', async () => {
    (prisma.project.findUnique as any).mockResolvedValue({ ...mockProject, managerId: 99 });
    await expect(listCostCategories(1, mockUser)).rejects.toMatchObject({ statusCode: 403 });
  });
});

describe('Zod validation schemas', () => {
  let upsertPlannedAmountSchema: any;
  let createCostEntrySchema: any;
  let periodQuerySchema: any;
  let batchUpsertPlannedAmountsSchema: any;

  beforeAll(async () => {
    const v = await import('./validation.js');
    upsertPlannedAmountSchema = v.upsertPlannedAmountSchema;
    createCostEntrySchema = v.createCostEntrySchema;
    periodQuerySchema = v.periodQuerySchema;
    batchUpsertPlannedAmountsSchema = v.batchUpsertPlannedAmountsSchema;
  });

  it('accepts valid period YYYY-MM', () => {
    expect(upsertPlannedAmountSchema.safeParse({ period: '2026-03', amount: '50000.00' }).success).toBe(true);
  });

  it('rejects invalid period format', () => {
    expect(upsertPlannedAmountSchema.safeParse({ period: '2026-13', amount: '100' }).success).toBe(false);
    expect(upsertPlannedAmountSchema.safeParse({ period: '202603', amount: '100' }).success).toBe(false);
  });

  it('rejects invalid amount', () => {
    expect(upsertPlannedAmountSchema.safeParse({ period: '2026-03', amount: '-50' }).success).toBe(false);
    expect(upsertPlannedAmountSchema.safeParse({ period: '2026-03', amount: 'abc' }).success).toBe(false);
  });

  it('accepts amount without decimals', () => {
    expect(upsertPlannedAmountSchema.safeParse({ period: '2026-03', amount: '50000' }).success).toBe(true);
  });

  it('validates cost entry schema', () => {
    const valid = { costCategoryId: 1, period: '2026-03', actualAmount: '45000.00' };
    expect(createCostEntrySchema.safeParse(valid).success).toBe(true);
    expect(createCostEntrySchema.safeParse({ ...valid, costCategoryId: -1 }).success).toBe(false);
  });

  it('validates period query schema', () => {
    expect(periodQuerySchema.safeParse({ period: '2026-03' }).success).toBe(true);
    expect(periodQuerySchema.safeParse({}).success).toBe(true);
    expect(periodQuerySchema.safeParse({ period: 'bad' }).success).toBe(false);
  });

  it('validates batch schema requires min 1 item', () => {
    expect(batchUpsertPlannedAmountsSchema.safeParse({ items: [] }).success).toBe(false);
    expect(batchUpsertPlannedAmountsSchema.safeParse({
      items: [{ costCategoryId: 1, period: '2026-03', amount: '100.00' }],
    }).success).toBe(true);
  });
});
