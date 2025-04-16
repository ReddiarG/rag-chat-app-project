"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"
import { sendMessage } from "@/lib/api"
import type { Message, Conversation } from "@/types"

interface MessageInputProps {
  conversation: Conversation
  onMessageSent: (message: Message) => void
  onMessagesUpdate: (messages: Message[]) => void
}

export const MessageInput = ({ conversation, onMessageSent }: MessageInputProps) => {
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // const [input, setInput] = useState("")
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || !conversation) return

    const trimmed = content.trim()
    setContent("")
    setIsLoading(true)

    // Create user message with client-generated ID
    const userMessage: Message = {
      id: crypto.randomUUID(),
      conversation_id: conversation.id,
      content: trimmed,
      role: "user",
      created_at: new Date().toISOString(),
    }

    // Add user message to the UI immediately
    onMessageSent(userMessage)

    // Add loading placeholder for assistant response
    const assistantPlaceholder: Message = {
      id: "loading", // Special ID to identify this as a placeholder
      conversation_id: conversation.id,
      content: "…",
      role: "assistant", // Changed from "bot" to match backend role
      created_at: new Date().toISOString(),
    }

    onMessageSent(assistantPlaceholder)

    try {
      await sendMessage({
        conversation_id: conversation.id,
        content: trimmed,
      })
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <div className="p-4 border-t border-gray-200">
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type your message..."
          className="flex-1"
          disabled={isLoading}
        />
        <Button type="submit" disabled={!content.trim() || isLoading}>
          <Send className="h-4 w-4" />
          <span className="sr-only">Send</span>
        </Button>
      </form>
    </div>
  )
}

  // const handleSend = () => {
  //   const trimmed = input.trim()
  //   if (!trimmed || disabled) return
  //   onMessageSent(trimmed)
  //   setInput("")
  // }

  // const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  //   if (e.key === "Enter" && !e.shiftKey) {
  //     e.preventDefault()
  //     handleSubmit()
  //   }
  // }

//   return (
//     <div className="flex gap-2">
//       <input
//         type="text"
//         className="flex-1 p-2 border rounded-lg"
//         placeholder="Type your message..."
//         value={input}
//         onChange={(e) => setInput(e.target.value)}
//         onKeyDown={handleKeyDown}
//         disabled={disabled}
//       />
//       <button
//         onClick={handleSend}
//         className="bg-blue-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
//         disabled={disabled}
//       >
//         Send
//       </button>
//     </div>
//   )
// }


// export function MessageInput({
//   conversation,
//   onMessageSent,
// }: MessageInputProps) {
//   const [content, setContent] = useState("")
//   const [isLoading, setIsLoading] = useState(false)

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!content.trim() || !conversation) return

//     const trimmed = content.trim()
//     setContent("")
//     setIsLoading(true)

//     // Create user message with client-generated ID
//     const userMessage: Message = {
//       id: crypto.randomUUID(),
//       conversation_id: conversation.id,
//       content: trimmed,
//       role: "user",
//       created_at: new Date().toISOString(),
//     }

//     // Add user message to the UI immediately
//     onMessageSent(userMessage)

//     // Add loading placeholder for assistant response
//     const assistantPlaceholder: Message = {
//       id: "loading", // Special ID to identify this as a placeholder
//       conversation_id: conversation.id,
//       content: "…",
//       role: "assistant", // Changed from "bot" to match backend role
//       created_at: new Date().toISOString(),
//     }

//     onMessageSent(assistantPlaceholder)

//     try {
//       await sendMessage({
//         conversation_id: conversation.id,
//         content: trimmed,
//       })
//     } catch (error) {
//       console.error("Failed to send message:", error)
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   return (
//     <div className="p-4 border-t border-gray-200">
//       <form onSubmit={handleSubmit} className="flex space-x-2">
//         <Input
//           value={content}
//           onChange={(e) => setContent(e.target.value)}
//           placeholder="Type your message..."
//           className="flex-1"
//           disabled={isLoading}
//         />
//         <Button type="submit" disabled={!content.trim() || isLoading}>
//           <Send className="h-4 w-4" />
//           <span className="sr-only">Send</span>
//         </Button>
//       </form>
//     </div>
//   )
// }