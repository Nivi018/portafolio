"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

export function InvoiceTemplateForm() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Save invoice template settings
      toast.success("Template saved")
    } catch (error) {
      toast.error("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div className="space-y-2">
        <Label htmlFor="companyName">Company Name</Label>
        <Input
          id="companyName"
          placeholder="Your Company Name"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="companyAddress">Address</Label>
        <Textarea
          id="companyAddress"
          placeholder="123 Main St, City, State, ZIP"
          rows={3}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="companyEmail">Email</Label>
        <Input
          id="companyEmail"
          type="email"
          placeholder="billing@company.com"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="companyPhone">Phone</Label>
        <Input
          id="companyPhone"
          placeholder="+1 (555) 000-0000"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="defaultNotes">Default Notes</Label>
        <Textarea
          id="defaultNotes"
          placeholder="Payment terms, bank details, etc."
          rows={4}
          disabled={isLoading}
        />
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Template
      </Button>
    </form>
  )
}
