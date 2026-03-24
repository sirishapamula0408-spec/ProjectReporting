import { useState, useCallback, useRef } from 'react';
import { Grid, GridColumn, type GridCellProps, type GridPageChangeEvent, type GridSortChangeEvent } from '@progress/kendo-react-grid';
import { Button } from '@progress/kendo-react-buttons';
import { Input, type InputChangeEvent } from '@progress/kendo-react-inputs';
import type { SortDescriptor } from '@progress/kendo-data-query';
import { useTeamMembers, useUpdateTeamMember, useDeactivateTeamMember, type TeamMembersParams } from '../hooks/useTeamMembers';
import { AddTeamMemberDialog } from './AddTeamMemberDialog';
import { SkeletonLoader } from '../../../components/shared';
import { useToast } from '../../../components/shared';
import { useAuth } from '../../../context/AuthContext';
import { formatINR } from '../../../config/constants';
import './TeamRegistryPage.css';

function NameCell(props: GridCellProps) {
  const { name } = props.dataItem;
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  return (
    <td>
      <div className="team-registry__name-cell">
        <span className="team-registry__avatar">{initial}</span>
        <span>{name}</span>
      </div>
    </td>
  );
}

function CostRateCell(props: GridCellProps) {
  return (
    <td className="team-registry__currency-cell">
      {formatINR(props.dataItem.loadedCostRate)}
    </td>
  );
}

function SkillsCell(props: GridCellProps) {
  const skills: string[] = props.dataItem.skills ?? [];
  return (
    <td>
      {skills.map((skill) => (
        <span key={skill} className="team-registry__skill-tag">{skill}</span>
      ))}
    </td>
  );
}

