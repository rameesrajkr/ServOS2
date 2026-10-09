import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  ActionableNotification,
  ActivityEvent,
  AttendanceStatus,
  Booking,
  BookingStatus,
  CompanyInvoice,
  CompanyPaymentRecord,
  CompanyTenant,
  CreditAdjustmentRecord,
  DayOfWeek,
  FeatureCatalogItem,
  FinancialTransaction,
  InventoryItem,
  InvoiceStatus,
  LeaveRequest,
  LeaveRequestStatus,
  LeaveType,
  MenuItem,
  ModuleId,
  OperationalTask,
  Order,
  OrderLineItem,
  OrderStatus,
  PaymentMethod,
  ProcurementOrder,
  ProcurementStage,
  ProductionStation,
  RestaurantTable,
  ServiceAuditLogEntry,
  ServiceCatalogItem,
  ServiceId,
  ShiftAssignmentCode,
  ShiftDefinition,
  StaffMember,
  StaffWeeklySchedule,
  SubscriptionPlanId,
  SubscriptionPlanPackage,
  Supplier,
  TableStatus,
  TaskPriority,
  UserRole,
} from '../types/operations';
import {
  INITIAL_ACTIVITY,
  INITIAL_BOOKINGS,
  INITIAL_COMPANIES,
  INITIAL_INVENTORY,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_MENU_ITEMS,
  INITIAL_NOTIFICATIONS,
  INITIAL_ORDERS,
  INITIAL_PROCUREMENT,
  INITIAL_SCHEDULE,
  INITIAL_SHIFTS,
  INITIAL_STAFF,
  INITIAL_SUPPLIERS,
  INITIAL_TABLES,
  INITIAL_TASKS,
  INITIAL_TRANSACTIONS,
} from '../lib/mock-data/initialData';
import {
  FEATURE_CATALOG,
  INITIAL_COMPANY_INVOICES,
  INITIAL_COMPANY_PAYMENTS,
  INITIAL_CREDIT_ADJUSTMENTS,
  INITIAL_SERVICE_AUDIT_LOG,
  INITIAL_SUBSCRIPTION_PLANS,
  RESOURCE_MANAGEMENT_SUB_SERVICES,
  SERVICE_CATALOG,
  getServiceById,
} from '../lib/mock-data/serviceCatalog';
import {
  buildCompanyInvoiceFromEntitlements,
  safeAddINR,
  safeSubtractINR,
} from '../lib/billingEngine';
import { formatINR } from '../lib/utils';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

interface OperationsContextValue {
  // Session, Role & Fast Staff Access
  role: UserRole;
  setRole: (role: UserRole) => void;
  activeStaffId: string;
  setActiveStaffId: (staffId: string) => void;
  activeStaffMember: StaffMember;
  loginAsStaffWithPin: (
    staffId: string,
    pinInput: string,
    prepareForClockInDemo?: boolean
  ) => boolean;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  activeCompanyId: string;
  setActiveCompanyId: (id: string) => void;
  activeCompany: CompanyTenant;
  companies: CompanyTenant[];

  // Modular Service Management, Feature Entitlements & Billing Engine
  serviceCatalog: ServiceCatalogItem[];
  featureCatalog: FeatureCatalogItem[];
  subscriptionPlans: SubscriptionPlanPackage[];
  companyInvoices: CompanyInvoice[];
  companyPayments: CompanyPaymentRecord[];
  creditAdjustments: CreditAdjustmentRecord[];
  serviceAuditLogs: ServiceAuditLogEntry[];
  hasService: (serviceId: ServiceId, companyId?: string) => boolean;
  hasFeature: (featureId: string, companyId?: string) => boolean;
  getServiceEntitlementSource: (
    serviceId: ServiceId,
    companyId?: string
  ) => {
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'COMING SOON';
    source: string;
    includedInPlan: boolean;
    isAddon: boolean;
    isOverriddenDisabled: boolean;
  };
  hasPermission: (
    serviceId: ServiceId,
    targetRole?: UserRole,
    companyId?: string
  ) => boolean;
  hasAccess: (
    serviceId: ServiceId,
    targetRole?: UserRole,
    companyId?: string
  ) => boolean;
  canAccessModule: (moduleId: ModuleId) => {
    allowed: boolean;
    reason?: 'service_disabled' | 'role_denied';
    serviceId?: ServiceId;
    serviceName?: string;
  };
  toggleCompanyService: (
    companyId: string,
    serviceId: ServiceId,
    enable: boolean,
    reason?: string,
    cascadeServiceIds?: ServiceId[]
  ) => void;
  toggleCompanyFeature: (
    companyId: string,
    featureId: string,
    reason?: string
  ) => void;
  setCompanyCustomServicePrice: (
    companyId: string,
    serviceId: ServiceId,
    customPrice: number | undefined,
    reason?: string
  ) => void;
  enableResourceManagementSuite: (
    companyId: string,
    enable: boolean,
    reason?: string
  ) => void;
  bulkUpdateCompanyService: (
    companyIds: string[],
    serviceId: ServiceId,
    enable: boolean,
    reason?: string
  ) => void;
  toggleCompanyRolePermission: (
    companyId: string,
    targetRole: UserRole,
    serviceId: ServiceId
  ) => void;
  updateCompanyPlan: (
    companyId: string,
    planId: SubscriptionPlanId,
    migrateServices?: boolean
  ) => void;
  updateCompanyDetails: (
    companyId: string,
    updates: Partial<CompanyTenant>
  ) => void;
  saveSubscriptionPlan: (
    plan: SubscriptionPlanPackage,
    migrateSubscribedCompanies?: boolean
  ) => void;
  createSubscriptionPackage: (plan: SubscriptionPlanPackage) => void;
  archiveSubscriptionPlan: (planId: SubscriptionPlanId) => void;
  approveCompanyOnboarding: (
    companyId: string,
    approvedServices: ServiceId[],
    onboardingOptions?: {
      planId?: SubscriptionPlanId;
      billingCycle?: CompanyTenant['billingCycle'];
      discountAmount?: number;
      paymentTerms?: CompanyTenant['paymentTerms'];
      generateFirstInvoice?: boolean;
    }
  ) => void;
  generateCompanyInvoice: (
    companyId: string,
    options?: {
      billingPeriod?: string;
      status?: InvoiceStatus;
      customDiscount?: number;
    }
  ) => CompanyInvoice | null;
  updateInvoiceStatus: (invoiceId: string, status: InvoiceStatus) => void;
  recordCompanyInvoicePayment: (
    invoiceId: string,
    amountPaid: number,
    paymentMethod: CompanyPaymentRecord['paymentMethod'],
    transactionReference: string,
    verificationSource: CompanyPaymentRecord['verificationSource']
  ) => void;
  addCreditAdjustment: (
    companyId: string,
    type: CreditAdjustmentRecord['type'],
    amount: number,
    reason: string,
    invoiceNumber?: string
  ) => void;

  // Navigation & Global Overlays
  activeModule: ModuleId;
  setActiveModule: (module: ModuleId) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;

  // Contextual Floor / Table / Order / Billing State + Resource Management State
  tables: RestaurantTable[];
  orders: Order[];
  menuItems: MenuItem[];
  bookings: Booking[];
  inventory: InventoryItem[];
  procurementOrders: ProcurementOrder[];
  suppliers: Supplier[];
  staff: StaffMember[];
  shifts: ShiftDefinition[];
  weeklySchedule: StaffWeeklySchedule[];
  leaveRequests: LeaveRequest[];
  tasks: OperationalTask[];
  transactions: FinancialTransaction[];
  notifications: ActionableNotification[];
  activities: ActivityEvent[];

  selectedTableId: string | null;
  setSelectedTableId: (tableId: string | null) => void;
  orderingTableId: string | null;
  setOrderingTableId: (tableId: string | null) => void;
  billingTableId: string | null;
  setBillingTableId: (tableId: string | null) => void;

  // Core Operational Actions
  seatTable: (tableId: string, guests: number) => void;
  updateTableStatus: (tableId: string, status: TableStatus) => void;
  transferTable: (fromTableId: string, toTableId: string) => void;
  addTableNote: (tableId: string, note: string) => void;
  sendOrderToKitchen: (
    tableId: string | null,
    items: Omit<OrderLineItem, 'id' | 'status'>[],
    options?: { customerName?: string; customerPhone?: string; note?: string }
  ) => Order;
  updateOrderItemQuantity: (orderId: string, lineItemId: string, delta: number) => void;
  advanceOrderStatus: (orderId: string, nextStatus: OrderStatus, station?: ProductionStation) => void;
  requestBillForTable: (tableId: string) => void;
  completeTablePayment: (
    tableId: string,
    method: PaymentMethod,
    discount?: number
  ) => { orderNumber: string; amount: number; method: PaymentMethod } | null;
  completeTakeawayOrder: (orderId: string, method?: PaymentMethod) => void;

  // Bookings Actions
  updateBookingStatus: (bookingId: string, status: BookingStatus) => void;
  createBooking: (booking: Omit<Booking, 'id'>) => void;

  // Menu Actions
  toggleMenuItemAvailability: (itemId: string) => void;
  saveMenuItem: (item: MenuItem) => void;
  duplicateMenuItem: (itemId: string) => void;

  // Inventory & Procurement Actions
  adjustInventoryStock: (itemId: string, newStock: number) => void;
  createPurchaseFromAlert: (itemId: string, quantity: number) => void;
  advanceProcurementStage: (poId: string) => void;
  paySupplierOutstanding: (supplierId: string) => void;

  // Resource Management & Staff Operations Actions
  updateStaffAttendance: (staffId: string, attendance: AttendanceStatus) => void;
  clockInStaff: (staffId: string) => void;
  startStaffBreak: (staffId: string) => void;
  endStaffBreak: (staffId: string) => void;
  clockOutStaff: (staffId: string) => void;
  resetStaffToNotClockedIn: (staffId: string) => void;
  updateStaffProfile: (updated: StaffMember) => void;
  saveShiftDefinition: (shift: ShiftDefinition) => void;
  duplicateShiftDefinition: (shiftId: string) => void;
  toggleShiftDefinitionActive: (shiftId: string) => void;
  cycleScheduleSlot: (staffId: string, day: DayOfWeek, explicitCode?: ShiftAssignmentCode) => void;
  updateStaffAvailabilityPreference: (
    staffId: string,
    preferredShift: StaffMember['preferredShift'],
    unavailableDays: string[]
  ) => void;
  submitLeaveRequest: (
    staffId: string,
    leaveType: LeaveType,
    startDate: string,
    endDate: string,
    reason: string
  ) => void;
  updateLeaveRequestStatus: (leaveId: string, status: LeaveRequestStatus) => void;
  assignOperationalTask: (
    title: string,
    staffId: string,
    priority: TaskPriority,
    dueTime: string,
    station?: OperationalTask['station']
  ) => void;
  toggleTaskStatus: (taskId: string) => void;

  // Finance Actions
  addExpenseTransaction: (title: string, amount: number, category: FinancialTransaction['category'], method: PaymentMethod) => void;

  // Super Admin Actions
  updateCompanyStatus: (companyId: string, status: CompanyTenant['status']) => void;

  // Notifications & Toasts
  markNotificationRead: (id: string) => void;
  triggerNotificationAction: (notification: ActionableNotification) => void;
  toasts: ToastMessage[];
  addToast: (title: string, description?: string, variant?: ToastMessage['variant']) => void;
  dismissToast: (id: string) => void;
  resetDemoState: () => void;
}

const OperationsContext = createContext<OperationsContextValue | undefined>(undefined);

