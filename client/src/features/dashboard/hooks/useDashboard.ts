import { useQuery } from '@tanstack/react-query';
import api from '../../../config/api';

/** PM Dashboard Landing Page data */
export function usePMDashboard() {
  return useQuery({
    queryKey: ['dashboards', 'pm'],
    queryFn: async () => {
      const res = await api.get('/dashboards/pm');
      return res.data.data;
    },
  });
}

/** Single Project Dashboard data (for Overview tab) */
export function useProjectDashboard(projectId: number) {
  return useQuery({
    queryKey: ['dashboards', 'project', projectId],
    queryFn: async () => {
      const res = await api.get(`/dashboards/project/${projectId}`);
      return res.data.data;
    },
    enabled: projectId > 0,
  });
}
