import { useState } from 'react';
import { AppBar, Toolbar, Box, Typography, Button, IconButton, Avatar, Menu, MenuItem, Tooltip, Divider, useTheme } from '@mui/material';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { 
    Dashboard as DashboardIcon, 
    Home as HomeIcon,
    Person as PersonIcon,
    Logout as LogoutIcon,
    Login as LoginIcon
} from '@mui/icons-material';

export function Header() {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    
    // Простая проверка авторизации по наличию токена
    const isAuthenticated = !!localStorage.getItem('access_token');

    // State для меню профиля
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        handleMenuClose();
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        navigate("/login");
    };

    // Функция для подсветки активной ссылки
    const isActive = (path: string) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    return (
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: theme.palette.background.paper, color: theme.palette.text.primary, borderBottom: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
            <Toolbar>
                {/* --- ЛЕВАЯ ЧАСТЬ: ЛОГО + НАВИГАЦИЯ --- */}
                
                {/* 1. Логотип + Название (Клик ведет на Главную) */}
                <Box 
                    onClick={() => navigate("/")}
                    sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', mr: 4, userSelect: 'none' }}
                >
                    <Box
                        component="img"
                        src="/media/logo.png"
                        alt="Logo"
                        sx={{ 
                            height: 32, 
                            width: 32, 
                            mr: 1.5,
                        }}
                    />
                    <Typography variant="h6" fontWeight="bold" noWrap sx={{ display: { xs: 'none', sm: 'block' } }}>
                        Mometrics
                    </Typography>
                </Box>

                {/* 2. Ссылки меню */}
                <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
                    <Button 
                        component={RouterLink} 
                        to="/" 
                        color={isActive('/') ? "primary" : "inherit"}
                        startIcon={<HomeIcon />}
                        sx={{ fontWeight: isActive('/') ? 'bold' : 'normal', opacity: isActive('/') ? 1 : 0.7 }}
                    >
                        Главная
                    </Button>
                    
                    <Button 
                        component={RouterLink} 
                        to="/app/projects" 
                        color={isActive('/app') ? "primary" : "inherit"}
                        startIcon={<DashboardIcon />}
                        sx={{ fontWeight: isActive('/app') ? 'bold' : 'normal', opacity: isActive('/app') ? 1 : 0.7 }}
                    >
                        Мои проекты
                    </Button>
                </Box>


                {/* --- ПРАВАЯ ЧАСТЬ: ПРОФИЛЬ / ВХОД --- */}
                
                {isAuthenticated ? (
                    <Box>
                        <Tooltip title="Профиль">
                            <IconButton onClick={handleMenuOpen} size="small" sx={{ ml: 2 }}>
                                <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main }}>
                                    <PersonIcon />
                                </Avatar>
                            </IconButton>
                        </Tooltip>
                        
                        <Menu
                            anchorEl={anchorEl}
                            open={open}
                            onClose={handleMenuClose}
                            onClick={handleMenuClose}
                            PaperProps={{
                                elevation: 0,
                                sx: {
                                    overflow: 'visible',
                                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                                    mt: 1.5,
                                    border: `1px solid ${theme.palette.divider}`,
                                    '&:before': {
                                        content: '""',
                                        display: 'block',
                                        position: 'absolute',
                                        top: 0,
                                        right: 14,
                                        width: 10,
                                        height: 10,
                                        bgcolor: 'background.paper',
                                        transform: 'translateY(-50%) rotate(45deg)',
                                        zIndex: 0,
                                    },
                                },
                            }}
                            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                        >
                            <MenuItem onClick={handleMenuClose} disabled>
                                <PersonIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} /> Профиль
                            </MenuItem>
                            <Divider />
                            <MenuItem onClick={handleLogout}>
                                <LogoutIcon fontSize="small" sx={{ mr: 1.5, color: 'error.main' }} /> Выйти
                            </MenuItem>
                        </Menu>
                    </Box>
                ) : (
                    <Button 
                        component={RouterLink} 
                        to="/login" 
                        variant="contained" 
                        color="primary"
                        startIcon={<LoginIcon />}
                        size="small"
                    >
                        Войти
                    </Button>
                )}

            </Toolbar>
        </AppBar>
    );
}