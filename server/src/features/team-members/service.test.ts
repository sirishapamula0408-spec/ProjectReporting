import { jest, describe, it, expect, beforeEach, beforeAll } from '@jest/globals';

// Mock database before importing service
const mockFindMany = jest.fn<any>();
const mockFindUnique = jest.fn<any>();
const mockCreate = jest.fn<any>();
const mockUpdate = jest.fn<any>();
const mockCount = jest.fn<any>();

jest.unstable_mockModule('../../config/database.js', () => ({
  prisma: {
    teamMember: {
      findMany: mockFindMany,
      findUnique: mockFindUnique,
      create: mockCreate,
      update: mockUpdate,
      count: mockCount,
    },
  },
}));

let listTeamMembers: any;
let getTeamMemberById: any;
let createTeamMember: any;
let updateTeamMember: any;

beforeAll(async () => {
  const service = await import('./service.js');
  listTeamMembers = service.listTeamMembers;
  getTeamMemberById = service.getTeamMemberById;
  createTeamMember = service.createTeamMember;
  updateTeamMember = service.updateTeamMember;
});

describe('teamMemberService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listTeamMembers', () => {
    it('returns paginated results with serialized cost rate', async () => {
      const members = [
        { id: 1, name: 'Alice', role: 'Dev', department: 'Eng', loadedCostRate: { toString: () => '145000.00' }, skills: ['React'], isActive: true, _count: { allocations: 2 } },
        { id: 2, name: 'Bob', role: 'QA', department: 'QA', loadedCostRate: { toString: () => '95000.50' }, skills: [], isActive: true, _count: { allocations: 0 } },
      ];
      mockFindMany.mockResolvedValue(members);
      mockCount.mockResolvedValue(2);

      const result = await listTeamMembers({ page: 1, pageSize: 50 });

      expect(result.data).toHaveLength(2);
      expect(result.data[0].loadedCostRate).toBe('145000.00');
      expect(result.data[0].projectCount).toBe(2);
      expect(result.data[1].projectCount).toBe(0);
      expect(result.meta).toEqual({ total: 2, page: 1, pageSize: 50 });
    });

    it('applies search filter', async () => {
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);

      await listTeamMembers({ search: 'Alice' });

      const findCall = mockFindMany.mock.calls[0]![0] as any;
      expect(findCall.where.OR).toEqual([
        { name: { contains: 'Alice', mode: 'insensitive' } },
        { role: { contains: 'Alice', mode: 'insensitive' } },
        { department: { contains: 'Alice', mode: 'insensitive' } },
      ]);
    });

    it('applies isActive filter', async () => {
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);

      await listTeamMembers({ isActive: true });

      const findCall = mockFindMany.mock.calls[0]![0] as any;
      expect(findCall.where.isActive).toBe(true);
    });

    it('includes _count for projectCount', async () => {
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);

      await listTeamMembers();

      const findCall = mockFindMany.mock.calls[0]![0] as any;
      expect(findCall.include._count.select.allocations).toBe(true);
    });
  });

  describe('getTeamMemberById', () => {
    it('returns a member with serialized cost rate', async () => {
      const member = {
        id: 1, name: 'Alice', role: 'Dev', department: 'Eng',
        loadedCostRate: { toString: () => '145000.00' }, skills: ['React'], isActive: true,
      };
      mockFindUnique.mockResolvedValue(member);

      const result = await getTeamMemberById(1);

      expect(result.data.loadedCostRate).toBe('145000.00');
      expect(result.data.name).toBe('Alice');
    });

    it('throws 404 for missing member', async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(getTeamMemberById(999)).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    });
  });

  describe('createTeamMember', () => {
    it('creates member with Decimal cost rate', async () => {
      const created = {
        id: 1, name: 'Charlie', role: 'Dev', department: 'Eng',
        loadedCostRate: { toString: () => '100000.00' }, skills: ['JS'], isActive: true,
      };
      mockCreate.mockResolvedValue(created);

      const result = await createTeamMember({
        name: 'Charlie', role: 'Dev', department: 'Eng',
        loadedCostRate: '100000.00', skills: ['JS'],
      });

      expect(result.data.name).toBe('Charlie');
      expect(result.data.loadedCostRate).toBe('100000.00');

      const createCall = mockCreate.mock.calls[0]![0] as any;
      expect(createCall.data.name).toBe('Charlie');
      expect(createCall.data.loadedCostRate).toBeDefined();
    });
  });

  describe('updateTeamMember', () => {
    it('updates partial fields', async () => {
      mockFindUnique.mockResolvedValue({ id: 1, name: 'Alice' });
      mockUpdate.mockResolvedValue({
        id: 1, name: 'Alice Updated',
        loadedCostRate: { toString: () => '100.00' },
      });

      const result = await updateTeamMember(1, { name: 'Alice Updated' });

      expect(result.data.name).toBe('Alice Updated');
      expect((mockUpdate.mock.calls[0]![0] as any).data.name).toBe('Alice Updated');
    });

    it('throws 404 for missing member', async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(updateTeamMember(999, { name: 'X' })).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    });

    it('handles isActive update', async () => {
      mockFindUnique.mockResolvedValue({ id: 1, name: 'Alice' });
      mockUpdate.mockResolvedValue({
        id: 1, name: 'Alice', isActive: false,
        loadedCostRate: { toString: () => '100.00' },
      });

      await updateTeamMember(1, { isActive: false });

      expect((mockUpdate.mock.calls[0]![0] as any).data.isActive).toBe(false);
    });
  });
});

describe('Zod validation schemas', () => {
  let createTeamMemberSchema: any;
  let updateTeamMemberSchema: any;

  beforeAll(async () => {
    const validation = await import('./validation.js');
    createTeamMemberSchema = validation.createTeamMemberSchema;
    updateTeamMemberSchema = validation.updateTeamMemberSchema;
  });

  it('rejects missing name', () => {
    const result = createTeamMemberSchema.safeParse({
      role: 'Dev', department: 'Eng', loadedCostRate: '100.00',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid cost rate format', () => {
    const result = createTeamMemberSchema.safeParse({
      name: 'A', role: 'Dev', department: 'Eng', loadedCostRate: 'abc',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid input', () => {
    const result = createTeamMemberSchema.safeParse({
      name: 'Alice', role: 'Dev', department: 'Eng', loadedCostRate: '145000.00',
    });
    expect(result.success).toBe(true);
  });

  it('update schema accepts partial fields', () => {
    const result = updateTeamMemberSchema.safeParse({ name: 'Updated' });
    expect(result.success).toBe(true);
  });

  it('update schema accepts isActive', () => {
    const result = updateTeamMemberSchema.safeParse({ isActive: false });
    expect(result.success).toBe(true);
  });
});
