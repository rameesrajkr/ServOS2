export type UserRole =
  | 'COMPANY_ADMIN'
  | 'WAITER'
  | 'HEAD_CHEF'
  | 'JUICER'
  | 'FINANCE'
  | 'SUPER_ADMIN';

export type ModuleId =
  | 'overview'
  | 'floor'
  | 'orders'
  | 'kitchen'
  | 'juice'
  | 'bookings'
  | 'takeaway'
  | 'menu'
  | 'inventory'
  | 'suppliers'
  // Resource Management & Staff Home modules
  | 'staff_home'
  | 'rm_dashboard'
  | 'staff'
  | 'rm_attendance'
  | 'rm_shifts'
  | 'rm_schedule'
  | 'rm_leave'
  | 'rm_tasks'
  | 'rm_planning'
  | 'finance'
  | 'reports'
  | 'settings'
  // Super Admin modules
  | 'sa_overview'
  | 'sa_alerts'
  | 'sa_activity'
  | 'sa_companies'
  | 'sa_applications'
  | 'sa_company_details'
  | 'sa_company_services'
  | 'sa_system'
  | 'sa_services'
  | 'sa_features'
  | 'sa_packages'
  | 'sa_custom_packages'
  | 'sa_entitlements'
  | 'sa_subscriptions'
  | 'sa_sub_pending'
  | 'sa_sub_renewals'
  | 'sa_sub_expired'
  | 'sa_sub_suspended'
  | 'sa_pricing'
  | 'sa_invoices'
  | 'sa_payments'
  | 'sa_balances'
  | 'sa_credits'
  | 'sa_billing_history'
  | 'sa_admins'
  | 'sa_permissions'
  | 'sa_audit'
  | 'sa_settings';

// Future V2 Hotel Modules (Architecture & Design System Ready, not active in V1)
export type FutureV2HotelModuleId =
  | 'hotel_rooms'
  | 'hotel_reservations'
  | 'hotel_front_desk'
  | 'hotel_guests'
  | 'hotel_housekeeping'
  | 'hotel_maintenance';

export type FutureRoomStatus =
  | 'Available'
  | 'Reserved'
  | 'Occupied'
  | 'Cleaning'
  | 'Dirty'
  | 'Maintenance'
  | 'Out of Service';

export interface FutureV2RoomCardModel {
  id: string;
  roomNumber: string;
  roomType: string;
  status: FutureRoomStatus;
  guestName?: string;
  guestCount?: number;
  folioBalance?: number;
  nights?: number;
}

export type TableStatus =
  | 'Available'
  | 'Reserved'
  | 'Occupied'
  | 'Preparing'
  | 'Ready'
  | 'Waiting for Bill'
  | 'Cleaning';

export type FloorZone = 'Floor 1 — Main Dining' | 'Floor 2 — Terrace & Lounge' | 'Private Dining';

export interface RestaurantTable {
  id: string;
  number: string; // e.g. "01", "04"
  name: string;   // e.g. "TABLE 04"
  capacity: number;
  zone: FloorZone;
  status: TableStatus;
  guestCount: number;
  seatedAt?: string;
  durationMinutes: number;
  currentOrderId?: string;
  waiterName?: string;
  reservationName?: string;
  reservationTime?: string;
}

export type MenuCategory =
  | 'Popular'
  | 'Starters'
  | 'Main Course'
  | 'Rice'
  | 'Drinks'
  | 'Desserts';

export type ProductionStation = 'Kitchen' | 'Juice' | 'Other Production';

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  price: number;
  station: ProductionStation;
  available: boolean;
  popular?: boolean;
  prepTimeMinutes: number;
  isVeg: boolean;
  description: string;
  imageUrl?: string;
  modifiers?: {
    sizes?: { label: string; priceDelta: number }[];
    spiceLevels?: ('Mild' | 'Medium' | 'Spicy' | 'Extra Fiery')[];
    extras?: { label: string; price: number }[];
  };
}

export type OrderItemStatus = 'New' | 'Preparing' | 'Ready' | 'Served';

export interface OrderLineItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  station: ProductionStation;
  status: OrderItemStatus;
  size?: string;
  spice?: string;
  extras?: string[];
  notes?: string;
}

export type OrderStatus =
  | 'New'
  | 'Preparing'
  | 'Ready'
  | 'Served'
  | 'Completed'
  | 'Cancelled';

export type OrderType = 'Dine-In' | 'Takeaway';

export type PaymentMethod = 'Cash' | 'Card' | 'UPI';

