// src/api/monitors.ts
import { api } from "./client";

// --- Types ---

export interface Monitor {
  id: string;
  name: string;
  target_url: string;
  check_interval_sec: number;
  is_active: boolean;
  project_id: string; // Полезно иметь project_id в типе
  created_at: string;
  updated_at: string;
}

export interface CreateMonitorPayload {
  name: string;
  target_url: string;
  check_interval_sec: number;
  is_active?: boolean;
}

// Payload для обновления (все поля опциональны)
export interface UpdateMonitorPayload {
  name?: string;
  target_url?: string;
  check_interval_sec?: number;
  is_active?: boolean;
}

// Payload для массовых операций
export interface MonitorIdList {
  ids: string[];
}

// --- API Methods ---

// 1. Получить мониторы проекта
export async function getMonitorsByProject(projectId: string): Promise<Monitor[]> {
  const response = await api.get<Monitor[]>(`/monitors/projects/${projectId}`);
  return response.data;
}

// 2. Создать монитор
export async function createMonitor(
  projectId: string,
  payload: CreateMonitorPayload
): Promise<Monitor> {
  const response = await api.post<Monitor>(
    `/monitors/projects/${projectId}`,
    payload
  );
  return response.data;
}

// 3. Обновить монитор (PUT /api/v1/monitors/{id})
// ПРИМЕЧАНИЕ: Убедитесь, что на бэкенде есть эндпоинт @router.put("/{monitor_id}")
export async function updateMonitor(
  id: string,
  payload: UpdateMonitorPayload
): Promise<Monitor> {
  // Используем PATCH, так как обновляем частично
  const response = await api.patch<Monitor>(`/monitors/${id}`, payload);
  return response.data;
}

// 4. Удалить монитор (DELETE /api/v1/monitors/{id})
// ПРИМЕЧАНИЕ: Если на бэке пока нет Hard Delete, можно использовать этот метод как заглушку для деактивации
export async function deleteMonitor(id: string): Promise<void> {
  await api.delete(`/monitors/${id}`);
}

// 5. Массовая смена статуса (PUT /api/v1/monitors/bulk-set-status?is_active=...)
export async function bulkSetMonitorStatus(
  monitorIds: MonitorIdList,
  isActive: boolean
): Promise<number> {
  const response = await api.put<number>("/monitors/bulk-set-status", monitorIds, {
      params: { is_active: isActive }
  });
  return response.data;
}

// 6. Массовая деактивация (PUT /api/v1/monitors/bulk-deactivate)
export async function bulkDeactivateMonitors(monitorIds: MonitorIdList): Promise<number> {
  const response = await api.put<number>("/monitors/bulk-deactivate", monitorIds);
  return response.data;
}

