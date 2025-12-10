import { Box, Container, Toolbar } from "@mui/material";
import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer"; // <--- Импортируем Footer

interface Props {
  children?: ReactNode;
}

export function AppLayout({ children }: Props) {
  return (
    // Добавляем flex: 'column' и minHeight, чтобы футер прижимался к низу
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* 1. Единая шапка */}
      <Header />

      {/* Распорка (пустое место) под фиксированной шапкой */}
      <Toolbar />

      {/* 2. Основной контент */}
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        {children}
      </Container>

      {/* 3. Футер */}
      <Footer />

    </Box>
  );
}