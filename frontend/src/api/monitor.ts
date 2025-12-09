// src/api/monitor.ts
import { api } from './client'

export interface Monitor {
	id: string
	name: string
	target_url: string
	check_interval_sec: number
	is_active: boolean
	created_at: string
	updated_at: string
}

export interface CheckResult {
	id: string
	monitor_id: string
	status_code: number | null
	response_time_ms: number | null
	error_message: string | null
	created_at: string
}

export interface MonitorStats {
	uptime_24h: number // in percentage
	avg_response_ms: number | null
	last_status: 'up' | 'down' | 'unknown'
	last_check_at: string | null
}

export async function getMonitor(id: string): Promise<Monitor> {
	const r = await api.get(`/monitors/${id}`)
	return r.data
}

export async function getMonitorStats(id: string): Promise<MonitorStats> {
	const r = await api.get(`/monitors/${id}/stats`)
	return r.data
}

export async function getMonitorChecks(
	id: string,
	limit = 20
): Promise<CheckResult[]> {
	const r = await api.get(`/monitors/${id}/checks`, {
		params: { limit },
	})
	return r.data
}

export const getMonitorChecksHistory = async (id: string, from: Date, to: Date): Promise<CheckResult[]> => {
    const response = await api.get<CheckResult[]>(`/monitors/${id}/checks-history`, {
        params: {
            from_ts: from.toISOString(),
            to_ts: to.toISOString()
        }
    });
    return response.data;
};