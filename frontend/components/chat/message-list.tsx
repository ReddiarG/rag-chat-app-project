"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getMessages } from "@/lib/api"
import type { Message, Conversation } from "@/types"
import { cn } from "@/lib/utils"

interface MessageListProps {
  conversation: Conversation
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
}

// interface MessageListProps {
//   messages: Message[]
// }

// export const MessageList = ({ messages }: MessageListProps) => {
//   return (
//     <div className="space-y-4">
//       {messages.map((msg) => (
//         <div
//           key={msg.id}
//           className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
//         >
//           <div
//             className={`max-w-md p-3 rounded-lg shadow-md ${
//               msg.role === "user"
//                 ? "bg-blue-500 text-white"
//                 : msg.id === "loading"
//                 ? "bg-gray-300 text-gray-600 animate-pulse"
//                 : "bg-gray-200 text-black"
//             }`}
//           >
//             {msg.content}
//           </div>
//         </div>
//       ))}
//     </div>
//   )
// }


export function MessageList({ conversation, messages, setMessages }: MessageListProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const fetchMessages = async () => {
    if (!conversation) return

//     try {
//       const data = await getMessages(conversation.id)
      
//       // Handle loading message replacement
//       if (messages.some(msg => msg.id === "loading")) {
//         // Find the newest assistant message that wasn't in our previous message list
//         const newestAssistantMessage = data
//           .filter(msg => msg.role === "assistant")
//           .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
        
//         // If we found a new assistant message and it's newer than our last tracked message
//         if (newestAssistantMessage && 
//             (!lastMessageTimeRef.current || 
//              new Date(newestAssistantMessage.created_at) > new Date(lastMessageTimeRef.current))) {
          
//           // Update our messages by keeping everything except the loading placeholder
//           // and adding the new assistant message at the end to maintain order
//           setMessages(prev => {
//             const withoutLoading = prev.filter(msg => msg.id !== "loading")
//             return [...withoutLoading, newestAssistantMessage]
//           })
          
//           // Update the last message time reference
//           lastMessageTimeRef.current = newestAssistantMessage.created_at
          
//           // Stop polling since we have a response
//           if (pollingTimerRef.current) {
//             clearInterval(pollingTimerRef.current)
//             pollingTimerRef.current = null
//             setIsPolling(false)
//           }
//         }
//       } else {
//         // No loading message, just update the messages normally
//         setMessages(data)
        
//         // Update last message time if we have messages
//         if (data.length > 0) {
//           const lastMsg = data.sort((a, b) => 
//             new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
//           )[0]
//           lastMessageTimeRef.current = lastMsg.created_at
//         }
//       }
      
//       setError(null)
//     } catch (err) {
//       setError("Failed to load messages")
//       console.error(err)
//     } finally {
//       setIsLoading(false)
//     }
  }

  // Initial message loading
  useEffect(() => {
    setIsLoading(true)
    fetchMessages()
  }, [conversation])

//   // Start polling when a loading message appears
//   useEffect(() => {
//     const hasLoadingMsg = messages.some(msg => msg.id === "loading")
    
//     if (hasLoadingMsg && !isPolling) {
//       setIsPolling(true)
//       pollingTimerRef.current = setInterval(fetchMessages, 2000) // Poll every 2 seconds
//     }
    
//     // Clean up on unmount
//     return () => {
//       if (pollingTimerRef.current) {
//         clearInterval(pollingTimerRef.current)
//       }
//     }
//   }, [messages, isPolling])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  if (isLoading && messages.length === 0) {
    return <div className="flex-1 flex items-center justify-center">Loading messages...</div>
  }

  if (error) {
    return <div className="flex-1 flex items-center justify-center text-red-500">{error}</div>
  }

  return (
    <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
      <div className="space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[80%] rounded-lg p-3",
                message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
              )}
            >
              {message.id === "loading" ? (
                <span className="animate-pulse text-muted-foreground">Thinking<span className="dots">...</span></span>
              ) : (
                message.content
              )}
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p>This is the beginning of your conversation.</p>
            <p>Send a message to get started!</p>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}