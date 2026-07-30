import { ClientForm } from "@/components/clientes/cliente-form"

export default function NewClientPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Client</h1>
        <p className="text-muted-foreground">
          Add a new client to your CRM
        </p>
      </div>

      <ClientForm />
    </div>
  )
}
