import { Box, Container, Toolbar } from "@mui/material";
import { ReactNode } from "react";
import { Header } from "./Header";

interface Props {
  children?: ReactNode;
}

export function AppLayout({ children }: Props) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* Единая шапка */}
      <Header />

      {/* Распорка (пустое место) под фиксированной шапкой */}
      <Toolbar />

      {/* Основной контент */}
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        {children}
      </Container>
    </Box>
  );
}