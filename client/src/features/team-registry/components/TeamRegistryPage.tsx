import { useState, useCallback } from 'react';
import { Grid, GridColumn, type GridCellProps } from '@progress/kendo-react-grid';
import { Button } from '@progress/kendo-react-buttons';
import { Input, type InputChangeEvent } from '@progress/kendo-react-inputs';
import { useTeamMembers, useUpdateTeamMember, useDeleteTeamMember } from '../hooks/useTeamMembers';
import { AddTeamMemberDialog } from './AddTeamMemberDialog';
import { SkeletonLoader } from '../../../components/shared';
import { useToast } from '../../../components/shared';
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
  const { data, isLoading } = useTeamMembers();
  const updateMember = useUpdateTeamMember();
  const deleteMember = useDeleteTeamMember();
  const { showToast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<{ name: string; role: string; department: string; loadedCostRate: string }>({ name: '', role: '', department: '', loadedCostRate: '' });

  const handleOpenAdd = useCallback(() => setShowAddDialog(true), []);
  const handleCloseAdd = useCallback(() => setShowAddDialog(false), []);

  const handleEdit = useCallback((member: { id: number; name: string; role: string; department: string; loadedCostRate: string }) => {
    setEditingId(member.id);
    setEditData({ name: member.name, role: member.role, department: member.department, loadedCostRate: member.loadedCostRate });
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditData({ name: '', role: '', department: '', loadedCostRate: '' });
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingId) return;
    try {
      await updateMember.mutateAsync({ id: editingId, ...editData });
      showToast('Team member updated', 'success');
      setEditingId(null);
    } catch {
      showToast('Failed to update team member', 'error');
    }
  }, [editingId, editData, updateMember, showToast]);

  const handleDelete = useCallback(async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to deactivate "${name}"?`)) return;
    try {
      await deleteMember.mutateAsync(id);
      showToast(`${name} has been deactivated`, 'success');
    } catch {
      showToast('Failed to deactivate team member', 'error');
    }
  }, [deleteMember, showToast]);

  if (isLoading) {
    return (
      <div className="team-registry">
        <SkeletonLoader type="kpi-row" count={3} />
        <div style={skeletonMarginStyle}><SkeletonLoader type="grid" count={5} /></div>
      </div>
    );
  }

  const members = data?.data ?? [];

  // Inline edit cell renderers
  function EditableNameCell(props: GridCellProps) {
    const item = props.dataItem;
    if (editingId === item.id) {
      return (
        <td>
          <Input
            value={editData.name}
            onChange={(e: InputChangeEvent) => setEditData((d) => ({ ...d, name: String(e.value) }))}
            style={{ width: '100%' }}
          />
        </td>
      );
    }
    return <NameCell {...props} />;
  }

  function EditableRoleCell(props: GridCellProps) {
    if (editingId === props.dataItem.id) {
      return (
        <td>
          <Input
            value={editData.role}
            onChange={(e: InputChangeEvent) => setEditData((d) => ({ ...d, role: String(e.value) }))}
            style={{ width: '100%' }}
          />
        </td>
      );
    }
    return <td>{props.dataItem.role}</td>;
  }

  function EditableDeptCell(props: GridCellProps) {
    if (editingId === props.dataItem.id) {
      return (
        <td>
          <Input
            value={editData.department}
            onChange={(e: InputChangeEvent) => setEditData((d) => ({ ...d, department: String(e.value) }))}
            style={{ width: '100%' }}
          />
        </td>
      );
    }
    return <td>{props.dataItem.department}</td>;
  }

  function EditableCostCell(props: GridCellProps) {
    if (editingId === props.dataItem.id) {
      return (
        <td>
          <Input
            value={editData.loadedCostRate}
            onChange={(e: InputChangeEvent) => setEditData((d) => ({ ...d, loadedCostRate: String(e.value) }))}
            style={{ width: '100%' }}
          />
        </td>
      );
    }
    return <CostRateCell {...props} />;
  }

  function ActionsCell(props: GridCellProps) {
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
          <button className="team-registry__action-btn team-registry__action-btn--edit" title="Edit" onClick={() => handleEdit(item)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" />
            </svg>
          </button>
          <button className="team-registry__action-btn team-registry__action-btn--delete" title="Delete" onClick={() => handleDelete(item.id, item.name)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 4h12M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M6 7v5M10 7v5" />
              <path d="M3 4l1 10a1 1 0 001 1h6a1 1 0 001-1l1-10" />
            </svg>
          </button>
        </div>
      </td>
    );
  }

  return (
    <div className="team-registry">
      <div className="team-registry__header">
        <div>
          <h1 className="team-registry__title">Team Member Registry</h1>
          <p className="team-registry__subtitle">
            Manage team members, roles, and cost rates across all enterprise portfolios
          </p>
        </div>
        <Button themeColor="primary" onClick={handleOpenAdd}>
          + Add Team Member
        </Button>
      </div>

      {members.length === 0 ? (
        <div className="team-registry__empty">
          <h3>No team members found</h3>
          <p>Add your first team member to get started.</p>
        </div>
      ) : (
        <Grid
          data={members}
          sortable
          pageable={{ pageSizes: [10, 20, 50] }}
          className="team-registry__grid"
        >
          <GridColumn field="name" title="Name" width="200" cell={EditableNameCell} />
          <GridColumn field="role" title="Role" width="140" cell={EditableRoleCell} />
          <GridColumn field="department" title="Department" width="140" cell={EditableDeptCell} />
          <GridColumn field="loadedCostRate" title="Cost Rate (INR)" width="160" cell={EditableCostCell} />
          <GridColumn field="skills" title="Skills" cell={SkillsCell} />
          <GridColumn field="isActive" title="Status" width="100" cell={StatusCell} />
          <GridColumn title="Actions" width="120" cell={ActionsCell} />
        </Grid>
      )}

      <AddTeamMemberDialog visible={showAddDialog} onClose={handleCloseAdd} />
    </div>
  );
}
