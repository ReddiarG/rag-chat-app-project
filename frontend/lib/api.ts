import Cookies from "js-cookie"
import type {
  LoginCredentials,
  RegisterCredentials,
  User,
  Context,
  Conversation,
  NewConversation,
  Message,
  NewMessage,
} from "@/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.example.com"

// Get the token from cookies
export const getToken = (): string | null => {
  return Cookies.get("token") || null
}

// API helper
async function apiRequest<T>(endpoint: string, method = "GET", data?: any): Promise<T> {
  const token = getToken()

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const config: RequestInit = {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  }

  const response = await fetch(`${API_BASE_URL}/${endpoint}`, config)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `API request failed with status ${response.status}`)
  }

  return response.json()
}

// Auth APIs
export const registerUser = async (credentials: RegisterCredentials): Promise<{ user: User; token: string }> => {
  const data = await apiRequest<{ user: User; token: string }>("auth/register", "POST", credentials)
  Cookies.set("token", data.token, { path: "/" })
  return data
}

export const loginUser = async (credentials: LoginCredentials): Promise<{ user: User; token: string }> => {
  const data = await apiRequest<{ user: User; token: string }>("auth/login", "POST", credentials)
  Cookies.set("token", data.token, { path: "/" })
  return data
}

export const logoutUser = (): void => {
  Cookies.remove("token")
}

export const getCurrentUser = async (): Promise<User> => {
  return apiRequest<User>("auth/user")
}

// Context APIs
export const getContexts = async (): Promise<Context[]> => {
  return apiRequest<Context[]>("vector-contexts")
}

// Conversation APIs
export const getConversations = async (): Promise<Conversation[]> => {
  return apiRequest<Conversation[]>("conversations")
}

export const createConversation = async (newConversation: NewConversation): Promise<Conversation> => {
  return apiRequest<Conversation>("conversations", "POST", newConversation)
}


// Message APIs
export const getMessages = async (conversationId: string): Promise<Message[]> => {
  return apiRequest<Message[]>(`messages/${conversationId}`)
}

export const sendMessage = async (newMessage: NewMessage): Promise<Message> => {
  return apiRequest<Message>(`messages/${newMessage.conversation_id}`, "POST", newMessage)
}

// Auth check
export const isAuthenticated = (): boolean => {
  return !!getToken()
}