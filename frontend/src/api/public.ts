import axios from 'axios';
import { api } from './client'; // Импортируем инстанс, чтобы взять baseURL

// Импортируем типы. Убедитесь, что путь правильный (обычно './monitors' или './monitor')
// Если у вас файл называется monitors.ts, то путь './monitors'. Если monitor.ts, то './monitor'
import type { Monitor, MonitorStats, CheckResult } from './monitors';

// --- Types for Public Projects ---
export interface PublicProject {
    id: string;
    name: string;
    description: string | null;
    is_active: boolean;
    updated_at: string;
}

// Получаем базовый URL (обычно http://localhost:8000/api/v1)
const BASE_URL = api.defaults.baseURL || import.meta.env.VITE_API_URL;


// ==========================================
// 1. PROJECT APIs (Публичные проекты)
// ==========================================

// Список проектов (для Главной / Landing Page)
export async function getPublicProjects(limit: number = 20, skip: number = 0): Promise<PublicProject[]> {
    const response = await axios.get<PublicProject[]>(`${BASE_URL}/public/projects`, {
         params: { limit, skip }
    });
    return response.data;
}

// Один проект по ID (для Заголовка на странице мониторов) <--- ВОТ ЧЕГО НЕ ХВАТАЛО
export async function getPublicProject(projectId: string): Promise<PublicProject> {
    const response = await axios.get<PublicProject>(`${BASE_URL}/public/projects/${projectId}`);
    return response.data;
}


// ==========================================
// 2. MONITOR APIs (Публичные мониторы)
// ==========================================

// Список мониторов проекта
export async function getPublicMonitors(projectId: string): Promise<Monitor[]> {
    const response = await axios.get<Monitor[]>(`${BASE_URL}/public/projects/${projectId}/monitors`);
    return response.data;
}

// Данные одного монитора
export async function getPublicMonitor(monitorId: string): Promise<Monitor> {
    const response = await axios.get<Monitor>(`${BASE_URL}/public/monitors/${monitorId}`);
    return response.data;
}

// Статистика монитора
export async function getPublicMonitorStats(monitorId: string, fromTs?: Date, toTs?: Date): Promise<MonitorStats> {
    const response = await axios.get<MonitorStats>(`${BASE_URL}/public/monitors/${monitorId}/stats`, {
        params: {
            from_ts: fromTs?.toISOString(),
            to_ts: toTs?.toISOString(),
        }
    });
    return response.data;
}

// История проверок монитора
export async function getPublicChecksHistory(monitorId: string, fromTs: Date, toTs: Date): Promise<CheckResult[]> {
    const response = await axios.get<CheckResult[]>(`${BASE_URL}/public/monitors/${monitorId}/checks-history`, {
        params: {
            from_ts: fromTs.toISOString(),
            to_ts: toTs.toISOString(),
        }
    });
    return response.data;
}