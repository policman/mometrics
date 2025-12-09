// src/theme.ts
import { createTheme } from '@mui/material'

export const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        background: {
            default: '#0d1117', // Темный фон как у GitHub
            paper: '#161b22',   // Фон карточек
        },
        primary: { main: '#58a6ff' }, // Синий акцент
        success: { main: '#238636', contrastText: '#fff' }, // Зеленый для кнопок
        error: { main: '#da3633', light: '#f85149' },
        warning: { main: '#d29922' },
        text: { primary: '#c9d1d9', secondary: '#8b949e' },
        divider: '#30363d',
    },
    typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
        h4: { fontWeight: 600 },
        h6: { fontWeight: 600 },
        button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    scrollbarColor: "#30363d #0d1117",
                    "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
                        backgroundColor: "#0d1117",
                        width: 12,
                    },
                    "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
                        borderRadius: 8,
                        backgroundColor: "#30363d",
                        minHeight: 24,
                        border: "3px solid #0d1117",
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    border: '1px solid #30363d',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                        borderColor: '#8b949e',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    },
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: { borderRadius: 6 },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: '#30363d' },
                        '&:hover fieldset': { borderColor: '#8b949e' },
                    },
                },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    border: '1px solid #30363d',
                    backgroundColor: '#161b22',
                },
            },
        },
    },
})