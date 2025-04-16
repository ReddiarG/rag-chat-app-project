"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut, UserIcon, Info } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ConversationList } from "@/components/chat/conversation-list"
import { MessageList } from "@/components/chat/message-list"
import { MessageInput } from "@/components/chat/message-input"
import { NewConversationModal } from "@/components/chat/new-conversation-modal"
import { UserDetailsModal } from "@/components/chat/user-details-modal"
import { isAuthenticated, logoutUser, getMessages, sendMessage } from "@/lib/api"
import type { Conversation, Message } from "@/types"
import { useMobile } from "@/hooks/use-mobile"
import { useWebSocket } from "@/hooks/use-websocket"
import { cn } from "@/lib/utils"

export default function ChatPage() {
  const router = useRouter()
  const isMobile = useMobile()

  const [showUserModal, setShowUserModal] = useState(false)
  const [showNewConversationModal, setShowNewConversationModal] = useState(false)
  const [showSidebar, setShowSidebar] = useState(!isMobile)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)


  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login")
      return
    }
  }, [router])

  const handleLogout = () => {
    logoutUser()
    router.push("/")
  }

  // Fetch messages when conversation changes
  useEffect(() => {
    if (!selectedConversation) return

    const fetchMessages = async () => {
      const data = await getMessages(selectedConversation.id)
      setMessages(data)
    }

    fetchMessages()
  }, [selectedConversation])

  const handleSelectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation)
    setMessages([])
    if (isMobile) setShowSidebar(false)
    const latest = await getMessages(conversation.id)
    setMessages(latest.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()))
  }

  // Handle sending user messages
  const handleNewMessage = async (content: string) => {
    if (!selectedConversation) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      conversation_id: selectedConversation.id,
      content,
      role: "user",
      created_at: new Date().toISOString(),
    }

    const loadingMessage: Message = {
      id: "loading",
      conversation_id: selectedConversation.id,
      content: "...",
      role: "assistant",
      created_at: new Date().toISOString(),
    }

    // Optimistically update UI
    setMessages((prev) => [...prev, userMessage, loadingMessage])

    try {
      await sendMessage({ conversation_id: selectedConversation.id, content })
      // WebSocket will push the assistant response; no need to poll
    } catch (err) {
      console.error("Failed to send message:", err)
      // Remove loading message on failure
      setMessages((prev) => prev.filter((msg) => msg.id !== "loading"))
    }
  }

  // Setup WebSocket listener
  useWebSocket({
    conversationId: selectedConversation?.id || null,
    onNewMessage: (incoming) => {
      setMessages((prev) => {
        const withoutLoading = prev.filter((m) => m.id !== "loading")
        return [...withoutLoading, incoming]
      })
    },
  })

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div
        className={cn(
          "w-80 bg-white border-r border-gray-200 flex flex-col",
          isMobile ? "absolute z-10 h-full transition-transform duration-300 ease-in-out" : "relative",
          isMobile && !showSidebar ? "-translate-x-full" : "translate-x-0"
        )}
      >
        <ConversationList
          selectedConversation={selectedConversation}
          onSelectConversation={handleSelectConversation}
          onNewConversation={() => setShowNewConversationModal(true)}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-4">
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={() => setShowSidebar(!showSidebar)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-menu"
              >
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg>
              <span className="sr-only">Toggle menu</span>
            </Button>
          )}

          <div className="flex-1 flex justify-center">
            {selectedConversation && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center">
                      <span className="font-medium">{selectedConversation.collection_name}</span>
                      <Info className="ml-1 h-4 w-4 text-gray-500" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{selectedConversation.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={() => setShowUserModal(true)}>
              <UserIcon className="h-5 w-5" />
              <span className="sr-only">User details</span>
            </Button>

            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Logout</span>
            </Button>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedConversation ? (
            <>
              <MessageList conversation={selectedConversation} messages={messages} setMessages={setMessages} />
              
              <MessageInput
                conversation={selectedConversation}
                onMessageSent={(message) => {
                  setMessages((prev) =>
                    [...prev, message].sort(
                      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                    )
                  )
                }}
                onMessagesUpdate={(newMessages) => {
                  setMessages(
                    [...newMessages].sort(
                      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                    )
                  )
                }}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
              <h2 className="text-2xl font-bold mb-2">Welcome to the Chatbot</h2>
              <p className="text-gray-500 mb-6">Select an existing conversation or start a new one</p>
              <Button onClick={() => setShowNewConversationModal(true)}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 h-4 w-4"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                New Conversation
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <UserDetailsModal isOpen={showUserModal} onClose={() => setShowUserModal(false)} />
      <NewConversationModal
        isOpen={showNewConversationModal}
        onClose={() => setShowNewConversationModal(false)}
        onConversationCreated={(conversation) => {
          setSelectedConversation(conversation)
          setMessages([])
        }}
      />
    </div>
  )
}