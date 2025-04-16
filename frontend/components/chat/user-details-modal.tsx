"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getCurrentUser } from "@/lib/api"
import type { User } from "@/types"

interface UserDetailsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function UserDetailsModal({ isOpen, onClose }: UserDetailsModalProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!isOpen) return

      try {
        setIsLoading(true)
        const userData = await getCurrentUser()
        setUser(userData)
        setError(null)
      } catch (err) {
        setError("Failed to load user details")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserDetails()
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-4 text-center">Loading user details...</div>
        ) : error ? (
          <div className="py-4 text-center text-red-500">{error}</div>
        ) : user ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <p className="text-sm font-medium">{user.name}</p>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <p className="text-sm font-medium">{user.email}</p>
            </div>
            <div className="space-y-2">
              <Label>Account Created</Label>
              <p className="text-sm font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
