import type { User } from '../../entities'

/**
 * Port: Auth service.
 * Session validation happens at the API middleware level (Better Auth);
 * use cases receive userId directly. This port covers the rare cases
 * where the domain needs full user data.
 */
export interface IAuthService {
  getUserById(userId: string): Promise<User | null>
}
