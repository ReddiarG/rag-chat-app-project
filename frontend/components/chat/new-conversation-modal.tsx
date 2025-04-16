"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { getContexts, createConversation } from "@/lib/api"
import type { Context, Conversation } from "@/types"

interface NewConversationModalProps {
  isOpen: boolean
  onClose: () => void
  onConversationCreated: (conversation: Conversation) => void
}

export function NewConversationModal({ isOpen, onClose, onConversationCreated }: NewConversationModalProps) {
  const [name, setName] = useState("")
  const [selectedContextId, setSelectedContextId] = useState("")
  const [contexts, setContexts] = useState<Context[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchContexts = async () => {
      try {
        const data = await getContexts()
        setContexts(data)
      } catch (err) {
        setError("Failed to load contexts")
        console.error(err)
      }
    }

    if (isOpen) {
      fetchContexts()
    }
  }, [isOpen])

  const handleCreateConversation = async () => {
    if (!name || !selectedContextId) return

    try {
      setIsLoading(true)
      setError(null)

      const conversation = await createConversation({
        title: name,
        vector_context_id: selectedContextId,
      })

      onConversationCreated(conversation)
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create conversation")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setName("")
    setSelectedContextId("")
    setError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
          <DialogDescription>Create a new conversation by selecting a context and providing a name.</DialogDescription>
        </DialogHeader>

        {error && <div className="p-3 text-sm bg-red-50 text-red-500 rounded-md">{error}</div>}

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="conversation-name">Conversation Name</Label>
            <Input
              id="conversation-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="E.g., Trip Planning, Coding Help"
            />
          </div>

          <div className="space-y-3">
            <Label>Select a Context</Label>
            <RadioGroup value={selectedContextId} onValueChange={setSelectedContextId}>
              {contexts.map((context) => (
                <div key={context.id} className="flex items-start space-x-2 p-2 rounded-md hover:bg-gray-100">
                  <RadioGroupItem value={context.id} id={`context-${context.id}`} />
                  <div className="grid gap-1">
                    <Label htmlFor={`context-${context.id}`} className="font-medium">
                      {context.name}
                    </Label>
                    <p className="text-sm text-gray-500">{context.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleCreateConversation} disabled={!name || !selectedContextId || isLoading}>
            {isLoading ? "Creating..." : "Create Conversation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
