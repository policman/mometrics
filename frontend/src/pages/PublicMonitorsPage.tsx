import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom'
import {
    Alert,
    Box,
    Card,
    CardContent,
    CircularProgress,
    Grid as MuiGrid,
    TextField,
    Typography,
    IconButton,
    InputAdornment,
    Paper,
    Divider,
    Link,
    Tooltip,
    useTheme
} from '@mui/material'

import {
    ArrowBack,
    Search as SearchIcon,
    Language as WebIcon,
    Timer as TimerIcon,
    ArrowForwardIos,
    // Уберите неиспользуемые импорты, если линтер ругается
} from '@mui/icons-material'

// --- ИСПРАВЛЕННЫЙ БЛОК ИМПОРТОВ API ---
// Импортируем обе функции в одной строке
import { getPublicMonitors, getPublicProject } from '../api/public'
import { type Monitor } from '../api/monitors'

export function PublicMonitorsPage() {
    const { projectId } = useParams<{ projectId: string }>()
    const navigate = useNavigate()
    const theme = useTheme()

    const [monitors, setMonitors] = useState<Monitor[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [projectName, setProjectName] = useState('Проект')
    const [searchQuery, setSearchQuery] = useState('')

    const loadData = async () => {
       if (!projectId) return
       try {
          setError(null)
          setLoading(true)

          // Параллельная загрузка данных через ПУБЛИЧНЫЕ ручки
          const [monitorsData, projectData] = await Promise.allSettled([
              getPublicMonitors(projectId),
              getPublicProject(projectId) // <-- Теперь используем правильную публичную функцию
          ])

          // Обработка результата мониторов
          if (monitorsData.status === 'fulfilled') {
              setMonitors(monitorsData.value)
          } else {
              console.error("Ошибка загрузки мониторов:", monitorsData.reason)
              throw new Error('Не удалось загрузить мониторы')
          }

          // Обработка результата проекта (название)
          if (projectData.status === 'fulfilled') {
              setProjectName(projectData.value.name)
          } else {
              console.error("Ошибка загрузки проекта:", projectData.reason)
              // Не критично, если имя не загрузилось, оставим дефолтное
          }

       } catch (err: any) {
          console.error(err)
          setError('Не удалось загрузить данные публичного проекта. Возможно, сервер недоступен.')
       } finally {
          setLoading(false)
       }
    }

    useEffect(() => {
       void loadData()
    }, [projectId])

    // Фильтрация и Сортировка
    const filteredMonitors = useMemo(() => {
        const lowerQuery = searchQuery.toLowerCase()
        const filtered = monitors.filter(m =>
            m.name.toLowerCase().includes(lowerQuery) ||
            m.target_url.toLowerCase().includes(lowerQuery)
        )
        // Сортировка: Активные выше, затем по имени
        return filtered.sort((a, b) => {
            if (a.is_active === b.is_active) return 0;
            return a.is_active ? -1 : 1;
        });
    }, [monitors, searchQuery])


    if (!projectId) return <Alert severity="error">Проект не найден</Alert>

    return (
       <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto', minHeight: '100vh' }}>

          {/* HEADER */}
          <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
             {/* Кнопка назад ведет на ГЛАВНУЮ (Landing Page) */}
             <IconButton component={RouterLink} to="/" sx={{ border: '1px solid #30363d' }}>
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
                    Публичный просмотр ресурсов
                 </Typography>
             </Box>
          </Box>

          {error && <Alert severity='error' sx={{ mb: 3 }}>{error}</Alert>}

          {/* SEARCH */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
             {monitors.length > 0 && (
                 <TextField
                    placeholder="Поиск..."
                    size="small"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    sx={{ maxWidth: 400 }}
                    InputProps={{
                        startAdornment: (<InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>),
                    }}
                 />
             )}
          </Box>

          {/* LIST */}
          {loading ? (
             <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>
          ) : filteredMonitors.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center', border: '1px dashed #30363d', bgcolor: 'transparent' }}>
                <WebIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" color="text.secondary">
                   {searchQuery ? 'Мониторы не найдены' : 'В этом проекте нет активных мониторов'}
                </Typography>
             </Paper>
          ) : (
             <MuiGrid container spacing={2}>
                {filteredMonitors.map(monitor => (
                   <MuiGrid item xs={12} md={6} lg={4} key={monitor.id}>
                      <Card
                         // ВАЖНО: Ссылка ведет на ПУБЛИЧНУЮ страницу деталей (/view/...)
                         onClick={() => navigate(`/view/monitors/${monitor.id}`)}
                         sx={{
                            cursor: 'pointer',
                            height: '100%',
                            position: 'relative',
                            opacity: monitor.is_active ? 1 : 0.6,
                            transition: 'all 0.3s ease',
                            '&:hover': { boxShadow: 6 }
                         }}
                      >
                         <CardContent>
                             {/* Статус (Точка) справа сверху */}
                             <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
                                <Tooltip title={monitor.is_active ? "Активен" : "На паузе"}>
                                    <Box sx={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: '50%',
                                        bgcolor: monitor.is_active ? theme.palette.success.main : theme.palette.warning.main,
                                        boxShadow: monitor.is_active ? `0 0 5px ${theme.palette.success.main}` : 'none'
                                    }} />
                                </Tooltip>
                             </Box>

                            {/* Название */}
                            <Box sx={{ mb: 1, pr: 4 }}>
                               <Typography variant='h6' noWrap>{monitor.name}</Typography>
                            </Box>

                            <Divider sx={{ my: 1.5 }} />

                            {/* URL */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                               <WebIcon fontSize="small" color="primary" />
                               {/* Останавливаем всплытие (stopPropagation), чтобы клик по ссылке не открывал карточку */}
                               <Link
                                  href={monitor.target_url}
                                  target="_blank"
                                  onClick={(e) => e.stopPropagation()}
                                  underline="hover"
                                  sx={{ fontSize: '0.9rem', color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                               >
                                  {monitor.target_url}
                               </Link>
                            </Box>

                            {/* Интервал */}
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
       </Box>
    )
}