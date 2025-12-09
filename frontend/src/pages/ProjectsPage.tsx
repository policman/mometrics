import { useNavigate } from 'react-router-dom'
import { useEffect, useState, useMemo } from 'react'
import {
    Alert, Box, Button, Card, CardContent, CircularProgress, Grid as MuiGrid,
    TextField, Typography, Dialog, DialogTitle, DialogContent, DialogActions,
    IconButton, InputAdornment, Paper, Checkbox, Tooltip, Stack, useTheme,
    FormControlLabel, Switch
} from '@mui/material'

import {
    Add as AddIcon,
    FolderOpen as FolderIcon,
    ArrowForwardIos as ArrowIcon,
    Search as SearchIcon,
    Close as CloseIcon,
    PlayCircleOutline,
    PauseCircleOutline,
    Edit as EditIcon
    // DeleteIcon удален
} from '@mui/icons-material'

import {
    getProjects, createProject, updateProject, bulkSetProjectStatus,
    type Project
} from '../api/projects'

export function ProjectsPage() {
    const navigate = useNavigate()
    const theme = useTheme()

    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // UI States
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([])

    // Editing State
    const [projectToEdit, setProjectToEdit] = useState<Project | null>(null)

    // Form States
    const [formName, setFormName] = useState('')
    const [formDesc, setFormDesc] = useState('')
    const [formActive, setFormActive] = useState(true)
    const [processing, setProcessing] = useState(false)

    // --- Data Loading ---
    const loadProjects = async () => {
        try {
            setError(null)
            setLoading(true)
            const data = await getProjects()
            setProjects(data)
        } catch (err: any) {
            console.error(err)
            setError('Не удалось загрузить проекты')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void loadProjects()
    }, [])

    // --- Handlers: Dialogs ---
    const handleOpenCreate = () => {
        setProjectToEdit(null);
        setFormName(''); setFormDesc(''); setFormActive(true);
        setIsDialogOpen(true);
    }

    const handleOpenEdit = (project: Project) => {
        setProjectToEdit(project);
        setFormName(project.name); setFormDesc(project.description || ''); setFormActive(project.is_active);
        setIsDialogOpen(true);
    }

    // --- Handlers: Save ---
    const handleSaveProject = async (event?: React.FormEvent) => {
        if (event) event.preventDefault()
        if (!formName.trim()) return

        try {
            setProcessing(true)
            setError(null)

            const payload = {
                name: formName.trim(),
                description: formDesc.trim() || null,
                is_active: formActive
            }

            if (projectToEdit) {
                const updated = await updateProject(projectToEdit.id, payload)
                setProjects(prev => prev.map(p => p.id === updated.id ? updated : p))
            } else {
                const created = await createProject(payload)
                setProjects(prev => [created, ...prev])
            }
            setIsDialogOpen(false)
        } catch (err: any) {
            console.error(err)
            setError(`Не удалось ${projectToEdit ? 'обновить' : 'создать'} проект`)
        } finally {
            setProcessing(false)
        }
    }

    // --- Handlers: Selection ---
    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setSelectedProjectIds(filteredProjects.map(p => p.id));
        } else {
            setSelectedProjectIds([]);
        }
    };

    const handleSelectOne = (projectId: string) => {
        setSelectedProjectIds(prev =>
            prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId]
        );
    };

    // --- Handlers: Bulk Status ---
    const handleBulkSetStatus = async (isActive: boolean) => {
        if (selectedProjectIds.length === 0) return;
        try {
            await bulkSetProjectStatus({ ids: selectedProjectIds }, isActive);
            setProjects(prev => prev.map(p => selectedProjectIds.includes(p.id) ? { ...p, is_active: isActive } : p));
            setSelectedProjectIds([]);
        } catch (err) {
            console.error(err);
            await loadProjects();
        }
    };

    // --- Filtering ---
    const filteredProjects = useMemo(() => {
        const query = searchQuery.toLowerCase();
        const filtered = projects.filter(p =>
            p.name.toLowerCase().includes(query) ||
            (p.description && p.description.toLowerCase().includes(query))
        );
        return filtered.sort((a, b) => {
            if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    }, [projects, searchQuery])

    const isAllSelected = filteredProjects.length > 0 && selectedProjectIds.length === filteredProjects.length;
    const isIndeterminate = selectedProjectIds.length > 0 && selectedProjectIds.length < filteredProjects.length;

    return (
        <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto', minHeight: '100vh' }}>

            {/* HEADER */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant='h4'>Мои Проекты</Typography>
                    <Typography variant='body2' color='text.secondary'>
                        Управляйте своими мониторами и ресурсами
                    </Typography>
                </Box>
                <Button variant="contained" color="success" startIcon={<AddIcon />} onClick={handleOpenCreate}>
                    Новый Проект
                </Button>
            </Box>

            {error && <Alert severity='error' sx={{ mb: 3 }}>{error}</Alert>}

            {/* ACTIONS BAR */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                {projects.length > 0 && (
                    <TextField
                        placeholder="Найти проект..."
                        size="small"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ maxWidth: 400 }}
                        InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>) }}
                    />
                )}

                {/* УБРАНА КНОПКА УДАЛЕНИЯ, ОСТАЛИСЬ ТОЛЬКО СТАТУСЫ */}
                <Stack direction="row" spacing={1} sx={{ visibility: selectedProjectIds.length > 0 ? 'visible' : 'hidden', opacity: selectedProjectIds.length > 0 ? 1 : 0, transition: 'opacity 0.2s' }}>
                    <Button variant="outlined" color="success" size="small" startIcon={<PlayCircleOutline />} onClick={() => void handleBulkSetStatus(true)}>
                        Активировать ({selectedProjectIds.length})
                    </Button>
                    <Button variant="outlined" color="warning" size="small" startIcon={<PauseCircleOutline />} onClick={() => void handleBulkSetStatus(false)}>
                        Деактивировать ({selectedProjectIds.length})
                    </Button>
                </Stack>
            </Box>

            {/* GRID */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>
            ) : filteredProjects.length === 0 ? (
                <Paper sx={{ p: 6, textAlign: 'center', border: '1px dashed #30363d', bgcolor: 'transparent' }}>
                    <FolderIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                    <Typography variant="h6" color="text.secondary">{searchQuery ? 'Проекты не найдены' : 'Список проектов пуст'}</Typography>
                    {!searchQuery && <Button sx={{ mt: 2 }} onClick={handleOpenCreate}>Создать первый проект</Button>}
                </Paper>
            ) : (
                <MuiGrid container spacing={2}>
                    <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', mb: 1.5, ml: 2 }}>
                        <Checkbox checked={isAllSelected} indeterminate={isIndeterminate} onChange={handleSelectAll} color="primary" size="small" sx={{ mr: 1 }} />
                        <Typography variant="caption" color="text.secondary">Выбрать все ({filteredProjects.length})</Typography>
                    </Box>

                    {filteredProjects.map(project => (
                        <MuiGrid item xs={12} md={6} lg={4} key={project.id}>
                            <Card
                                onClick={() => navigate(`/app/projects/${project.id}/monitors`)}
                                sx={{
                                    cursor: 'pointer', height: '100%', position: 'relative',
                                    opacity: project.is_active ? 1 : 0.6,
                                    bgcolor: project.is_active ? 'background.paper' : 'action.hover',
                                    transition: 'all 0.3s ease',
                                    '&:hover': { boxShadow: 6 }
                                }}
                            >
                                <CardContent sx={{ pb: '16px !important' }}>
                                    <Box sx={{ position: 'absolute', top: 8, left: 8, zIndex: 10 }}>
                                        <Checkbox
                                            checked={selectedProjectIds.includes(project.id)}
                                            onChange={() => handleSelectOne(project.id)}
                                            onClick={(e) => e.stopPropagation()}
                                            size="small"
                                        />
                                    </Box>

                                    {/* УБРАНА КНОПКА УДАЛЕНИЯ, ОСТАЛАСЬ ТОЛЬКО ИЗМЕНИТЬ */}
                                    <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 0.5, zIndex: 10 }}>
                                        <Tooltip title={project.is_active ? "Активен" : "Деактивирован"}>
                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: project.is_active ? theme.palette.success.main : theme.palette.warning.main, mr: 1, alignSelf: 'center' }} />
                                        </Tooltip>
                                        <Tooltip title="Изменить">
                                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpenEdit(project); }}>
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>

                                    <Box sx={{ mt: 4, mb: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <FolderIcon color="primary" fontSize="small" />
                                            <Typography variant='h6' noWrap>{project.name}</Typography>
                                        </Box>
                                    </Box>

                                    <Typography variant='body2' color='text.secondary' sx={{ mb: 2, height: 40, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                        {project.description || "Нет описания"}
                                    </Typography>

                                    <Box sx={{ pt: 1, borderTop: '1px solid #30363d', display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant='caption' color='text.secondary'>ID: {project.id.slice(0, 8)}...</Typography>
                                        <Typography variant='caption' color='text.secondary'>{new Date(project.created_at).toLocaleDateString()}</Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </MuiGrid>
                    ))}
                </MuiGrid>
            )}

            {/* CREATE / EDIT DIALOG */}
            <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} fullWidth maxWidth="sm">
                <Box component="form" onSubmit={handleSaveProject}>
                    <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {projectToEdit ? 'Изменить проект' : 'Новый проект'}
                        <IconButton onClick={() => setIsDialogOpen(false)} size="small"><CloseIcon /></IconButton>
                    </DialogTitle>
                    <DialogContent dividers>
                        <TextField autoFocus label='Название проекта' value={formName} onChange={e => setFormName(e.target.value)} fullWidth required margin='dense' />
                        <TextField label='Описание' value={formDesc} onChange={e => setFormDesc(e.target.value)} fullWidth multiline rows={3} margin='normal' />
                        <FormControlLabel control={<Switch checked={formActive} onChange={e => setFormActive(e.target.checked)} color="success" />} label={formActive ? 'Проект активен' : 'Проект отключен'} sx={{ mt: 1 }} />
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setIsDialogOpen(false)} color="inherit">Отмена</Button>
                        <Button type="submit" variant="contained" color="success" disabled={processing || !formName.trim()}>{processing ? 'Сохранение...' : (projectToEdit ? 'Сохранить' : 'Создать')}</Button>
                    </DialogActions>
                </Box>
            </Dialog>
        </Box>
    )
}