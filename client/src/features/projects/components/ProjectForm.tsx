import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, NumericTextBox } from '@progress/kendo-react-inputs';
import { DatePicker } from '@progress/kendo-react-dateinputs';
import { Button } from '@progress/kendo-react-buttons';
import { useToast } from '../../../components/shared';
import { ConfirmDialog } from '../../../components/shared';
import { ROUTES } from '../../../config/routes';
import { formatINR } from '../../../config/constants';
import './ProjectForm.css';

const projectFormSchema = z.object({
  code: z.string().min(1, 'Required').max(20),
  name: z.string().min(1, 'Required').max(200),
  client: z.string().min(1, 'Required').max(200),
  contractValue: z.string().min(1, 'Required').regex(/^\d+(\.\d{1,2})?$/),
  startDate: z.string().min(1, 'Required'),
  endDate: z.string().min(1, 'Required'),
  businessUnit: z.string().min(1, 'Required').max(100),
  description: z.string().max(2000).optional().nullable(),
  milestones: z.array(
    z.object({
      name: z.string().min(1, 'Required'),
      amount: z.string().min(1, 'Required').regex(/^\d+(\.\d{1,2})?$/),
      dueDate: z.string().min(1, 'Required'),
    }),
  ).optional(),
});

type ProjectFormData = z.infer<typeof projectFormSchema>;

interface ProjectFormProps {
  mode: 'create' | 'edit';
  defaultValues?: Partial<ProjectFormData>;
  projectId?: number;
  currentStatus?: string;
  onSubmit: (data: ProjectFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function ProjectForm({
  mode,
  defaultValues,
  projectId,
  currentStatus,
  onSubmit,
  isSubmitting = false,
}: ProjectFormProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
    setValue,
    watch,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      code: '',
      name: '',
      client: '',
      contractValue: '',
      startDate: '',
      endDate: '',
      businessUnit: '',
      description: '',
      milestones: [],
      ...defaultValues,
    },
  });

  const { fields: milestoneFields, append: addMilestone, remove: removeMilestone } = useFieldArray({
    control,
    name: 'milestones',
  });

  const handleFormSubmit = async (data: ProjectFormData) => {
    try {
      await onSubmit(data);
      showToast(
        mode === 'create' ? 'Project created successfully' : 'Project updated successfully',
        'success',
      );
    } catch (err: any) {
      showToast(err?.response?.data?.error?.message || 'Failed to save project', 'error');
    }
  };

  const handleDiscard = useCallback(() => {
    if (isDirty) {
      setShowDiscardDialog(true);
    } else {
      navigate(-1);
    }
  }, [isDirty, navigate]);

  return (
    <div className="project-form">
      {/* Header */}
      <div className="project-form__header">
        <div>
          <h1 className="project-form__title">
            {mode === 'create' ? 'Project Setup & Team Management' : 'Edit Project Details'}
          </h1>
          {mode === 'edit' && currentStatus && (
            <span className={`project-form__status project-form__status--${currentStatus.toLowerCase()}`}>
              {currentStatus}
            </span>
          )}
        </div>
        <div className="project-form__actions">
          <Button onClick={handleDiscard} className="btn-secondary">
            Discard
          </Button>
          <Button
            themeColor="primary"
            onClick={handleSubmit(handleFormSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Save Changes' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Unsaved changes warning */}
      {mode === 'edit' && isDirty && (
        <div className="project-form__warning">
          ⚠️ You have unsaved changes. Please save or discard to continue.
        </div>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        {/* Section 1: Project Details */}
        <section className="project-form__section">
          <h2 className="project-form__section-title">Section 1 — Project Details</h2>

          <div className="project-form__grid project-form__grid--3">
            <div className="project-form__field">
              <label>Project Name</label>
              <Input {...register('name')} placeholder="e.g. Q4 Infrastructure Upgrade" />
              {errors.name && <span className="project-form__error">{errors.name.message}</span>}
            </div>
            <div className="project-form__field">
              <label>Project Code</label>
              <Input {...register('code')} placeholder="PRJ-2024-001" disabled={mode === 'edit'} />
              {errors.code && <span className="project-form__error">{errors.code.message}</span>}
            </div>
            <div className="project-form__field">
              <label>Client Name</label>
              <Input {...register('client')} placeholder="Infosys Tech Corp" />
              {errors.client && <span className="project-form__error">{errors.client.message}</span>}
            </div>
          </div>

          <div className="project-form__grid project-form__grid--3">
            <div className="project-form__field">
              <label>Contract Value (₹)</label>
              <Input
                {...register('contractValue')}
                placeholder="85,00,000"
              />
              {errors.contractValue && <span className="project-form__error">{errors.contractValue.message}</span>}
            </div>
            <div className="project-form__field">
              <label>Start Date</label>
              <Input type="date" {...register('startDate')} />
              {errors.startDate && <span className="project-form__error">{errors.startDate.message}</span>}
            </div>
            <div className="project-form__field">
              <label>End Date</label>
              <Input type="date" {...register('endDate')} />
              {errors.endDate && <span className="project-form__error">{errors.endDate.message}</span>}
            </div>
          </div>

          <div className="project-form__grid project-form__grid--2">
            <div className="project-form__field">
              <label>Business Unit</label>
              <Input {...register('businessUnit')} placeholder="Engineering" />
              {errors.businessUnit && <span className="project-form__error">{errors.businessUnit.message}</span>}
            </div>
            <div className="project-form__field">
              <label>Description (optional)</label>
              <Input {...register('description')} placeholder="Project description..." />
            </div>
          </div>
        </section>

        {/* Section 4: Payment Milestones */}
        <section className="project-form__section">
          <div className="project-form__section-header">
            <h2 className="project-form__section-title">Section 4 — Payment Milestones</h2>
            <Button
              type="button"
              className="btn-tertiary"
              onClick={() => addMilestone({ name: '', amount: '', dueDate: '' })}
            >
              + Add Milestone
            </Button>
          </div>

          {milestoneFields.length === 0 && (
            <p className="project-form__empty">No milestones added yet. Click "Add Milestone" to get started.</p>
          )}

          {milestoneFields.map((field, index) => (
            <div key={field.id} className="project-form__milestone-row">
              <div className="project-form__field" style={{ flex: 2 }}>
                <Input
                  {...register(`milestones.${index}.name`)}
                  placeholder="Milestone name"
                />
              </div>
              <div className="project-form__field" style={{ flex: 1 }}>
                <Input
                  {...register(`milestones.${index}.amount`)}
                  placeholder="₹ Amount"
                />
              </div>
              <div className="project-form__field" style={{ flex: 1 }}>
                <Input
                  type="date"
                  {...register(`milestones.${index}.dueDate`)}
                />
              </div>
              <Button
                type="button"
                className="btn-destructive"
                onClick={() => removeMilestone(index)}
              >
                🗑
              </Button>
            </div>
          ))}
        </section>
      </form>

      {/* Discard Confirmation Dialog */}
      <ConfirmDialog
        visible={showDiscardDialog}
        title="Discard Changes"
        message="You have unsaved changes. Are you sure you want to discard them?"
        confirmText="Discard"
        destructive
        onConfirm={() => {
          setShowDiscardDialog(false);
          navigate(-1);
        }}
        onCancel={() => setShowDiscardDialog(false)}
      />
    </div>
  );
}
