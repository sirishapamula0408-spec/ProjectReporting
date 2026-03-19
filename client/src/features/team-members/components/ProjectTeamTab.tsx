import { useState, useCallback, useEffect, useMemo } from 'react';
import { Grid, GridColumn } from '@progress/kendo-react-grid';
import { Button } from '@progress/kendo-react-buttons';
import { Dialog, DialogActionsBar } from '@progress/kendo-react-dialogs';
import { ComboBox } from '@progress/kendo-react-dropdowns';
import type { ComboBoxFilterChangeEvent } from '@progress/kendo-react-dropdowns';
import { NumericTextBox } from '@progress/kendo-react-inputs';
import { DatePicker } from '@progress/kendo-react-dateinputs';
import { Label, Error as KendoError } from '@progress/kendo-react-labels';
import { LoadingSpinner, ConfirmDialog, useToast } from '../../../components/shared';
import { formatINR } from '../../../config/constants';
import {
  useProjectAllocations,
  useCreateAllocation,
  useUpdateAllocation,
  useDeleteAllocation,
  useTeamMembers,
  type Allocation,
  type TeamMember,
} from '../hooks/useTeamMembers';
import './ProjectTeamTab.css';

interface ProjectTeamTabProps {
  projectId: number;
}

function formatDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function toDateInputString(d: string | null): Date | null {
  if (!d) return null;
  return new Date(d);
}

function toApiDate(d: Date | null): string | null {
  if (!d) return null;
  return d.toISOString().split('T')[0];
}

