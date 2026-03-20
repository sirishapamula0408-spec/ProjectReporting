import { useState, useCallback } from 'react';
import { Grid, GridColumn, type GridCellProps } from '@progress/kendo-react-grid';
import { Button } from '@progress/kendo-react-buttons';
import { useTeamMembers } from '../hooks/useTeamMembers';
import { AddTeamMemberDialog } from './AddTeamMemberDialog';
import { SkeletonLoader } from '../../../components/shared';
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
        <span key={skill} className="team-registry__skill-tag">
          {skill}
        </span>
      ))}
    </td>
  );
}

function StatusCell(props: GridCellProps) {
  const isActive: boolean = props.dataItem.isActive;
  return (
    <td>
      <span
        className={`team-registry__status-badge ${
          isActive
            ? 'team-registry__status-badge--active'
            : 'team-registry__status-badge--inactive'
        }`}
      >
        {isActive ? 'Active' : 'Inactive'}
      </span>
    </td>
  );
}

const skeletonMarginStyle = { marginTop: 24 } as const;

export function TeamRegistryPage() {
  const { data, isLoading } = useTeamMembers();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const handleOpenAdd = useCallback(() => setShowAddDialog(true), []);
  const handleCloseAdd = useCallback(() => setShowAddDialog(false), []);

  if (isLoading) {
    return (
      <div className="team-registry">
        <SkeletonLoader type="kpi-row" count={3} />
        <div style={skeletonMarginStyle}>
          <SkeletonLoader type="grid" count={5} />
        </div>
      </div>
    );
  }

  const members = data?.data ?? [];

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
          <GridColumn field="name" title="Name" width="220" cell={NameCell} />
          <GridColumn field="role" title="Role" width="150" />
          <GridColumn field="department" title="Department" width="150" />
          <GridColumn
            field="loadedCostRate"
            title="Loaded Cost Rate (INR)"
            width="180"
            cell={CostRateCell}
          />
          <GridColumn field="skills" title="Skills" cell={SkillsCell} />
          <GridColumn
            field="isActive"
            title="Status"
            width="110"
            cell={StatusCell}
          />
        </Grid>
      )}

      <AddTeamMemberDialog visible={showAddDialog} onClose={handleCloseAdd} />
    </div>
  );
}
