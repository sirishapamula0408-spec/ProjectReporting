import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogActionsBar } from '@progress/kendo-react-dialogs';
import { Input } from '@progress/kendo-react-inputs';
import { Button } from '@progress/kendo-react-buttons';
import { Label, Error as KendoError } from '@progress/kendo-react-labels';
import type { TeamMember } from '../hooks/useTeamMembers';

const teamMemberSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  role: z.string().min(1, 'Role is required').max(100),
  department: z.string().min(1, 'Department is required').max(100),
  loadedCostRate: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal (e.g., 15000.00)'),
  skills: z.string().optional(),
  isActive: z.boolean().optional(),
});

type FormData = z.infer<typeof teamMemberSchema>;

interface TeamMemberFormDialogProps {
  visible: boolean;
  member?: TeamMember | null;
  onClose: () => void;
  onSave: (data: { name: string; role: string; department: string; loadedCostRate: string; skills: string[]; isActive?: boolean }) => void;
  saving?: boolean;
}

export function TeamMemberFormDialog({ visible, member, onClose, onSave, saving }: TeamMemberFormDialogProps) {
  const isEdit = !!member;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: {
      name: '',
      role: '',
      department: '',
      loadedCostRate: '',
      skills: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (visible) {
      if (member) {
        reset({
          name: member.name,
          role: member.role,
          department: member.department,
          loadedCostRate: member.loadedCostRate,
          skills: member.skills.join(', '),
          isActive: member.isActive,
        });
      } else {
        reset({ name: '', role: '', department: '', loadedCostRate: '', skills: '', isActive: true });
      }
    }
  }, [visible, member, reset]);

  const onSubmit = (data: FormData) => {
    const skills = data.skills
      ? data.skills.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    onSave({
      name: data.name,
      role: data.role,
      department: data.department,
      loadedCostRate: data.loadedCostRate,
      skills,
      ...(isEdit && { isActive: data.isActive }),
    });
  };

  if (!visible) return null;

  return (
    <Dialog title={isEdit ? 'Edit Team Member' : 'Add Team Member'} onClose={onClose} width={500}>
      <form onSubmit={handleSubmit(onSubmit)} className="team-member-form">
        <div>
          <Label>Name *</Label>
          <Input {...register('name')} placeholder="Full name" />
          {errors.name && <KendoError>{errors.name.message}</KendoError>}
        </div>

        <div>
          <Label>Role *</Label>
          <Input {...register('role')} placeholder="e.g., Lead Developer" />
          {errors.role && <KendoError>{errors.role.message}</KendoError>}
        </div>

        <div>
          <Label>Department *</Label>
          <Input {...register('department')} placeholder="e.g., Engineering" />
          {errors.department && <KendoError>{errors.department.message}</KendoError>}
        </div>

        <div>
          <Label>Loaded Cost Rate (₹/month) *</Label>
          <Input {...register('loadedCostRate')} placeholder="e.g., 145000.00" />
          {errors.loadedCostRate && <KendoError>{errors.loadedCostRate.message}</KendoError>}
        </div>

        <div>
          <Label>Skills (comma-separated)</Label>
          <Input {...register('skills')} placeholder="e.g., React, TypeScript, Node.js" />
        </div>

        {isEdit && (
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" {...register('isActive')} />
              Active
            </label>
          </div>
        )}

        <DialogActionsBar layout="end">
          <Button type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" themeColor="primary" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Button>
        </DialogActionsBar>
      </form>
    </Dialog>
  );
}