export function ProjectTeamTab({ projectId }: ProjectTeamTabProps) {
  const { showToast } = useToast();
  const { data: allocations, isLoading } = useProjectAllocations(projectId);
  const createAllocation = useCreateAllocation(projectId);
  const updateAllocation = useUpdateAllocation(projectId);
  const deleteAllocation = useDeleteAllocation(projectId);

  const [addDialogVisible, setAddDialogVisible] = useState(false);
  const [editAllocation, setEditAllocation] = useState<Allocation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Allocation | null>(null);

  // Summary stats
  const stats = useMemo(() => {
    if (!allocations || allocations.length === 0) {
      return { teamSize: 0, totalAllocation: '0', avgCostRate: '0' };
    }
    const totalPct = allocations.reduce((sum, a) => sum + parseFloat(a.allocationPct), 0);
    const avgRate = allocations.reduce((sum, a) => {
      const rate = a.teamMember?.loadedCostRate ? parseFloat(a.teamMember.loadedCostRate) : 0;
      return sum + rate;
    }, 0) / allocations.length;
    return {
      teamSize: allocations.length,
      totalAllocation: totalPct.toFixed(0),
      avgCostRate: avgRate.toFixed(2),
    };
  }, [allocations]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteAllocation.mutateAsync(deleteTarget.id);
      showToast('Team member removed from project', 'success');
    } catch (err: any) {
      showToast(err?.response?.data?.error?.message || 'Failed to remove allocation', 'error');
    }
    setDeleteTarget(null);
  }, [deleteTarget, deleteAllocation, showToast]);

  if (isLoading) return <LoadingSpinner size="large" />;

  return (
    <div className="project-team-tab">
      {/* Summary Cards */}
      <div className="project-team-tab__summary">
        <div className="summary-card">
          <span className="summary-card__label">Team Size</span>
          <span className="summary-card__value">{stats.teamSize}</span>
          <span className="summary-card__unit">members</span>
        </div>
        <div className="summary-card">
          <span className="summary-card__label">Total Allocation</span>
          <span className="summary-card__value summary-card__value--primary">{stats.totalAllocation}%</span>
          <span className="summary-card__unit">aggregated</span>
        </div>
        <div className="summary-card">
          <span className="summary-card__label">Avg Cost Rate</span>
          <span className="summary-card__value">{formatINR(stats.avgCostRate)}</span>
          <span className="summary-card__unit">per month</span>
        </div>
      </div>

      {/* Actions */}
      <div className="project-team-tab__toolbar">
        <Button themeColor="primary" onClick={() => setAddDialogVisible(true)}>
          Add Team Member
        </Button>
      </div>

      {/* Allocation Grid */}
      {!allocations || allocations.length === 0 ? (
        <div className="project-team-tab__empty">
          <p>No team members assigned yet. Click "Add Team Member" to get started.</p>
        </div>
      ) : (
        <Grid data={allocations} style={{ minHeight: 300 }}>
          <GridColumn
            field="teamMember.name"
            title="Name"
            width={200}
            cell={(props) => (
              <td>
                <div className="member-name-cell">
                  <div className="member-avatar">
                    {props.dataItem.teamMember?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  {props.dataItem.teamMember?.name || 'Unknown'}
                </div>
              </td>
            )}
          />
          <GridColumn
            field="teamMember.role"
            title="Role"
            width={140}
          />
          <GridColumn
            field="allocationPct"
            title="Allocation %"
            width={160}
            cell={(props) => {
              const pct = parseFloat(props.dataItem.allocationPct);
              const color = pct >= 100 ? 'var(--color-amber)' : 'var(--color-primary)';
              return (
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 80,
                      height: 8,
                      background: 'var(--color-gray-200)',
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${Math.min(pct, 100)}%`,
                        height: '100%',
                        background: color,
                        borderRadius: 4,
                      }} />
                    </div>
                    <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                      {pct}%
                    </span>
                  </div>
                </td>
              );
            }}
          />
          <GridColumn
            field="startDate"
            title="Start Date"
            width={130}
            cell={(props) => <td>{formatDate(props.dataItem.startDate)}</td>}
          />
          <GridColumn
            field="endDate"
            title="End Date"
            width={130}
            cell={(props) => <td>{formatDate(props.dataItem.endDate)}</td>}
          />
          <GridColumn
            field="onboardingDate"
            title="Onboarding"
            width={130}
            cell={(props) => <td>{formatDate(props.dataItem.onboardingDate)}</td>}
          />
          <GridColumn
            field="offboardingDate"
            title="Offboarding"
            width={130}
            cell={(props) => <td>{formatDate(props.dataItem.offboardingDate)}</td>}
          />
          <GridColumn
            field="teamMember.loadedCostRate"
            title="Cost Rate"
            width={140}
            cell={(props) => (
              <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {props.dataItem.teamMember?.loadedCostRate
                  ? formatINR(props.dataItem.teamMember.loadedCostRate)
                  : '—'}
              </td>
            )}
          />
          <GridColumn
            title="Actions"
            width={120}
            sortable={false}
            cell={(props) => (
              <td>
                <Button fillMode="flat" size="small" onClick={() => setEditAllocation(props.dataItem)}>
                  Edit
                </Button>
                <Button fillMode="flat" size="small" onClick={() => setDeleteTarget(props.dataItem)}
                  style={{ color: 'var(--color-red)' }}>
                  Remove
                </Button>
              </td>
            )}
          />
        </Grid>
      )}

      {/* Allocation Timeline */}
      {allocations && allocations.length > 0 && (
        <AllocationTimeline allocations={allocations} />
      )}

      {/* Add Allocation Dialog */}
      <AddAllocationDialog
        visible={addDialogVisible}
        projectId={projectId}
        onClose={() => setAddDialogVisible(false)}
        onSave={async (data) => {
          try {
            await createAllocation.mutateAsync(data);
            showToast('Team member added to project', 'success');
            setAddDialogVisible(false);
          } catch (err: any) {
            const msg = err?.response?.status === 409
              ? 'This member already has an allocation with the same start date'
              : err?.response?.data?.error?.message || 'Failed to add team member';
            showToast(msg, 'error');
          }
        }}
        saving={createAllocation.isPending}
      />

      {/* Edit Allocation Dialog */}
      <EditAllocationDialog
        visible={!!editAllocation}
        allocation={editAllocation}
        onClose={() => setEditAllocation(null)}
        onSave={async (data) => {
          if (!editAllocation) return;
          try {
            await updateAllocation.mutateAsync({ allocationId: editAllocation.id, data });
            showToast('Allocation updated', 'success');
            setEditAllocation(null);
          } catch (err: any) {
            showToast(err?.response?.data?.error?.message || 'Failed to update allocation', 'error');
          }
        }}
        saving={updateAllocation.isPending}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        visible={!!deleteTarget}
        title="Remove Team Member"
        message={`Remove ${deleteTarget?.teamMember?.name || 'this member'} from the project?`}
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Info Note */}
      <div className="project-team-tab__info-note">
        <span className="project-team-tab__info-icon">ℹ</span>
        Cost rates are from the Team Registry and include overhead multipliers. Monthly costs are calculated based on allocation percentage.
      </div>
    </div>
  );
}

// ─── Add Allocation Dialog ───

interface AddAllocationDialogProps {
  visible: boolean;
  projectId: number;
  onClose: () => void;
  onSave: (data: { teamMemberId: number; allocationPct: string; startDate: string; endDate?: string | null; onboardingDate?: string | null; offboardingDate?: string | null }) => void;
  saving?: boolean;
}

function AddAllocationDialog({ visible, onClose, onSave, saving }: AddAllocationDialogProps) {
  const [memberFilter, setMemberFilter] = useState('');
  const { data: membersData } = useTeamMembers({ isActive: true });
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [pct, setPct] = useState<number | null>(100);
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [onboardingDate, setOnboardingDate] = useState<Date | null>(null);
  const [offboardingDate, setOffboardingDate] = useState<Date | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredMembers = useMemo(() => {
    const all = membersData?.data ?? [];
    if (!memberFilter) return all;
    const lc = memberFilter.toLowerCase();
    return all.filter(
      (m) =>
        m.name.toLowerCase().includes(lc) ||
        m.role.toLowerCase().includes(lc) ||
        m.department.toLowerCase().includes(lc),
    );
  }, [membersData, memberFilter]);

  const handleSubmit = () => {
    const errs: Record<string, string> = {};
    if (!selectedMember) errs.member = 'Select a team member';
    if (!pct || pct <= 0 || pct > 100) errs.pct = 'Must be 1-100';
    if (!startDate) errs.startDate = 'Start date is required';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    onSave({
      teamMemberId: selectedMember!.id,
      allocationPct: pct!.toFixed(2),
      startDate: toApiDate(startDate)!,
      endDate: toApiDate(endDate),
      onboardingDate: toApiDate(onboardingDate),
      offboardingDate: toApiDate(offboardingDate),
    });
  };

  const handleClose = () => {
    setSelectedMember(null);
    setPct(100);
    setStartDate(new Date());
    setEndDate(null);
    setOnboardingDate(null);
    setOffboardingDate(null);
    setErrors({});
    onClose();
  };

  if (!visible) return null;

  return (
    <Dialog title="Add Team Member to Project" onClose={handleClose} width={520}>
      <div style={{ padding: '8px 0' }}>
        <div>
          <Label>Team Member *</Label>
          <ComboBox
            data={filteredMembers}
            textField="name"
            dataItemKey="id"
            filterable
            onFilterChange={(e: ComboBoxFilterChangeEvent) => setMemberFilter(e.filter.value)}
            onChange={(e) => setSelectedMember(e.value)}
            value={selectedMember}
            placeholder="Search team members..."
            itemRender={(_li, itemProps) => (
              <div style={{ padding: '4px 8px' }}>
                <strong>{itemProps.dataItem.name}</strong>
                <span style={{ color: 'var(--color-gray-500)', marginLeft: 8 }}>
                  {itemProps.dataItem.role}, {itemProps.dataItem.department}
                </span>
              </div>
            )}
          />
          {errors.member && <KendoError>{errors.member}</KendoError>}
        </div>

        <div>
          <Label>Allocation % *</Label>
          <NumericTextBox
            value={pct}
            onChange={(e) => setPct(e.value)}
            min={1}
            max={100}
            step={5}
            format="n0"
          />
          {errors.pct && <KendoError>{errors.pct}</KendoError>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <Label>Start Date *</Label>
            <DatePicker value={startDate} onChange={(e) => setStartDate(e.value)} format="dd-MMM-yyyy" />
            {errors.startDate && <KendoError>{errors.startDate}</KendoError>}
          </div>
          <div>
            <Label>End Date</Label>
            <DatePicker value={endDate} onChange={(e) => setEndDate(e.value)} format="dd-MMM-yyyy" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <Label>Onboarding Date</Label>
            <DatePicker value={onboardingDate} onChange={(e) => setOnboardingDate(e.value)} format="dd-MMM-yyyy" />
          </div>
          <div>
            <Label>Offboarding Date</Label>
            <DatePicker value={offboardingDate} onChange={(e) => setOffboardingDate(e.value)} format="dd-MMM-yyyy" />
          </div>
        </div>
      </div>
      <DialogActionsBar layout="end">
        <Button type="button" onClick={handleClose}>Cancel</Button>
        <Button themeColor="primary" onClick={handleSubmit} disabled={saving}>
          {saving ? 'Adding...' : 'Add Member'}
        </Button>
      </DialogActionsBar>
    </Dialog>
  );
}

// ─── Edit Allocation Dialog ───

interface EditAllocationDialogProps {
  visible: boolean;
  allocation: Allocation | null;
  onClose: () => void;
  onSave: (data: { allocationPct?: string; startDate?: string; endDate?: string | null; onboardingDate?: string | null; offboardingDate?: string | null }) => void;
  saving?: boolean;
}

function EditAllocationDialog({ visible, allocation, onClose, onSave, saving }: EditAllocationDialogProps) {
  const [pct, setPct] = useState<number | null>(100);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [onboardingDate, setOnboardingDate] = useState<Date | null>(null);
  const [offboardingDate, setOffboardingDate] = useState<Date | null>(null);

  // Sync state when allocation changes
  useEffect(() => {
    if (allocation) {
      setPct(parseFloat(allocation.allocationPct));
      setStartDate(toDateInputString(allocation.startDate));
      setEndDate(toDateInputString(allocation.endDate));
      setOnboardingDate(toDateInputString(allocation.onboardingDate));
      setOffboardingDate(toDateInputString(allocation.offboardingDate));
    }
  }, [allocation]);

  if (!visible || !allocation) return null;

  return (
    <Dialog
      title={`Edit Allocation — ${allocation.teamMember?.name || 'Member'}`}
      onClose={onClose}
      width={520}
    >
      <div style={{ padding: '8px 0' }}>
        <div>
          <Label>Allocation %</Label>
          <NumericTextBox value={pct} onChange={(e) => setPct(e.value)} min={1} max={100} step={5} format="n0" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <Label>Start Date</Label>
            <DatePicker value={startDate} onChange={(e) => setStartDate(e.value)} format="dd-MMM-yyyy" />
          </div>
          <div>
            <Label>End Date</Label>
            <DatePicker value={endDate} onChange={(e) => setEndDate(e.value)} format="dd-MMM-yyyy" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <Label>Onboarding Date</Label>
            <DatePicker value={onboardingDate} onChange={(e) => setOnboardingDate(e.value)} format="dd-MMM-yyyy" />
          </div>
          <div>
            <Label>Offboarding Date</Label>
            <DatePicker value={offboardingDate} onChange={(e) => setOffboardingDate(e.value)} format="dd-MMM-yyyy" />
          </div>
        </div>
      </div>
      <DialogActionsBar layout="end">
        <Button type="button" onClick={onClose}>Cancel</Button>
        <Button
          themeColor="primary"
          disabled={saving}
          onClick={() => {
            onSave({
              allocationPct: pct?.toFixed(2),
              startDate: toApiDate(startDate) ?? undefined,
              endDate: toApiDate(endDate),
              onboardingDate: toApiDate(onboardingDate),
              offboardingDate: toApiDate(offboardingDate),
            });
          }}
        >
          {saving ? 'Saving...' : 'Update'}
        </Button>
      </DialogActionsBar>
    </Dialog>
  );
}

// ─── Allocation Timeline (Gantt-style) ───

function AllocationTimeline({ allocations }: { allocations: Allocation[] }) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();
  const yearStart = new Date(currentYear, 0, 1).getTime();
  const yearEnd = new Date(currentYear, 11, 31).getTime();
  const totalMs = yearEnd - yearStart;

  return (
    <div className="allocation-timeline">
      <h3 className="allocation-timeline__title">Allocation Timeline</h3>
      <div className="allocation-timeline__chart">
        {/* Month headers */}
        <div className="allocation-timeline__months">
          <div className="allocation-timeline__label-col" />
          {months.map((m) => (
            <div key={m} className="allocation-timeline__month">{m}</div>
          ))}
        </div>

        {/* Bars */}
        {allocations.map((a) => {
          const start = Math.max(new Date(a.startDate).getTime(), yearStart);
          const end = a.endDate
            ? Math.min(new Date(a.endDate).getTime(), yearEnd)
            : yearEnd;
          const leftPct = ((start - yearStart) / totalMs) * 100;
          const widthPct = ((end - start) / totalMs) * 100;

          const onboard = a.onboardingDate ? new Date(a.onboardingDate).getTime() : null;
          const offboard = a.offboardingDate ? new Date(a.offboardingDate).getTime() : null;

          return (
            <div key={a.id} className="allocation-timeline__row">
              <div className="allocation-timeline__label-col">
                {a.teamMember?.name || 'Unknown'}
              </div>
              <div className="allocation-timeline__bar-area">
                <div
                  className="allocation-timeline__bar"
                  style={{ left: `${leftPct}%`, width: `${Math.max(widthPct, 1)}%` }}
                />
                {onboard && onboard >= yearStart && onboard <= yearEnd && (
                  <div
                    className="allocation-timeline__marker allocation-timeline__marker--onboard"
                    style={{ left: `${((onboard - yearStart) / totalMs) * 100}%` }}
                    title={`Onboarding: ${a.onboardingDate}`}
                  />
                )}
                {offboard && offboard >= yearStart && offboard <= yearEnd && (
                  <div
                    className="allocation-timeline__marker allocation-timeline__marker--offboard"
                    style={{ left: `${((offboard - yearStart) / totalMs) * 100}%` }}
                    title={`Offboarding: ${a.offboardingDate}`}
                  />
                )}
              </div>
            </div>
          );
        })}

        {/* Legend */}
        <div className="allocation-timeline__legend">
          <span><span className="legend-dot legend-dot--onboard" /> Onboarding Marker</span>
          <span><span className="legend-dot legend-dot--offboard" /> Offboarding Marker</span>
          <span><span className="legend-bar" /> Active Allocation</span>
        </div>
      </div>
    </div>
  );
}
