export interface UserProps {
  id: string
  name: string
  email: string
  image: string | null
  createdAt: Date
}

/**
 * Minimal User entity for the domain.
 * Authentication itself is handled by Better Auth in the infrastructure layer;
 * the domain only needs the identity for ownership checks.
 */
export class User {
  private constructor(private readonly props: UserProps) {}

  static reconstitute(props: UserProps): User {
    return new User(props)
  }

  get id(): string {
    return this.props.id
  }
  get name(): string {
    return this.props.name
  }
  get email(): string {
    return this.props.email
  }
  get image(): string | null {
    return this.props.image
  }
  get createdAt(): Date {
    return this.props.createdAt
  }
}
