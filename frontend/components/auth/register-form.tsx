"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { registerUser } from "@/lib/api"
import type { RegisterCredentials } from "@/types"

export function RegisterForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [credentials, setCredentials] = useState<RegisterCredentials>({
    name: "",
    email: "",
    password: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCredentials((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await registerUser(credentials)
      router.push("/chat")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        {error && <div className="p-3 text-sm bg-red-50 text-red-500 rounded-md">{error}</div>}

        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            value={credentials.name}
            onChange={handleChange}
            placeholder="John Doe"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-email">Email</Label>
          <Input
            id="register-email"
            name="email"
            type="email"
            value={credentials.email}
            onChange={handleChange}
            placeholder="john@example.com"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-password">Password</Label>
          <Input
            id="register-password"
            name="password"
            type="password"
            value={credentials.password}
            onChange={handleChange}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Creating account..." : "Create Account"}
        </Button>
      </div>
    </form>
  )
}
