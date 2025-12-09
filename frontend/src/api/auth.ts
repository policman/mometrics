import { api } from "./client";

// Типы данных
export interface AuthPayload {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserMe {
  id: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
}

// --- LOGIN (Исправлено: используем URLSearchParams) ---
export async function login(payload: AuthPayload): Promise<TokenResponse> {
  // ВАЖНО: FastAPI OAuth2 требует x-www-form-urlencoded
  const formData = new URLSearchParams();
  formData.append("username", payload.email);
  formData.append("password", payload.password);

  const response = await api.post<TokenResponse>("/auth/login", formData, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  return response.data;
}

// --- REGISTER (Оставляем JSON) ---
export async function register(payload: AuthPayload): Promise<void> {
  // Эндпоинт создания пользователя принимает обычный JSON (Pydantic schema)
  await api.post("/users", payload);
}

// --- GET ME ---
export async function getMe(): Promise<UserMe> {
  const response = await api.get<UserMe>("/auth/me");
  return response.data;
}