function StatusCell(props: GridCellProps) {
  const isActive: boolean = props.dataItem.isActive;
  return (
    <td>
      <span className={`team-registry__status-badge ${isActive ? 'team-registry__status-badge--active' : 'team-registry__status-badge--inactive'}`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    </td>
  );
}

const skeletonMarginStyle = { marginTop: 24 } as const;

export function TeamRegistryPage() {
  const { user } = useAuth();
  const isPM = user?.role === 'PM';

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Search state
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Sort state
  const [sort, setSort] = useState<SortDescriptor[]>([{ field: 'name', dir: 'asc' }]);

  const params: TeamMembersParams = {
    page,
    pageSize,
    search: search || undefined,
    sortBy: sort[0]?.field || 'name',
    sortDir: sort[0]?.dir || 'asc',
  };

  const { data, isLoading } = useTeamMembers(params);
  const updateMember = useUpdateTeamMember();
  const deactivateMember = useDeactivateTeamMember();
  const { showToast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const editRef = useRef({ name: '', role: '', department: '', loadedCostRate: '' });

  const handleOpenAdd = useCallback(() => setShowAddDialog(true), []);
  const handleCloseAdd = useCallback(() => setShowAddDialog(false), []);

  const handleEdit = useCallback((member: { id: number; name: string; role: string; department: string; loadedCostRate: string }) => {
    editRef.current = { name: member.name, role: member.role, department: member.department, loadedCostRate: member.loadedCostRate };
    setEditingId(member.id);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingId) return;
    const { name } = editRef.current;
    if (!name.trim()) {
      showToast('Name is required', 'error');
      return;
    }
    try {
      await updateMember.mutateAsync({ id: editingId, ...editRef.current });
      showToast('Team member updated', 'success');
      setEditingId(null);
    } catch {
      showToast('Failed to update team member', 'error');
    }
  }, [editingId, updateMember, showToast]);

  const handleDelete = useCallback(async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to deactivate "${name}"?`)) return;
    try {
      await deactivateMember.mutateAsync(id);
      showToast(`${name} has been deactivated`, 'success');
    } catch {
      showToast('Failed to deactivate team member', 'error');
    }
  }, [deactivateMember, showToast]);

  const handlePageChange = useCallback((e: GridPageChangeEvent) => {
    setPage(Math.floor(e.page.skip / e.page.take) + 1);
    setPageSize(e.page.take);
  }, []);

  const handleSortChange = useCallback((e: GridSortChangeEvent) => {
    setSort(e.sort);
    setPage(1);
  }, []);

  const handleSearchSubmit = useCallback(() => {
    setSearch(searchInput);
    setPage(1);
  }, [searchInput]);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setSearch(searchInput);
      setPage(1);
    }
  }, [searchInput]);

  const handleClearSearch = useCallback(() => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  }, []);

  if (isLoading) {
    return (
      <div className="team-registry">
        <SkeletonLoader type="kpi-row" count={3} />
        <div style={skeletonMarginStyle}><SkeletonLoader type="grid" count={5} /></div>
      </div>
    );
  }

  const members = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const skip = (page - 1) * pageSize;

  return (
    <div className="team-registry">
      <div className="team-registry__header">
        <div>
          <h1 className="team-registry__title">Team Member Registry</h1>
          <p className="team-registry__subtitle">
            Manage team members, roles, and cost rates across all enterprise portfolios
          </p>
        </div>
        {isPM && (
          <Button themeColor="primary" onClick={handleOpenAdd}>
            + Add Team Member
          </Button>
        )}
      </div>

      {/* Search bar */}
      <div className="team-registry__toolbar">
        <div className="team-registry__search">
          <Input
            placeholder="Search by name, role, or department..."
            value={searchInput}
            onChange={(e: InputChangeEvent) => setSearchInput(e.value ?? '')}
            onKeyDown={handleSearchKeyDown}
            className="team-registry__search-input"
          />
          <Button themeColor="primary" size="small" onClick={handleSearchSubmit}>
            Search
          </Button>
          {search && (
            <Button fillMode="flat" size="small" onClick={handleClearSearch}>
              Clear
            </Button>
          )}
        </div>
        <span className="team-registry__count">
          {total} member{total !== 1 ? 's' : ''} found
        </span>
      </div>

      {members.length === 0 ? (
        <div className="team-registry__empty">
          <h3>No team members found</h3>
          <p>{search ? `No results for "${search}". Try a different search term.` : 'Add your first team member to get started.'}</p>
        </div>
      ) : (
        <Grid
          data={members}
          sortable
          sort={sort}
          onSortChange={handleSortChange}
          pageable={{ pageSizes: [10, 20, 50] }}
          skip={skip}
          take={pageSize}
          total={total}
          onPageChange={handlePageChange}
          className="team-registry__grid"
        >
          <GridColumn field="name" title="Name" width="200" cell={(props: GridCellProps) => {
            if (editingId === props.dataItem.id) {
              return (
                <td>
                  <input
                    className="team-registry__inline-input"
                    defaultValue={editRef.current.name}
                    onChange={(e) => { editRef.current.name = e.target.value; }}
                  />
                </td>
              );
            }
            return <NameCell {...props} />;
          }} />
          <GridColumn field="role" title="Role" width="140" cell={(props: GridCellProps) => {
            if (editingId === props.dataItem.id) {
              return (
                <td>
                  <input
                    className="team-registry__inline-input"
                    defaultValue={editRef.current.role}
                    onChange={(e) => { editRef.current.role = e.target.value; }}
                  />
                </td>
              );
            }
            return <td>{props.dataItem.role}</td>;
          }} />
          <GridColumn field="department" title="Department" width="140" cell={(props: GridCellProps) => {
            if (editingId === props.dataItem.id) {
              return (
                <td>
                  <input
                    className="team-registry__inline-input"
                    defaultValue={editRef.current.department}
                    onChange={(e) => { editRef.current.department = e.target.value; }}
                  />
                </td>
              );
            }
            return <td>{props.dataItem.department}</td>;
          }} />
          <GridColumn field="loadedCostRate" title="Cost Rate (INR)" width="160" cell={(props: GridCellProps) => {
            if (editingId === props.dataItem.id) {
              return (
                <td>
                  <input
                    className="team-registry__inline-input"
                    defaultValue={editRef.current.loadedCostRate}
                    onChange={(e) => { editRef.current.loadedCostRate = e.target.value; }}
                  />
                </td>
              );
            }
            return <CostRateCell {...props} />;
          }} />
          <GridColumn field="skills" title="Skills" sortable={false} cell={SkillsCell} />
          <GridColumn field="isActive" title="Status" width="100" sortable={false} cell={StatusCell} />
          {isPM && (
            <GridColumn title="Actions" width="130" sortable={false} cell={(props: GridCellProps) => {
              const item = props.dataItem;
              if (editingId === item.id) {
                return (
                  <td>
                    <div className="team-registry__actions">
                      <Button size="small" themeColor="primary" onClick={handleSaveEdit} disabled={updateMember.isPending}>
                        Save
                      </Button>
                      <Button size="small" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  </td>
                );
              }
              return (
                <td>
                  <div className="team-registry__actions">
                    <Button fillMode="flat" size="small" className="team-registry__action-btn team-registry__action-btn--edit" title="Edit" onClick={() => handleEdit(item)}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" />
                      </svg>
                    </Button>
                    <Button fillMode="flat" size="small" className="team-registry__action-btn team-registry__action-btn--delete" title="Delete" onClick={() => handleDelete(item.id, item.name)}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M2 4h12M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M6 7v5M10 7v5" />
                        <path d="M3 4l1 10a1 1 0 001 1h6a1 1 0 001-1l1-10" />
                      </svg>
                    </Button>
                  </div>
                </td>
              );
            }} />
          )}
        </Grid>
      )}

      {isPM && <AddTeamMemberDialog visible={showAddDialog} onClose={handleCloseAdd} />}
    </div>
  );
}