const ROLE_DEFAULT_MODULE: Record<UserRole, ModuleId> = {
  COMPANY_ADMIN: 'overview',
  WAITER: 'floor',
  HEAD_CHEF: 'kitchen',
  JUICER: 'juice',
  FINANCE: 'finance',
  SUPER_ADMIN: 'sa_overview',
};

export const OperationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole>('COMPANY_ADMIN');
  const [activeStaffId, setActiveStaffId] = useState<string>('st-1');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [activeCompanyId, setActiveCompanyIdState] = useState<string>('comp-1');
  const [companies, setCompanies] = useState<CompanyTenant[]>(INITIAL_COMPANIES);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlanPackage[]>(
    INITIAL_SUBSCRIPTION_PLANS
  );
  const [companyInvoices, setCompanyInvoices] = useState<CompanyInvoice[]>(
    INITIAL_COMPANY_INVOICES
  );
  const [companyPayments, setCompanyPayments] = useState<CompanyPaymentRecord[]>(
    INITIAL_COMPANY_PAYMENTS
  );
  const [creditAdjustments, setCreditAdjustments] = useState<CreditAdjustmentRecord[]>(
    INITIAL_CREDIT_ADJUSTMENTS
  );
  const [serviceAuditLogs, setServiceAuditLogs] = useState<ServiceAuditLogEntry[]>(
    INITIAL_SERVICE_AUDIT_LOG
  );

  const activeCompany =
    companies.find((c) => c.id === activeCompanyId) || companies[0];

  const getServiceEntitlementSource = useCallback(
    (serviceId: ServiceId, companyId?: string) => {
      const catalogItem = getServiceById(serviceId);
      if (catalogItem?.platformStatus === 'COMING SOON') {
        return {
          status: 'COMING SOON' as const,
          source: 'Future V2 Roadmap',
          includedInPlan: false,
          isAddon: false,
          isOverriddenDisabled: false,
        };
      }

      const comp =
        companies.find((c) => c.id === (companyId || activeCompanyId)) ||
        companies[0];

      if (comp.status === 'Suspended') {
        return {
          status: 'SUSPENDED' as const,
          source: 'Account Suspended',
          includedInPlan: false,
          isAddon: false,
          isOverriddenDisabled: true,
        };
      }

      const planObj =
        subscriptionPlans.find((p) => p.id === comp.planId) ||
        subscriptionPlans[0];

      // Special handling for the 'resource_management' umbrella service
      if (serviceId === 'resource_management') {
        const anySubActive = RESOURCE_MANAGEMENT_SUB_SERVICES.some((subId) => {
          const inPlan = planObj.includedServices.includes(subId);
          const inAddon = comp.addonServices.includes(subId);
          const isDis = comp.disabledServices.includes(subId);
          return (inPlan || inAddon) && !isDis;
        });
        const explicitlyDisabled = comp.disabledServices.includes('resource_management');
        const explicitlyAddon = comp.addonServices.includes('resource_management');
        const inPlan = planObj.includedServices.includes('resource_management');

        if (explicitlyDisabled && !anySubActive) {
          return {
            status: 'INACTIVE' as const,
            source: 'Disabled by Super Admin',
            includedInPlan: inPlan,
            isAddon: false,
            isOverriddenDisabled: true,
          };
        }
        if (anySubActive || explicitlyAddon || (inPlan && !explicitlyDisabled)) {
          return {
            status: 'ACTIVE' as const,
            source: explicitlyAddon
              ? 'Custom Add-on'
              : inPlan
              ? `${planObj.name} Plan`
              : 'Granular Sub-Services',
            includedInPlan: inPlan,
            isAddon: explicitlyAddon,
            isOverriddenDisabled: false,
          };
        }
        return {
          status: 'INACTIVE' as const,
          source: `Not in ${planObj.name} Plan`,
          includedInPlan: false,
          isAddon: false,
          isOverriddenDisabled: false,
        };
      }

      const includedInPlan = planObj.includedServices.includes(serviceId);
      const isAddon = comp.addonServices.includes(serviceId);
      const isOverriddenDisabled = comp.disabledServices.includes(serviceId);

      if (isOverriddenDisabled) {
        return {
          status: 'INACTIVE' as const,
          source: includedInPlan
            ? 'Disabled by Super Admin (Client Override)'
            : 'Disabled by Super Admin',
          includedInPlan,
          isAddon: false,
          isOverriddenDisabled: true,
        };
      }

      if (isAddon) {
        return {
          status: 'ACTIVE' as const,
          source: includedInPlan ? `${planObj.name} Plan` : 'Custom Add-on',
          includedInPlan,
          isAddon: !includedInPlan,
          isOverriddenDisabled: false,
        };
      }

      if (includedInPlan) {
        return {
          status: 'ACTIVE' as const,
          source: `${planObj.name} Plan`,
          includedInPlan: true,
          isAddon: false,
          isOverriddenDisabled: false,
        };
      }

      return {
        status: 'INACTIVE' as const,
        source: `Not Included in ${planObj.name} Plan`,
        includedInPlan: false,
        isAddon: false,
        isOverriddenDisabled: false,
      };
    },
    [companies, activeCompanyId, subscriptionPlans]
  );

  const hasService = useCallback(
    (serviceId: ServiceId, companyId?: string): boolean => {
      return getServiceEntitlementSource(serviceId, companyId).status === 'ACTIVE';
    },
    [getServiceEntitlementSource]
  );

  const hasPermission = useCallback(
    (serviceId: ServiceId, targetRole?: UserRole, companyId?: string): boolean => {
      const effectiveRole = targetRole || role;
      if (effectiveRole === 'SUPER_ADMIN' || effectiveRole === 'COMPANY_ADMIN') {
        return true;
      }
      const comp =
        companies.find((c) => c.id === (companyId || activeCompanyId)) ||
        companies[0];
      const allowedList = comp.rolePermissions?.[effectiveRole] || [];
      if (serviceId === 'resource_management') {
        return (
          allowedList.includes('resource_management') ||
          RESOURCE_MANAGEMENT_SUB_SERVICES.some((s) => allowedList.includes(s))
        );
      }
      return allowedList.includes(serviceId);
    },
    [role, companies, activeCompanyId]
  );

  const hasAccess = useCallback(
    (serviceId: ServiceId, targetRole?: UserRole, companyId?: string): boolean => {
      return (
        hasService(serviceId, companyId) &&
        hasPermission(serviceId, targetRole, companyId)
      );
    },
    [hasService, hasPermission]
  );

  const canAccessModule = useCallback(
    (
      moduleId: ModuleId
    ): {
      allowed: boolean;
      reason?: 'service_disabled' | 'role_denied';
      serviceId?: ServiceId;
      serviceName?: string;
    } => {
      if (
        role === 'SUPER_ADMIN' ||
        moduleId === 'overview' ||
        moduleId === 'settings' ||
        moduleId === 'sa_overview' ||
        moduleId === 'sa_companies' ||
        moduleId === 'sa_subscriptions' ||
        moduleId === 'sa_system'
      ) {
        return { allowed: true };
      }

      const moduleToServiceMap: Partial<Record<ModuleId, ServiceId>> = {
        floor: 'floor',
        orders: 'orders',
        kitchen: 'kitchen',
        juice: 'juice',
        bookings: 'bookings',
        takeaway: 'takeaway',
        menu: 'menu',
        inventory: 'inventory',
        suppliers: 'suppliers',
        staff_home: 'attendance',
        rm_dashboard: 'resource_management',
        staff: 'staff',
        rm_attendance: 'attendance',
        rm_shifts: 'shifts',
        rm_schedule: 'schedule',
        rm_leave: 'leave',
        rm_tasks: 'tasks',
        rm_planning: 'resource_planning',
        finance: 'finance',
        reports: 'reports',
      };

      const requiredService = moduleToServiceMap[moduleId];
      if (!requiredService) return { allowed: true };

      const svcItem = getServiceById(requiredService);
      const serviceName = svcItem?.name || requiredService;

      if (!hasService(requiredService)) {
        return {
          allowed: false,
          reason: 'service_disabled',
          serviceId: requiredService,
          serviceName,
        };
      }

      if (!hasPermission(requiredService)) {
        return {
          allowed: false,
          reason: 'role_denied',
          serviceId: requiredService,
          serviceName,
        };
      }

      return { allowed: true, serviceId: requiredService, serviceName };
    },
    [role, hasService, hasPermission]
  );

  const [activeModule, setActiveModule] = useState<ModuleId>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const [tables, setTables] = useState<RestaurantTable[]>(INITIAL_TABLES);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU_ITEMS);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [procurementOrders, setProcurementOrders] = useState<ProcurementOrder[]>(INITIAL_PROCUREMENT);
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [staff, setStaff] = useState<StaffMember[]>(INITIAL_STAFF);
  const [shifts, setShifts] = useState<ShiftDefinition[]>(INITIAL_SHIFTS);
  const [weeklySchedule, setWeeklySchedule] = useState<StaffWeeklySchedule[]>(INITIAL_SCHEDULE);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(INITIAL_LEAVE_REQUESTS);
  const [tasks, setTasks] = useState<OperationalTask[]>(INITIAL_TASKS);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>(INITIAL_TRANSACTIONS);
  const [notifications, setNotifications] = useState<ActionableNotification[]>(INITIAL_NOTIFICATIONS);
  const [activities, setActivities] = useState<ActivityEvent[]>(INITIAL_ACTIVITY);

  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [orderingTableId, setOrderingTableId] = useState<string | null>(null);
  const [billingTableId, setBillingTableId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    (title: string, description?: string, variant: ToastMessage['variant'] = 'default') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-3), { id, title, description, variant }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3600);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const logActivity = useCallback(
    (title: string, detail: string, category: ActivityEvent['category']) => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      setActivities((prev) => [
        {
          id: `act-${Date.now()}`,
          time: timeStr,
          title,
          detail,
          category,
        },
        ...prev,
      ]);
    },
    []
  );

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const setRole = useCallback(
    (newRole: UserRole) => {
      setRoleState(newRole);
      setSelectedTableId(null);
      setOrderingTableId(null);
      setBillingTableId(null);
      if (newRole === 'WAITER') {
        setActiveStaffId('st-arun');
        setActiveModule('staff_home');
      } else if (newRole === 'HEAD_CHEF') {
        setActiveStaffId('st-anu');
        setActiveModule('staff_home');
      } else if (newRole === 'JUICER') {
        setActiveStaffId('st-vishnu');
        setActiveModule('staff_home');
      } else if (newRole === 'COMPANY_ADMIN') {
        setActiveStaffId('st-1');
        setActiveModule('overview');
      } else {
        setActiveModule(ROLE_DEFAULT_MODULE[newRole]);
      }
      const roleLabels: Record<UserRole, string> = {
        COMPANY_ADMIN: 'Company Admin / Manager',
        WAITER: 'Waiter Operations (Arun)',
        HEAD_CHEF: 'Chef Operations (Anu)',
        JUICER: 'Juicer / Production (Vishnu)',
        FINANCE: 'Finance & Management',
        SUPER_ADMIN: 'Super Admin Platform',
      };
      addToast(`Switched to ${roleLabels[newRole]}`, 'Workspace adapted to role permissions & workflows.', 'default');
    },
    [addToast]
  );

  // Secure Mock PIN Verification for Fast Staff Access (Section 2 & 24)
  // Does not store or compare plaintext PINs in UI; simulates hashed token verification.
  const loginAsStaffWithPin = useCallback(
    (staffId: string, pinInput: string, prepareForClockInDemo = false): boolean => {
      if (!/^\d{4}$/.test(pinInput)) {
        return false;
      }
      const member = staff.find((s) => s.id === staffId);
      if (!member) return false;

      if (prepareForClockInDemo) {
        setStaff((prev) =>
          prev.map((s) =>
            s.id === staffId
              ? {
                  ...s,
                  clockStatus: 'Not Clocked In',
                  checkInTime: undefined,
                  clockOutTime: undefined,
                  breakStartedAt: undefined,
                  workedDuration: '0h 00m',
                }
              : s
          )
        );
      }

      setActiveStaffId(member.id);
      setRoleState(member.userRoleMapping);
      setSelectedTableId(null);
      setOrderingTableId(null);
      setBillingTableId(null);

      if (member.userRoleMapping === 'COMPANY_ADMIN') {
        setActiveModule('overview');
      } else {
        setActiveModule('staff_home');
      }

      addToast(
        `Welcome, ${member.name}`,
        `Signed in to ${member.role} workspace (${member.currentShiftTime}).`,
        'success'
      );
      return true;
    },
    [staff, addToast]
  );

  const activeStaffMember =
    staff.find((s) => s.id === activeStaffId) || staff[0];

  const seatTable = useCallback(
    (tableId: string, guests: number) => {
      setTables((prev) =>
        prev.map((t) =>
          t.id === tableId
            ? {
                ...t,
                status: 'Occupied',
                guestCount: guests,
                durationMinutes: 1,
                seatedAt: 'Just now',
                waiterName: 'Karthik R.',
              }
            : t
        )
      );
      const tbl = tables.find((t) => t.id === tableId);
      addToast(`${tbl?.name || 'Table'} seated`, `${guests} guests checked in.`, 'success');
      logActivity(`${tbl?.name || 'Table'} seated`, `${guests} guests · Waiter: Karthik R.`, 'order');
    },
    [tables, addToast, logActivity]
  );

  const updateTableStatus = useCallback(
    (tableId: string, status: TableStatus) => {
      setTables((prev) =>
        prev.map((t) =>
          t.id === tableId
            ? {
                ...t,
                status,
                ...(status === 'Available'
                  ? { guestCount: 0, durationMinutes: 0, currentOrderId: undefined, reservationName: undefined }
                  : {}),
              }
            : t
        )
      );
      const tbl = tables.find((t) => t.id === tableId);
      addToast(`${tbl?.name || 'Table'} marked ${status}`, undefined, 'default');
    },
    [tables, addToast]
  );

  const transferTable = useCallback(
    (fromTableId: string, toTableId: string) => {
      const fromTable = tables.find((t) => t.id === fromTableId);
      const toTable = tables.find((t) => t.id === toTableId);
      if (!fromTable || !toTable) return;

      setTables((prev) =>
        prev.map((t) => {
          if (t.id === fromTableId) {
            return {
              ...t,
              status: 'Available',
              guestCount: 0,
              durationMinutes: 0,
              currentOrderId: undefined,
            };
          }
          if (t.id === toTableId) {
            return {
              ...t,
              status: fromTable.status,
              guestCount: fromTable.guestCount || 2,
              durationMinutes: fromTable.durationMinutes,
              currentOrderId: fromTable.currentOrderId,
              waiterName: fromTable.waiterName,
              seatedAt: fromTable.seatedAt,
            };
          }
          return t;
        })
      );

      if (fromTable.currentOrderId) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === fromTable.currentOrderId
              ? { ...o, tableId: toTable.id, tableName: `Table ${toTable.number}` }
              : o
          )
        );
      }

      setSelectedTableId(toTableId);
      addToast(
        `Transferred ${fromTable.name} → ${toTable.name}`,
        'Order items and guest session moved seamlessly.',
        'success'
      );
      logActivity(
        `Table transfer ${fromTable.name} → ${toTable.name}`,
        `${fromTable.guestCount} guests & active bill reassigned`,
        'order'
      );
    },
    [tables, addToast, logActivity]
  );

  const addTableNote = useCallback(
    (tableId: string, note: string) => {
      const tbl = tables.find((t) => t.id === tableId);
      if (!tbl?.currentOrderId) return;
      setOrders((prev) =>
        prev.map((o) => (o.id === tbl.currentOrderId ? { ...o, notes: note } : o))
      );
      addToast('Kitchen note saved', `Attached to ${tbl.name} order.`, 'default');
    },
    [tables, addToast]
  );

  const sendOrderToKitchen = useCallback(
    (
      tableId: string | null,
      newItems: Omit<OrderLineItem, 'id' | 'status'>[],
      options?: { customerName?: string; customerPhone?: string; note?: string }
    ): Order => {
      const lineItems: OrderLineItem[] = newItems.map((item, idx) => ({
        ...item,
        id: `li-${Date.now()}-${idx}`,
        status: 'New',
      }));

      // Check if table already has an unpaid active order
      const targetTable = tableId ? tables.find((t) => t.id === tableId) : undefined;
      const existingOrder = targetTable?.currentOrderId
        ? orders.find((o) => o.id === targetTable.currentOrderId && !o.isPaid)
        : undefined;

      if (existingOrder && targetTable) {
        const mergedItems = [...existingOrder.items];
        lineItems.forEach((newItem) => {
          const existingIdx = mergedItems.findIndex(
            (i) =>
              i.menuItemId === newItem.menuItemId &&
              i.size === newItem.size &&
              i.spice === newItem.spice &&
              i.status === 'New'
          );
          if (existingIdx > -1) {
            mergedItems[existingIdx] = {
              ...mergedItems[existingIdx],
              quantity: mergedItems[existingIdx].quantity + newItem.quantity,
            };
          } else {
            mergedItems.push(newItem);
          }
        });

        const subtotal = mergedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const tax = Math.round(subtotal * 0.05);
        const total = subtotal - existingOrder.discount + tax;

        const updatedOrder: Order = {
          ...existingOrder,
          items: mergedItems,
          status: 'New',
          subtotal,
          tax,
          total,
          notes: options?.note || existingOrder.notes,
        };

        setOrders((prev) => prev.map((o) => (o.id === existingOrder.id ? updatedOrder : o)));
        setTables((prev) =>
          prev.map((t) =>
            t.id === targetTable.id
              ? {
                  ...t,
                  status: 'Preparing',
                  guestCount: t.guestCount > 0 ? t.guestCount : 2,
                }
              : t
          )
        );

        addToast(
          `Sent ${lineItems.reduce((s, i) => s + i.quantity, 0)} items to Kitchen`,
          `${targetTable.name} (${existingOrder.orderNumber}) updated — Total ${formatINR(total)}`,
          'success'
        );
        logActivity(
          `Added items to ${existingOrder.orderNumber} (${targetTable.name})`,
          `${lineItems.map((i) => `${i.name} ×${i.quantity}`).join(', ')}`,
          'kitchen'
        );
        return updatedOrder;
      }

      // Otherwise create a brand new order
      const isTakeaway = !tableId;
      const nextNum = 109 + orders.length;
      const orderNumber = isTakeaway ? `#P${nextNum}` : `#${nextNum}`;
      const subtotal = lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const tax = Math.round(subtotal * 0.05);
      const total = subtotal + tax;

      const createdOrder: Order = {
        id: `ord-${Date.now()}`,
        orderNumber,
        type: isTakeaway ? 'Takeaway' : 'Dine-In',
        tableId: targetTable?.id,
        tableName: targetTable ? `Table ${targetTable.number}` : undefined,
        customerName: options?.customerName || (isTakeaway ? 'Walk-in Guest' : undefined),
        customerPhone: options?.customerPhone,
        waiterName: isTakeaway ? 'Parcel Desk' : 'Karthik R.',
        items: lineItems,
        status: 'New',
        createdAt: 'Just now',
        elapsedMinutes: 1,
        subtotal,
        discount: 0,
        tax,
        total,
        isPaid: false,
        notes: options?.note,
      };

      setOrders((prev) => [createdOrder, ...prev]);

      if (targetTable) {
        setTables((prev) =>
          prev.map((t) =>
            t.id === targetTable.id
              ? {
                  ...t,
                  status: 'Preparing',
                  guestCount: t.guestCount || 2,
                  durationMinutes: t.durationMinutes || 1,
                  seatedAt: t.seatedAt || 'Just now',
                  currentOrderId: createdOrder.id,
                  waiterName: 'Karthik R.',
                }
              : t
          )
        );
      }

      addToast(
        `Order ${orderNumber} sent to Kitchen`,
        `${targetTable ? targetTable.name : createdOrder.customerName} · ${formatINR(total)}`,
        'success'
      );
      logActivity(
        `New order ${orderNumber} fired to Kitchen`,
        `${targetTable ? targetTable.name : 'Takeaway'} · ${lineItems.length} items · ${formatINR(total)}`,
        'kitchen'
      );

      return createdOrder;
    },
    [tables, orders, addToast, logActivity]
  );

  const updateOrderItemQuantity = useCallback((orderId: string, lineItemId: string, delta: number) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        const updatedItems = order.items
          .map((item) =>
            item.id === lineItemId ? { ...item, quantity: item.quantity + delta } : item
          )
          .filter((item) => item.quantity > 0);

        const subtotal = updatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const tax = Math.round(subtotal * 0.05);
        const total = Math.max(0, subtotal - order.discount + tax);

        return {
          ...order,
          items: updatedItems,
          subtotal,
          tax,
          total,
        };
      })
    );
  }, []);

  const advanceOrderStatus = useCallback(
    (orderId: string, nextStatus: OrderStatus, station?: ProductionStation) => {
      const targetOrder = orders.find((o) => o.id === orderId);
      if (!targetOrder) return;

      const itemNextStatus =
        nextStatus === 'Preparing'
          ? 'Preparing'
          : nextStatus === 'Ready'
          ? 'Ready'
          : nextStatus === 'Served' || nextStatus === 'Completed'
          ? 'Served'
          : 'New';

      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== orderId) return order;
          const updatedItems = order.items.map((item) => {
            if (station && item.station !== station) return item;
            return { ...item, status: itemNextStatus as OrderLineItem['status'] };
          });
          return {
            ...order,
            status: nextStatus,
            items: updatedItems,
          };
        })
      );

      if (targetOrder.tableId) {
        const nextTableStatus: TableStatus =
          nextStatus === 'Preparing'
            ? 'Preparing'
            : nextStatus === 'Ready'
            ? 'Ready'
            : nextStatus === 'Served'
            ? 'Occupied'
            : 'Occupied';

        setTables((prev) =>
          prev.map((t) => (t.id === targetOrder.tableId ? { ...t, status: nextTableStatus } : t))
        );
      }

      addToast(
        `Order ${targetOrder.orderNumber} → ${nextStatus}`,
        targetOrder.tableName
          ? `${targetOrder.tableName} status synchronized.`
          : `Takeaway order for ${targetOrder.customerName} updated.`,
        nextStatus === 'Ready' ? 'success' : 'default'
      );
      logActivity(
        `Order ${targetOrder.orderNumber} marked ${nextStatus}`,
        `${targetOrder.tableName || targetOrder.customerName || 'Order'} · ${station || 'All Stations'}`,
        'kitchen'
      );
    },
    [orders, addToast, logActivity]
  );

  const requestBillForTable = useCallback(
    (tableId: string) => {
      const tbl = tables.find((t) => t.id === tableId);
      if (!tbl) return;
      setTables((prev) =>
        prev.map((t) => (t.id === tableId ? { ...t, status: 'Waiting for Bill' } : t))
      );
      setBillingTableId(tableId);
      addToast(`Bill generated for ${tbl.name}`, 'Ready for Cash, Card, or UPI settlement.', 'default');
      logActivity(`Bill requested for ${tbl.name}`, `Waiter initiated settlement workflow`, 'payment');
    },
    [tables, addToast, logActivity]
  );

  const completeTablePayment = useCallback(
    (tableId: string, method: PaymentMethod, discountOverride?: number) => {
      const tbl = tables.find((t) => t.id === tableId);
      if (!tbl) return null;
      const order = orders.find((o) => o.id === tbl.currentOrderId);
      const subtotal = order?.subtotal ?? 1050;
      const discount = discountOverride !== undefined ? discountOverride : order?.discount ?? 50;
      const tax = order?.tax ?? 100;
      const finalAmount = Math.max(0, subtotal - discount + tax);
      const orderNumber = order?.orderNumber ?? '#101';

      if (order) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id
              ? {
                  ...o,
                  discount,
                  total: finalAmount,
                  isPaid: true,
                  paymentMethod: method,
                  status: 'Completed',
                  items: o.items.map((i) => ({ ...i, status: 'Served' })),
                }
              : o
          )
        );
      }

      // Transition table immediately to AVAILABLE as required by the Core Demo Flow
      setTables((prev) =>
        prev.map((t) =>
          t.id === tableId
            ? {
                ...t,
                status: 'Available',
                guestCount: 0,
                durationMinutes: 0,
                currentOrderId: undefined,
                seatedAt: undefined,
              }
            : t
        )
      );

      // Record financial transaction
      const newTx: FinancialTransaction = {
        id: `tx-${Date.now()}`,
        reference: `INV-${Math.floor(9085 + Math.random() * 900)}`,
        title: `${tbl.name} (${orderNumber}) — Dine-In Settlement`,
        category: 'Dine-In Sale',
        type: 'Inflow',
        amount: finalAmount,
        method,
        timestamp: 'Just now',
        status: 'Completed',
      };
      setTransactions((prev) => [newTx, ...prev]);

      addToast(
        `Payment Successful · ${formatINR(finalAmount)}`,
        `${tbl.name} settled via ${method} and is now AVAILABLE.`,
        'success'
      );
      logActivity(
        `${tbl.name} payment completed via ${method}`,
        `${formatINR(finalAmount)} received · ${tbl.name} is now Available`,
        'payment'
      );

      return { orderNumber, amount: finalAmount, method };
    },
    [tables, orders, addToast, logActivity]
  );

  const completeTakeawayOrder = useCallback(
    (orderId: string, method: PaymentMethod = 'UPI') => {
      const ord = orders.find((o) => o.id === orderId);
      if (!ord) return;
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: 'Completed', isPaid: true, paymentMethod: o.paymentMethod || method }
            : o
        )
      );
      addToast(`Takeaway ${ord.orderNumber} completed`, `Handed over to ${ord.customerName}.`, 'success');
      logActivity(`Takeaway ${ord.orderNumber} picked up`, `${ord.customerName} · ${formatINR(ord.total)}`, 'order');
    },
    [orders, addToast, logActivity]
  );

  const updateBookingStatus = useCallback(
    (bookingId: string, status: BookingStatus) => {
      const bk = bookings.find((b) => b.id === bookingId);
      if (!bk) return;
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status } : b)));

      if (status === 'Seated') {
        setTables((prev) =>
          prev.map((t) =>
            t.id === bk.tableId
              ? {
                  ...t,
                  status: 'Occupied',
                  guestCount: bk.guests,
                  seatedAt: 'Just now',
                  durationMinutes: 1,
                  waiterName: 'Karthik R.',
                }
              : t
          )
        );
      }

      addToast(
        `Booking for ${bk.guestName} → ${status}`,
        status === 'Seated' ? `${bk.tableName} marked Occupied (${bk.guests} guests).` : `${bk.time} · ${bk.tableName}`,
        status === 'Seated' || status === 'Confirmed' ? 'success' : 'default'
      );
      logActivity(`Booking ${status}: ${bk.guestName}`, `${bk.tableName} · ${bk.guests} guests`, 'booking');
    },
    [bookings, addToast, logActivity]
  );

  const createBooking = useCallback(
    (newBk: Omit<Booking, 'id'>) => {
      const created: Booking = { ...newBk, id: `bk-${Date.now()}` };
      setBookings((prev) => [created, ...prev]);
      setTables((prev) =>
        prev.map((t) =>
          t.id === newBk.tableId && t.status === 'Available'
            ? {
                ...t,
                status: 'Reserved',
                guestCount: newBk.guests,
                reservationName: newBk.guestName,
                reservationTime: newBk.time,
              }
            : t
        )
      );
      addToast(`Reservation confirmed for ${newBk.guestName}`, `${newBk.time} · ${newBk.tableName}`, 'success');
      logActivity(`New reservation: ${newBk.guestName}`, `${newBk.tableName} at ${newBk.time} (${newBk.guests} guests)`, 'booking');
    },
    [addToast, logActivity]
  );

  const toggleMenuItemAvailability = useCallback(
    (itemId: string) => {
      const item = menuItems.find((m) => m.id === itemId);
      setMenuItems((prev) =>
        prev.map((m) => (m.id === itemId ? { ...m, available: !m.available } : m))
      );
      if (item) {
        addToast(
          `${item.name} ${!item.available ? 'Enabled' : 'Disabled'}`,
          !item.available ? 'Now available on waiter POS.' : 'Temporarily hidden from active ordering.',
          'default'
        );
      }
    },
    [menuItems, addToast]
  );

  const saveMenuItem = useCallback(
    (updated: MenuItem) => {
      setMenuItems((prev) => {
        const exists = prev.some((m) => m.id === updated.id);
        if (exists) {
          return prev.map((m) => (m.id === updated.id ? updated : m));
        }
        return [updated, ...prev];
      });
      addToast(`Saved "${updated.name}"`, `${formatINR(updated.price)} · ${updated.category}`, 'success');
    },
    [addToast]
  );

  const duplicateMenuItem = useCallback(
    (itemId: string) => {
      const orig = menuItems.find((m) => m.id === itemId);
      if (!orig) return;
      const copy: MenuItem = {
        ...orig,
        id: `m-${Date.now()}`,
        name: `${orig.name} (Special)`,
      };
      setMenuItems((prev) => [copy, ...prev]);
      addToast(`Duplicated "${orig.name}"`, 'Ready for customization.', 'default');
    },
    [menuItems, addToast]
  );

  const adjustInventoryStock = useCallback(
    (itemId: string, newStock: number) => {
      setInventory((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;
          const status =
            newStock <= item.minimumStock * 0.6
              ? 'Critical'
              : newStock < item.minimumStock
              ? 'Low'
              : 'Healthy';
          return {
            ...item,
            currentStock: Math.max(0, newStock),
            status,
            lastUpdated: 'Just now',
          };
        })
      );
      const target = inventory.find((i) => i.id === itemId);
      addToast(`Stock updated: ${target?.name}`, `New level: ${newStock} ${target?.unit}`, 'success');
    },
    [inventory, addToast]
  );

  const createPurchaseFromAlert = useCallback(
    (itemId: string, quantity: number) => {
      const item = inventory.find((i) => i.id === itemId);
      if (!item) return;
      const amount = quantity * item.unitCost;
      const newPo: ProcurementOrder = {
        id: `po-${Date.now()}`,
        poNumber: `PO-2026-${Math.floor(885 + Math.random() * 110)}`,
        itemId: item.id,
        itemName: item.name,
        quantity,
        unit: item.unit,
        supplierId: item.supplierId,
        supplierName: item.supplierName,
        amount,
        stage: 'Purchase Request',
        createdAt: 'Just now',
        dueDate: 'Tomorrow, 7:00 AM',
      };
      setProcurementOrders((prev) => [newPo, ...prev]);
      addToast(
        `Purchase Order ${newPo.poNumber} created`,
        `${quantity} ${item.unit} of ${item.name} (${formatINR(amount)})`,
        'success'
      );
      logActivity(
        `Created ${newPo.poNumber} for ${item.name}`,
        `${quantity} ${item.unit} · ${item.supplierName} · ${formatINR(amount)}`,
        'inventory'
      );
    },
    [inventory, addToast, logActivity]
  );

  const advanceProcurementStage = useCallback(
    (poId: string) => {
      const stages: ProcurementStage[] = [
        'Stock Alert',
        'Purchase Request',
        'Supplier',
        'Order',
        'Receive Stock',
        'Payment',
      ];
      const target = procurementOrders.find((p) => p.id === poId);
      if (!target) return;
      const currentIdx = stages.indexOf(target.stage);
      if (currentIdx === -1 || currentIdx >= stages.length - 1) return;
      const nextStage = stages[currentIdx + 1];

      setProcurementOrders((prev) =>
        prev.map((p) => (p.id === poId ? { ...p, stage: nextStage } : p))
      );

      if (nextStage === 'Receive Stock') {
        // Automatically replenish inventory
        setInventory((prev) =>
          prev.map((inv) => {
            if (inv.id !== target.itemId) return inv;
            const updatedStock = inv.currentStock + target.quantity;
            return {
              ...inv,
              currentStock: updatedStock,
              status: updatedStock >= inv.minimumStock ? 'Healthy' : 'Low',
              lastUpdated: 'Just now (PO Received)',
            };
          })
        );
        addToast(
          `Stock Received · +${target.quantity} ${target.unit}`,
          `${target.itemName} inventory is now Healthy.`,
          'success'
        );
      } else {
        addToast(`${target.poNumber} → ${nextStage}`, `${target.itemName} (${target.supplierName})`, 'default');
      }
    },
    [procurementOrders, addToast]
  );

  const paySupplierOutstanding = useCallback(
    (supplierId: string) => {
      const sup = suppliers.find((s) => s.id === supplierId);
      if (!sup || sup.outstandingAmount <= 0) return;

      const paidAmount = sup.outstandingAmount;
      setSuppliers((prev) =>
        prev.map((s) =>
          s.id === supplierId
            ? {
                ...s,
                outstandingAmount: 0,
                status: 'Active',
                recentPurchases: s.recentPurchases.map((rp) => ({ ...rp, status: 'Paid' })),
              }
            : s
        )
      );

      setTransactions((prev) => [
        {
          id: `tx-${Date.now()}`,
          reference: `SUP-${Math.floor(500 + Math.random() * 400)}`,
          title: `${sup.name} — Vendor Settlement`,
          category: 'Supplier Payment',
          type: 'Outflow',
          amount: paidAmount,
          method: 'Bank Transfer',
          timestamp: 'Just now',
          status: 'Completed',
        },
        ...prev.map((t) =>
          t.title.includes(sup.name) ? { ...t, status: 'Completed' as const } : t
        ),
      ]);

      addToast(
        `Settled ${formatINR(paidAmount)} to ${sup.name}`,
        'Vendor ledger balance is now ₹0.',
        'success'
      );
      logActivity(`Supplier payment completed: ${sup.name}`, `${formatINR(paidAmount)} via Bank Transfer`, 'payment');
    },
    [suppliers, addToast, logActivity]
  );

  const updateStaffAttendance = useCallback(
    (staffId: string, attendance: AttendanceStatus) => {
      const member = staff.find((s) => s.id === staffId);
      setStaff((prev) =>
        prev.map((s) =>
          s.id === staffId
            ? {
                ...s,
                attendance,
                clockStatus:
                  attendance === 'Present'
                    ? 'Working'
                    : attendance === 'Late'
                    ? 'Late'
                    : 'Not Clocked In',
                checkInTime:
                  attendance === 'Present' || attendance === 'Late'
                    ? s.checkInTime || '10:02 AM'
                    : undefined,
                availability:
                  attendance === 'Present' || attendance === 'Late'
                    ? 'Available'
                    : 'Unavailable',
                status:
                  attendance === 'Present' || attendance === 'Late'
                    ? 'On Floor'
                    : 'Off Duty',
              }
            : s
        )
      );
      if (member) {
        addToast(`${member.name} marked ${attendance}`, `Shift status updated.`, 'default');
      }
    },
    [staff, addToast]
  );

  const clockInStaff = useCallback(
    (staffId: string) => {
      const member = staff.find((s) => s.id === staffId);
      const clockInStr = '10:02 AM';
      setStaff((prev) =>
        prev.map((s) =>
          s.id === staffId
            ? {
                ...s,
                clockStatus: 'Working',
                attendance: 'Present',
                checkInTime: clockInStr,
                clockOutTime: undefined,
                breakStartedAt: undefined,
                workedDuration: '2h 14m',
                availability: s.role.includes('Chef') ? 'Kitchen' : 'Available',
                status: s.role.includes('Chef') || s.role === 'Juicer' ? 'In Kitchen' : 'On Floor',
                activityTimeline: [
                  { time: clockInStr, action: 'Clocked in' },
                  ...s.activityTimeline,
                ],
              }
            : s
        )
      );
      if (member) {
        addToast(
          `You're clocked in ✓ (${clockInStr})`,
          `Shift: ${member.currentShiftTime}`,
          'success'
        );
        logActivity(`${member.name} (${member.role}) clocked in`, `Shift ${member.currentShiftTime}`, 'order');
      }
    },
    [staff, addToast, logActivity]
  );

  const startStaffBreak = useCallback(
    (staffId: string) => {
      const member = staff.find((s) => s.id === staffId);
      const breakStart = '2:14 PM';
      setStaff((prev) =>
        prev.map((s) =>
          s.id === staffId
            ? {
                ...s,
                clockStatus: 'On Break',
                breakStartedAt: breakStart,
                availability: 'On Break',
                status: 'Break',
                activityTimeline: [
                  { time: breakStart, action: 'Started break' },
                  ...s.activityTimeline,
                ],
              }
            : s
        )
      );
      if (member) {
        addToast(
          `${member.name} on break`,
          `Started at ${breakStart} · Working timer paused.`,
          'default'
        );
      }
    },
    [staff, addToast]
  );

  const endStaffBreak = useCallback(
    (staffId: string) => {
      const member = staff.find((s) => s.id === staffId);
      setStaff((prev) =>
        prev.map((s) =>
          s.id === staffId
            ? {
                ...s,
                clockStatus: 'Working',
                breakStartedAt: undefined,
                totalBreakMinutes: (s.totalBreakMinutes || 24) + 18,
                availability: s.role.includes('Chef') ? 'Kitchen' : 'Available',
                status: s.role.includes('Chef') || s.role === 'Juicer' ? 'In Kitchen' : 'On Floor',
                activityTimeline: [
                  { time: '2:32 PM', action: 'Returned from break' },
                  ...s.activityTimeline,
                ],
              }
            : s
        )
      );
      if (member) {
        addToast(
          `Break ended · Working time resumed`,
          `Total break time: ${(member.totalBreakMinutes || 24) + 18} min`,
          'success'
        );
      }
    },
    [staff, addToast]
  );

  const clockOutStaff = useCallback(
    (staffId: string) => {
      const member = staff.find((s) => s.id === staffId);
      setStaff((prev) =>
        prev.map((s) =>
          s.id === staffId
            ? {
                ...s,
                clockStatus: 'Completed',
                clockOutTime: '6:21 PM',
                breakStartedAt: undefined,
                workedDuration: '7h 37m',
                availability: 'Unavailable',
                status: 'Off Duty',
                activityTimeline: [
                  { time: '6:21 PM', action: 'Clocked out (Worked 7h 37m)' },
                  ...s.activityTimeline,
                ],
              }
            : s
        )
      );
      if (member) {
        addToast(
          `Shift Completed ✓`,
          `${member.name} worked 7h 37m · Clocked out at 6:21 PM`,
          'success'
        );
        logActivity(
          `${member.name} completed shift`,
          `Clocked out at 6:21 PM · Total worked: 7h 37m`,
          'order'
        );
      }
    },
    [staff, addToast, logActivity]
  );

  const resetStaffToNotClockedIn = useCallback(
    (staffId: string) => {
      setStaff((prev) =>
        prev.map((s) =>
          s.id === staffId
            ? {
                ...s,
                clockStatus: 'Not Clocked In',
                checkInTime: undefined,
                clockOutTime: undefined,
                breakStartedAt: undefined,
                workedDuration: '0h 00m',
                availability: 'Unavailable',
              }
            : s
        )
      );
    },
    []
  );

  const updateStaffProfile = useCallback(
    (updated: StaffMember) => {
      setStaff((prev) => {
        const exists = prev.some((s) => s.id === updated.id);
        if (exists) {
          return prev.map((s) => (s.id === updated.id ? updated : s));
        }
        return [updated, ...prev];
      });
      addToast(`Saved staff profile: ${updated.name}`, `${updated.role} · ${updated.currentShiftTime}`, 'success');
    },
    [addToast]
  );

  const saveShiftDefinition = useCallback(
    (shift: ShiftDefinition) => {
      setShifts((prev) => {
        const exists = prev.some((sh) => sh.id === shift.id);
        if (exists) {
          return prev.map((sh) => (sh.id === shift.id ? shift : sh));
        }
        return [...prev, shift];
      });
      addToast(`Shift saved: ${shift.name}`, `${shift.startTime} – ${shift.endTime}`, 'success');
    },
    [addToast]
  );

  const duplicateShiftDefinition = useCallback(
    (shiftId: string) => {
      const orig = shifts.find((sh) => sh.id === shiftId);
      if (!orig) return;
      const copy: ShiftDefinition = {
        ...orig,
        id: `sh-${Date.now()}`,
        name: `${orig.name} (Copy)`,
      };
      setShifts((prev) => [...prev, copy]);
      addToast(`Duplicated "${orig.name}"`, 'Ready to customize hours & staffing.', 'default');
    },
    [shifts, addToast]
  );

  const toggleShiftDefinitionActive = useCallback(
    (shiftId: string) => {
      setShifts((prev) =>
        prev.map((sh) => (sh.id === shiftId ? { ...sh, active: !sh.active } : sh))
      );
      addToast('Shift status updated', undefined, 'default');
    },
    [addToast]
  );

  const cycleScheduleSlot = useCallback(
    (staffId: string, day: DayOfWeek, explicitCode?: ShiftAssignmentCode) => {
      const orderCycle: ShiftAssignmentCode[] = ['M', 'E', 'OFF'];
      setWeeklySchedule((prev) =>
        prev.map((row) => {
          if (row.staffId !== staffId) return row;
          const current = row.days[day];
          const next =
            explicitCode ||
            orderCycle[(orderCycle.indexOf(current === 'LEAVE' ? 'OFF' : current) + 1) % orderCycle.length];
          return {
            ...row,
            days: {
              ...row.days,
              [day]: next,
            },
          };
        })
      );
      addToast('Schedule updated', `Assigned shift for ${day}.`, 'default');
    },
    [addToast]
  );

  const updateStaffAvailabilityPreference = useCallback(
    (
      staffId: string,
      preferredShift: StaffMember['preferredShift'],
      unavailableDays: string[]
    ) => {
      setStaff((prev) =>
        prev.map((s) =>
          s.id === staffId ? { ...s, preferredShift, unavailableDays } : s
        )
      );
      const dayCodeMap: Record<string, DayOfWeek> = {
        Monday: 'MON',
        Tuesday: 'TUE',
        Wednesday: 'WED',
        Thursday: 'THU',
        Friday: 'FRI',
        Saturday: 'SAT',
        Sunday: 'SUN',
      };
      const mappedDays = unavailableDays
        .map((d) => dayCodeMap[d] || (d as DayOfWeek))
        .filter(Boolean);

      setWeeklySchedule((prev) =>
        prev.map((row) =>
          row.staffId === staffId
            ? { ...row, preferredShift, unavailableDays: mappedDays }
            : row
        )
      );
      addToast('Availability preferences saved', `Updated preferred shift & unavailable days.`, 'success');
    },
    [addToast]
  );

  const submitLeaveRequest = useCallback(
    (
      staffId: string,
      leaveType: LeaveType,
      startDate: string,
      endDate: string,
      reason: string
    ) => {
      const member = staff.find((s) => s.id === staffId) || activeStaffMember;
      const newReq: LeaveRequest = {
        id: `lv-${Date.now()}`,
        staffId: member.id,
        staffName: member.name,
        staffRole: member.role,
        leaveType,
        startDate,
        endDate,
        reason,
        status: 'Pending',
        requestedAt: 'Just now',
      };
      setLeaveRequests((prev) => [newReq, ...prev]);
      addToast(
        `Leave request submitted`,
        `${member.name} · ${startDate} → ${endDate} (${leaveType})`,
        'success'
      );
    },
    [staff, activeStaffMember, addToast]
  );

  const updateLeaveRequestStatus = useCallback(
    (leaveId: string, status: LeaveRequestStatus) => {
      const req = leaveRequests.find((l) => l.id === leaveId);
      setLeaveRequests((prev) =>
        prev.map((l) => (l.id === leaveId ? { ...l, status } : l))
      );
      if (req && status === 'Approved') {
        setStaff((prev) =>
          prev.map((s) => {
            if (s.id !== req.staffId) return s;
            return {
              ...s,
              annualLeaveRemaining:
                req.leaveType === 'Annual Leave'
                  ? Math.max(0, s.annualLeaveRemaining - 2)
                  : s.annualLeaveRemaining,
              sickLeaveRemaining:
                req.leaveType === 'Sick Leave'
                  ? Math.max(0, s.sickLeaveRemaining - 1)
                  : s.sickLeaveRemaining,
            };
          })
        );
        // Reflect approved leave on weekly schedule
        setWeeklySchedule((prev) =>
          prev.map((row) =>
            row.staffId === req.staffId
              ? { ...row, days: { ...row.days, MON: 'LEAVE', TUE: 'LEAVE' } }
              : row
          )
        );
      }
      if (req) {
        addToast(
          `Leave request ${status}`,
          `${req.staffName} (${req.startDate} → ${req.endDate})`,
          status === 'Approved' ? 'success' : 'default'
        );
      }
    },
    [leaveRequests, addToast]
  );

  const assignOperationalTask = useCallback(
    (
      title: string,
      staffId: string,
      priority: TaskPriority,
      dueTime: string,
      station: OperationalTask['station'] = 'General'
    ) => {
      const member = staff.find((s) => s.id === staffId) || staff[0];
      const newTask: OperationalTask = {
        id: `tsk-${Date.now()}`,
        title,
        assignedStaffId: member.id,
        assignedStaffName: member.name,
        assignedRole: member.role,
        priority,
        dueTime,
        status: 'Pending',
        station,
      };
      setTasks((prev) => [newTask, ...prev]);
      addToast(
        `Task assigned to ${member.name}`,
        `${title} · Due ${dueTime} (${priority} priority)`,
        'success'
      );
    },
    [staff, addToast]
  );

  const toggleTaskStatus = useCallback(
    (taskId: string) => {
      const tsk = tasks.find((t) => t.id === taskId);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: t.status === 'Completed' ? 'Pending' : 'Completed',
              }
            : t
        )
      );
      if (tsk) {
        addToast(
          tsk.status === 'Completed' ? `Reopened "${tsk.title}"` : `Completed "${tsk.title}" ✓`,
          `Assigned to ${tsk.assignedStaffName}`,
          tsk.status === 'Completed' ? 'default' : 'success'
        );
      }
    },
    [tasks, addToast]
  );

  const addExpenseTransaction = useCallback(
    (
      title: string,
      amount: number,
      category: FinancialTransaction['category'],
      method: PaymentMethod
    ) => {
      const newTx: FinancialTransaction = {
        id: `tx-${Date.now()}`,
        reference: `EXP-${Math.floor(415 + Math.random() * 500)}`,
        title,
        category,
        type: 'Outflow',
        amount,
        method,
        timestamp: 'Just now',
        status: 'Completed',
      };
      setTransactions((prev) => [newTx, ...prev]);
      addToast(`Recorded expense · ${formatINR(amount)}`, title, 'default');
      logActivity(`Expense logged: ${title}`, `${formatINR(amount)} via ${method}`, 'payment');
    },
    [addToast, logActivity]
  );

  const setActiveCompanyId = useCallback(
    (id: string) => {
      setActiveCompanyIdState(id);
      const comp = companies.find((c) => c.id === id);
      if (comp) {
        addToast(
          `Switched Tenant: ${comp.name}`,
          `${comp.businessType} · ${comp.plan} · Entitlements & navigation updated`,
          'default'
        );
      }
    },
    [companies, addToast]
  );

  const toggleCompanyService = useCallback(
    (
      companyId: string,
      serviceId: ServiceId,
      enable: boolean,
      reason?: string,
      cascadeServiceIds: ServiceId[] = []
    ) => {
      const comp = companies.find((c) => c.id === companyId);
      if (!comp) return;
      const planObj =
        subscriptionPlans.find((p) => p.id === comp.planId) ||
        subscriptionPlans[0];

      const targets: ServiceId[] = Array.from(
        new Set([
          serviceId,
          ...cascadeServiceIds,
          ...(serviceId === 'resource_management'
            ? RESOURCE_MANAGEMENT_SUB_SERVICES
            : []),
        ])
      );

      setCompanies((prev) =>
        prev.map((c) => {
          if (c.id !== companyId) return c;
          let nextAddons = [...c.addonServices];
          let nextDisabled = [...c.disabledServices];

          targets.forEach((tId) => {
            const inPlan = planObj.includedServices.includes(tId);
            if (enable) {
              nextDisabled = nextDisabled.filter((id) => id !== tId);
              if (!inPlan && !nextAddons.includes(tId)) {
                nextAddons.push(tId);
              }
            } else {
              nextAddons = nextAddons.filter((id) => id !== tId);
              if (inPlan && !nextDisabled.includes(tId)) {
                nextDisabled.push(tId);
              } else if (!inPlan && !nextDisabled.includes(tId)) {
                nextDisabled.push(tId);
              }
            }
          });

          return {
            ...c,
            addonServices: nextAddons,
            disabledServices: nextDisabled,
            lastActivity: 'Just now',
          };
        })
      );

      const svcName = getServiceById(serviceId)?.name || serviceId;
      const newLog: ServiceAuditLogEntry = {
        id: `sa-log-${Date.now()}`,
        action: enable ? 'SERVICE ACTIVATED' : 'SERVICE DEACTIVATED',
        serviceId,
        serviceName:
          cascadeServiceIds.length > 0
            ? `${svcName} (+${cascadeServiceIds.length} dependent)`
            : svcName,
        companyId: comp.id,
        companyName: comp.name,
        changedBy: 'Super Admin',
        timestamp: 'Just now',
        dateLabel: 'Oct 7, 2026',
        previousValue: enable ? 'Disabled' : 'Enabled',
        newValue: enable ? 'Enabled' : 'Disabled (Historical data retained)',
        reason:
          reason ||
          (enable
            ? `Enabled ${svcName} for ${comp.name}`
            : `Disabled ${svcName} access (historical data retained)`),
      };
      setServiceAuditLogs((prev) => [newLog, ...prev]);

      addToast(
        enable
          ? `${svcName} enabled for ${comp.name}`
          : `${svcName} disabled for ${comp.name}`,
        enable
          ? 'Client navigation, dashboard widgets, and permissions updated immediately.'
          : 'Access disabled. Existing historical data is safely retained.',
        enable ? 'success' : 'warning'
      );
    },
    [companies, subscriptionPlans, addToast]
  );

  const hasFeature = useCallback(
    (featureId: string, companyId?: string) => {
      const comp =
        companies.find((c) => c.id === (companyId || activeCompanyId)) ||
        companies[0];
      const feat = FEATURE_CATALOG.find((f) => f.id === featureId);
      if (!feat) return false;
      if (!hasService(feat.serviceId, comp.id)) return false;
      return !(comp.disabledFeatures || []).includes(featureId);
    },
    [companies, activeCompanyId, hasService]
  );

  const toggleCompanyFeature = useCallback(
    (companyId: string, featureId: string, reason?: string) => {
      const comp = companies.find((c) => c.id === companyId);
      const feat = FEATURE_CATALOG.find((f) => f.id === featureId);
      if (!comp || !feat) return;

      const currentlyDisabled = (comp.disabledFeatures || []).includes(featureId);
      const nextDisabled = currentlyDisabled
        ? (comp.disabledFeatures || []).filter((id) => id !== featureId)
        : [...(comp.disabledFeatures || []), featureId];

      setCompanies((prev) =>
        prev.map((c) =>
          c.id === companyId
            ? { ...c, disabledFeatures: nextDisabled, lastActivity: 'Just now' }
            : c
        )
      );

      setServiceAuditLogs((prev) => [
        {
          id: `sa-log-${Date.now()}`,
          action: 'FEATURE ENTITLEMENT CHANGED',
          serviceId: feat.serviceId,
          serviceName: `Feature: ${feat.name}`,
          companyId: comp.id,
          companyName: comp.name,
          changedBy: 'Super Admin',
          timestamp: 'Just now',
          dateLabel: 'Oct 7, 2026',
          previousValue: currentlyDisabled ? 'Disabled' : 'Enabled',
          newValue: currentlyDisabled ? 'Enabled' : 'Disabled',
          reason:
            reason ||
            `${currentlyDisabled ? 'Enabled' : 'Disabled'} feature "${feat.name}" for ${comp.name}.`,
        },
        ...prev,
      ]);

      addToast(
        `Feature ${currentlyDisabled ? 'Enabled' : 'Disabled'}: ${feat.name}`,
        `Updated feature-level entitlement for ${comp.name}.`,
        currentlyDisabled ? 'success' : 'warning'
      );
    },
    [companies, addToast]
  );

  const setCompanyCustomServicePrice = useCallback(
    (
      companyId: string,
      serviceId: ServiceId,
      customPrice: number | undefined,
      reason?: string
    ) => {
      const comp = companies.find((c) => c.id === companyId);
      if (!comp) return;
      const svcName = getServiceById(serviceId)?.name || serviceId;
      const prevPrice = comp.customServicePrices?.[serviceId];

      setCompanies((prev) =>
        prev.map((c) => {
          if (c.id !== companyId) return c;
          const nextPrices = { ...(c.customServicePrices || {}) };
          if (customPrice === undefined) {
            delete nextPrices[serviceId];
          } else {
            nextPrices[serviceId] = customPrice;
          }
          return {
            ...c,
            customServicePrices: nextPrices,
            lastActivity: 'Just now',
          };
        })
      );

      setServiceAuditLogs((prev) => [
        {
          id: `sa-log-${Date.now()}`,
          action: 'PLAN UPDATED',
          serviceId,
          serviceName: `Custom Pricing: ${svcName}`,
          companyId: comp.id,
          companyName: comp.name,
          changedBy: 'Super Admin',
          timestamp: 'Just now',
          dateLabel: 'Oct 7, 2026',
          previousValue:
            prevPrice !== undefined ? formatINR(prevPrice) : 'Standard Base Price',
          newValue:
            customPrice !== undefined
              ? `${formatINR(customPrice)}/mo (Custom Negotiated)`
              : 'Standard Base Price',
          reason:
            reason ||
            `Set negotiated service price for ${svcName} on ${comp.name}.`,
        },
        ...prev,
      ]);

      addToast(
        `Updated Service Price: ${svcName}`,
        customPrice !== undefined
          ? `Set custom negotiated rate of ${formatINR(customPrice)}/mo for ${comp.name}.`
          : `Reverted ${svcName} to standard catalog pricing.`,
        'success'
      );
    },
    [companies, addToast]
  );

  const enableResourceManagementSuite = useCallback(
    (companyId: string, enable: boolean, reason?: string) => {
      toggleCompanyService(
        companyId,
        'resource_management',
        enable,
        reason ||
          (enable
            ? 'Client requested full Resource Management suite.'
            : 'Resource Management suite disabled by Super Admin.'),
        RESOURCE_MANAGEMENT_SUB_SERVICES
      );
    },
    [toggleCompanyService]
  );

  const bulkUpdateCompanyService = useCallback(
    (
      companyIds: string[],
      serviceId: ServiceId,
      enable: boolean,
      reason?: string
    ) => {
      const svcName = getServiceById(serviceId)?.name || serviceId;
      companyIds.forEach((cId) => {
        toggleCompanyService(cId, serviceId, enable, reason);
      });
      addToast(
        `Bulk Action Complete: ${svcName}`,
        `${enable ? 'Enabled' : 'Disabled'} ${svcName} across ${companyIds.length} companies.`,
        enable ? 'success' : 'warning'
      );
    },
    [toggleCompanyService, addToast]
  );

  const toggleCompanyRolePermission = useCallback(
    (companyId: string, targetRole: UserRole, serviceId: ServiceId) => {
      const comp = companies.find((c) => c.id === companyId);
      if (!comp) return;
      const currentList = comp.rolePermissions[targetRole] || [];
      const exists = currentList.includes(serviceId);
      const nextList = exists
        ? currentList.filter((id) => id !== serviceId)
        : [...currentList, serviceId];

      setCompanies((prev) =>
        prev.map((c) =>
          c.id === companyId
            ? {
                ...c,
                rolePermissions: {
                  ...c.rolePermissions,
                  [targetRole]: nextList,
                },
              }
            : c
        )
      );

      const svcName = getServiceById(serviceId)?.name || serviceId;
      setServiceAuditLogs((prev) => [
        {
          id: `sa-log-${Date.now()}`,
          action: 'PERMISSION UPDATED',
          serviceId,
          serviceName: svcName,
          companyId: comp.id,
          companyName: comp.name,
          changedBy: 'Super Admin',
          timestamp: 'Just now',
          dateLabel: 'Oct 7, 2026',
          reason: `${exists ? 'Revoked' : 'Granted'} ${svcName} permission for role ${targetRole}.`,
        },
        ...prev,
      ]);

      addToast(
        `Role Permission Updated`,
        `${targetRole}: ${svcName} is now ${exists ? 'DENIED' : 'ALLOWED'} for ${comp.name}.`,
        'default'
      );
    },
    [companies, addToast]
  );

  const updateCompanyPlan = useCallback(
    (
      companyId: string,
      planId: SubscriptionPlanId,
      migrateServices = true
    ) => {
      const planObj = subscriptionPlans.find((p) => p.id === planId);
      const comp = companies.find((c) => c.id === companyId);
      if (!planObj || !comp) return;

      setCompanies((prev) =>
        prev.map((c) =>
          c.id === companyId
            ? {
                ...c,
                planId: planObj.id,
                plan: planObj.displayBadge,
                mrr: planObj.monthlyPrice,
                ...(migrateServices
                  ? {
                      addonServices: [],
                      disabledServices: SERVICE_CATALOG.filter(
                        (s) =>
                          s.version === 'V1' &&
                          !planObj.includedServices.includes(s.id)
                      ).map((s) => s.id),
                    }
                  : {}),
                limitsUsage: {
                  ...c.limitsUsage,
                  staffMax: planObj.limits.maxStaff,
                  usersMax: planObj.limits.maxUsers,
                  tablesMax: planObj.limits.maxTables,
                  monthlyOrdersLimit: planObj.limits.monthlyOrdersLimit,
                },
              }
            : c
        )
      );

      setServiceAuditLogs((prev) => [
        {
          id: `sa-log-${Date.now()}`,
          action: 'PLAN UPDATED',
          serviceName: `${planObj.name} Package`,
          companyId: comp.id,
          companyName: comp.name,
          changedBy: 'Super Admin',
          timestamp: 'Just now',
          dateLabel: 'Oct 7, 2026',
          previousValue: `${comp.plan} (${formatINR(comp.mrr)}/mo)`,
          newValue: `${planObj.displayBadge} (${formatINR(planObj.monthlyPrice)}/mo)`,
          reason: `Assigned ${planObj.name} package (${planObj.includedServices.length} included services).`,
        },
        ...prev,
      ]);

      addToast(
        `Assigned ${planObj.name} Package to ${comp.name}`,
        `Subscription updated to ${formatINR(planObj.monthlyPrice)}/mo.`,
        'success'
      );
    },
    [subscriptionPlans, companies, addToast]
  );

  const updateCompanyDetails = useCallback(
    (companyId: string, updates: Partial<CompanyTenant>) => {
      const comp = companies.find((c) => c.id === companyId);
      if (!comp) return;
      setCompanies((prev) =>
        prev.map((c) =>
          c.id === companyId
            ? { ...c, ...updates, lastActivity: 'Just now' }
            : c
        )
      );
      addToast(
        `Updated ${comp.name}`,
        'Company profile and subscription terms saved.',
        'success'
      );
    },
    [companies, addToast]
  );

  const saveSubscriptionPlan = useCallback(
    (
      updatedPlan: SubscriptionPlanPackage,
      migrateSubscribedCompanies = false
    ) => {
      setSubscriptionPlans((prev) =>
        prev.map((p) => (p.id === updatedPlan.id ? updatedPlan : p))
      );

      if (migrateSubscribedCompanies) {
        setCompanies((prev) =>
          prev.map((c) =>
            c.planId === updatedPlan.id
              ? {
                  ...c,
                  plan: updatedPlan.displayBadge,
                  mrr: updatedPlan.monthlyPrice,
                  limitsUsage: {
                    ...c.limitsUsage,
                    staffMax: updatedPlan.limits.maxStaff,
                    usersMax: updatedPlan.limits.maxUsers,
                    tablesMax: updatedPlan.limits.maxTables,
                    monthlyOrdersLimit: updatedPlan.limits.monthlyOrdersLimit,
                  },
                }
              : c
          )
        );
      }

      addToast(
        `Saved ${updatedPlan.name} Package`,
        migrateSubscribedCompanies
          ? `Updated package and migrated active subscribed companies.`
          : `Saved for new subscriptions (existing customer subscriptions preserved).`,
        'success'
      );
    },
    [addToast]
  );

  const createSubscriptionPackage = useCallback(
    (newPlan: SubscriptionPlanPackage) => {
      setSubscriptionPlans((prev) => [...prev, newPlan]);
      const targetComp = companies.find(
        (c) => c.id === newPlan.assignedCompanyId
      );

      setServiceAuditLogs((prev) => [
        {
          id: `sa-log-${Date.now()}`,
          action: 'CUSTOM PACKAGE CREATED',
          serviceName: newPlan.name,
          companyId: targetComp?.id || 'platform',
          companyName: targetComp?.name || 'Platform Catalog',
          changedBy: 'Super Admin',
          timestamp: 'Just now',
          dateLabel: 'Oct 7, 2026',
          previousValue: 'None',
          newValue: `${newPlan.name} (${formatINR(newPlan.monthlyPrice)}/mo · ${newPlan.includedServices.length} services)`,
          reason: newPlan.isCustomPackage
            ? `Created custom negotiated package for ${targetComp?.name || 'client'}.`
            : `Created reusable service package "${newPlan.name}".`,
        },
        ...prev,
      ]);

      if (targetComp && newPlan.isCustomPackage) {
        setCompanies((prev) =>
          prev.map((c) =>
            c.id === targetComp.id
              ? {
                  ...c,
                  planId: newPlan.id,
                  plan: newPlan.displayBadge,
                  mrr: newPlan.monthlyPrice,
                  addonServices: [],
                  disabledServices: SERVICE_CATALOG.filter(
                    (s) =>
                      s.version === 'V1' &&
                      !newPlan.includedServices.includes(s.id)
                  ).map((s) => s.id),
                }
              : c
          )
        );
      }

      addToast(
        `Created Package: ${newPlan.name}`,
        `${newPlan.includedServices.length} services · ${formatINR(newPlan.monthlyPrice)}/mo`,
        'success'
      );
    },
    [companies, addToast]
  );

  const archiveSubscriptionPlan = useCallback(
    (planId: SubscriptionPlanId) => {
      setSubscriptionPlans((prev) =>
        prev.map((p) =>
          p.id === planId
            ? { ...p, status: p.status === 'Active' ? 'Archived' : 'Active' }
            : p
        )
      );
      addToast('Package Status Updated', 'Updated package availability status.', 'default');
    },
    [addToast]
  );

  const approveCompanyOnboarding = useCallback(
    (
      companyId: string,
      approvedServices: ServiceId[],
      onboardingOptions?: {
        planId?: SubscriptionPlanId;
        billingCycle?: CompanyTenant['billingCycle'];
        discountAmount?: number;
        paymentTerms?: CompanyTenant['paymentTerms'];
        generateFirstInvoice?: boolean;
      }
    ) => {
      const comp = companies.find((c) => c.id === companyId);
      if (!comp) return;
      const targetPlanId = onboardingOptions?.planId || comp.planId;
      const planObj =
        subscriptionPlans.find((p) => p.id === targetPlanId) ||
        subscriptionPlans[1];

      const addons = approvedServices.filter(
        (id) => !planObj.includedServices.includes(id)
      );
      const disabled = SERVICE_CATALOG.filter(
        (s) =>
          s.version === 'V1' &&
          !approvedServices.includes(s.id) &&
          s.id !== 'dashboard' &&
          s.id !== 'company_management' &&
          s.id !== 'user_management'
      ).map((s) => s.id);

      const updatedComp: CompanyTenant = {
        ...comp,
        status: 'Active',
        subscriptionStatus: 'Active',
        planId: planObj.id,
        plan: planObj.displayBadge,
        billingCycle: onboardingOptions?.billingCycle || comp.billingCycle,
        discountAmount:
          onboardingOptions?.discountAmount ?? comp.discountAmount,
        paymentTerms: onboardingOptions?.paymentTerms || comp.paymentTerms,
        addonServices: addons,
        disabledServices: disabled,
        lastActivity: 'Just now',
      };

      setCompanies((prev) =>
        prev.map((c) => (c.id === companyId ? updatedComp : c))
      );

      if (onboardingOptions?.generateFirstInvoice !== false) {
        const firstInv = buildCompanyInvoiceFromEntitlements(
          updatedComp,
          (sId) => approvedServices.includes(sId),
          {
            billingPeriod: 'October 2026 (Onboarding)',
            status: 'Issued',
            customDiscount: updatedComp.discountAmount,
          }
        );
        setCompanyInvoices((prev) => [firstInv, ...prev]);
        setCompanies((prev) =>
          prev.map((c) =>
            c.id === companyId
              ? { ...c, outstandingAmount: firstInv.balanceDue }
              : c
          )
        );
      }

      setServiceAuditLogs((prev) => [
        {
          id: `sa-log-${Date.now()}`,
          action: 'COMPANY ONBOARDED',
          serviceName: `${approvedServices.length} Services Provisioned`,
          companyId: comp.id,
          companyName: comp.name,
          changedBy: 'Super Admin',
          timestamp: 'Just now',
          dateLabel: 'Oct 7, 2026',
          previousValue: 'Pending Application',
          newValue: `Active (${planObj.name} · ${approvedServices.length} Services)`,
          reason: `Completed 10-step onboarding workflow and activated subscription.`,
        },
        ...prev,
      ]);

      addToast(
        `Onboarded & Activated ${comp.name}`,
        `${approvedServices.length} services provisioned and initial invoice issued.`,
        'success'
      );
    },
    [companies, subscriptionPlans, addToast]
  );

  const generateCompanyInvoice = useCallback(
    (
      companyId: string,
      options?: {
        billingPeriod?: string;
        status?: InvoiceStatus;
        customDiscount?: number;
      }
    ): CompanyInvoice | null => {
      const comp = companies.find((c) => c.id === companyId);
      if (!comp) return null;

      const newInvoice = buildCompanyInvoiceFromEntitlements(
        comp,
        hasService,
        {
          billingPeriod: options?.billingPeriod || 'October 2026',
          status: options?.status || 'Draft',
          invoiceSequence: 1045 + companyInvoices.length,
          customDiscount: options?.customDiscount,
        }
      );

      setCompanyInvoices((prev) => [newInvoice, ...prev]);

      if (newInvoice.status === 'Issued') {
        setCompanies((prev) =>
          prev.map((c) =>
            c.id === companyId
              ? {
                  ...c,
                  outstandingAmount: safeAddINR(
                    c.outstandingAmount,
                    newInvoice.balanceDue
                  ),
                }
              : c
          )
        );
      }

      setServiceAuditLogs((prev) => [
        {
          id: `sa-log-${Date.now()}`,
          action: 'INVOICE GENERATED',
          serviceName: `${newInvoice.invoiceNumber} (${formatINR(newInvoice.total)})`,
          companyId: comp.id,
          companyName: comp.name,
          changedBy: 'Super Admin',
          timestamp: 'Just now',
          dateLabel: 'Oct 7, 2026',
          previousValue: 'No Invoice for Cycle',
          newValue: `${newInvoice.status}: ${formatINR(newInvoice.total)} (${newInvoice.lineItems.length} line items)`,
          reason: `Generated ${newInvoice.status.toLowerCase()} invoice for ${newInvoice.billingPeriod} from active company entitlements.`,
        },
        ...prev,
      ]);

      addToast(
        `Generated ${newInvoice.status} Invoice: ${newInvoice.invoiceNumber}`,
        `${comp.name} · Total: ${formatINR(newInvoice.total)} (${newInvoice.lineItems.length} service items)`,
        'success'
      );

      return newInvoice;
    },
    [companies, hasService, companyInvoices.length, addToast]
  );

  const updateInvoiceStatus = useCallback(
    (invoiceId: string, nextStatus: InvoiceStatus) => {
      const inv = companyInvoices.find((i) => i.id === invoiceId);
      if (!inv) return;

      setCompanyInvoices((prev) =>
        prev.map((i) => (i.id === invoiceId ? { ...i, status: nextStatus } : i))
      );

      if (inv.status === 'Draft' && nextStatus === 'Issued') {
        setCompanies((prev) =>
          prev.map((c) =>
            c.id === inv.companyId
              ? {
                  ...c,
                  outstandingAmount: safeAddINR(
                    c.outstandingAmount,
                    inv.balanceDue
                  ),
                }
              : c
          )
        );
      }

      addToast(
        `Invoice ${inv.invoiceNumber} → ${nextStatus}`,
        `Updated invoice status for ${inv.companyName}.`,
        'success'
      );
    },
    [companyInvoices, addToast]
  );

  const recordCompanyInvoicePayment = useCallback(
    (
      invoiceId: string,
      amountPaidInput: number,
      paymentMethod: CompanyPaymentRecord['paymentMethod'],
      transactionReference: string,
      verificationSource: CompanyPaymentRecord['verificationSource']
    ) => {
      const inv = companyInvoices.find((i) => i.id === invoiceId);
      if (!inv || amountPaidInput <= 0) return;

      const cappedPayment = Math.min(amountPaidInput, inv.balanceDue);
      const nextAmountPaid = safeAddINR(inv.amountPaid, cappedPayment);
      const nextBalanceDue = safeSubtractINR(inv.total, nextAmountPaid);
      const nextStatus: InvoiceStatus =
        nextBalanceDue <= 0 ? 'Paid' : 'Partially Paid';

      setCompanyInvoices((prev) =>
        prev.map((i) =>
          i.id === invoiceId
            ? {
                ...i,
                amountPaid: nextAmountPaid,
                balanceDue: nextBalanceDue,
                status: nextStatus,
              }
            : i
        )
      );

      const newPayment: CompanyPaymentRecord = {
        id: `pay-${Date.now()}`,
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        companyId: inv.companyId,
        companyName: inv.companyName,
        invoiceAmount: inv.total,
        amountPaid: cappedPayment,
        balanceAfter: nextBalanceDue,
        paymentMethod,
        transactionReference:
          transactionReference.trim() || `REF-${Date.now().toString().slice(-6)}`,
        paymentDate: 'Oct 7, 2026',
        verificationSource,
        status:
          nextBalanceDue > 0
            ? 'Partial'
            : verificationSource === 'Verified Payment Provider'
            ? 'Verified'
            : 'Manually Recorded',
      };

      setCompanyPayments((prev) => [newPayment, ...prev]);

      setCompanies((prev) =>
        prev.map((c) => {
          if (c.id !== inv.companyId) return c;
          const updatedOutstanding = safeSubtractINR(
            c.outstandingAmount,
            cappedPayment
          );
          return {
            ...c,
            outstandingAmount: updatedOutstanding,
            lastActivity: 'Just now',
          };
        })
      );

      setServiceAuditLogs((prev) => [
        {
          id: `sa-log-${Date.now()}`,
          action: 'PAYMENT RECORDED',
          serviceName: `${inv.invoiceNumber} (${paymentMethod})`,
          companyId: inv.companyId,
          companyName: inv.companyName,
          changedBy: 'Super Admin',
          timestamp: 'Just now',
          dateLabel: 'Oct 7, 2026',
          previousValue: `Balance ${formatINR(inv.balanceDue)} (${inv.status})`,
          newValue: `Paid ${formatINR(cappedPayment)} · Balance ${formatINR(nextBalanceDue)} (${nextStatus})`,
          reason: `Recorded ${verificationSource.toLowerCase()} payment via ${paymentMethod} (Ref: ${newPayment.transactionReference}).`,
        },
        ...prev,
      ]);

      addToast(
        `Payment Recorded: ${formatINR(cappedPayment)}`,
        `${inv.invoiceNumber} is now ${nextStatus} · Remaining balance: ${formatINR(nextBalanceDue)}`,
        'success'
      );
    },
    [companyInvoices, addToast]
  );

  const addCreditAdjustment = useCallback(
    (
      companyId: string,
      type: CreditAdjustmentRecord['type'],
      amount: number,
      reason: string,
      invoiceNumber?: string
    ) => {
      const comp = companies.find((c) => c.id === companyId);
      if (!comp || amount <= 0) return;

      const newCredit: CreditAdjustmentRecord = {
        id: `cred-${Date.now()}`,
        companyId: comp.id,
        companyName: comp.name,
        invoiceNumber,
        type,
        amount,
        reason,
        createdAt: 'Oct 7, 2026',
        status: 'Applied',
      };

      setCreditAdjustments((prev) => [newCredit, ...prev]);

      if (type !== 'Debit Adjustment') {
        setCompanies((prev) =>
          prev.map((c) =>
            c.id === companyId
              ? {
                  ...c,
                  discountAmount: safeAddINR(c.discountAmount, amount),
                  outstandingAmount: safeSubtractINR(
                    c.outstandingAmount,
                    amount
                  ),
                }
              : c
          )
        );
      }

      addToast(
        `${type} Recorded: ${formatINR(amount)}`,
        `Applied to ${comp.name} billing ledger.`,
        'success'
      );
    },
    [companies, addToast]
  );

  const updateCompanyStatus = useCallback(
    (companyId: string, status: CompanyTenant['status']) => {
      const comp = companies.find((c) => c.id === companyId);
      if (!comp) return;
      const nextSubStatus: CompanyTenant['subscriptionStatus'] =
        status === 'Active'
          ? 'Active'
          : status === 'Suspended'
          ? 'Suspended'
          : 'Pending Activation';

      setCompanies((prev) =>
        prev.map((c) =>
          c.id === companyId
            ? { ...c, status, subscriptionStatus: nextSubStatus }
            : c
        )
      );

      setServiceAuditLogs((prev) => [
        {
          id: `sa-log-${Date.now()}`,
          action:
            status === 'Suspended'
              ? 'COMPANY SUSPENDED'
              : 'COMPANY REACTIVATED',
          serviceName: `Account & Subscription Access`,
          companyId: comp.id,
          companyName: comp.name,
          changedBy: 'Super Admin',
          timestamp: 'Just now',
          dateLabel: 'Oct 7, 2026',
          previousValue: comp.status,
          newValue: status,
          reason:
            status === 'Suspended'
              ? 'Suspended tenant operational access (historical data preserved).'
              : 'Reactivated tenant operational access and restored entitled services.',
        },
        ...prev,
      ]);

      addToast(
        `${comp.name} → ${status}`,
        status === 'Suspended'
          ? 'Tenant access suspended. Historical records are safely preserved.'
          : 'Tenant access reactivated.',
        status === 'Suspended' ? 'warning' : 'success'
      );
    },
    [companies, addToast]
  );

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const triggerNotificationAction = useCallback(
    (notif: ActionableNotification) => {
      markNotificationRead(notif.id);
      setActiveModule(notif.targetModule);
      if (notif.targetModule === 'floor' && notif.targetEntityId) {
        setSelectedTableId(notif.targetEntityId);
      }
      addToast(`Opened ${notif.actionLabel}`, notif.title, 'default');
    },
    [markNotificationRead, addToast]
  );

  const resetDemoState = useCallback(() => {
    setCompanies(INITIAL_COMPANIES);
    setSubscriptionPlans(INITIAL_SUBSCRIPTION_PLANS);
    setCompanyInvoices(INITIAL_COMPANY_INVOICES);
    setCompanyPayments(INITIAL_COMPANY_PAYMENTS);
    setCreditAdjustments(INITIAL_CREDIT_ADJUSTMENTS);
    setServiceAuditLogs(INITIAL_SERVICE_AUDIT_LOG);
    setTables(INITIAL_TABLES);
    setOrders(INITIAL_ORDERS);
    setMenuItems(INITIAL_MENU_ITEMS);
    setBookings(INITIAL_BOOKINGS);
    setInventory(INITIAL_INVENTORY);
    setProcurementOrders(INITIAL_PROCUREMENT);
    setSuppliers(INITIAL_SUPPLIERS);
    setStaff(INITIAL_STAFF);
    setShifts(INITIAL_SHIFTS);
    setWeeklySchedule(INITIAL_SCHEDULE);
    setLeaveRequests(INITIAL_LEAVE_REQUESTS);
    setTasks(INITIAL_TASKS);
    setTransactions(INITIAL_TRANSACTIONS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setActivities(INITIAL_ACTIVITY);
    setSelectedTableId(null);
    setOrderingTableId(null);
    setBillingTableId(null);
    addToast('Demo state restored', 'All floor, kitchen, resource management, and billing state reset.', 'success');
  }, [addToast]);

  return (
    <OperationsContext.Provider
      value={{
        role,
        setRole,
        activeStaffId,
        setActiveStaffId,
        activeStaffMember,
        loginAsStaffWithPin,
        isLoginModalOpen,
        setIsLoginModalOpen,
        activeCompanyId,
        setActiveCompanyId,
        activeCompany,
        companies,
        serviceCatalog: SERVICE_CATALOG,
        featureCatalog: FEATURE_CATALOG,
        subscriptionPlans,
        companyInvoices,
        companyPayments,
        creditAdjustments,
        serviceAuditLogs,
        hasService,
        hasFeature,
        getServiceEntitlementSource,
        hasPermission,
        hasAccess,
        canAccessModule,
        toggleCompanyService,
        toggleCompanyFeature,
        setCompanyCustomServicePrice,
        enableResourceManagementSuite,
        bulkUpdateCompanyService,
        toggleCompanyRolePermission,
        updateCompanyPlan,
        updateCompanyDetails,
        saveSubscriptionPlan,
        createSubscriptionPackage,
        archiveSubscriptionPlan,
        approveCompanyOnboarding,
        generateCompanyInvoice,
        updateInvoiceStatus,
        recordCompanyInvoicePayment,
        addCreditAdjustment,
        activeModule,
        setActiveModule,
        sidebarCollapsed,
        setSidebarCollapsed,
        commandPaletteOpen,
        setCommandPaletteOpen,
        tables,
        orders,
        menuItems,
        bookings,
        inventory,
        procurementOrders,
        suppliers,
        staff,
        shifts,
        weeklySchedule,
        leaveRequests,
        tasks,
        transactions,
        notifications,
        activities,
        selectedTableId,
        setSelectedTableId,
        orderingTableId,
        setOrderingTableId,
        billingTableId,
        setBillingTableId,
        seatTable,
        updateTableStatus,
        transferTable,
        addTableNote,
        sendOrderToKitchen,
        updateOrderItemQuantity,
        advanceOrderStatus,
        requestBillForTable,
        completeTablePayment,
        completeTakeawayOrder,
        updateBookingStatus,
        createBooking,
        toggleMenuItemAvailability,
        saveMenuItem,
        duplicateMenuItem,
        adjustInventoryStock,
        createPurchaseFromAlert,
        advanceProcurementStage,
        paySupplierOutstanding,
        updateStaffAttendance,
        clockInStaff,
        startStaffBreak,
        endStaffBreak,
        clockOutStaff,
        resetStaffToNotClockedIn,
        updateStaffProfile,
        saveShiftDefinition,
        duplicateShiftDefinition,
        toggleShiftDefinitionActive,
        cycleScheduleSlot,
        updateStaffAvailabilityPreference,
        submitLeaveRequest,
        updateLeaveRequestStatus,
        assignOperationalTask,
        toggleTaskStatus,
        addExpenseTransaction,
        updateCompanyStatus,
        markNotificationRead,
        triggerNotificationAction,
        toasts,
        addToast,
        dismissToast,
        resetDemoState,
      }}
    >
      {children}
    </OperationsContext.Provider>
  );
};

export function useOperations() {
  const ctx = useContext(OperationsContext);
  if (!ctx) {
    throw new Error('useOperations must be used within an OperationsProvider');
  }
  return ctx;
}
