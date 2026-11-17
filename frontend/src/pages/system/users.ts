// Platform accounts as listed by /system/users.
import type { Role } from './roles';

export interface UserRow {
  id: string;
  username: string;
  displayName: string;
  roleCode: string;
  roleName?: string | null;
  additionalRoles?: Array<Pick<Role, 'code' | 'name' | 'builtIn'>> | null;
  supplierId?: string | null;
  supplierName?: string | null;
  enabled: boolean;
  online?: boolean;
  version: number;
}

/** Account and one-time password returned by account creation or a password reset. */
export interface Credential { username?: string; initialPassword?: string | null }