export interface Order {
  id: string;
  orderNumber: string; // e.g., "#104" or "#P104"
  type: OrderType;
  tableId?: string;
  tableName?: string; // e.g., "Table 04"
  customerName?: string;
  customerPhone?: string;
  waiterName: string;
  items: OrderLineItem[];
  status: OrderStatus;
  createdAt: string;
  elapsedMinutes: number;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  isPaid: boolean;
  paymentMethod?: PaymentMethod;
  notes?: string;
}

export type BookingStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Arriving'
  | 'Arrived'
  | 'Seated'
  | 'Completed'
  | 'Cancelled'
  | 'No-show';

export interface Booking {
  id: string;
  guestName: string;
  phone: string;
  date: string; // e.g., "2026-10-07"
  time: string; // e.g., "7:30 PM"
  durationMinutes: number;
  tableId: string;
  tableName: string;
  guests: number;
  status: BookingStatus;
  notes?: string;
  specialRequest?: string;
}

export type StockHealth = 'Healthy' | 'Low' | 'Critical';

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Meat & Poultry' | 'Grains & Staples' | 'Oils & Dairy' | 'Fresh Produce' | 'Beverages';
  currentStock: number;
  minimumStock: number;
  unit: 'kg' | 'L' | 'pcs' | 'packs';
  unitCost: number;
  status: StockHealth;
  supplierId: string;
  supplierName: string;
  lastUpdated: string;
}

export type ProcurementStage =
  | 'Stock Alert'
  | 'Purchase Request'
  | 'Supplier'
  | 'Order'
  | 'Receive Stock'
  | 'Payment';

