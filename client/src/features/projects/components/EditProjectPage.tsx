import { useParams, useNavigate } from 'react-router-dom';
import { ProjectForm } from './ProjectForm';
import { useProjectDetail, useUpdateProject, useMilestones } from '../hooks/useProjects';
import { Breadcrumbs } from '../../../components/shared';
import { LoadingSpinner } from '../../../components/shared';
import { ROUTES } from '../../../config/routes';

export function EditProjectPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id!, 10);
  const navigate = useNavigate();

  const { data: project, isLoading: projectLoading } = useProjectDetail(projectId);
  const { data: milestones, isLoading: milestonesLoading } = useMilestones(projectId);
  const updateProject = useUpdateProject(projectId);

  if (projectLoading || milestonesLoading) {
    return <LoadingSpinner fullPage />;
  }

  if (!project) {
    return <div>Project not found</div>;
  }

  const handleSubmit = async (data: any) => {
    const { milestones: _, ...projectData } = data;
    await updateProject.mutateAsync(projectData);
    navigate(`/projects/${projectId}`, { replace: true });
  };

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'My Projects', path: ROUTES.PM_DASHBOARD },
          { label: project.name, path: `/projects/${projectId}` },
          { label: 'Edit' },
        ]}
      />
      <ProjectForm
        mode="edit"
        projectId={projectId}
        currentStatus={project.status}
        defaultValues={{
          code: project.code,
          name: project.name,
          client: project.client,
          contractValue: project.contractValue,
          startDate: project.startDate,
          endDate: project.endDate,
          businessUnit: project.businessUnit,
          description: project.description,
          milestones: milestones?.map((m) => ({
            name: m.name,
            amount: m.amount,
            dueDate: m.dueDate,
          })) ?? [],
        }}
        onSubmit={handleSubmit}
        isSubmitting={updateProject.isPending}
      />
    </div>
  );
}
