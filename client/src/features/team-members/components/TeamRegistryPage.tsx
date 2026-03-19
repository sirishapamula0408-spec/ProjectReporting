import { useState, useCallback, useMemo } from 'react';
import { Grid, GridColumn } from '@progress/kendo-react-grid';
import type { GridDetailRowProps, GridExpandChangeEvent } from '@progress/kendo-react-grid';
import { Button } from '@progress/kendo-react-buttons';
import { Input } from '@progress/kendo-react-inputs';
import { Breadcrumbs, LoadingSpinner, useToast } from '../../../components/shared';
import { formatINR } from '../../../config/constants';
import {
  useTeamMembers,
  useCreateTeamMember,
  useUpdateTeamMember,
  useMemberAllocations,
  type TeamMember,
} from '../hooks/useTeamMembers';
import { TeamMemberFormDialog } from './TeamMemberFormDialog';
import './TeamRegistryPage.css';

/** Expandable detail row showing cross-project allocations */
function MemberAllocationDetail({ dataItem }: GridDetailRowProps) {
  const { data: allocations, isLoading } = useMemberAllocations(dataItem.id);

  if (isLoading) return <div className="member-allocations"><LoadingSpinner size="small" /></div>;

  return (
    <div className="member-allocations">
      <h4 className="member-allocations__title">Project Allocation Details</h4>
      {!allocations || allocations.length === 0 ? (
        <p className="member-allocations__empty">No project allocations</p>
      ) : (
        <Grid data={allocations} style={{ maxWidth: 700 }}>
          <GridColumn field="project.name" title="Project Name" />
          <GridColumn
            field="allocationPct"
            title="Allocation %"
            width={130}
            cell={(props) => (
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 60,
                    height: 6,
                    background: 'var(--color-gray-200)',
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${Math.min(parseFloat(props.dataItem.allocationPct), 100)}%`,
                      height: '100%',
                      background: parseFloat(props.dataItem.allocationPct) > 80
                        ? 'var(--color-amber)'
                        : 'var(--color-primary)',
                      borderRadius: 3,
                    }} />
                  </div>
                  <span>{props.dataItem.allocationPct}%</span>
                </div>
              </td>
            )}
          />
          <GridColumn field="startDate" title="Start Date" width={120} />
          <GridColumn field="endDate" title="End Date" width={120} cell={(props) => (
            <td>{props.dataItem.endDate || '—'}</td>
          )} />
        </Grid>
      )}
    </div>
  );
}

export function TeamRegistryPage() {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [formVisible, setFormVisible] = useState(false);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const { data: membersData, isLoading } = useTeamMembers(
    search ? { search } : undefined,
  );

  const createMember = useCreateTeamMember();
  const updateMemberMutation = useUpdateTeamMember(editMember?.id ?? 0);

  const members = membersData?.data ?? [];

  // Add expanded flag for Kendo Grid detail template
  const gridData = useMemo(
    () => members.map((m) => ({ ...m, expanded: expandedIds.has(m.id) })),
    [members, expandedIds],
  );

  const handleExpandChange = useCallback((e: GridExpandChangeEvent) => {
    const id = e.dataItem.id as number;
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleAdd = useCallback(() => {
    setEditMember(null);
    setFormVisible(true);
  }, []);

  const handleEdit = useCallback((member: TeamMember) => {
    setEditMember(member);
    setFormVisible(true);
  }, []);

  const handleSave = useCallback(async (data: { name: string; role: string; department: string; loadedCostRate: string; skills: string[]; isActive?: boolean }) => {
    try {
      if (editMember) {
        await updateMemberMutation.mutateAsync(data);
        showToast('Team member updated', 'success');
      } else {
        await createMember.mutateAsync(data);
        showToast('Team member created', 'success');
      }
      setFormVisible(false);
      setEditMember(null);
    } catch (err: any) {
      showToast(err?.response?.data?.error?.message || 'Failed to save team member', 'error');
    }
  }, [editMember, updateMemberMutation, createMember, showToast]);

  return (
    <div className="team-registry">
      <Breadcrumbs items={[{ label: 'Team Registry' }]} />

      <div className="team-registry__header">
        <div>
          <h1 className="team-registry__title">Team Member Registry</h1>
          <p className="team-registry__subtitle">
            Manage team members, roles, and cost rates across all enterprise portfolios.
          </p>
        </div>
        <div className="team-registry__actions">
          <Input
            className="team-registry__search"
            placeholder="Search team members..."
            value={search}
            onChange={(e) => setSearch(e.value as string)}
          />
          <Button themeColor="primary" onClick={handleAdd}>
            Add Team Member
          </Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner size="large" />
      ) : (
        <Grid
          data={gridData}
          sortable
          detail={MemberAllocationDetail}
          expandField="expanded"
          onExpandChange={handleExpandChange}
          style={{ minHeight: 400 }}
        >
          <GridColumn
            field="name"
            title="Name"
            width={220}
            cell={(props) => (
              <td>
                <div className="member-name-cell">
                  <div className="member-avatar">
                    {props.dataItem.name.charAt(0).toUpperCase()}
                  </div>
                  {props.dataItem.name}
                </div>
              </td>
            )}
          />
          <GridColumn field="role" title="Role" width={160} />
          <GridColumn field="department" title="Department" width={140} />
          <GridColumn
            field="loadedCostRate"
            title="Loaded Cost Rate"
            width={160}
            cell={(props) => (
              <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {formatINR(props.dataItem.loadedCostRate)}
              </td>
            )}
          />
          <GridColumn
            field="skills"
            title="Skills"
            sortable={false}
            cell={(props) => (
              <td>
                {(props.dataItem.skills as string[]).map((skill) => (
                  <span key={skill} className="skill-chip">{skill}</span>
                ))}
              </td>
            )}
          />
          <GridColumn
            field="isActive"
            title="Status"
            width={100}
            cell={(props) => (
              <td>
                <span className={`status-badge ${props.dataItem.isActive ? 'status-badge--active' : 'status-badge--inactive'}`}>
                  {props.dataItem.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
            )}
          />
          <GridColumn
            field="projectCount"
            title="Projects"
            width={100}
            sortable={false}
            cell={(props) => {
              const count = props.dataItem.projectCount ?? 0;
              return (
                <td>
                  {count > 0 ? (
                    <span className="project-count-badge">{count} project{count !== 1 ? 's' : ''}</span>
                  ) : (
                    <span style={{ color: 'var(--color-gray-400)' }}>—</span>
                  )}
                </td>
              );
            }}
          />
          <GridColumn
            title="Actions"
            width={80}
            sortable={false}
            cell={(props) => (
              <td>
                <Button
                  fillMode="flat"
                  size="small"
                  onClick={() => handleEdit(props.dataItem as TeamMember)}
                >
                  Edit
                </Button>
              </td>
            )}
          />
        </Grid>
      )}

      <TeamMemberFormDialog
        visible={formVisible}
        member={editMember}
        onClose={() => { setFormVisible(false); setEditMember(null); }}
        onSave={handleSave}
        saving={createMember.isPending || updateMemberMutation.isPending}
      />
    </div>
  );
}
