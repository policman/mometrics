import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material"; // 1. Импортируем провайдер темы

import { router } from "./router";
import { darkTheme } from "./theme"; // 2. Импортируем нашу тему (убедись, что файл src/theme.ts создан)

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* 3. Оборачиваем все приложение в ThemeProvider */}
    <ThemeProvider theme={darkTheme}>
      {/* CssBaseline должен быть ВНУТРИ провайдера, чтобы подхватить темный фон */}
      <CssBaseline />
      {/* Твой роутер остается на месте */}
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>
);