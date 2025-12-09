import { useEffect, useState, useMemo } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    Alert,
    Box,
    Card,
    CardContent,
    CircularProgress,
    Grid,
    Typography,
    Paper,
    TextField,
    Tooltip as MuiTooltip,
    Collapse,
    IconButton,
    Chip,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControlLabel,
    Switch,
    Stack,
    Link,
    useTheme
} from '@mui/material';

import {
    CheckCircleOutline,
    ErrorOutline,
    ArrowBack,
    Refresh,
    Edit as EditIcon,
    Delete as DeleteIcon,
    PlayCircleOutline,
    PauseCircleOutline,
    Close as CloseIcon,
    Language as WebIcon
} from '@mui/icons-material';

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

// Импортируем функции чтения (они у вас были в api/monitor.ts)
import {
    getMonitor,
    getMonitorStats,
    getMonitorChecksHistory,
    type Monitor, // Интерфейс монитора
    type CheckResult,
    type MonitorStats,
} from '../api/monitor';

// Импортируем функции записи (которые мы добавили в api/monitors.ts)
import { updateMonitor, deleteMonitor } from '../api/monitors';

import {
    formatChecksForCharts,
    aggregateChecksToHeatmapDay,
    type HeatmapCellData
} from '../utils/chartUtils';

// --- HEATMAP COMPONENT ---
interface HeatmapProps {
    heatmapData: HeatmapCellData[];
    onCellClick: (cell: HeatmapCellData) => void;
    selectedCellId: string | null;
}

