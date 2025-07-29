

/**
 * @fileOverview TypeScript type definitions for the AgriFAAS Connect User Profile.
 */

export type UserRole =
  | 'Super Admin' // Top-level admin, can manage promo codes, etc.
  | 'Admin' // Primary system administrator, first user gets this.
  | 'Manager' // Access to full operations, task delegation, reports
  | 'FieldOfficer' // Limited to field data entry, task updates
  | 'HRManager' // Access to employee records, attendance, payroll
  | 'OfficeManager' // Access to office operations and management
  | 'FinanceManager' // Access to financial reports, budgeting, and office finances
  | 'Farmer' // General farmer role
  | 'Investor'
  | 'Farm Staff'
  | 'Agric Extension Officer';

export type Gender = 'Male' | 'Female' | 'Other' | 'PreferNotToSay';

export type CommunicationChannel = 'SMS' | 'AppNotification' | 'WhatsApp';

export type MobileMoneyProvider = 'MTN MoMo' | 'AirtelTigo' | 'Vodafone Cash';

export type EmploymentStatus = 'Active' | 'Seasonal' | 'Former';

export type WorkforceCategory = 'Laborer' | 'Technician' | 'Supervisor';

export type AppAccessType = 'Web' | 'Mobile';

export interface GPSCoordinates {
  latitude: number;
  longitude: number;
}

export interface YieldData {
  expected: number;
  actual: number;
  unit: string;
  season: string; // e.g., "2023 Dry Season"
  cropType: string;
}

export interface FarmHubDetails {
  linkedFarmHubId?: string;
  allocatedLandSizeAcres?: number;
  cropTypesBeingGrown?: string[];
  yieldData?: YieldData[];
  irrigationAccess?: boolean;
  productivityScore?: number; // e.g., 0-100
  previousSeasonPerformance?: string; // Could be a summary or link to detailed report
  soilType?: string; // Added for farmer profiling
  farmingTechniquesUsed?: string[]; // Added for farmer profiling
}

export interface MobileMoneyWallet {
  provider: MobileMoneyProvider;
  walletNumber: string;
}

export interface BankAccountDetails {
  bankName: string;
  accountNumber: string;
  branch?: string;
  accountName?: string;
}

export interface Investment {
  investmentId: string;
  type: string; // e.g., "Equity", "Debt"
  amount: number;
  currency: string; // e.g., "GHS", "USD"
  date: string; // ISO 8601 date string
  description?: string;
}

export interface Loan {
  loanId: string;
  amount: number;
  currency: string;
  lender: string;
  date: string; // ISO 8601 date string
  status: 'Active' | 'Paid Off' | 'Defaulted';
  repaymentSchedule?: string;
}

export interface Transaction {
  transactionId: string;
  type: 'Credit' | 'Debit' | 'Fee' | 'Payment' | 'Disbursement';
  amount: number;
  currency: string;
  date: string; // ISO 8601 date string
  description: string;
  status: 'Pending' | 'Completed' | 'Failed' | 'Reversed';
  relatedEntity?: string; // e.g., Order ID, Loan ID
}

export interface AttendanceLog {
  date: string; // ISO 8601 date string
  checkInTime?: string; // ISO 8601 datetime string
  checkOutTime?: string; // ISO 8601 datetime string
  gpsLocation?: GPSCoordinates;
  notes?: string;
}

export interface ContractDetails {
  contractId: string;
  startDate: string; // ISO 8601 date string
  endDate?: string; // ISO 8601 date string, optional for ongoing
  terms: string; // Could be a summary or link to a document
  documentUrl?: string;
}

export interface PayrollRecord {
  payrollId: string;
  payPeriod: string; // e.g., "2023-October"
  amount: number;
  currency: string;
  paymentDate: string; // ISO 8601 date string
  paymentMethod?: string; // e.g., "Mobile Money", "Bank Transfer"
}

export interface EmploymentDetails {
  employmentStatus?: EmploymentStatus;
  attendanceLogs?: AttendanceLog[];
  contractDetails?: ContractDetails;
  payrollRecords?: PayrollRecord[];
  workforceCategory?: WorkforceCategory;
  startDate?: string; // ISO 8601 date string
  endDate?: string; // ISO 8601 date string
}

