import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { usePortfolioDashboard, useReviewNotes, useCreateReviewNote } from './usePortfolio';

vi.mock('../../../config/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}));

import api from '../../../config/api';
const mockedApi = vi.mocked(api);

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
  return ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: qc }, children);
}

describe('usePortfolioDashboard', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('calls GET /dashboards/portfolio', async () => {
    const data = { kpis: { totalProjects: 5 }, projects: [] };
    mockedApi.get.mockResolvedValueOnce({ data: { data } });

    const { result } = renderHook(() => usePortfolioDashboard(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith('/dashboards/portfolio');
  });
});

describe('useReviewNotes', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('calls correct endpoint', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { data: [] } });
    const { result } = renderHook(() => useReviewNotes(10), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.get).toHaveBeenCalledWith('/projects/10/review-notes');
  });

  it('does not fetch when projectId is undefined', () => {
    const { result } = renderHook(() => useReviewNotes(undefined), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useCreateReviewNote', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('calls POST and invalidates', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: { data: { id: 1 } } });
    const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: qc }, children);

    const { result } = renderHook(() => useCreateReviewNote(10), { wrapper });
    result.current.mutate({ period: '2026-03', note: 'Looks good', decision: 'Approved' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.post).toHaveBeenCalledWith('/projects/10/review-notes', expect.objectContaining({ note: 'Looks good' }));
    expect(spy).toHaveBeenCalledWith({ queryKey: ['projects', 10, 'review-notes'] });
  });
});
