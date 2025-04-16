import { useEffect, useRef } from "react"
import type { Message } from "@/types"

export function useWebSocket({
  conversationId,
  onNewMessage,
}: {
  conversationId: string | null
  onNewMessage: (message: Message) => void
}) {
  const socketRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!conversationId) return

    const wsUrl = `ws://localhost:8000/ws/${conversationId}`
    socketRef.current = new WebSocket(wsUrl)

    socketRef.current.onopen = () => {
      console.log("✅ WebSocket connected")
    }

    socketRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        onNewMessage(data)
      } catch (err) {
        console.error("Invalid WebSocket message:", err)
      }
    }

    socketRef.current.onerror = (err) => {
      console.error("WebSocket error:", err)
    }

    socketRef.current.onclose = () => {
      console.log("❌ WebSocket disconnected")
    }

    return () => {
      socketRef.current?.close()
    }
  }, [conversationId])
}