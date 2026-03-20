import { jest, describe, it, expect, beforeEach, beforeAll } from '@jest/globals';

const mockFindMany = jest.fn<any>();
const mockFindUnique = jest.fn<any>();
const mockUpsert = jest.fn<any>();
const mockProjectFindUnique = jest.fn<any>();

jest.unstable_mockModule('../../config/database.js', () => ({
  prisma: {
    project: { findUnique: mockProjectFindUnique },
    healthUpdate: { findMany: mockFindMany, findUnique: mockFindUnique, upsert: mockUpsert },
  },
}));

let listHealthUpdates: any;
let upsertHealthUpdate: any;

beforeAll(async () => {
  const service = await import('./service.js');
  listHealthUpdates = service.listHealthUpdates;
  upsertHealthUpdate = service.upsertHealthUpdate;
});

const mockUser = { id: 1, username: 'pm1', role: 'PM' as const, businessUnit: 'BU1', displayName: 'PM One' };
const mockProject = { id: 1, managerId: 1, businessUnit: 'BU1' };

describe('listHealthUpdates', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('returns health updates for a project', async () => {
    mockProjectFindUnique.mockResolvedValue(mockProject);
    mockFindMany.mockResolvedValue([
      { id: 1, projectId: 1, period: '2026-03', achievements: ['Done'], challenges: [], clientSatisfactionRag: 'GREEN', avgResponseTimeDays: { toString: () => '2.50' }, createdAt: new Date(), updatedAt: new Date() },
    ]);

    const result = await listHealthUpdates(1, mockUser);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].period).toBe('2026-03');
  });

  it('throws 404 for missing project', async () => {
    mockProjectFindUnique.mockResolvedValue(null);
    await expect(listHealthUpdates(999, mockUser)).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('Validation schemas', () => {
  let createHealthUpdateSchema: any;

  beforeAll(async () => {
    const v = await import('./validation.js');
    createHealthUpdateSchema = v.createHealthUpdateSchema;
  });

  it('accepts valid health update', () => {
    expect(createHealthUpdateSchema.safeParse({
      period: '2026-03', achievements: ['Done'], challenges: ['Blocker'],
      clientSatisfactionRag: 'GREEN',
    }).success).toBe(true);
  });

  it('rejects invalid RAG', () => {
    expect(createHealthUpdateSchema.safeParse({
      period: '2026-03', achievements: [], challenges: [],
      clientSatisfactionRag: 'BLUE',
    }).success).toBe(false);
  });

  it('rejects invalid period', () => {
    expect(createHealthUpdateSchema.safeParse({
      period: 'bad', achievements: [], challenges: [],
      clientSatisfactionRag: 'GREEN',
    }).success).toBe(false);
  });
});
