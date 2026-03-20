import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useHealthUpdates, useRisks, useCreateRisk, useUpsertHealthUpdate } from './useHealth';

vi.mock('../../../config/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn() },
}));

import api from '../../../config/api';
const mockedApi = vi.mocked(api);

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
  return ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: qc }, children);
}

describe('useHealthUpdates', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('calls correct endpoint', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { data: [{ id: 1, period: '2026-03' }] } });
    const { result } = renderHook(() => useHealthUpdates(10), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith('/projects/10/health-updates');
  });

  it('does not fetch when projectId is undefined', () => {
    const { result } = renderHook(() => useHealthUpdates(undefined), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useRisks', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('calls correct endpoint', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { data: [] } });
    const { result } = renderHook(() => useRisks(10), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith('/projects/10/risks');
  });
});

describe('useCreateRisk', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('calls POST and invalidates', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: { data: { id: 1 } } });
    const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: qc }, children);

    const { result } = renderHook(() => useCreateRisk(10), { wrapper });
    result.current.mutate({ description: 'Test', probability: 'LOW', costImpact: '1000.00' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.post).toHaveBeenCalledWith('/projects/10/risks', expect.objectContaining({ description: 'Test' }));
    expect(spy).toHaveBeenCalledWith({ queryKey: ['projects', 10, 'risks'] });
  });
});

describe('useUpsertHealthUpdate', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('calls PUT and invalidates', async () => {
    mockedApi.put.mockResolvedValueOnce({ data: { data: { id: 1 } } });
    const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: qc }, children);

    const { result } = renderHook(() => useUpsertHealthUpdate(10), { wrapper });
    result.current.mutate({ period: '2026-03', achievements: ['Done'], challenges: [], clientSatisfactionRag: 'GREEN' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.put).toHaveBeenCalledWith('/projects/10/health-updates', expect.objectContaining({ period: '2026-03' }));
    expect(spy).toHaveBeenCalledWith({ queryKey: ['projects', 10, 'health-updates'] });
  });
});
