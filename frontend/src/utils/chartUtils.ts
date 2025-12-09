import { type CheckResult } from '../api/monitor';

export interface ResponseTimeData {
    name: string;
    'Время ответа (мс)': number | null;
}

export interface HeatmapCellData {
    id: string;
    name: string;
    errorRatio: number;
    totalChecks: number;
    startTime: Date;
    endTime: Date;
    associatedChecks: CheckResult[];
}

/**
 * Агрегирует проверки в сетку 24 часа x 6 (10-минутки) для КОНКРЕТНОЙ ДАТЫ.
 */
export const aggregateChecksToHeatmapDay = (checks: CheckResult[], date: Date): HeatmapCellData[] => {
    if (!Array.isArray(checks)) {
        console.warn("aggregateChecksToHeatmapDay: 'checks' is not an array", checks);
        // Возвращаем пустую сетку, чтобы интерфейс не падал
        return [];
    }

    // Начало дня (00:00:00)
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const MS_PER_TEN_MINUTES = 10 * 60 * 1000;
    const NUM_INTERVALS = 144; // 24 * 6

    const intervals: Record<string, HeatmapCellData> = {};

    // 1. Создаем пустую сетку на весь день (чтобы были серые квадратики там, где нет данных)
    for (let i = 0; i < NUM_INTERVALS; i++) {
        const intervalStartTime = new Date(startOfDay.getTime() + i * MS_PER_TEN_MINUTES);
        const intervalEndTime = new Date(intervalStartTime.getTime() + MS_PER_TEN_MINUTES);
        // Ключ - ISO строка времени начала слота
        const id = intervalStartTime.toISOString();

        intervals[id] = {
            id,
            name: intervalStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            errorRatio: 0,
            totalChecks: 0, // 0 проверок = будет серым
            startTime: intervalStartTime,
            endTime: intervalEndTime,
            associatedChecks: [],
        };
    }

    // 2. Раскладываем проверки по слотам
    checks.forEach(check => {
        const checkTime = new Date(check.checked_at);
        // Пропускаем чеки не за этот день (на всякий случай)
        if (checkTime < startOfDay || checkTime >= new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)) {
            return;
        }

        const timeSinceStart = checkTime.getTime() - startOfDay.getTime();
        const intervalIndex = Math.floor(timeSinceStart / MS_PER_TEN_MINUTES);

        const intervalStartTime = new Date(startOfDay.getTime() + intervalIndex * MS_PER_TEN_MINUTES);
        const id = intervalStartTime.toISOString();

        if (intervals[id]) {
            intervals[id].totalChecks++;
            intervals[id].associatedChecks.push(check);
            if (!check.is_up) {
                // Временно храним кол-во ошибок в errorRatio, потом поделим
                intervals[id].errorRatio++; 
            }
        }
    });

    // 3. Превращаем в массив и считаем финальный процент ошибок
    return Object.values(intervals).map(cell => ({
        ...cell,
        errorRatio: cell.totalChecks > 0 ? cell.errorRatio / cell.totalChecks : 0,
        associatedChecks: cell.associatedChecks.sort((a, b) => new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime()),
    })).sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
};

export const formatChecksForCharts = (checks: CheckResult[]) => {
    if (!Array.isArray(checks)) {
        return { responseTimeData: [] };
    }
    // Сортировка по возрастанию для графика линий
    const sortedChecks = [...checks].sort((a, b) => new Date(a.checked_at).getTime() - new Date(b.checked_at).getTime());

    const responseTimeData: ResponseTimeData[] = sortedChecks.map(c => ({
        name: new Date(c.checked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        'Время ответа (мс)': c.response_time_ms || null,
    })).filter(d => d['Время ответа (мс)'] !== null);

    return { responseTimeData };
};