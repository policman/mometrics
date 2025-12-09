import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Alert,
  Link,
  useTheme
} from "@mui/material";
import { login, register } from "../api/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const theme = useTheme();

  // Состояние: true = режим регистрации, false = режим входа
  const [isRegister, setIsRegister] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Сброс ошибок при переключении режима
  const toggleMode = () => {
    setIsRegister(!isRegister);
    setError(null);
    setSuccessMsg(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isRegister) {
        // --- ЛОГИКА РЕГИСТРАЦИИ ---
        await register({ email, password });
        setSuccessMsg("Аккаунт создан! Выполняется вход...");

        // Сразу логиним пользователя после регистрации
        const data = await login({ email, password });
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);

        // Небольшая задержка для красоты UX
        setTimeout(() => navigate("/"), 1000);

      } else {
        // --- ЛОГИКА ВХОДА ---
        const data = await login({ email, password });
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        navigate("/");
      }
    } catch (err: any) {
      console.error(err);
      // Обработка ошибок (например, 400 если юзер уже есть)
      if (err.response?.status === 400 && isRegister) {
        setError("Пользователь с таким email уже существует");
      } else if (err.response?.status === 400 && !isRegister) {
        setError("Неверный email или пароль");
      } else {
        setError("Произошла ошибка. Попробуйте позже.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: 2 }}>

        <Box sx={{ textAlign: 'center', mb: 3 }}>
            {/* Логотип (опционально) */}
            <Typography variant="h4" component="h1" fontWeight="bold" color="primary">
            Mometrics
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
            {isRegister ? "Создание нового аккаунта" : "Вход в панель мониторинга"}
            </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {successMsg && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMsg}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            fullWidth
            required
            autoFocus
            disabled={loading}
          />

          <TextField
            label="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            fullWidth
            required
            disabled={loading}
            helperText={isRegister ? "Минимум 8 символов" : ""}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{ mt: 3, mb: 2, py: 1.5, fontWeight: 'bold' }}
            disabled={loading}
          >
            {loading
                ? (isRegister ? "Регистрация..." : "Вход...")
                : (isRegister ? "Зарегистрироваться" : "Войти")
            }
          </Button>

          {/* Переключатель режима */}
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {isRegister ? "Уже есть аккаунт? " : "Нет аккаунта? "}
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={toggleMode}
                underline="hover"
                sx={{ fontWeight: 'bold', cursor: 'pointer' }}
              >
                {isRegister ? "Войти" : "Зарегистрироваться"}
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}