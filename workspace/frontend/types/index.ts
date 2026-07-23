import './index_generated';

declare module './index_generated' {
  export interface UserProfile {
    full_name?: string;
    email?: string;
    phone?: string;
    fullName?: string;
  }
}

// Re-export generated types
export * from './index_generated';

// Custom DTO for updating user profile
export interface UpdateProfileDTO {
  full_name?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  preferences?: any;
}

export interface AuditLogFilter {
  entity_type?: string;
  action?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}
