'use client';

export type UserRole = 'citizen' | 'officer' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  city?: string;
  department_id?: string | null;
  approval_status?: 'pending' | 'approved' | 'rejected';
}

const AUTH_KEY = 'civicfix_auth';

export function getAuthUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setAuthUser(user: AuthUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

export function clearAuthUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_KEY);
}

export function getRoleDashboard(role: UserRole): string {
  switch (role) {
    case 'citizen':
      return '/citizen-home';
    case 'officer':
      return '/officer-dashboard';
    case 'admin':
      return '/admin-dashboard';
  }
}

// Routes accessible by each role
export const roleRoutes: Record<UserRole, string[]> = {
  citizen: ['/citizen-home', '/citizen-dashboard', '/report-an-issue', '/complaint', '/explore'],
  officer: ['/officer-dashboard', '/complaint'],
  admin: ['/admin-dashboard', '/complaint'],
};

export function canRoleAccessPath(role: UserRole, pathname: string): boolean {
  const allowed = roleRoutes[role];
  return allowed.some((route) => pathname === route || pathname.startsWith(route + '/'));
}
