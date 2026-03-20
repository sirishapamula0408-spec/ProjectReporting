import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogActionsBar } from '@progress/kendo-react-dialogs';
import { Input, type InputChangeEvent } from '@progress/kendo-react-inputs';
import { Button } from '@progress/kendo-react-buttons';
import { useCreateTeamMember } from '../hooks/useTeamMembers';
import { useToast } from '../../../components/shared';
import './AddTeamMemberDialog.css';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  role: z.string().min(1, 'Role is required').max(100),
  department: z.string().min(1, 'Department is required').max(100),
  loadedCostRate: z.string().min(1, 'Cost rate is required').regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid amount (e.g. 45000.00)'),
  skillsText: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddTeamMemberDialogProps {
  visible: boolean;
  onClose: () => void;
}

export function AddTeamMemberDialog({ visible, onClose }: AddTeamMemberDialogProps) {
  const createMember = useCreateTeamMember();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const { control, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      role: '',
      department: '',
      loadedCostRate: '',
      skillsText: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const skills = (data.skillsText ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await createMember.mutateAsync({
        name: data.name,
        role: data.role,
        department: data.department,
        loadedCostRate: data.loadedCostRate,
        skills,
      });

      showToast('Team member added successfully', 'success');
      reset();
      onClose();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? 'Failed to add team member';
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    reset();
    onClose();
  };

  if (!visible) return null;

  return (
    <Dialog title="Add Team Member" onClose={handleCancel} width={520}>
      <form onSubmit={handleSubmit(onSubmit)} className="add-member-form">
        <div className="add-member-form__field">
          <label className="add-member-form__label">Name *</label>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input
                placeholder="e.g. Rajesh Kumar"
                value={field.value}
                onChange={(e: InputChangeEvent) => field.onChange(e.value)}
                onBlur={field.onBlur}
                valid={!errors.name}
              />
            )}
          />
          {errors.name && <span className="add-member-form__error">{errors.name.message}</span>}
        </div>

        <div className="add-member-form__row">
          <div className="add-member-form__field">
            <label className="add-member-form__label">Role *</label>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Input
                  placeholder="e.g. Lead Developer"
                  value={field.value}
                  onChange={(e: InputChangeEvent) => field.onChange(e.value)}
                  onBlur={field.onBlur}
                  valid={!errors.role}
                />
              )}
            />
            {errors.role && <span className="add-member-form__error">{errors.role.message}</span>}
          </div>

          <div className="add-member-form__field">
            <label className="add-member-form__label">Department *</label>
            <Controller
              name="department"
              control={control}
              render={({ field }) => (
                <Input
                  placeholder="e.g. Engineering"
                  value={field.value}
                  onChange={(e: InputChangeEvent) => field.onChange(e.value)}
                  onBlur={field.onBlur}
                  valid={!errors.department}
                />
              )}
            />
            {errors.department && <span className="add-member-form__error">{errors.department.message}</span>}
          </div>
        </div>

        <div className="add-member-form__field">
          <label className="add-member-form__label">Loaded Cost Rate (₹) *</label>
          <Controller
            name="loadedCostRate"
            control={control}
            render={({ field }) => (
              <Input
                placeholder="e.g. 45000.00"
                value={field.value}
                onChange={(e: InputChangeEvent) => field.onChange(e.value)}
                onBlur={field.onBlur}
                valid={!errors.loadedCostRate}
              />
            )}
          />
          {errors.loadedCostRate && <span className="add-member-form__error">{errors.loadedCostRate.message}</span>}
        </div>

        <div className="add-member-form__field">
          <label className="add-member-form__label">Skills</label>
          <Controller
            name="skillsText"
            control={control}
            render={({ field }) => (
              <Input
                placeholder="e.g. React, TypeScript, Node.js (comma-separated)"
                value={field.value}
                onChange={(e: InputChangeEvent) => field.onChange(e.value)}
                onBlur={field.onBlur}
              />
            )}
          />
          <span className="add-member-form__hint">Separate multiple skills with commas</span>
        </div>
      </form>

      <DialogActionsBar>
        <Button onClick={handleCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button
          themeColor="primary"
          onClick={handleSubmit(onSubmit)}
          disabled={submitting}
          className="add-member-form__submit-btn"
        >
          {submitting ? 'Adding...' : 'Add Team Member'}
        </Button>
      </DialogActionsBar>
    </Dialog>
  );
}
