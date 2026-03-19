import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TeamRegistryPage } from './TeamRegistryPage';
import { formatINR } from '../../../config/constants';

vi.mock('../../../components/shared', () => ({
  Breadcrumbs: ({ items }: { items: Array<{ label: string }> }) =>
    createElement('nav', { 'data-testid': 'breadcrumbs' }, items.map((i) => i.label).join(' / ')),
  LoadingSpinner: ({ size }: { size: string }) =>
    createElement('div', { 'data-testid': 'loading-spinner', 'data-size': size }, 'Loading...'),
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('./TeamRegistryPage.css', () => ({}));

vi.mock('./TeamMemberFormDialog', () => ({
  TeamMemberFormDialog: ({ visible }: { visible: boolean }) =>
    visible ? createElement('div', { 'data-testid': 'team-member-form-dialog' }, 'Form Dialog') : null,
}));

const mockUseTeamMembers = vi.fn();
const mockUseCreateTeamMember = vi.fn();
const mockUseUpdateTeamMember = vi.fn();
const mockUseMemberAllocations = vi.fn();

vi.mock('../hooks/useTeamMembers', () => ({
  useTeamMembers: (...args: unknown[]) => mockUseTeamMembers(...args),
  useCreateTeamMember: () => mockUseCreateTeamMember(),
  useUpdateTeamMember: () => mockUseUpdateTeamMember(),
  useMemberAllocations: (...args: unknown[]) => mockUseMemberAllocations(...args),
}));

const sampleMembers = [
  {
    id: 1, name: 'Priya Sharma', role: 'Lead Developer', department: 'Engineering',
    loadedCostRate: '145000.00', skills: ['React', 'TypeScript', 'Node.js'],
    isActive: true, projectCount: 2, createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  {
    id: 2, name: 'Rahul Patel', role: 'QA Engineer', department: 'Quality',
    loadedCostRate: '95000.50', skills: ['Selenium', 'Jest'],
    isActive: false, projectCount: 0, createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
  {
    id: 3, name: 'Anita Desai', role: 'Designer', department: 'Design',
    loadedCostRate: '1250000.00', skills: [],
    isActive: true, projectCount: 1, createdAt: '2026-01-01', updatedAt: '2026-01-01',
  },
];

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

function setupMocks(overrides?: { membersData?: typeof sampleMembers; isLoading?: boolean }) {
  const { membersData = sampleMembers, isLoading = false } = overrides ?? {};

  mockUseTeamMembers.mockReturnValue({
    data: { data: membersData, meta: { total: membersData.length } },
    isLoading,
  });
  mockUseCreateTeamMember.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
  mockUseUpdateTeamMember.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
  mockUseMemberAllocations.mockReturnValue({ data: [], isLoading: false });
}

describe('TeamRegistryPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders loading spinner when data is loading', () => {
    setupMocks({ isLoading: true });
    render(createElement(TeamRegistryPage), { wrapper: createWrapper() });
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('renders the page title and subtitle', () => {
    setupMocks();
    render(createElement(TeamRegistryPage), { wrapper: createWrapper() });
    expect(screen.getByText('Team Member Registry')).toBeInTheDocument();
    expect(screen.getByText(/Manage team members, roles, and cost rates/)).toBeInTheDocument();
  });

  it('renders team member names in the grid', () => {
    setupMocks();
    render(createElement(TeamRegistryPage), { wrapper: createWrapper() });
    expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    expect(screen.getByText('Rahul Patel')).toBeInTheDocument();
    expect(screen.getByText('Anita Desai')).toBeInTheDocument();
  });

  it('renders roles and departments', () => {
    setupMocks();
    render(createElement(TeamRegistryPage), { wrapper: createWrapper() });
    expect(screen.getByText('Lead Developer')).toBeInTheDocument();
    expect(screen.getByText('QA Engineer')).toBeInTheDocument();
    expect(screen.getByText('Engineering')).toBeInTheDocument();
  });

  it('renders skills as chips', () => {
    setupMocks();
    render(createElement(TeamRegistryPage), { wrapper: createWrapper() });
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Selenium')).toBeInTheDocument();
  });

  it('renders Active/Inactive status badges', () => {
    setupMocks();
    render(createElement(TeamRegistryPage), { wrapper: createWrapper() });
    expect(screen.getAllByText('Active').length).toBe(2);
    expect(screen.getAllByText('Inactive').length).toBe(1);
  });

  it('renders "Add Team Member" button', () => {
    setupMocks();
    render(createElement(TeamRegistryPage), { wrapper: createWrapper() });
    expect(screen.getByText('Add Team Member')).toBeInTheDocument();
  });

  it('opens form dialog when "Add Team Member" is clicked', async () => {
    setupMocks();
    const user = userEvent.setup();
    render(createElement(TeamRegistryPage), { wrapper: createWrapper() });

    expect(screen.queryByTestId('team-member-form-dialog')).not.toBeInTheDocument();
    await user.click(screen.getByText('Add Team Member'));
    expect(screen.getByTestId('team-member-form-dialog')).toBeInTheDocument();
  });

  it('renders search input', () => {
    setupMocks();
    render(createElement(TeamRegistryPage), { wrapper: createWrapper() });
    expect(screen.getByPlaceholderText('Search team members...')).toBeInTheDocument();
  });

  it('passes search value to useTeamMembers', async () => {
    setupMocks();
    const user = userEvent.setup();
    render(createElement(TeamRegistryPage), { wrapper: createWrapper() });

    const searchInput = screen.getByPlaceholderText('Search team members...');
    await user.type(searchInput, 'Priya');

    const lastCall = mockUseTeamMembers.mock.calls[mockUseTeamMembers.mock.calls.length - 1];
    expect(lastCall[0]).toEqual({ search: 'Priya' });
  });

  it('renders formatted INR cost rates', () => {
    setupMocks();
    render(createElement(TeamRegistryPage), { wrapper: createWrapper() });
    const formatted = formatINR('145000.00');
    expect(screen.getByText(formatted)).toBeInTheDocument();
  });

  it('renders Edit buttons for each member', () => {
    setupMocks();
    render(createElement(TeamRegistryPage), { wrapper: createWrapper() });
    expect(screen.getAllByText('Edit').length).toBe(sampleMembers.length);
  });

  it('renders member avatar initials', () => {
    setupMocks();
    render(createElement(TeamRegistryPage), { wrapper: createWrapper() });
    expect(screen.getByText('P')).toBeInTheDocument();
    expect(screen.getByText('R')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('renders project count badges', () => {
    setupMocks();
    render(createElement(TeamRegistryPage), { wrapper: createWrapper() });
    expect(screen.getByText('2 projects')).toBeInTheDocument();
    expect(screen.getByText('1 project')).toBeInTheDocument();
  });
});

describe('formatINR', () => {
  it('formats with Indian numbering and rupee symbol', () => {
    expect(formatINR(1250000)).toMatch(/12,50,000\.00/);
    expect(formatINR(1250000)).toContain('₹');
  });

  it('formats string values', () => {
    expect(formatINR('145000.00')).toMatch(/1,45,000\.00/);
    expect(formatINR('145000.00')).toContain('₹');
  });

  it('uses Indian grouping (lakhs/crores)', () => {
    expect(formatINR('1250000')).toMatch(/12,50,000/);
  });
});