export interface ProcurementOrder {
  id: string;
  poNumber: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  stage: ProcurementStage;
  createdAt: string;
  dueDate: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  category: string;
  outstandingAmount: number;
  lastPurchaseDate: string;
  status: 'Active' | 'Payment Due' | 'On Hold';
  products: string[];
  recentPurchases: { id: string; date: string; items: string; amount: number; status: 'Paid' | 'Pending' }[];
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'On Leave';

export type StaffClockStatus =
  | 'Not Clocked In'
  | 'Working'
  | 'On Break'
  | 'Late'
  | 'Completed';

export type StaffAvailabilityState =
  | 'Available'
  | 'Busy'
  | 'Kitchen'
  | 'On Break'
  | 'Unavailable';

export interface StaffMember {
  id: string;
  name: string;
  role: 'Manager' | 'Senior Waiter' | 'Waiter' | 'Chef' | 'Head Chef' | 'Sous Chef' | 'Juicer' | 'Cashier';
  userRoleMapping: UserRole;
  phone: string;
  shift: 'Morning (7 AM – 3 PM)' | 'Evening (3 PM – 11 PM)' | 'Full Day Split' | 'Day Shift (10 AM – 7 PM)';
  currentShiftTime: string; // e.g., "10:00 AM – 7:00 PM" or "10:00 – 19:00"
  scheduledStart: string;   // e.g., "10:00"
  attendance: AttendanceStatus;
  clockStatus: StaffClockStatus;
  checkInTime?: string;     // e.g., "10:02 AM"
  clockOutTime?: string;    // e.g., "6:21 PM"
  breakStartedAt?: string;  // e.g., "2:14 PM"
  totalBreakMinutes: number; // e.g., 42
  workedDuration: string;   // e.g., "7h 37m"
  availability: StaffAvailabilityState;
  preferredShift: 'Morning' | 'Evening' | 'Flexible';
  unavailableDays: string[]; // e.g., ["Sunday"]
  annualLeaveRemaining: number;
  sickLeaveRemaining: number;
  assignedTablesCount?: number;
  activeOrdersCount?: number;
  pendingBillsCount?: number;
  status: 'On Floor' | 'In Kitchen' | 'Break' | 'Off Duty';
  monthlySalary: number;
  pendingPayout: number;
  recentActivity: string[];
  activityTimeline: { time: string; action: string }[];
}

export interface ShiftDefinition {
  id: string;
  name: string; // e.g. "Morning Shift", "Evening Shift"
  code: 'M' | 'E' | 'SPLIT';
  startTime: string; // e.g. "08:00 AM"
  endTime: string;   // e.g. "04:00 PM"
  breakDurationMinutes: number;
  requiredStaff: number;
  assignedStaffCount: number;
  active: boolean;
}

export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
export type ShiftAssignmentCode = 'M' | 'E' | 'OFF' | 'LEAVE';

export interface StaffWeeklySchedule {
  staffId: string;
  staffName: string;
  role: string;
  preferredShift: 'Morning' | 'Evening' | 'Flexible';
  unavailableDays: DayOfWeek[];
  days: Record<DayOfWeek, ShiftAssignmentCode>;
}

export type LeaveType = 'Annual Leave' | 'Sick Leave' | 'Emergency Leave';
export type LeaveRequestStatus = 'Pending' | 'Approved' | 'Rejected';

export interface LeaveRequest {
  id: string;
  staffId: string;
  staffName: string;
  staffRole: string;
  leaveType: LeaveType;
  startDate: string; // e.g. "Oct 12"
  endDate: string;   // e.g. "Oct 14"
  reason: string;
  status: LeaveRequestStatus;
  requestedAt: string;
}

export type TaskPriority = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';

export interface OperationalTask {
  id: string;
  title: string;
  assignedStaffId: string;
  assignedStaffName: string;
  assignedRole: string;
  priority: TaskPriority;
  dueTime: string; // e.g. "12:00 PM"
  status: TaskStatus;
  station: 'Floor' | 'Kitchen' | 'Juice' | 'Inventory' | 'General';
}

export interface FinancialTransaction {
  id: string;
  reference: string;
  title: string;
  category: 'Dine-In Sale' | 'Takeaway Sale' | 'Supplier Payment' | 'Utility Expense' | 'Staff Payout';
  type: 'Inflow' | 'Outflow';
  amount: number;
  method: PaymentMethod | 'Bank Transfer';
  timestamp: string;
  status: 'Completed' | 'Pending';
}

export interface ActionableNotification {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  timestamp: string;
  actionLabel: string;
  targetModule: ModuleId;
  targetEntityId?: string;
  read: boolean;
}

export interface ActivityEvent {
  id: string;
  time: string;
  title: string;
  detail: string;
  category: 'order' | 'kitchen' | 'payment' | 'inventory' | 'booking';
}

export type SubscriptionStatus =
  | 'Draft'
  | 'Pending Activation'
  | 'Active'
  | 'Past Due'
  | 'Expired'
  | 'Suspended'
  | 'Cancelled';

export type BillingCycle = 'Monthly' | 'Annual';

export type PaymentTerms = 'Due on Receipt' | 'Net 7' | 'Net 15' | 'Net 30';

export type ServicePricingModel =
  | 'Monthly Fixed'
  | 'Annual Fixed'
  | 'Per User'
  | 'Per Location'
  | 'Custom Negotiated';

export type ServiceGroupCategory =
  | 'Restaurant Operations'
  | 'Business Management'
  | 'Resource Management'
  | 'Platform Services'
  | 'Future V2 Services — Planned Only';

export interface FeatureCatalogItem {
  id: string;
  serviceId: ServiceId;
  name: string;
  description: string;
  includedInServiceBase: boolean;
  additionalMonthlyPrice?: number;
}

export interface CompanyTenant {
  id: string;
  companyCode: string;
  name: string;
  location: string;
  owner: string;
  ownerEmail?: string;
  ownerPhone?: string;
  gstin?: string;
  businessType:
    | 'Restaurant'
    | 'Cafe'
    | 'Cloud Kitchen'
    | 'Food Court'
    | 'Hotel'
    | 'Resort'
    | 'Multi-property Hospitality';
  planId: SubscriptionPlanId;
  plan: string;
  status: 'Active' | 'Pending' | 'Suspended';
  subscriptionStatus: SubscriptionStatus;
  billingCycle: BillingCycle;
  subscriptionStartDate: string;
  renewalDate: string;
  mrr: number;
  discountAmount: number;
  taxRatePercent: number;
  paymentTerms: PaymentTerms;
  outstandingAmount: number;
  tablesCount: number;
  createdDate: string;
  lastActivity: string;
  addonServices: ServiceId[];
  disabledServices: ServiceId[];
  disabledFeatures: string[];
  customServicePrices?: Partial<Record<ServiceId, number>>;
  requestedServices?: ServiceId[];
  rolePermissions: Record<UserRole, ServiceId[]>;
  limitsUsage: {
    staffCurrent: number;
    staffMax: number;
    usersCurrent: number;
    usersMax: number;
    tablesCurrent: number;
    tablesMax: number;
    monthlyOrdersCurrent: number;
    monthlyOrdersLimit: number;
  };
}

export type ServiceCategory =
  | 'Core'
  | 'Restaurant'
  | 'Inventory'
  | 'Resource Management'
  | 'Finance'
  | 'Insights'
  | 'Hotel';

export type ServiceId =
  // CORE
  | 'dashboard'
  | 'company_management'
  | 'user_management'
  // RESTAURANT
  | 'floor'
  | 'orders'
  | 'kitchen'
  | 'juice'
  | 'bookings'
  | 'takeaway'
  | 'billing'
  | 'menu'
  // INVENTORY
  | 'inventory'
  | 'suppliers'
  | 'procurement'
  | 'stock_management'
  // RESOURCE MANAGEMENT (group + granular services)
  | 'resource_management'
  | 'staff'
  | 'attendance'
  | 'clock_in_out'
  | 'breaks'
  | 'shifts'
  | 'schedule'
  | 'leave'
  | 'tasks'
  | 'resource_planning'
  // FINANCE
  | 'finance'
  | 'expenses'
  | 'transactions'
  | 'supplier_payments'
  | 'financial_reports'
  // INSIGHTS
  | 'reports'
  | 'analytics'
  // FUTURE V2 HOTEL
  | 'hotel_rooms'
  | 'hotel_room_types'
  | 'hotel_reservations'
  | 'hotel_front_desk'
  | 'hotel_guests'
  | 'hotel_housekeeping'
  | 'hotel_maintenance'
  | 'hotel_folios'
  | 'hotel_check_in'
  | 'hotel_check_out';

export type PlatformServiceState =
  | 'AVAILABLE'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED'
  | 'COMING SOON';

export interface ServiceCatalogItem {
  id: ServiceId;
  name: string;
  category: ServiceCategory;
  serviceGroup?: ServiceGroupCategory;
  platformStatus: 'AVAILABLE' | 'COMING SOON';
  version: 'V1' | 'V2';
  description: string;
  basePrice?: number;
  pricingModel?: ServicePricingModel;
  features?: FeatureCatalogItem[];
  dependencies: ServiceId[];
  affectedAreas: string[];
  clientsCount: number;
  activeTodayCount: number;
  adoptionPercent: number;
  usageTodayLabel: string;
  usageMonthLabel: string;
  defaultRolesAllowed: UserRole[];
}

export type SubscriptionPlanId =
  | 'starter'
  | 'growth'
  | 'professional'
  | 'enterprise'
  | string;

export interface SubscriptionPlanPackage {
  id: SubscriptionPlanId;
  name: string;
  displayBadge: string;
  isCustomPackage?: boolean;
  assignedCompanyId?: string;
  billingCycle?: BillingCycle;
  monthlyPrice: number;
  annualPrice?: number;
  description: string;
  includedServices: ServiceId[];
  includedFeatures?: string[];
  changePolicy?: 'New Subscriptions Only' | 'Migrate Active Subscriptions';
  limits: {
    maxStaff: number;
    maxUsers: number;
    maxTables: number;
    monthlyOrdersLimit: number;
  };
  status: 'Active' | 'Archived';
}

export type InvoiceStatus =
  | 'Draft'
  | 'Issued'
  | 'Partially Paid'
  | 'Paid'
  | 'Overdue'
  | 'Void';

export interface InvoiceLineItem {
  id: string;
  serviceId?: ServiceId;
  label: string;
  description: string;
  pricingModel: ServicePricingModel | 'Package Base' | 'Adjustment';
  quantity: number;
  unitPrice: number;
  amount: number;
  isIncludedInPackage?: boolean;
}

export interface CompanyInvoice {
  id: string;
  invoiceNumber: string;
  companyId: string;
  companyName: string;
  companyCode: string;
  billingPeriod: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  discount: number;
  taxRatePercent: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  notes?: string;
}

export interface CompanyPaymentRecord {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  companyId: string;
  companyName: string;
  invoiceAmount: number;
  amountPaid: number;
  balanceAfter: number;
  paymentMethod: 'UPI' | 'NEFT / RTGS' | 'Corporate Card' | 'Cheque';
  transactionReference: string;
  paymentDate: string;
  verificationSource: 'Manual Admin Record' | 'Verified Payment Provider';
  status: 'Verified' | 'Manually Recorded' | 'Partial' | 'Failed' | 'Refunded';
}

export interface CreditAdjustmentRecord {
  id: string;
  companyId: string;
  companyName: string;
  invoiceNumber?: string;
  type:
    | 'Credit Note'
    | 'Promotional Discount'
    | 'Proration Credit'
    | 'Debit Adjustment';
  amount: number;
  reason: string;
  createdAt: string;
  status: 'Applied' | 'Available';
}

export interface ServiceAuditLogEntry {
  id: string;
  action:
    | 'SERVICE ACTIVATED'
    | 'SERVICE DEACTIVATED'
    | 'FEATURE ENTITLEMENT CHANGED'
    | 'SUBSCRIPTION CREATED'
    | 'PLAN UPDATED'
    | 'INVOICE GENERATED'
    | 'PAYMENT RECORDED'
    | 'COMPANY SUSPENDED'
    | 'COMPANY REACTIVATED'
    | 'PERMISSION UPDATED'
    | 'COMPANY ONBOARDED'
    | 'CUSTOM PACKAGE CREATED';
  serviceId?: ServiceId;
  serviceName: string;
  companyId: string;
  companyName: string;
  changedBy: string;
  timestamp: string;
  dateLabel: string;
  previousValue?: string;
  newValue?: string;
  reason: string;
}
