import { useNavigate } from 'react-router-dom';
import { ProjectForm } from './ProjectForm';
import { useCreateProject, useCreateMilestone } from '../hooks/useProjects';
import { Breadcrumbs } from '../../../components/shared';
import { ROUTES } from '../../../config/routes';

export function CreateProjectPage() {
  const navigate = useNavigate();
  const createProject = useCreateProject();
  const createMilestone = useCreateMilestone(0); // Will set after project creation

  const handleSubmit = async (data: { milestones?: Array<{ name: string; amount: string; dueDate: string }>; [key: string]: unknown }) => {
    const { milestones, ...projectData } = data;
    const project = await createProject.mutateAsync(projectData);

    // Create milestones for the new project in parallel
    if (milestones && milestones.length > 0) {
      await Promise.all(
        milestones.map((m: { name: string; amount: string; dueDate: string }) =>
          fetch(`/api/projects/${project.id}/milestones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(m),
          })
        )
      );
    }

    navigate(`/projects/${project.id}/edit`, { replace: true });
  };

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'My Projects', path: ROUTES.PM_DASHBOARD },
          { label: 'New Project' },
        ]}
      />
      <ProjectForm
        mode="create"
        onSubmit={handleSubmit}
        isSubmitting={createProject.isPending}
      />
    </div>
  );
}