export interface LoginHistoryEntry {
  timestamp: string; // ISO 8601 datetime string
  ipAddress?: string;
  device?: string; // e.g., "iPhone 13, iOS 17.1", "Chrome on Windows 10"
  userAgent?: string;
}

export interface NotificationPreferences {
  email?: boolean;
  sms?: boolean;
  push?: boolean; // In-app push notifications
  whatsApp?: boolean;
}

export interface AlertToggles {
  dailySummary?: boolean;
  weeklySummary?: boolean;
  priceAlerts?: boolean;
  pestAlerts?: boolean;
}

export type AccountStatus = 'Active' | 'PendingVerification' | 'Suspended' | 'Deactivated' | 'Invited';

export interface SubscriptionDetails {
  planId: 'starter' | 'grower' | 'business' | 'enterprise';
  status: 'Active' | 'Canceled' | 'Trialing' | 'Past Due';
  billingCycle: 'monthly' | 'annually';
  nextBillingDate?: string | null;
  trialEnds?: string | null; // Added for trial management
}

export interface AgriFAASUserProfile {
  // 1. Basic Information
  userId: string; // Auto-generated UUID for Firestore doc ID, primary key
  tenantId?: string; // ID of the tenant (farm) this user belongs to
  fullName: string;
  role: UserRole[]; // Can have multiple roles
  gender?: Gender;
  dateOfBirth?: string; // ISO 8601 date string
  nationalId?: string; // Ghana Card Number
  avatarUrl?: string;
  primaryLanguage?: string; // e.g., 'en', 'twi', 'ewe'
  organization?: string; // e.g., Name of the Cooperative or NGO for an AEO

  // 2. Contact & Login Info
  phoneNumber?: string;
  emailAddress?: string; // This will be the primary email for auth as well
  address?: {
    street?: string;
    city?: string;
    community?: string;
    region?: string;
    country?: string;
    postalCode?: string;
  };
  gpsCoordinates?: GPSCoordinates;
  preferredCommunicationChannel?: CommunicationChannel;

  // 3. Farm & Hub Details
  farmDetails?: FarmHubDetails;
  assignedRegion?: string;
  assignedDistrict?: string;
  farmChallenges?: string[];
  farmerNeeds?: string[];

  // 4. Financial & Mobile Money
  mobileMoneyWallets?: MobileMoneyWallet[];
  bankAccounts?: BankAccountDetails[];
  investmentPortfolio?: Investment[];
  loansOrFundingReceived?: Loan[];
  digitalWalletBalance?: {
    amount: number;
    currency: string;
  };
  transactionHistory?: Transaction[];

  // 5. HR & Employment
  employmentDetails?: EmploymentDetails;

  // 6. System & Permissions
  firebaseUid?: string; // UID from Firebase Authentication, linked after registration completion
  rbacTags?: string[];
  appAccess?: AppAccessType[];
  loginHistory?: LoginHistoryEntry[];
  lastActiveTimestamp?: string;
  lastLoginTimestamp?: string;
  deviceId?: string;
  deviceType?: string;
  accountStatus: AccountStatus;
  registrationDate: string; // ISO string of initial profile creation/invitation
  invitationToken?: string; // Unique token for completing registration
  invitationSentAt?: any; // Firestore ServerTimestamp

  // 7. Notifications & Preferences
  notificationPreferences?: NotificationPreferences;
  languagePreference?: string;
  alertsToggle?: AlertToggles;
  receiveAgriculturalTips?: boolean;
  receiveWeatherUpdates?: boolean;

  // 8. Billing & Subscription
  subscription?: SubscriptionDetails;
  
  // 9. AEO Specific Linkage
  managedByAEO?: string;
  initialAeoRegion?: string;
  initialAeoDistrict?: string;

  // Timestamps
  createdAt: any; // Firestore ServerTimestamp on creation
  updatedAt: any; // Firestore ServerTimestamp on update
}
