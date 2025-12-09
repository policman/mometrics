import { api } from "./client";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectPayload {
  name: string;
  description?: string | null;
  is_active?: boolean;
}

// Поля опциональны для PATCH запроса
export interface UpdateProjectPayload {
    name?: string;
    description?: string | null;
    is_active?: boolean;
}

export interface ProjectIdList {
    ids: string[];
}

// --- READ ---
export async function getProjects(): Promise<Project[]> {
  const response = await api.get<Project[]>("/projects");
  return response.data;
}

export async function getProject(id: string): Promise<Project> {
    const response = await api.get<Project>(`/projects/${id}`);
    return response.data;
}

// --- CREATE ---
export async function createProject(payload: CreateProjectPayload): Promise<Project> {
  const response = await api.post<Project>("/projects", payload);
  return response.data;
}

// --- UPDATE (PATCH) ---
// ВАЖНО: Используем PATCH, так как на бэке @router.patch
export async function updateProject(id: string, payload: UpdateProjectPayload): Promise<Project> {
    const response = await api.patch<Project>(`/projects/${id}`, payload);
    return response.data;
}

// --- DELETE (Single) ---
export async function deleteProject(id: string): Promise<void> {
    // ВАРИАНТ А: Если на бэке есть реальный @router.delete("/{project_id}")
    // await api.delete(`/projects/${id}`);

    // ВАРИАНТ Б (Soft Delete через PATCH): Если удаление = деактивация
    // Это безопасный вариант, если отдельного DELETE эндпоинта нет
    await updateProject(id, { is_active: false });
}

// --- BULK OPERATIONS ---
export async function bulkSetProjectStatus(projectIds: ProjectIdList, isActive: boolean): Promise<number> {
    const response = await api.put<number>("/projects/bulk-set-status", projectIds, {
        params: { is_active: isActive }
    });
    return response.data;
}

export async function deleteProjects(projectIds: ProjectIdList): Promise<number> {
    // Используем bulk деактивацию как удаление
    return bulkSetProjectStatus(projectIds, false);
}