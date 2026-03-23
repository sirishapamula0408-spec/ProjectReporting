import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@progress/kendo-react-buttons';
import { Input, type InputChangeEvent } from '@progress/kendo-react-inputs';
import { DropDownList, type DropDownListChangeEvent } from '@progress/kendo-react-dropdowns';
import { Dialog, DialogActionsBar } from '@progress/kendo-react-dialogs';
import { useToast } from '../../../components/shared';
import { useAllocations, useCreateAllocation, useDeleteAllocation } from '../hooks/useAllocations';
import { useTeamMembers, type TeamMember } from '../../team-registry/hooks/useTeamMembers';
import './ResourceAssignment.css';

interface ResourceAssignmentProps {
  projectId?: number;
  mode: 'create' | 'edit';
}

interface AddResourceFormData {
  teamMemberId: number | null;
  allocationPct: string;
  startDate: string;
  endDate: string;
}

export function ResourceAssignment({ projectId, mode }: ResourceAssignmentProps) {
  const { showToast } = useToast();
  const [showDialog, setShowDialog] = useState(false);

  const { data: allocations = [], isLoading } = useAllocations(projectId);
  const { data: teamMembersData } = useTeamMembers();
  const createAllocation = useCreateAllocation(projectId ?? 0);
  const deleteAllocation = useDeleteAllocation(projectId ?? 0);

  const teamMembers = teamMembersData?.data ?? [];

  const { control, handleSubmit, reset, formState: { errors } } = useForm<AddResourceFormData>({
    defaultValues: {
      teamMemberId: null,
      allocationPct: '',
      startDate: '',
      endDate: '',
    },
  });

  if (mode === 'create') {
    return (
      <section className="project-form__section">
        <div className="project-form__section-header">
          <h2 className="project-form__section-title">Section 2 — Resource Assignment</h2>
          <span className="project-form__section-hint">Assign team members and define their allocation rates</span>
        </div>
        <div className="resource-assignment__placeholder">
          Click "Save Changes" to create the project, then you'll be redirected to add resources and budget details.
        </div>
      </section>
    );
  }

  const handleAdd = async (data: AddResourceFormData) => {
    if (!data.teamMemberId) return;
    try {
      await createAllocation.mutateAsync({
        teamMemberId: data.teamMemberId,
        allocationPct: data.allocationPct,
        startDate: data.startDate,
        endDate: data.endDate || undefined,
      });
      showToast('Resource assigned successfully', 'success');
      setShowDialog(false);
      reset();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Failed to assign resource';
      showToast(msg, 'error');
    }
  };

  const handleDelete = async (allocationId: number) => {
    try {
      await deleteAllocation.mutateAsync(allocationId);
      showToast('Resource removed', 'success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Failed to remove resource';
      showToast(msg, 'error');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <section className="project-form__section">
      <div className="project-form__section-header">
        <h2 className="project-form__section-title">Section 2 — Resource Assignment</h2>
        <Button type="button" className="btn-tertiary" onClick={() => setShowDialog(true)}>
          + Add Resource
        </Button>
      </div>

      {isLoading ? (
        <p>Loading allocations...</p>
      ) : allocations.length === 0 ? (
        <table className="project-form__resource-table">
          <thead>
            <tr>
              <th>TEAM MEMBER</th>
              <th>ROLE</th>
              <th>ALLOCATION (%)</th>
              <th>START DATE</th>
              <th>END DATE</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} className="project-form__empty-row">
                No resources assigned yet. Click "+ Add Resource" to assign team members.
              </td>
            </tr>
          </tbody>
        </table>
      ) : (
        <table className="project-form__resource-table">
          <thead>
            <tr>
              <th>TEAM MEMBER</th>
              <th>ROLE</th>
              <th>ALLOCATION (%)</th>
              <th>START DATE</th>
              <th>END DATE</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {allocations.map((alloc) => (
              <tr key={alloc.id}>
                <td>
                  <div className="resource-assignment__member">
                    <span className="resource-assignment__avatar">
                      {getInitials(alloc.teamMember?.name ?? '')}
                    </span>
                    {alloc.teamMember?.name}
                  </div>
                </td>
                <td>{alloc.teamMember?.role}</td>
                <td>
                  <div className="resource-assignment__allocation">
                    <div className="resource-assignment__progress-bar">
                      <div
                        className="resource-assignment__progress-fill"
                        style={{ width: `${Math.min(parseFloat(alloc.allocationPct), 100)}%` }}
                      />
                    </div>
                    <span>{alloc.allocationPct}%</span>
                  </div>
                </td>
                <td>{alloc.startDate}</td>
                <td>{alloc.endDate ?? '—'}</td>
                <td>
                  <Button
                    type="button"
                    className="btn-destructive"
                    onClick={() => handleDelete(alloc.id)}
                    disabled={deleteAllocation.isPending}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showDialog && (
        <Dialog title="Add Resource" onClose={() => setShowDialog(false)} width={480}>
          <div className="resource-assignment__dialog-form">
            <div className="resource-assignment__dialog-field">
              <label>Team Member</label>
              <Controller
                name="teamMemberId"
                control={control}
                rules={{ required: 'Please select a team member' }}
                render={({ field }) => (
                  <DropDownList
                    data={teamMembers}
                    textField="name"
                    dataItemKey="id"
                    value={teamMembers.find((m) => m.id === field.value) || null}
                    onChange={(e: DropDownListChangeEvent) => field.onChange(e.value?.id ?? null)}
                    placeholder="Select team member..."
                  />
                )}
              />
              {errors.teamMemberId && (
                <span className="project-form__error">{errors.teamMemberId.message}</span>
              )}
            </div>
            <div className="resource-assignment__dialog-field">
              <label>Allocation (%)</label>
              <Controller
                name="allocationPct"
                control={control}
                rules={{ required: 'Allocation % is required' }}
                render={({ field }) => (
                  <Input
                    placeholder="e.g. 100"
                    value={field.value}
                    onChange={(e: InputChangeEvent) => field.onChange(e.value)}
                    onBlur={field.onBlur}
                  />
                )}
              />
              {errors.allocationPct && (
                <span className="project-form__error">{errors.allocationPct.message}</span>
              )}
            </div>
            <div className="resource-assignment__dialog-field">
              <label>Start Date</label>
              <Controller
                name="startDate"
                control={control}
                rules={{ required: 'Start date is required' }}
                render={({ field }) => (
                  <Input
                    type="date"
                    value={field.value}
                    onChange={(e: InputChangeEvent) => field.onChange(e.value)}
                    onBlur={field.onBlur}
                  />
                )}
              />
              {errors.startDate && (
                <span className="project-form__error">{errors.startDate.message}</span>
              )}
            </div>
            <div className="resource-assignment__dialog-field">
              <label>End Date (optional)</label>
              <Controller
                name="endDate"
                control={control}
                render={({ field }) => (
                  <Input
                    type="date"
                    value={field.value}
                    onChange={(e: InputChangeEvent) => field.onChange(e.value)}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </div>
          </div>
          <DialogActionsBar>
            <Button type="button" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button
              type="button"
              themeColor="primary"
              onClick={handleSubmit(handleAdd)}
              disabled={createAllocation.isPending}
            >
              {createAllocation.isPending ? 'Adding...' : 'Add Resource'}
            </Button>
          </DialogActionsBar>
        </Dialog>
      )}
    </section>
  );
}
