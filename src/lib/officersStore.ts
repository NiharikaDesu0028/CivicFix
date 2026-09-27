// Shared Officers & Approvals Store
// Works cooperatively with Supabase DB while providing resilient state
// for local execution and offline demonstrations.

export interface StoredOfficer {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: 'officer';
  city: string;
  department_name: string;
  department_id?: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  password?: string;
  resolved_count?: number;
  avg_resolution_hours?: number;
  rating?: number;
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  body: string;
  sent_at: string;
}

// Initial seed officers (1 approved for demo, 1 pending for review demonstration)
const DEFAULT_OFFICERS: StoredOfficer[] = [
  {
    id: '00000000-0000-0000-0000-000000000002',
    full_name: 'Priya Nair',
    email: 'priya.nair@bbmp.gov.in',
    phone: '9845012345',
    role: 'officer',
    city: 'Bengaluru',
    department_name: 'Roads & Infrastructure',
    department_id: 'dept-roads-01',
    approval_status: 'approved',
    is_active: true,
    created_at: '2026-08-15T09:30:00.000Z',
    password: 'Officer@2026',
    resolved_count: 42,
    avg_resolution_hours: 18.4,
    rating: 4.8,
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    full_name: 'Vikramaditya Joshi',
    email: 'vikram.joshi@bbmp.gov.in',
    phone: '9876543210',
    role: 'officer',
    city: 'Bengaluru',
    department_name: 'Sanitation & Waste',
    department_id: 'dept-waste-01',
    approval_status: 'pending',
    is_active: true,
    created_at: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
    password: 'Officer@2026',
    resolved_count: 0,
    avg_resolution_hours: 0,
    rating: 5.0,
  },
];

// Global in-memory cache to preserve updates across API requests during runtime
declare global {
  // eslint-disable-next-line no-var
  var __civicfix_officers: StoredOfficer[] | undefined;
  // eslint-disable-next-line no-var
  var __civicfix_email_logs: EmailLog[] | undefined;
}

function getGlobalOfficers(): StoredOfficer[] {
  if (!global.__civicfix_officers) {
    global.__civicfix_officers = [...DEFAULT_OFFICERS];
  }
  return global.__civicfix_officers;
}

function getGlobalEmailLogs(): EmailLog[] {
  if (!global.__civicfix_email_logs) {
    global.__civicfix_email_logs = [];
  }
  return global.__civicfix_email_logs;
}

export const officersStore = {
  getAll: (filters?: { city?: string; approval_status?: string }): StoredOfficer[] => {
    let list = getGlobalOfficers();
    if (filters?.city) {
      list = list.filter((o) => o.city.toLowerCase() === filters.city!.toLowerCase());
    }
    if (filters?.approval_status && filters.approval_status !== 'all') {
      list = list.filter((o) => o.approval_status === filters.approval_status);
    }
    return list;
  },

  getByEmail: (email: string): StoredOfficer | undefined => {
    const list = getGlobalOfficers();
    return list.find((o) => o.email.toLowerCase() === email.trim().toLowerCase());
  },

  getById: (id: string): StoredOfficer | undefined => {
    const list = getGlobalOfficers();
    return list.find((o) => o.id === id);
  },

  addOfficer: (officer: Omit<StoredOfficer, 'id' | 'created_at' | 'is_active'> & { id?: string }): StoredOfficer => {
    const list = getGlobalOfficers();
    const existingIndex = list.findIndex(
      (o) => o.email.toLowerCase() === officer.email.toLowerCase()
    );

    const newOfficer: StoredOfficer = {
      id: officer.id || `officer-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      full_name: officer.full_name,
      email: officer.email,
      phone: officer.phone,
      role: 'officer',
      city: officer.city || 'Bengaluru',
      department_name: officer.department_name || 'Roads & Infrastructure',
      department_id: officer.department_id,
      approval_status: officer.approval_status || 'pending',
      is_active: true,
      created_at: new Date().toISOString(),
      password: officer.password,
      resolved_count: 0,
      avg_resolution_hours: 0,
      rating: 5.0,
    };

    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...newOfficer };
      return list[existingIndex];
    } else {
      list.unshift(newOfficer);
      return newOfficer;
    }
  },

  updateApproval: (
    officerId: string,
    status: 'approved' | 'rejected'
  ): { officer: StoredOfficer; emailLog: EmailLog } | null => {
    const list = getGlobalOfficers();
    const officer = list.find((o) => o.id === officerId);
    if (!officer) return null;

    officer.approval_status = status;
    officer.updated_at = new Date().toISOString();

    const subject =
      status === 'approved'
        ? 'Your CivicFix Municipal Officer Account has been Approved!'
        : 'Update regarding your CivicFix Municipal Officer Application';

    const body =
      status === 'approved'
        ? `Dear ${officer.full_name},\n\nCongratulations! Your CivicFix officer account for the ${officer.department_name} department in ${officer.city} has been approved by the municipal administrator.\n\nYou can now sign in at the CivicFix portal to begin managing civic issues.`
        : `Dear ${officer.full_name},\n\nThank you for applying to CivicFix. Your officer application for ${officer.city} could not be approved at this time. If you believe this is an error, please contact admin@civicfix.in.`;

    const emailLog: EmailLog = {
      id: `email-${Date.now()}`,
      to: officer.email,
      subject,
      body,
      sent_at: new Date().toISOString(),
    };

    getGlobalEmailLogs().unshift(emailLog);
    console.log(`[CivicFix Email Notification] Dispatched to ${officer.email}: "${subject}"`);

    return { officer, emailLog };
  },

  getEmailLogs: (): EmailLog[] => {
    return getGlobalEmailLogs();
  },
};
