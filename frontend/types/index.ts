// User types
export interface User {
  id: string
  name: string
  email: string
  createdAt: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  name: string
  email: string
  password: string
}

// Context types
export interface Context {
  id: string
  name: string
  description: string,
  chroma_collection_name: string,
  created_at: string
}

// Conversation types
export interface Conversation {
  id: string
  title: string
  vector_context_id: string
  collection_name: string
  description: string
  created_at: string
}

export interface NewConversation {
  title: string
  vector_context_id: string
}

// Message types
export interface Message {
  id: string
  conversation_id: string
  content: string
  role: string
  created_at: string
}

export interface NewMessage {
  conversation_id: string
  content: string
}
