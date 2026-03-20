import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import {
  useCostCategories,
  usePlannedAmounts,
  useCostEntries,
  useVariance,
  useBurnRate,
  useCostDashboard,
  useBatchUpsertPlannedAmounts,
  useBatchUpsertCostEntries,
} from './useCosts';

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
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useCostCategories', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('calls GET /projects/:id/cost-categories', async () => {
    const cats = [{ id: 1, categoryType: 'EMPLOYEE_SALARY' }];
    mockedApi.get.mockResolvedValueOnce({ data: { data: cats } });

    const { result } = renderHook(() => useCostCategories(10), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.get).toHaveBeenCalledWith('/projects/10/cost-categories');
    expect(result.current.data).toEqual(cats);
  });

  it('does not fetch when projectId is undefined', () => {
    const { result } = renderHook(() => useCostCategories(undefined), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('usePlannedAmounts', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('calls GET with period param', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { data: [] } });

    const { result } = renderHook(() => usePlannedAmounts(10, '2026-03'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.get).toHaveBeenCalledWith(
      '/projects/10/cost-categories/planned-amounts',
      { params: { period: '2026-03' } },
    );
  });

  it('calls GET without period when not provided', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { data: [] } });

    const { result } = renderHook(() => usePlannedAmounts(10), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.get).toHaveBeenCalledWith(
      '/projects/10/cost-categories/planned-amounts',
      { params: undefined },
    );
  });
});

describe('useCostEntries', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('calls GET with period param', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { data: [] } });

    const { result } = renderHook(() => useCostEntries(10, '2026-03'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.get).toHaveBeenCalledWith(
      '/projects/10/cost-categories/cost-entries',
      { params: { period: '2026-03' } },
    );
  });

  it('does not fetch when projectId is undefined', () => {
    const { result } = renderHook(() => useCostEntries(undefined), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useVariance', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('calls GET with period query param', async () => {
    const variance = { period: '2026-03', categories: [], totals: {} };
    mockedApi.get.mockResolvedValueOnce({ data: { data: variance } });

    const { result } = renderHook(() => useVariance(10, '2026-03'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.get).toHaveBeenCalledWith(
      '/projects/10/cost-categories/variance',
      { params: { period: '2026-03' } },
    );
  });

  it('does not fetch when period is empty', () => {
    const { result } = renderHook(() => useVariance(10, ''), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useBurnRate', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('calls GET /projects/:id/cost-categories/burn-rate', async () => {
    const data = { contractValue: '1000000.00', periods: [] };
    mockedApi.get.mockResolvedValueOnce({ data: { data } });

    const { result } = renderHook(() => useBurnRate(10), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.get).toHaveBeenCalledWith('/projects/10/cost-categories/burn-rate');
    expect(result.current.data).toEqual(data);
  });
});

describe('useCostDashboard', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('calls GET /projects/:id/cost-categories/dashboard', async () => {
    const data = { contractValue: '1000000.00', totalSpend: '500000.00' };
    mockedApi.get.mockResolvedValueOnce({ data: { data } });

    const { result } = renderHook(() => useCostDashboard(10), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.get).toHaveBeenCalledWith('/projects/10/cost-categories/dashboard');
  });
});

describe('useBatchUpsertPlannedAmounts', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('calls PUT and invalidates queries on success', async () => {
    mockedApi.put.mockResolvedValueOnce({ data: { data: [] } });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useBatchUpsertPlannedAmounts(10), { wrapper });
    const items = [{ costCategoryId: 1, period: '2026-03', amount: '50000.00' }];
    result.current.mutate(items);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.put).toHaveBeenCalledWith(
      '/projects/10/cost-categories/planned-amounts',
      { items },
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['projects', 10] });
  });
});

describe('useBatchUpsertCostEntries', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('calls PUT and invalidates queries on success', async () => {
    mockedApi.put.mockResolvedValueOnce({ data: { data: [] } });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useBatchUpsertCostEntries(10), { wrapper });
    const items = [{ costCategoryId: 1, period: '2026-03', actualAmount: '45000.00' }];
    result.current.mutate(items);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.put).toHaveBeenCalledWith(
      '/projects/10/cost-categories/cost-entries',
      { items },
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['projects', 10] });
  });
});
