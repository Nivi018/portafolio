import { notFound } from "next/navigation"
import { getClientById } from "@/server/queries/clients"
import { ClientForm } from "@/components/clientes/cliente-form"

interface EditClientPageProps {
  params: Promise<{ id: string }>
}

export default async function EditClientPage({ params }: EditClientPageProps) {
  const { id } = await params

  let client
  try {
    client = await getClientById(id)
  } catch {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Client</h1>
        <p className="text-muted-foreground">
          Update client information
        </p>
      </div>

      <ClientForm
        initialData={{
          id: client.id,
          name: client.name,
          email: client.email,
          phone: client.phone,
          company: client.company,
          address: client.address,
          notes: client.notes,
          status: client.status,
        }}
      />
    </div>
  )
}
