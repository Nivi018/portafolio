import type { IAuthService, User } from "@finance/domain"
import type { PrismaClient } from "../database/client"
import { toDomainUser } from "../database/mapper"

/**
 * Auth service adapter implementing the domain IAuthService port.
 * Session handling itself is done by Better Auth at the API layer;
 * this covers domain use cases that need full user data.
 */
export class PrismaAuthService implements IAuthService {
  constructor(private readonly prisma: PrismaClient) {}

  async getUserById(userId: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id: userId } })
    return row ? toDomainUser(row) : null
  }
}
