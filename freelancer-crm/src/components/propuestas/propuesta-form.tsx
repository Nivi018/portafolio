"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { proposalSchema, type ProposalInput } from "@/lib/validators"
import { createProposal, updateProposal } from "@/server/actions/proposals"
import { getAllProjects } from "@/server/queries/projects"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface Project {
  id: string
  name: string
  client: { name: string } | null
}

interface ProposalFormProps {
  initialData?: {
    id: string
    title: string
    content: string | null
    status: string
    validUntil: Date | null
    projectId: string
    taxRate: number
    items: {
      description: string
      quantity: number
      unitPrice: number
    }[]
  }
}

export function ProposalForm({ initialData }: ProposalFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProposalInput>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      title: initialData?.title || "",
      content: initialData?.content || "",
      status: (initialData?.status as "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED") || "DRAFT",
      validUntil: initialData?.validUntil
        ? new Date(initialData.validUntil).toISOString().split("T")[0]
        : "",
      projectId: initialData?.projectId || searchParams.get("projectId") || "",
      taxRate: initialData?.taxRate || 0,
      items: initialData?.items || [
        { description: "", quantity: 1, unitPrice: 0 },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  })

  const items = watch("items")
  const taxRate = watch("taxRate")
  const status = watch("status")
  const projectId = watch("projectId")

  const subtotal = items.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
    0
  )
  const tax = subtotal * ((taxRate || 0) / 100)
  const total = subtotal + tax

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await getAllProjects()
        setProjects(data as unknown as Project[])
      } catch (error) {
        console.error("Failed to load projects:", error)
      }
    }
    loadProjects()
  }, [])

  const onSubmit = async (data: ProposalInput) => {
    setIsLoading(true)

    try {
      if (initialData) {
        await updateProposal(initialData.id, data)
        toast.success("Proposal updated")
      } else {
        await createProposal(data)
        toast.success("Proposal created")
      }
      router.push("/proposals")
      router.refresh()
    } catch (error) {
      toast.error("Something went wrong")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Proposal Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Proposal title"
                disabled={isLoading}
                {...register("title")}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="content">Description</Label>
              <Textarea
                id="content"
                placeholder="Proposal description..."
                rows={3}
                disabled={isLoading}
                {...register("content")}
              />
            </div>

            <div className="space-y-2">
              <Label>Project *</Label>
              <Select
                value={projectId}
                onValueChange={(value) => setValue("projectId", value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                      {project.client && ` - ${project.client.name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.projectId && (
                <p className="text-sm text-destructive">{errors.projectId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setValue("status", value as "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED")}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                  <SelectItem value="ACCEPTED">Accepted</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="validUntil">Valid Until</Label>
              <Input
                id="validUntil"
                type="date"
                disabled={isLoading}
                {...register("validUntil")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="0"
                disabled={isLoading}
                {...register("taxRate")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Line Items</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ description: "", quantity: 1, unitPrice: 0 })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-4">
              <div className="flex-1 space-y-2">
                <Label>Description *</Label>
                <Input
                  placeholder="Item description"
                  disabled={isLoading}
                  {...register(`items.${index}.description`)}
                />
                {errors.items?.[index]?.description && (
                  <p className="text-sm text-destructive">
                    {errors.items[index].description.message}
                  </p>
                )}
              </div>
              <div className="w-24 space-y-2">
                <Label>Qty</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  disabled={isLoading}
                  {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                />
              </div>
              <div className="w-32 space-y-2">
                <Label>Unit Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  disabled={isLoading}
                  {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                />
              </div>
              <div className="w-32 space-y-2">
                <Label>Total</Label>
                <div className="h-10 flex items-center">
                  {formatCurrency(
                    (items[index]?.quantity || 0) * (items[index]?.unitPrice || 0)
                  )}
                </div>
              </div>
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-6"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax ({taxRate || 0}%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Update Proposal" : "Create Proposal"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
