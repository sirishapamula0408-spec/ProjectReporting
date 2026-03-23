import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, type InputChangeEvent } from '@progress/kendo-react-inputs';
import { DatePicker } from '@progress/kendo-react-dateinputs';
import { Button } from '@progress/kendo-react-buttons';
import { useToast } from '../../../components/shared';
import { ConfirmDialog } from '../../../components/shared';
import { ROUTES } from '../../../config/routes';
import { formatINR } from '../../../config/constants';
import { ResourceAssignment } from './ResourceAssignment';
import { BudgetPlanning } from './BudgetPlanning';
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
    control,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
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
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input
                    placeholder="e.g. Q4 Infrastructure Upgrade"
                    value={field.value}
                    onChange={(e: InputChangeEvent) => field.onChange(e.value)}
                    onBlur={field.onBlur}
                  />
                )}
              />
              {errors.name && <span className="project-form__error">{errors.name.message}</span>}
            </div>
            <div className="project-form__field">
              <label>Project Code</label>
              <Controller
                name="code"
                control={control}
                render={({ field }) => (
                  <Input
                    placeholder="PRJ-2024-001"
                    value={field.value}
                    onChange={(e: InputChangeEvent) => field.onChange(e.value)}
                    onBlur={field.onBlur}
                    disabled={mode === 'edit'}
                  />
                )}
              />
              {errors.code && <span className="project-form__error">{errors.code.message}</span>}
            </div>
            <div className="project-form__field">
              <label>Client Name</label>
              <Controller
                name="client"
                control={control}
                render={({ field }) => (
                  <Input
                    placeholder="Infosys Tech Corp"
                    value={field.value}
                    onChange={(e: InputChangeEvent) => field.onChange(e.value)}
                    onBlur={field.onBlur}
                  />
                )}
              />
              {errors.client && <span className="project-form__error">{errors.client.message}</span>}
            </div>
          </div>

          <div className="project-form__grid project-form__grid--3">
            <div className="project-form__field">
              <label>Contract Value (₹)</label>
              <Controller
                name="contractValue"
                control={control}
                render={({ field }) => (
                  <Input
                    placeholder="85,00,000"
                    value={field.value}
                    onChange={(e: InputChangeEvent) => field.onChange(e.value)}
                    onBlur={field.onBlur}
                  />
                )}
              />
              {errors.contractValue && <span className="project-form__error">{errors.contractValue.message}</span>}
            </div>
            <div className="project-form__field">
              <label>Start Date</label>
              <Controller
                name="startDate"
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
              {errors.startDate && <span className="project-form__error">{errors.startDate.message}</span>}
            </div>
            <div className="project-form__field">
              <label>End Date</label>
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
              {errors.endDate && <span className="project-form__error">{errors.endDate.message}</span>}
            </div>
          </div>

          <div className="project-form__grid project-form__grid--2">
            <div className="project-form__field">
              <label>Business Unit</label>
              <Controller
                name="businessUnit"
                control={control}
                render={({ field }) => (
                  <Input
                    placeholder="Engineering"
                    value={field.value}
                    onChange={(e: InputChangeEvent) => field.onChange(e.value)}
                    onBlur={field.onBlur}
                  />
                )}
              />
              {errors.businessUnit && <span className="project-form__error">{errors.businessUnit.message}</span>}
            </div>
            <div className="project-form__field">
              <label>Description (optional)</label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <Input
                    placeholder="Project description..."
                    value={field.value ?? ''}
                    onChange={(e: InputChangeEvent) => field.onChange(e.value)}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </div>
          </div>
        </section>

        {/* Section 2: Resource Assignment */}
        <ResourceAssignment projectId={projectId} mode={mode} projectStartDate={watch('startDate')} projectEndDate={watch('endDate')} />

        {/* Section 3: Budget Planning */}
        <BudgetPlanning projectId={projectId} startDate={watch('startDate')} endDate={watch('endDate')} mode={mode} />

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
                <Controller
                  name={`milestones.${index}.name`}
                  control={control}
                  render={({ field: f }) => (
                    <Input
                      placeholder="Milestone name"
                      value={f.value}
                      onChange={(e: InputChangeEvent) => f.onChange(e.value)}
                      onBlur={f.onBlur}
                    />
                  )}
                />
              </div>
              <div className="project-form__field" style={{ flex: 1 }}>
                <Controller
                  name={`milestones.${index}.amount`}
                  control={control}
                  render={({ field: f }) => (
                    <Input
                      placeholder="₹ Amount"
                      value={f.value}
                      onChange={(e: InputChangeEvent) => f.onChange(e.value)}
                      onBlur={f.onBlur}
                    />
                  )}
                />
              </div>
              <div className="project-form__field" style={{ flex: 1 }}>
                <Controller
                  name={`milestones.${index}.dueDate`}
                  control={control}
                  render={({ field: f }) => (
                    <Input
                      type="date"
                      value={f.value}
                      onChange={(e: InputChangeEvent) => f.onChange(e.value)}
                      onBlur={f.onBlur}
                    />
                  )}
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
