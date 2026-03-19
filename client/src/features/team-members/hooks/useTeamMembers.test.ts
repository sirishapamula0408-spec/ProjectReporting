import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import {
  useTeamMembers,
  useTeamMember,
  useCreateTeamMember,
  useUpdateTeamMember,
  useProjectAllocations,
  useCreateAllocation,
  useUpdateAllocation,
  useDeleteAllocation,
  useMemberAllocations,
} from './useTeamMembers';

vi.mock('../../../config/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from '../../../config/api';

const mockedApi = vi.mocked(api);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useTeamMembers', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('calls GET /team-members with no params', async () => {
    const mockData = { data: { data: [{ id: 1, name: 'Alice' }], meta: { total: 1 } } };
    mockedApi.get.mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useTeamMembers(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.get).toHaveBeenCalledWith('/team-members', { params: undefined });
    expect(result.current.data).toEqual(mockData.data);
  });

  it('calls GET /team-members with search params', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { data: [], meta: { total: 0 } } });

    const { result } = renderHook(() => useTeamMembers({ search: 'Alice' }), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.get).toHaveBeenCalledWith('/team-members', { params: { search: 'Alice' } });
  });

  it('includes isActive filter when provided', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { data: [], meta: { total: 0 } } });

    const { result } = renderHook(() => useTeamMembers({ isActive: true }), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.get).toHaveBeenCalledWith('/team-members', { params: { isActive: true } });
  });
});

describe('useTeamMember', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('calls GET /team-members/:id', async () => {
    const member = { id: 5, name: 'Bob' };
    mockedApi.get.mockResolvedValueOnce({ data: { data: member } });

    const { result } = renderHook(() => useTeamMember(5), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.get).toHaveBeenCalledWith('/team-members/5');
    expect(result.current.data).toEqual(member);
  });

  it('does not fetch when id is undefined', () => {
    const { result } = renderHook(() => useTeamMember(undefined), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useCreateTeamMember', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('calls POST /team-members and invalidates queries', async () => {
    const newMember = { id: 10, name: 'Charlie' };
    mockedApi.post.mockResolvedValueOnce({ data: { data: newMember } });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useCreateTeamMember(), { wrapper });
    result.current.mutate({ name: 'Charlie', role: 'Dev', department: 'Eng', loadedCostRate: '100000.00' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.post).toHaveBeenCalledWith('/team-members', expect.objectContaining({ name: 'Charlie' }));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['team-members'] });
  });
});

describe('useProjectAllocations', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('uses correct query key and endpoint', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { data: [] } });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useProjectAllocations(42), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.get).toHaveBeenCalledWith('/projects/42/allocations');
    expect(queryClient.getQueryData(['projects', 42, 'allocations'])).toEqual([]);
  });

  it('does not fetch when projectId is undefined', () => {
    const { result } = renderHook(() => useProjectAllocations(undefined), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useCreateAllocation', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('calls POST and invalidates allocation queries', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: { data: { id: 1 } } });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useCreateAllocation(10), { wrapper });
    result.current.mutate({ teamMemberId: 5, allocationPct: '100.00', startDate: '2026-01-01' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.post).toHaveBeenCalledWith('/projects/10/allocations', expect.objectContaining({ teamMemberId: 5 }));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['projects', 10, 'allocations'] });
  });
});

describe('useDeleteAllocation', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('calls DELETE and invalidates queries', async () => {
    mockedApi.delete.mockResolvedValueOnce({});

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useDeleteAllocation(10), { wrapper });
    result.current.mutate(7);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.delete).toHaveBeenCalledWith('/projects/10/allocations/7');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['projects', 10, 'allocations'] });
  });
});

describe('useMemberAllocations', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('calls GET /team-members/:id/allocations', async () => {
    const allocations = [{ id: 1, projectId: 2 }];
    mockedApi.get.mockResolvedValueOnce({ data: { data: allocations } });

    const { result } = renderHook(() => useMemberAllocations(5), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.get).toHaveBeenCalledWith('/team-members/5/allocations');
    expect(result.current.data).toEqual(allocations);
  });

  it('does not fetch when teamMemberId is undefined', () => {
    const { result } = renderHook(() => useMemberAllocations(undefined), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });
});
