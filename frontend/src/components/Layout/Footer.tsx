import { Box, Container, Typography, IconButton, useTheme } from '@mui/material';
import { GitHub as GitHubIcon, Telegram as TelegramIcon, Email as EmailIcon } from '@mui/icons-material';

export function Footer() {
    const theme = useTheme();

    return (
        <Box
            component="footer"
            sx={{
                py: 3,
                mt: 'auto', // Прижимает футер к низу, если контент не занимает всю высоту
                borderTop: `1px solid ${theme.palette.divider}`,
                bgcolor: theme.palette.background.paper,
                color: theme.palette.text.secondary,
                textAlign: 'center',
                width: '100%',
            }}
        >
            <Container maxWidth="xl">
                <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 'bold' }}>
                    Разработчик: Самойлов Геннадий
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>

                    {/* GitHub */}
                    <Tooltip title="GitHub">
                        <IconButton
                            href="https://github.com/policman"
                            target="_blank"
                            color="inherit"
                        >
                            <GitHubIcon />
                        </IconButton>
                    </Tooltip>

                    {/* Telegram */}
                    <Tooltip title="Telegram">
                        <IconButton
                            href="https://t.me/samoylov_gennadiy"
                            target="_blank"
                            color="inherit"
                        >
                            <TelegramIcon />
                        </IconButton>
                    </Tooltip>

                    {/* Gmail */}
                    <Tooltip title="Gmail">
                        <IconButton
                            href="mailto:samoylowfgg@gmail.com"
                            color="inherit"
                        >
                            <EmailIcon />
                        </IconButton>
                    </Tooltip>
                </Box>

                <Typography variant="caption" sx={{ mt: 2, display: 'block' }}>
                    Mometrics © {new Date().getFullYear()}
                </Typography>
            </Container>
        </Box>
    );
}

// Добавьте этот импорт, если его нет
import { Tooltip } from '@mui/material';