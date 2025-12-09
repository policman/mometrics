import { useEffect, useState, useMemo } from 'react';
import {
    Box,
    Typography,
    Paper,
    CircularProgress,
    Alert,
    TextField,
    InputAdornment,
    Divider,
    useTheme,
    Link as MuiLink
} from '@mui/material';

import {
    Search as SearchIcon,
    FolderOpen as FolderIcon,
    AccessTime as TimeIcon,
    PlayCircleOutline,
    PauseCircleOutline
} from '@mui/icons-material';

import { getPublicProjects, type PublicProject } from '../api/public';
import { Link as RouterLink } from 'react-router-dom';


export function LandingPage() {
    const theme = useTheme();

    const [projects, setProjects] = useState<PublicProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const loadProjects = async () => {
        try {
            setError(null);
            setLoading(true);
            const data = await getPublicProjects();
            setProjects(data);
        } catch (err: any) {
            console.error(err);
            setError('Не удалось загрузить публичные проекты. Возможно, API недоступно.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadProjects();
    }, []);

    const filteredProjects = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return projects.filter(p =>
            p.name.toLowerCase().includes(query) ||
            (p.description && p.description.toLowerCase().includes(query))
        );
    }, [projects, searchQuery]);

    const getStatusStyles = (isActive: boolean) => ({
        bgcolor: isActive ? theme.palette.success.main : theme.palette.warning.main,
        color: theme.palette.getContrastText(isActive ? theme.palette.success.main : theme.palette.warning.main),
        fontWeight: 'bold',
        px: 1,
        borderRadius: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        fontSize: '0.8rem',
        textTransform: 'uppercase'
    });

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
            <Box sx={{ textAlign: 'center', mb: 6 }}>
                <Typography variant='h4' sx={{ mb: 1, fontWeight: 'bold' }}>
                    Публичная Витрина
                </Typography>
                <Typography variant='h6' color='text.secondary'>
                    Мониторинг статуса сервисов в реальном времени
                </Typography>
            </Box>

            {error && <Alert severity='error' sx={{ mb: 3 }}>{error}</Alert>}

            <Paper sx={{ p: 2, mb: 4, borderRadius: 2 }}>
                <TextField
                    placeholder="Найти сервис..."
                    size="medium"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    fullWidth
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                        disableUnderline: true
                    }}
                    variant="standard"
                />
            </Paper>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
                    <CircularProgress />
                </Box>
            ) : filteredProjects.length === 0 ? (
                <Alert severity="info" variant="outlined" sx={{ justifyContent: 'center' }}>
                    {searchQuery ? 'Проекты по вашему запросу не найдены.' : 'Список публичных проектов пока пуст.'}
                </Alert>
            ) : (
                <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, textAlign: 'right' }}>
                        Всего проектов: {filteredProjects.length}
                    </Typography>

                    {filteredProjects.map((project) => (
                        <Paper
                            key={project.id}
                            elevation={2}
                            sx={{
                                p: 3,
                                mb: 2,
                                borderLeft: `6px solid ${project.is_active ? theme.palette.success.main : theme.palette.warning.main}`,
                                opacity: project.is_active ? 1 : 0.75,
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: 6
                                }
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <FolderIcon color="primary" fontSize="large" />

                                    {/* ССЫЛКА НА ПУБЛИЧНЫЙ ПРОСМОТР */}
                                    <MuiLink
                                        component={RouterLink}
                                        to={`/view/projects/${project.id}/monitors`}
                                        underline="none"
                                        color="text.primary"
                                    >
                                        <Typography variant='h5' fontWeight="600">{project.name}</Typography>
                                    </MuiLink>
                                </Box>

                                {/* Статус */}
                                <Box sx={getStatusStyles(project.is_active)}>
                                    {project.is_active ? <PlayCircleOutline sx={{ fontSize: 16 }} /> : <PauseCircleOutline sx={{ fontSize: 16 }} />}
                                    {project.is_active ? 'Online' : 'Paused'}
                                </Box>
                            </Box>

                            <Typography variant='body1' color='text.secondary' sx={{ my: 1.5, ml: 6 }}>
                                {project.description || "Описание отсутствует."}
                            </Typography>

                            <Divider sx={{ my: 2, ml: 6 }} />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', ml: 6 }}>
                                <Typography variant='caption' color='text.disabled' sx={{fontFamily: 'monospace'}}>
                                    ID: {project.id ? project.id.slice(0, 8) : '???'}...
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <TimeIcon sx={{ fontSize: 14 }} color="action" />
                                    <Typography variant='caption' color='text.secondary'>
                                        Обновлено: {new Date(project.updated_at).toLocaleDateString()}
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>
                    ))}
                </Box>
            )}
        </Box>
    );
}