import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom'
import {
    Alert, Box, Button, Card, CardContent, CircularProgress, Grid as MuiGrid,
    TextField, Typography, Switch, FormControlLabel, IconButton, InputAdornment,
    Paper, Dialog, DialogTitle, DialogContent, DialogActions, Divider, Link,
    Tooltip, Stack, Checkbox, useTheme
} from '@mui/material'

import {
    ArrowBack, Add as AddIcon, Search as SearchIcon, Language as WebIcon,
    Timer as TimerIcon, PlayCircleOutline, PauseCircleOutline, ArrowForwardIos,
    Close as CloseIcon, Edit as EditIcon
    // DeleteIcon удален
} from '@mui/icons-material'

import { getProject } from '../api/projects'
import {
    getMonitorsByProject, createMonitor, updateMonitor, bulkSetMonitorStatus,
    type Monitor, type MonitorIdList
} from '../api/monitors'

export function MonitorsPage() {
    const { projectId } = useParams<{ projectId: string }>()
    const navigate = useNavigate()
    const theme = useTheme()

    const [monitors, setMonitors] = useState<Monitor[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [projectName, setProjectName] = useState('Загрузка...')

    // UI States
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedMonitorIds, setSelectedMonitorIds] = useState<string[]>([])

    // Editing State
    const [monitorToEdit, setMonitorToEdit] = useState<Monitor | null>(null)

    // Form Fields
    const [name, setName] = useState('')
    const [targetUrl, setTargetUrl] = useState('')
    const [intervalSec, setIntervalSec] = useState(60)
    const [isActive, setIsActive] = useState(true)
    const [creating, setCreating] = useState(false)

    const loadMonitors = async () => {
       if (!projectId) return
       try {
          setError(null)
          setLoading(true)
          const projectData = await getProject(projectId)
          setProjectName(projectData.name)
          const data = await getMonitorsByProject(projectId)
          setMonitors(data)
       } catch (err: any) {
          console.error(err)
          setError('Не удалось загрузить данные')
          setProjectName('Ошибка')
       } finally {
          setLoading(false)
       }
    }

    useEffect(() => {
       void loadMonitors()
    }, [projectId])

    useEffect(() => {
        if (projectName && projectName !== 'Загрузка...' && projectName !== 'Ошибка') {
            document.title = `${projectName} | Мониторы | Momertrics`;
        }
    }, [projectName]);

    // --- Filtering ---
    const filteredMonitors = useMemo(() => {
        const lowerQuery = searchQuery.toLowerCase()
        const filtered = monitors.filter(m =>
            m.name.toLowerCase().includes(lowerQuery) ||
            m.target_url.toLowerCase().includes(lowerQuery)
        )
        return filtered.sort((a, b) => (a.is_active === b.is_active ? 0 : a.is_active ? -1 : 1));
    }, [monitors, searchQuery])

    // --- Bulk Actions ---
    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setSelectedMonitorIds(filteredMonitors.map(m => m.id));
        } else {
            setSelectedMonitorIds([]);
        }
    };

    const handleSelectOne = (id: string) => {
        setSelectedMonitorIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleBulkSetStatus = async (status: boolean) => {
        if (selectedMonitorIds.length === 0) return;
        try {
            const payload: MonitorIdList = { ids: selectedMonitorIds };
            await bulkSetMonitorStatus(payload, status);
            setMonitors(prev => prev.map(m =>
                selectedMonitorIds.includes(m.id) ? { ...m, is_active: status } : m
            ));
            setSelectedMonitorIds([]);
        } catch (err) {
            console.error(err);
            alert("Ошибка при массовом обновлении");
            await loadMonitors();
        }
    };

    const isAllSelected = filteredMonitors.length > 0 && selectedMonitorIds.length === filteredMonitors.length;
    const isIndeterminate = selectedMonitorIds.length > 0 && selectedMonitorIds.length < filteredMonitors.length;

    // --- Single Actions ---
    const handleSaveMonitor = async (event?: React.FormEvent) => {
        event?.preventDefault()
        if (!projectId) return

        setCreating(true)
        setError(null)
        try {
            const monitorData = {
                name,
                target_url: targetUrl,
                check_interval_sec: intervalSec,
                is_active: isActive,
            }

            if (monitorToEdit) {
                const updated = await updateMonitor(monitorToEdit.id, monitorData)
                setMonitors(prev => prev.map(m => m.id === updated.id ? updated : m))
            } else {
                const created = await createMonitor(projectId, monitorData)
                setMonitors(prev => [created, ...prev])
            }
            handleCloseDialog()
        } catch (err: any) {
            console.error(err)
            setError(`Не удалось ${monitorToEdit ? 'обновить' : 'создать'} монитор`)
        } finally {
            setCreating(false)
        }
    }

    const handleOpenCreateDialog = () => {
        setName(''); setTargetUrl(''); setIntervalSec(60); setIsActive(true);
        setMonitorToEdit(null);
        setIsDialogOpen(true);
    }

    const handleOpenEditDialog = (monitor: Monitor) => {
        setName(monitor.name); setTargetUrl(monitor.target_url); setIntervalSec(monitor.check_interval_sec); setIsActive(monitor.is_active);
        setMonitorToEdit(monitor);
        setIsDialogOpen(true);
    }

    const handleCloseDialog = () => {
        setMonitorToEdit(null);
        setIsDialogOpen(false);
    }

    if (!projectId) return <Alert severity="error">Проект не найден</Alert>

    return (
       <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto', minHeight: '100vh' }}>

          {/* HEADER */}
          <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
             <IconButton component={RouterLink} to="/app/projects" sx={{ border: '1px solid #30363d' }}>
                <ArrowBack />
             </IconButton>

             <Box sx={{ flexGrow: 1 }}>
                 <Typography variant='h4'>
                     {projectName}
                     <Typography component="span" variant="h4" color="text.secondary" sx={{ ml: 1 }}>
                         / Мониторы
                     </Typography>
                 </Typography>
                 <Typography variant='body2' color='text.secondary'>
                    Список ресурсов для отслеживания
                 </Typography>
             </Box>

             <Button variant="contained" color="success" startIcon={<AddIcon />} onClick={handleOpenCreateDialog}>
                Добавить монитор
             </Button>
          </Box>

          {error && <Alert severity='error' sx={{ mb: 3 }}>{error}</Alert>}

          {/* BULK ACTIONS */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
             {monitors.length > 0 && (
                 <TextField
                    placeholder="Поиск..." size="small" value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    sx={{ maxWidth: 400 }}
                    InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>), }}
                 />
             )}

             <Stack direction="row" spacing={1} sx={{ visibility: selectedMonitorIds.length > 0 ? 'visible' : 'hidden', opacity: selectedMonitorIds.length > 0 ? 1 : 0, transition: 'opacity 0.2s' }}>
                <Button variant="outlined" color="success" size="small" startIcon={<PlayCircleOutline />} onClick={() => void handleBulkSetStatus(true)}>
                    Активировать ({selectedMonitorIds.length})
                </Button>
                <Button variant="outlined" color="warning" size="small" startIcon={<PauseCircleOutline />} onClick={() => void handleBulkSetStatus(false)}>
                    Пауза ({selectedMonitorIds.length})
                </Button>
             </Stack>
          </Box>

          {/* LIST */}
          {loading ? (
             <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>
          ) : filteredMonitors.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center', border: '1px dashed #30363d', bgcolor: 'transparent' }}>
                <WebIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" color="text.secondary">{searchQuery ? 'Мониторы не найдены' : 'В этом проекте нет мониторов'}</Typography>
                {!searchQuery && <Button sx={{ mt: 2 }} onClick={handleOpenCreateDialog}>Создать первый монитор</Button>}
             </Paper>
          ) : (
             <MuiGrid container spacing={2}>
                <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', mb: 1.5, ml: 2 }}>
                    <Checkbox checked={isAllSelected} indeterminate={isIndeterminate} onChange={handleSelectAll} color="primary" size="small" sx={{ mr: 1 }} />
                    <Typography variant="caption" color="text.secondary">Выбрать все ({filteredMonitors.length})</Typography>
                </Box>

                {filteredMonitors.map(monitor => (
                   <MuiGrid item xs={12} md={6} lg={4} key={monitor.id}>
                      <Card
                         onClick={() => navigate(`/app/monitors/${monitor.id}`)}
                         sx={{
                            cursor: 'pointer', height: '100%', position: 'relative',
                            opacity: monitor.is_active ? 1 : 0.6,
                            transition: 'all 0.3s ease',
                            '&:hover': { boxShadow: 6 }
                         }}
                      >
                         <CardContent>
                             <Box sx={{ position: 'absolute', top: 8, left: 8, zIndex: 10 }}>
                                <Checkbox
                                    checked={selectedMonitorIds.includes(monitor.id)}
                                    onChange={() => handleSelectOne(monitor.id)}
                                    onClick={(e) => e.stopPropagation()}
                                    size="small"
                                />
                             </Box>

                             {/* КНОПКИ ДЕЙСТВИЙ (Осталась только Изменить) */}
                             <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Tooltip title={monitor.is_active ? "Активен" : "На паузе"}>
                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: monitor.is_active ? theme.palette.success.main : theme.palette.warning.main, mr: 1 }} />
                                </Tooltip>
                                <Tooltip title="Изменить">
                                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpenEditDialog(monitor); }}>
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                             </Box>

                            <Box sx={{ mt: 4, mb: 1 }}>
                               <Typography variant='h6' noWrap>{monitor.name}</Typography>
                            </Box>

                            <Divider sx={{ my: 1.5 }} />

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                               <WebIcon fontSize="small" color="primary" />
                               <Link href={monitor.target_url} target="_blank" onClick={(e) => e.stopPropagation()} underline="hover" sx={{ fontSize: '0.9rem', color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {monitor.target_url}
                               </Link>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <TimerIcon fontSize="small" color="action" />
                                    <Typography variant='body2' color='text.secondary'>
                                    {monitor.check_interval_sec} сек
                                    </Typography>
                                </Box>
                                <ArrowForwardIos sx={{ fontSize: 14, color: 'text.secondary' }} />
                            </Box>
                         </CardContent>
                      </Card>
                   </MuiGrid>
                ))}
             </MuiGrid>
          )}

          {/* DIALOG */}
          <Dialog open={isDialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="sm">
             <Box component="form" onSubmit={handleSaveMonitor}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   {monitorToEdit ? 'Изменить монитор' : 'Добавить монитор'}
                   <IconButton onClick={handleCloseDialog} size="small"><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent dividers>
                   <TextField autoFocus label='Название' value={name} onChange={e => setName(e.target.value)} fullWidth required margin='dense' />
                   <TextField label='URL (Target)' value={targetUrl} onChange={e => setTargetUrl(e.target.value)} fullWidth required margin='normal' type="url" />
                   <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 2 }}>
                       <TextField label='Интервал (сек)' type='number' value={intervalSec} onChange={e => setIntervalSec(Number(e.target.value))} required size="small" sx={{ width: 150 }} inputProps={{ min: 15 }} />
                       <FormControlLabel control={<Switch checked={isActive} onChange={e => setIsActive(e.target.checked)} color="success" />} label={isActive ? 'Мониторинг активен' : 'Создать выключенным'} />
                   </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                   <Button onClick={handleCloseDialog} color="inherit">Отмена</Button>
                   <Button type='submit' variant='contained' color="success" disabled={creating || !name.trim() || !targetUrl.trim()}>{creating ? 'Сохранение...' : 'Сохранить'}</Button>
                </DialogActions>
             </Box>
          </Dialog>
       </Box>
    )
}