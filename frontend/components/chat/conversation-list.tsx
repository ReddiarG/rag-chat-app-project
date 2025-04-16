"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getConversations } from "@/lib/api"
import type { Conversation } from "@/types"

interface ConversationListProps {
  selectedConversation: Conversation | null
  onSelectConversation: (conversation: Conversation) => void
  onNewConversation: () => void
}

export function ConversationList({
  selectedConversation,
  onSelectConversation,
  onNewConversation,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoading(true)
        const data = await getConversations()
        setConversations(data)
        setError(null)
      } catch (err) {
        setError("Failed to load conversations")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchConversations()
  }, [])

  return (
    <>
      <div className="p-4 border-b border-gray-200">
        <Button onClick={onNewConversation} className="w-full">
          <PlusCircle className="mr-2 h-4 w-4" />
          New Conversation
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-gray-500">Loading conversations...</div>
        ) : error ? (
          <div className="p-4 text-center text-sm text-red-500">{error}</div>
        ) : (
          <div className="p-2 space-y-1">
            {conversations.map((conversation) => (
              <Button
                key={conversation.id}
                variant={selectedConversation?.id === conversation.id ? "secondary" : "ghost"}
                className="w-full justify-start text-left font-normal h-auto py-3"
                onClick={() => onSelectConversation(conversation)}
              >
                <span className="truncate">{conversation.title}</span>
              </Button>
            ))}
            {conversations.length === 0 && <p className="text-sm text-gray-500 p-2">No conversations yet!</p>}
          </div>
        )}
      </ScrollArea>
    </>
  )
}
