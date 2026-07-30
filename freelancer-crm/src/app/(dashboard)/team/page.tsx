import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { getInitials } from "@/lib/utils"
import { InviteForm } from "@/components/equipo/invite-form"

const roleColors: Record<string, string> = {
  OWNER: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  ADMIN: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  MEMBER: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
}

export default async function TeamPage() {
  const session = await auth()
  if (!session?.user?.orgId) {
    redirect("/login")
  }

  const members = await prisma.user.findMany({
    where: { orgId: session.user.orgId },
    orderBy: { createdAt: "asc" },
    include: {
      assignedTasks: {
        where: { status: { not: "DONE" } },
        select: { id: true },
      },
    },
  })

  const isOwner = session.user.role === "OWNER"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground">
            Manage your organization members
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Members List */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Members ({members.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={member.image || undefined} />
                      <AvatarFallback>
                        {member.name ? getInitials(member.name) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {member.assignedTasks.length} tasks
                    </span>
                    <Badge className={roleColors[member.role]}>
                      {member.role}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Invite Form */}
        {isOwner && (
          <Card>
            <CardHeader>
              <CardTitle>Invite Member</CardTitle>
            </CardHeader>
            <CardContent>
              <InviteForm />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