const AvailabilityHeatmap = ({ heatmapData, onCellClick, selectedCellId }: HeatmapProps) => {
    const theme = useTheme();

    const hoursData = useMemo(() => {
        const chunks = [];
        for (let i = 0; i < 24; i++) {
            chunks.push(heatmapData.slice(i * 6, (i + 1) * 6));
        }
        return chunks;
    }, [heatmapData]);

    const minuteLabels = [':00', ':10', ':20', ':30', ':40', ':50'];
    const CELL_SIZE = 14;
    const GAP = 3;

    const getColor = (cell: HeatmapCellData) => {
        if (cell.totalChecks === 0) return '#21262d';
        if (cell.errorRatio === 0) return '#238636';
        if (cell.errorRatio < 0.3) return '#d29922';
        return '#da3633';
    };

    return (
        <Box sx={{ display: 'flex', overflowX: 'auto', pb: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${GAP}px`, mt: '24px', mr: 1 }}>
                {minuteLabels.map(label => (
                    <Typography key={label} variant="caption" sx={{ height: CELL_SIZE, lineHeight: `${CELL_SIZE}px`, fontSize: '10px', color: 'text.secondary' }}>
                        {label}
                    </Typography>
                ))}
            </Box>

            <Box sx={{ display: 'flex', gap: `${GAP}px` }}>
                {hoursData.map((hourCells, hIdx) => (
                    <Box key={hIdx} sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="caption" sx={{ height: 24, textAlign: 'center', color: 'text.secondary', fontSize: '10px' }}>
                            {hIdx.toString().padStart(2, '0')}
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${GAP}px` }}>
                            {hourCells.map(cell => {
                                const isSelected = selectedCellId === cell.id;
                                return (
                                    <MuiTooltip
                                        key={cell.id}
                                        title={`${cell.name} — Чеков: ${cell.totalChecks}`}
                                        arrow
                                    >
                                        <Box
                                            onClick={() => cell.totalChecks > 0 && onCellClick(cell)}
                                            sx={{
                                                width: CELL_SIZE,
                                                height: CELL_SIZE,
                                                bgcolor: getColor(cell),
                                                borderRadius: '2px',
                                                cursor: cell.totalChecks > 0 ? 'pointer' : 'default',
                                                border: isSelected ? `2px solid ${theme.palette.primary.main}` : '1px solid transparent',
                                                '&:hover': { opacity: 0.8 }
                                            }}
                                        />
                                    </MuiTooltip>
                                );
                            })}
                        </Box>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};


export function MonitorPage() {
    const { monitorId } = useParams<{ monitorId: string }>();
    const navigate = useNavigate();

    // --- STATE ---
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

    const [monitor, setMonitor] = useState<Monitor | null>(null);
    const [stats, setStats] = useState<MonitorStats | null>(null);
    const [checks, setChecks] = useState<CheckResult[]>([]);

    const [selectedInterval, setSelectedInterval] = useState<HeatmapCellData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Dialog States
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Edit Form State
    const [editName, setEditName] = useState('');
    const [editUrl, setEditUrl] = useState('');
    const [editInterval, setEditInterval] = useState(60);
    const [editActive, setEditActive] = useState(true);


    // --- FETCH DATA ---
    const fetchData = async () => {
        if (!monitorId) return;
        try {
            setError(null);
            // 1. Monitor & Stats
            const [m, s] = await Promise.all([
                getMonitor(monitorId),
                getMonitorStats(monitorId)
            ]);
            setMonitor(m);
            setStats(s);

            // 2. Checks History
            const start = new Date(selectedDate);
            start.setHours(0,0,0,0);
            const end = new Date(selectedDate);
            end.setHours(23,59,59,999);

            const history = await getMonitorChecksHistory(monitorId, start, end);
            setChecks(history);

        } catch (e: any) {
            console.error(e);
            setError('Не удалось загрузить данные монитора');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [monitorId, selectedDate]);


    // --- HANDLERS ---

    // 1. Открытие диалога редактирования
    const handleOpenEdit = () => {
        if (!monitor) return;
        setEditName(monitor.name);
        setEditUrl(monitor.target_url);
        setEditInterval(monitor.check_interval_sec);
        setEditActive(monitor.is_active);
        setIsEditOpen(true);
    };

    // 2. Сохранение изменений
    const handleSaveMonitor = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!monitor) return;

        try {
            setProcessing(true);
            const updated = await updateMonitor(monitor.id, {
                name: editName,
                target_url: editUrl,
                check_interval_sec: editInterval,
                is_active: editActive
            });
            setMonitor(updated); // Обновляем локальный стейт
            setIsEditOpen(false);
        } catch (err) {
            console.error(err);
            alert('Ошибка при обновлении монитора');
        } finally {
            setProcessing(false);
        }
    };

    // 3. Быстрое переключение статуса (из хедера или диалога)
    // Можно использовать внутри диалога handleSaveMonitor,
    // но если хотим переключать прямо с хедера, нужна отдельная функция.
    const handleToggleStatus = async () => {
        if (!monitor) return;
        try {
            // Оптимистичное обновление
            const newStatus = !monitor.is_active;
            setMonitor({ ...monitor, is_active: newStatus });

            await updateMonitor(monitor.id, { is_active: newStatus });
        } catch (err) {
            console.error(err);
            // Откат
            setMonitor({ ...monitor!, is_active: !monitor!.is_active });
        }
    }

    // 4. Удаление
    const handleDeleteMonitor = async () => {
        if (!monitor) return;
        try {
            setProcessing(true);
            await deleteMonitor(monitor.id);
            // Редирект обратно к списку мониторов проекта
            navigate(`/app/projects/${monitor.project_id}/monitors`);
        } catch (err) {
            console.error(err);
            alert('Ошибка при удалении');
            setProcessing(false);
        }
    };


    // --- MEMOIZED DATA ---
    const { responseTimeData, heatmapData, intervalChecks } = useMemo(() => {
        const { responseTimeData } = formatChecksForCharts(checks);
        const heatmapData = aggregateChecksToHeatmapDay(checks, new Date(selectedDate));
        return {
            responseTimeData,
            heatmapData,
            intervalChecks: selectedInterval ? selectedInterval.associatedChecks : []
        };
    }, [checks, selectedDate, selectedInterval]);


    if (loading && !monitor) return <Box sx={{p:4, display:'flex', justifyContent:'center'}}><CircularProgress /></Box>;
    if (!monitor) return <Alert severity="error">{error || 'Монитор не найден'}</Alert>;

    const isUp = stats?.last_status_up;
    const statusColor = isUp ? 'success.main' : 'error.main';

    return (
        <Box sx={{ p: 3, maxWidth: 1600, mx: 'auto' }}>

            {/* HEADER */}
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <IconButton component={RouterLink} to={`/app/projects/${monitor.project_id}/monitors`} sx={{ border: '1px solid #30363d' }}>
                        <ArrowBack />
                    </IconButton>

                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Typography variant="h5" fontWeight="bold">{monitor.name}</Typography>
                            {/* Статус Chip */}
                            <Chip
                                label={monitor.is_active ? "Активен" : "На паузе"}
                                color={monitor.is_active ? "success" : "default"}
                                size="small"
                                icon={monitor.is_active ? <PlayCircleOutline /> : <PauseCircleOutline />}
                                variant="outlined"
                            />
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <WebIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: 16 }} />
                            <Link href={monitor.target_url} target="_blank" color="text.secondary" underline="hover">
                                {monitor.target_url}
                            </Link>
                        </Box>
                    </Box>

                    <Box sx={{ flexGrow: 1 }} />

                    {/* ACTIONS */}
                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="outlined"
                            color="inherit"
                            startIcon={<EditIcon />}
                            onClick={handleOpenEdit}
                        >
                            Изменить
                        </Button>
                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => setIsDeleteOpen(true)}
                        >
                            Удалить
                        </Button>
                        <Tooltip title="Обновить данные">
                            <IconButton onClick={fetchData} sx={{ border: '1px solid #30363d' }}>
                                <Refresh />
                            </IconButton>
                        </Tooltip>
                    </Stack>
            </Box>

            {/* ROW 1: SUMMARY (Left) + HEATMAP (Right) */}
            <Grid container spacing={3} alignItems="stretch">

                {/* LEFT: SUMMARY CARD */}
                <Grid item xs={12} lg={3}>
                    <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                        <Box sx={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, bgcolor: statusColor }} />

                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            {isUp ? <CheckCircleOutline color="success" sx={{ fontSize: 32, mr: 1.5 }} />
                                    : <ErrorOutline color="error" sx={{ fontSize: 32, mr: 1.5 }} />}
                            <Typography variant="h3" fontWeight="bold" color={statusColor}>
                                {isUp ? 'UP' : 'DOWN'}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography color="text.secondary">Uptime (24h)</Typography>
                                <Typography fontWeight="bold">{stats?.uptime_percent.toFixed(2)}%</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography color="text.secondary">Ср. отклик</Typography>
                                <Typography fontWeight="bold">{stats?.avg_response_time_ms ? stats.avg_response_time_ms.toFixed(0) : '-'} мс</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography color="text.secondary">Интервал</Typography>
                                <Typography>{monitor.check_interval_sec} сек</Typography>
                            </Box>
                        </Box>

                        <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: 'block' }}>
                            Посл. проверка: {stats?.last_check_at ? new Date(stats.last_check_at).toLocaleTimeString() : 'N/A'}
                        </Typography>
                    </Paper>
                </Grid>

                {/* RIGHT: HEATMAP + DATE PICKER */}
                <Grid item xs={12} lg={9}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">Доступность</Typography>
                            <TextField
                                type="date"
                                size="small"
                                value={selectedDate}
                                onChange={(e) => {
                                    setSelectedDate(e.target.value);
                                    setSelectedInterval(null);
                                }}
                                sx={{
                                    '& input::-webkit-calendar-picker-indicator': { filter: 'invert(1)' }
                                }}
                            />
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
                            <AvailabilityHeatmap
                                heatmapData={heatmapData}
                                selectedCellId={selectedInterval?.id || null}
                                onCellClick={cell => setSelectedInterval(prev => prev?.id === cell.id ? null : cell)}
                            />
                        </Box>
                         <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
                            <Box sx={{display:'flex', alignItems:'center', gap: 1}}>
                                <Box sx={{width:10, height:10, bgcolor:'#21262d', borderRadius: '2px'}}/>
                                <Typography variant="caption">Нет данных</Typography>
                            </Box>
                            <Box sx={{display:'flex', alignItems:'center', gap: 1}}>
                                <Box sx={{width:10, height:10, bgcolor:'#238636', borderRadius: '2px'}}/>
                                <Typography variant="caption">Отлично</Typography>
                            </Box>
                            <Box sx={{display:'flex', alignItems:'center', gap: 1}}>
                                <Box sx={{width:10, height:10, bgcolor:'#da3633', borderRadius: '2px'}}/>
                                <Typography variant="caption">Ошибка</Typography>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* ROW 2: SELECTED INTERVAL DETAILS */}
            <Collapse in={!!selectedInterval}>
                <Paper sx={{ mt: 3, p: 2, borderLeft: '4px solid #58a6ff' }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Детали интервала: {selectedInterval?.startTime.toLocaleTimeString()} — {selectedInterval?.endTime.toLocaleTimeString()}
                    </Typography>
                    <Grid container spacing={2}>
                        {intervalChecks.map(check => (
                            <Grid item xs={12} sm={6} md={3} key={check.id}>
                                <Paper sx={{ p: 1.5, bgcolor: '#0d1117' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            {new Date(check.checked_at).toLocaleTimeString()}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: check.is_up ? 'success.light' : 'error.light',
                                                fontWeight: 'bold',
                                                border: `1px solid ${check.is_up ? '#238636' : '#da3633'}`,
                                                borderRadius: 1,
                                                px: 0.5
                                            }}
                                        >
                                            {check.is_up ? `UP ${check.status_code || ''}` : 'DOWN'}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2">
                                        {check.response_time_ms ? `${check.response_time_ms} ms` : 'timeout'}
                                    </Typography>
                                    {check.error_message && (
                                        <Typography variant="caption" color="error" sx={{display:'block', mt:0.5}}>
                                            {check.error_message}
                                        </Typography>
                                    )}
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Paper>
            </Collapse>

            {/* ROW 3: CHART */}
            <Paper sx={{ mt: 3, p: 3 }}>
                <Typography variant="h6" gutterBottom>График времени ответа (за день)</Typography>
                <Box sx={{ height: 300, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={responseTimeData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                            <XAxis dataKey="name" stroke="#8b949e" tick={{fontSize: 12}} />
                            <YAxis stroke="#8b949e" tick={{fontSize: 12}} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d' }}
                                itemStyle={{ color: '#c9d1d9' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="Время ответа (мс)"
                                stroke="#58a6ff"
                                dot={false}
                                strokeWidth={2}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </Box>
            </Paper>

            {/* --- EDIT DIALOG --- */}
            <Dialog
             open={isEditOpen}
             onClose={() => setIsEditOpen(false)}
             fullWidth
             maxWidth="sm"
            >
                <Box component="form" onSubmit={handleSaveMonitor}>
                    <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        Настройки монитора
                        <IconButton onClick={() => setIsEditOpen(false)} size="small">
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent dividers>
                        <TextField
                            autoFocus
                            label='Название'
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            fullWidth
                            required
                            margin='dense'
                        />
                        <TextField
                            label='URL (Target)'
                            value={editUrl}
                            onChange={e => setEditUrl(e.target.value)}
                            fullWidth
                            required
                            margin='normal'
                        />
                         <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 2 }}>
                            <TextField
                                label='Интервал (сек)'
                                type='number'
                                value={editInterval}
                                onChange={e => setEditInterval(Number(e.target.value))}
                                required
                                size="small"
                                sx={{ width: 150 }}
                                inputProps={{ min: 10 }}
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={editActive}
                                        onChange={e => setEditActive(e.target.checked)}
                                        color="success"
                                    />
                                }
                                label={editActive ? 'Мониторинг активен' : 'Мониторинг на паузе'}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setIsEditOpen(false)} color="inherit">Отмена</Button>
                        <Button type="submit" variant="contained" color="primary" disabled={processing}>
                            {processing ? 'Сохранение...' : 'Сохранить'}
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>

            {/* --- DELETE CONFIRMATION --- */}
            <Dialog
                open={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>Удалить монитор?</DialogTitle>
                <DialogContent>
                    <Typography>
                        Вы уверены, что хотите удалить монитор <b>{monitor.name}</b>?
                        История проверок будет потеряна навсегда.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsDeleteOpen(false)} color="inherit">Отмена</Button>
                    <Button onClick={handleDeleteMonitor} color="error" variant="contained" disabled={processing}>
                        {processing ? 'Удаление...' : 'Удалить'}
                    </Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
}