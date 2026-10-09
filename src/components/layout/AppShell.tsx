import React, { useState } from 'react';
import {
  LayoutDashboard,
  Grid,
  ClipboardList,
  Flame,
  CupSoda,
  Calendar,
  ShoppingBag,
  BookOpen,
  Package,
  Truck,
  Users,
  Wallet,
  BarChart3,
  Settings,
  Building2,
  CreditCard,
  Sliders,
  Search,
  Bell,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  ArrowUpRight,
  Clock,
  CheckSquare,
  CalendarDays,
  Sparkles,
  UserCircle2,
  ShieldAlert,
} from 'lucide-react';
import { useOperations } from '../../context/OperationsContext';
import { ModuleId, UserRole, FutureV2HotelModuleId } from '../../types/operations';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Primitives';
import { CommandPalette } from './CommandPalette';
import { RoleLoginModal } from './RoleLoginModal';

interface NavItem {
  id: ModuleId;
  label: string;
  icon: React.ReactNode;
  badgeCount?: number;
}

interface NavGroup {
  groupLabel: string;
  items: NavItem[];
}

// V2 Hotel Navigation Schema — Architected & typed so V2 slots in naturally without redesigning the shell.
// Kept inactive in V1 per specification ("Do not show Hotel as an active V1 module").
export const FUTURE_V2_HOTEL_NAVIGATION_SCHEMA: {
  enabledInV1: false;
  groupLabel: 'HOTEL';
  items: { id: FutureV2HotelModuleId; label: string }[];
} = {
  enabledInV1: false,
  groupLabel: 'HOTEL',
  items: [
    { id: 'hotel_rooms', label: 'Rooms' },
    { id: 'hotel_reservations', label: 'Reservations' },
    { id: 'hotel_front_desk', label: 'Front Desk' },
    { id: 'hotel_guests', label: 'Guests' },
    { id: 'hotel_housekeeping', label: 'Housekeeping' },
    { id: 'hotel_maintenance', label: 'Maintenance' },
  ],
};

const MODULE_LABELS: Record<ModuleId, { section: string; title: string }> = {
  overview: { section: 'Overview', title: 'Command Center' },
  floor: { section: 'Operations', title: 'Floor & Tables' },
  orders: { section: 'Operations', title: 'Orders & Bills' },
  kitchen: { section: 'Operations', title: 'Kitchen Display' },
  juice: { section: 'Operations', title: 'Juice & Production' },
  bookings: { section: 'Operations', title: 'Bookings' },
  takeaway: { section: 'Operations', title: 'Takeaway / Parcel' },
  staff_home: { section: 'Staff Mode', title: 'My Shift & Workspace' },
  rm_dashboard: { section: 'Resource Management', title: 'People · Shifts · Attendance' },
  staff: { section: 'Resource Management', title: 'Staff Directory' },
  rm_attendance: { section: 'Resource Management', title: 'Attendance & Logs' },
  rm_shifts: { section: 'Resource Management', title: 'Shift Definitions' },
  rm_schedule: { section: 'Resource Management', title: 'Weekly Schedule & Availability' },
  rm_leave: { section: 'Resource Management', title: 'Leave Requests' },
  rm_tasks: { section: 'Resource Management', title: 'Operational Tasks' },
  rm_planning: { section: 'Resource Management', title: 'Resource Planning' },
  menu: { section: 'Management', title: 'Menu Management' },
  inventory: { section: 'Management', title: 'Inventory & Procurement' },
  suppliers: { section: 'Management', title: 'Suppliers' },
  finance: { section: 'Management', title: 'Finance' },
  reports: { section: 'Insights', title: 'Reports & Analytics' },
  settings: { section: 'System', title: 'Company Settings' },
  sa_overview: { section: 'Overview', title: 'Platform Dashboard' },
  sa_alerts: { section: 'Overview', title: 'Attention Required & Alerts' },
  sa_activity: { section: 'Overview', title: 'Recent Company Activity' },
  sa_companies: { section: 'Companies', title: 'All Companies' },
  sa_applications: { section: 'Companies', title: 'Onboarding Applications' },
  sa_company_details: { section: 'Companies', title: 'Company Details Workspace' },
  sa_company_services: { section: 'Companies', title: 'Company Service Configuration' },
  sa_system: { section: 'Service Management', title: 'Service Catalog' },
  sa_services: { section: 'Service Management', title: 'Service Catalog' },
  sa_features: { section: 'Service Management', title: 'Feature Catalog' },
  sa_packages: { section: 'Service Management', title: 'Service Packages' },
  sa_custom_packages: { section: 'Service Management', title: 'Custom Packages' },
  sa_entitlements: { section: 'Service Management', title: 'Company Entitlements' },
  sa_subscriptions: { section: 'Subscriptions', title: 'Active Subscriptions' },
  sa_sub_pending: { section: 'Subscriptions', title: 'Pending Activation' },
  sa_sub_renewals: { section: 'Subscriptions', title: 'Upcoming Renewals' },
  sa_sub_expired: { section: 'Subscriptions', title: 'Expired Subscriptions' },
  sa_sub_suspended: { section: 'Subscriptions', title: 'Suspended Subscriptions' },
  sa_pricing: { section: 'Billing', title: 'Modular Service Pricing' },
  sa_invoices: { section: 'Billing', title: 'Invoices' },
  sa_payments: { section: 'Billing', title: 'Payments & Reconciliation' },
  sa_balances: { section: 'Billing', title: 'Outstanding Balances' },
  sa_credits: { section: 'Billing', title: 'Credits & Adjustments' },
  sa_billing_history: { section: 'Billing', title: 'Billing History' },
  sa_admins: { section: 'Platform Administration', title: 'Admin Users' },
  sa_permissions: { section: 'Platform Administration', title: 'Roles & Permissions' },
  sa_audit: { section: 'Platform Administration', title: 'Audit Logs' },
  sa_settings: { section: 'Platform Administration', title: 'Platform Settings' },
};

const ROLE_META: Record<UserRole, { name: string; title: string; initials: string }> = {
  COMPANY_ADMIN: { name: 'Alex Varghese', title: 'Manager', initials: 'AV' },
  WAITER: { name: 'Arun', title: 'Waiter', initials: 'AR' },
  HEAD_CHEF: { name: 'Anu', title: 'Chef', initials: 'AN' },
  JUICER: { name: 'Vishnu', title: 'Juicer', initials: 'VI' },
  FINANCE: { name: 'Nandini K.', title: 'Finance', initials: 'NK' },
  SUPER_ADMIN: { name: 'Platform Ops', title: 'Super Admin', initials: 'SA' },
};

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    role,
    activeStaffMember,
    setIsLoginModalOpen,
    activeCompanyId,
    setActiveCompanyId,
    companies,
    companyInvoices,
    canAccessModule,
    activeModule,
    setActiveModule,
    sidebarCollapsed,
    setSidebarCollapsed,
    setCommandPaletteOpen,
    tables,
    orders,
    inventory,
    leaveRequests,
    tasks,
    notifications,
    triggerNotificationAction,
    markNotificationRead,
    toasts,
    dismissToast,
  } = useOperations();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeOrdersCount = orders.filter(
    (o) => o.status === 'New' || o.status === 'Preparing' || o.status === 'Ready'
  ).length;
  const kitchenQueueCount = orders.filter(
    (o) =>
      (o.status === 'New' || o.status === 'Preparing') &&
      o.items.some((i) => i.station === 'Kitchen')
  ).length;
  const juiceQueueCount = orders.filter(
    (o) =>
      (o.status === 'New' || o.status === 'Preparing') &&
      o.items.some((i) => i.station === 'Juice' || i.station === 'Other Production')
  ).length;
  const lowInventoryCount = inventory.filter((i) => i.status !== 'Healthy').length;
  const pendingLeavesCount = leaveRequests.filter((l) => l.status === 'Pending').length;
  const pendingTasksCount = tasks.filter((t) => t.status !== 'Completed').length;
  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  const isStaffModeRole = role === 'WAITER' || role === 'HEAD_CHEF' || role === 'JUICER';

  // Build Role-Specific & Service-Entitlement-Aware Navigation Architecture
  const getNavGroups = (): NavGroup[] => {
    if (role === 'SUPER_ADMIN') {
      const pendingAppsCount = companies.filter((c) => c.status === 'Pending').length;
      const unpaidInvoicesCount = companyInvoices.filter((i) => i.balanceDue > 0).length;
      return [
        {
          groupLabel: 'OVERVIEW',
          items: [
            {
              id: 'sa_overview',
              label: 'Platform Dashboard',
              icon: <LayoutDashboard className="w-4 h-4" />,
            },
            {
              id: 'sa_alerts',
              label: 'Alerts',
              icon: <Bell className="w-4 h-4" />,
              badgeCount: pendingAppsCount + unpaidInvoicesCount,
            },
            {
              id: 'sa_activity',
              label: 'Recent Activity',
              icon: <Clock className="w-4 h-4" />,
            },
          ],
        },
        {
          groupLabel: 'COMPANIES',
          items: [
            {
              id: 'sa_companies',
              label: 'All Companies',
              icon: <Building2 className="w-4 h-4" />,
              badgeCount: companies.length,
            },
            {
              id: 'sa_applications',
              label: 'Applications',
              icon: <UserCheck className="w-4 h-4" />,
              badgeCount: pendingAppsCount,
            },
            {
              id: 'sa_company_details',
              label: 'Company Details',
              icon: <Users className="w-4 h-4" />,
            },
            {
              id: 'sa_company_services',
              label: 'Service Configuration',
              icon: <Sliders className="w-4 h-4" />,
            },
          ],
        },
        {
          groupLabel: 'SERVICE MANAGEMENT',
          items: [
            {
              id: 'sa_services',
              label: 'Service Catalog',
              icon: <Grid className="w-4 h-4" />,
            },
            {
              id: 'sa_features',
              label: 'Feature Catalog',
              icon: <CheckSquare className="w-4 h-4" />,
            },
            {
              id: 'sa_packages',
              label: 'Service Packages',
              icon: <Package className="w-4 h-4" />,
            },
            {
              id: 'sa_custom_packages',
              label: 'Custom Packages',
              icon: <Sparkles className="w-4 h-4" />,
            },
            {
              id: 'sa_entitlements',
              label: 'Company Entitlements',
              icon: <ShieldAlert className="w-4 h-4" />,
            },
          ],
        },
        {
          groupLabel: 'SUBSCRIPTIONS',
          items: [
            {
              id: 'sa_subscriptions',
              label: 'Active Subscriptions',
              icon: <CreditCard className="w-4 h-4" />,
            },
            {
              id: 'sa_sub_pending',
              label: 'Pending Activation',
              icon: <Clock className="w-4 h-4" />,
              badgeCount: pendingAppsCount,
            },
            {
              id: 'sa_sub_renewals',
              label: 'Upcoming Renewals',
              icon: <Calendar className="w-4 h-4" />,
            },
            {
              id: 'sa_sub_suspended',
              label: 'Suspended',
              icon: <ShieldAlert className="w-4 h-4" />,
            },
          ],
        },
        {
          groupLabel: 'BILLING',
          items: [
            {
              id: 'sa_pricing',
              label: 'Pricing Rules',
              icon: <BookOpen className="w-4 h-4" />,
            },
            {
              id: 'sa_invoices',
              label: 'Invoices',
              icon: <ClipboardList className="w-4 h-4" />,
              badgeCount: unpaidInvoicesCount,
            },
            {
              id: 'sa_payments',
              label: 'Payments',
              icon: <Wallet className="w-4 h-4" />,
            },
            {
              id: 'sa_balances',
              label: 'Outstanding Balances',
              icon: <BarChart3 className="w-4 h-4" />,
            },
            {
              id: 'sa_credits',
              label: 'Credits & Adjustments',
              icon: <CreditCard className="w-4 h-4" />,
            },
          ],
        },
        {
          groupLabel: 'PLATFORM ADMINISTRATION',
          items: [
            {
              id: 'sa_permissions',
              label: 'Roles & Permissions',
              icon: <Users className="w-4 h-4" />,
            },
            {
              id: 'sa_audit',
              label: 'Audit Logs',
              icon: <ClipboardList className="w-4 h-4" />,
            },
            {
              id: 'sa_settings',
              label: 'Platform Settings',
              icon: <Settings className="w-4 h-4" />,
            },
          ],
        },
      ];
    }

    let rawGroups: NavGroup[] = [];

    if (role === 'WAITER') {
      rawGroups = [
        {
          groupLabel: 'STAFF WORKSPACE',
          items: [
            {
              id: 'staff_home',
              label: 'My Shift & Clock In',
              icon: <UserCircle2 className="w-4 h-4" />,
            },
          ],
        },
        {
          groupLabel: 'OPERATIONS',
          items: [
            {
              id: 'floor',
              label: 'Floor & Tables',
              icon: <Grid className="w-4 h-4" />,
              badgeCount: tables.filter((t) => t.status !== 'Available').length,
            },
            {
              id: 'orders',
              label: 'Orders & Bills',
              icon: <ClipboardList className="w-4 h-4" />,
              badgeCount: activeOrdersCount,
            },
            {
              id: 'takeaway',
              label: 'Takeaway / Parcel',
              icon: <ShoppingBag className="w-4 h-4" />,
            },
            {
              id: 'bookings',
              label: 'Bookings',
              icon: <Calendar className="w-4 h-4" />,
            },
          ],
        },
      ];
    } else if (role === 'HEAD_CHEF') {
      rawGroups = [
        {
          groupLabel: 'STAFF WORKSPACE',
          items: [
            {
              id: 'staff_home',
              label: 'My Shift & Clock In',
              icon: <UserCircle2 className="w-4 h-4" />,
            },
          ],
        },
        {
          groupLabel: 'KITCHEN OPERATIONS',
          items: [
            {
              id: 'kitchen',
              label: 'Kitchen Display',
              icon: <Flame className="w-4 h-4" />,
              badgeCount: kitchenQueueCount,
            },
            {
              id: 'juice',
              label: 'Juice / Production',
              icon: <CupSoda className="w-4 h-4" />,
              badgeCount: juiceQueueCount,
            },
            {
              id: 'orders',
              label: 'All Orders',
              icon: <ClipboardList className="w-4 h-4" />,
            },
          ],
        },
        {
          groupLabel: 'PREP & STOCK',
          items: [
            {
              id: 'menu',
              label: 'Menu Availability',
              icon: <BookOpen className="w-4 h-4" />,
            },
            {
              id: 'inventory',
              label: 'Kitchen Stock',
              icon: <Package className="w-4 h-4" />,
              badgeCount: lowInventoryCount,
            },
          ],
        },
      ];
    } else if (role === 'JUICER') {
      rawGroups = [
        {
          groupLabel: 'STAFF WORKSPACE',
          items: [
            {
              id: 'staff_home',
              label: 'My Shift & Clock In',
              icon: <UserCircle2 className="w-4 h-4" />,
            },
          ],
        },
        {
          groupLabel: 'PRODUCTION STATION',
          items: [
            {
              id: 'juice',
              label: 'Juice / Production',
              icon: <CupSoda className="w-4 h-4" />,
              badgeCount: juiceQueueCount,
            },
            {
              id: 'kitchen',
              label: 'Main Kitchen KDS',
              icon: <Flame className="w-4 h-4" />,
            },
            {
              id: 'orders',
              label: 'Completed Queue',
              icon: <ClipboardList className="w-4 h-4" />,
            },
          ],
        },
      ];
    } else if (role === 'FINANCE') {
      rawGroups = [
        {
          groupLabel: 'FINANCE & LEDGER',
          items: [
            {
              id: 'finance',
              label: 'Finance',
              icon: <Wallet className="w-4 h-4" />,
            },
            {
              id: 'suppliers',
              label: 'Suppliers',
              icon: <Truck className="w-4 h-4" />,
            },
            {
              id: 'inventory',
              label: 'Inventory & POs',
              icon: <Package className="w-4 h-4" />,
            },
            {
              id: 'reports',
              label: 'Reports',
              icon: <BarChart3 className="w-4 h-4" />,
            },
            {
              id: 'overview',
              label: 'Overview',
              icon: <LayoutDashboard className="w-4 h-4" />,
            },
          ],
        },
      ];
    } else {
      // Default: COMPANY_ADMIN / MANAGER (Complete V1 Navigation + Resource Management)
      rawGroups = [
        {
          groupLabel: 'OVERVIEW',
          items: [
            {
              id: 'overview',
              label: 'Overview',
              icon: <LayoutDashboard className="w-4 h-4" />,
            },
          ],
        },
        {
          groupLabel: 'OPERATIONS',
          items: [
            {
              id: 'floor',
              label: 'Floor',
              icon: <Grid className="w-4 h-4" />,
              badgeCount: tables.filter((t) => t.status !== 'Available').length,
            },
            {
              id: 'orders',
              label: 'Orders',
              icon: <ClipboardList className="w-4 h-4" />,
              badgeCount: activeOrdersCount,
            },
            {
              id: 'kitchen',
              label: 'Kitchen',
              icon: <Flame className="w-4 h-4" />,
              badgeCount: kitchenQueueCount,
            },
            {
              id: 'juice',
              label: 'Juice / Production',
              icon: <CupSoda className="w-4 h-4" />,
              badgeCount: juiceQueueCount,
            },
            {
              id: 'bookings',
              label: 'Bookings',
              icon: <Calendar className="w-4 h-4" />,
            },
            {
              id: 'takeaway',
              label: 'Takeaway',
              icon: <ShoppingBag className="w-4 h-4" />,
            },
          ],
        },
        {
          groupLabel: 'RESOURCE MANAGEMENT',
          items: [
            {
              id: 'rm_dashboard',
              label: 'Resource Overview',
              icon: <Sparkles className="w-4 h-4" />,
            },
            {
              id: 'staff',
              label: 'Staff',
              icon: <Users className="w-4 h-4" />,
            },
            {
              id: 'rm_attendance',
              label: 'Attendance',
              icon: <UserCheck className="w-4 h-4" />,
            },
            {
              id: 'rm_shifts',
              label: 'Shifts',
              icon: <Clock className="w-4 h-4" />,
            },
            {
              id: 'rm_schedule',
              label: 'Schedule',
              icon: <CalendarDays className="w-4 h-4" />,
            },
            {
              id: 'rm_leave',
              label: 'Leave',
              icon: <Calendar className="w-4 h-4" />,
              badgeCount: pendingLeavesCount,
            },
            {
              id: 'rm_tasks',
              label: 'Tasks',
              icon: <CheckSquare className="w-4 h-4" />,
              badgeCount: pendingTasksCount,
            },
          ],
        },
        {
          groupLabel: 'MANAGEMENT',
          items: [
            { id: 'menu', label: 'Menu', icon: <BookOpen className="w-4 h-4" /> },
            {
              id: 'inventory',
              label: 'Inventory',
              icon: <Package className="w-4 h-4" />,
              badgeCount: lowInventoryCount,
            },
            { id: 'suppliers', label: 'Suppliers', icon: <Truck className="w-4 h-4" /> },
            { id: 'finance', label: 'Finance', icon: <Wallet className="w-4 h-4" /> },
          ],
        },
        {
          groupLabel: 'INSIGHTS',
          items: [{ id: 'reports', label: 'Reports', icon: <BarChart3 className="w-4 h-4" /> }],
        },
        {
          groupLabel: 'SYSTEM',
          items: [{ id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> }],
        },
      ];
    }

    // Filter items by tenant service entitlements + role permissions (Sections 15, 16, 17, 42)
    return rawGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => canAccessModule(item.id).allowed),
      }))
      .filter((group) => group.items.length > 0);
  };

  // Role-specific & Service-Aware mobile bottom tabs (Sections 27, 34, 48)
  const getMobileBottomNav = (): NavItem[] => {
    let candidates: NavItem[] = [];
    if (role === 'WAITER') {
      candidates = [
        { id: 'staff_home', label: 'My Shift', icon: <UserCircle2 className="w-4 h-4" /> },
        { id: 'floor', label: 'Floor', icon: <Grid className="w-4 h-4" /> },
        { id: 'orders', label: 'Orders', icon: <ClipboardList className="w-4 h-4" /> },
        { id: 'takeaway', label: 'Takeaway', icon: <ShoppingBag className="w-4 h-4" /> },
      ];
    } else if (role === 'HEAD_CHEF') {
      candidates = [
        { id: 'staff_home', label: 'My Shift', icon: <UserCircle2 className="w-4 h-4" /> },
        { id: 'kitchen', label: 'Kitchen', icon: <Flame className="w-4 h-4" /> },
        { id: 'juice', label: 'Queue', icon: <CupSoda className="w-4 h-4" /> },
        { id: 'orders', label: 'Orders', icon: <ClipboardList className="w-4 h-4" /> },
      ];
    } else if (role === 'JUICER') {
      candidates = [
        { id: 'staff_home', label: 'My Shift', icon: <UserCircle2 className="w-4 h-4" /> },
        { id: 'juice', label: 'Juice Queue', icon: <CupSoda className="w-4 h-4" /> },
        { id: 'kitchen', label: 'Kitchen', icon: <Flame className="w-4 h-4" /> },
        { id: 'orders', label: 'Orders', icon: <ClipboardList className="w-4 h-4" /> },
      ];
    } else if (role === 'SUPER_ADMIN') {
      return [
        { id: 'sa_overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'sa_companies', label: 'Companies', icon: <Building2 className="w-4 h-4" /> },
        { id: 'sa_system', label: 'Catalog', icon: <Sliders className="w-4 h-4" /> },
      ];
    } else {
      candidates = [
        { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'floor', label: 'Floor', icon: <Grid className="w-4 h-4" /> },
        { id: 'orders', label: 'Orders', icon: <ClipboardList className="w-4 h-4" /> },
        { id: 'rm_dashboard', label: 'Resources', icon: <Users className="w-4 h-4" /> },
        { id: 'kitchen', label: 'Kitchen', icon: <Flame className="w-4 h-4" /> },
      ];
    }
    return candidates.filter((item) => canAccessModule(item.id).allowed).slice(0, 3);
  };

  const navGroups = getNavGroups();
  const mobileBottomTabs = getMobileBottomNav();
  const currentBreadcrumb = MODULE_LABELS[activeModule] || {
    section: 'Operations',
    title: 'Workspace',
  };
  const activeRoleUser = isStaffModeRole
    ? {
        name: activeStaffMember.name,
        title: activeStaffMember.role,
        initials: activeStaffMember.name.slice(0, 2).toUpperCase(),
      }
    : ROLE_META[role];

  return (
    <div className="min-h-screen flex bg-[#FFF9F3] text-[#3D342E]">
      {/* LEFT SIDEBAR (Desktop & Tablet) — Borderless white panel with soft elevation */}
      <aside
        className={cn(
          'hidden md:flex flex-col bg-white shadow-[4px_0_24px_rgba(61,52,46,0.035)] shrink-0 transition-all duration-200 select-none sticky top-0 h-screen z-30',
          sidebarCollapsed ? 'w-[76px]' : 'w-[252px]'
        )}
      >
        {/* Brand Header */}
        <div className="h-20 px-5 flex items-center justify-between shrink-0">
          <button
            onClick={() =>
              setActiveModule(role === 'SUPER_ADMIN' ? 'sa_overview' : 'overview')
            }
            className="flex items-center gap-3 text-left cursor-pointer focus:outline-none"
          >
            <div className="w-10 h-10 rounded-full bg-[#FFF0E2] ring-2 ring-[#F97316] text-[#F97316] flex items-center justify-center font-extrabold text-xs tracking-tight shrink-0">
              KO
            </div>
            {!sidebarCollapsed && (
              <div className="overflow-hidden">
                <div className="text-base font-bold tracking-tight text-[#3D342E] leading-none">
                  KnockOUT
                </div>
                <div className="text-xs text-[#756A62] truncate mt-1">
                  Hospitality POS &amp; Ops
                </div>
              </div>
            )}
          </button>

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-2 rounded-xl text-[#756A62] hover:text-[#3D342E] hover:bg-[#FFF9F3] transition-colors cursor-pointer"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Company / Tenant Selector */}
        {!sidebarCollapsed && (
          <div className="px-4 pb-3">
            <label
              htmlFor="company-select"
              className="block text-[11px] font-medium text-[#756A62] mb-1.5 px-1"
            >
              Active Restaurant / Outlet
            </label>
            <div className="relative">
              <select
                id="company-select"
                value={activeCompanyId}
                onChange={(e) => setActiveCompanyId(e.target.value)}
                className="w-full appearance-none bg-[#FFF9F3] rounded-2xl px-3.5 py-2.5 pr-8 text-xs font-semibold text-[#3D342E] focus:outline-none focus:ring-2 focus:ring-[#F97316] cursor-pointer truncate"
              >
                {companies
                  .filter((c) => c.status === 'Active')
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.businessType})
                    </option>
                  ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#F97316] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Navigation Links — Solid Orange Pill for Active Item, Orange Icons for Inactive */}
        <nav
          className="flex-1 overflow-y-auto px-3.5 py-3 space-y-5"
          aria-label="Main Navigation"
        >
          {navGroups.map((group) => (
            <div key={group.groupLabel}>
              {!sidebarCollapsed && (
                <div className="px-3.5 mb-2 text-[11px] font-semibold text-[#756A62]/80 tracking-wide">
                  {group.groupLabel}
                </div>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = activeModule === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveModule(item.id)}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={cn(
                        'w-full min-h-[42px] flex items-center justify-between px-4 py-2.5 rounded-full text-sm transition-all cursor-pointer',
                        isActive
                          ? 'bg-[#F97316] text-white font-semibold shadow-[0_6px_16px_rgba(249,115,22,0.28)]'
                          : 'text-[#3D342E] font-medium hover:bg-[#FFF9F3]',
                        sidebarCollapsed && 'justify-center px-0 rounded-2xl'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={cn(
                            'shrink-0',
                            isActive ? 'text-white' : 'text-[#F97316]'
                          )}
                        >
                          {item.icon}
                        </span>
                        {!sidebarCollapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </div>
                      {!sidebarCollapsed &&
                        item.badgeCount !== undefined &&
                        item.badgeCount > 0 && (
                          <span
                            className={cn(
                              'text-xs tabular-nums px-2 py-0.5 rounded-full',
                              isActive
                                ? 'bg-white/20 text-white font-bold'
                                : 'bg-[#FFF0E2] text-[#EA580C] font-semibold'
                            )}
                          >
                            {item.badgeCount}
                          </span>
                        )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom User Profile & Role Switcher Pill (matching reference design) */}
        <div className="p-4 shrink-0">
          <button
            onClick={() => setIsLoginModalOpen(true)}
            title="Switch Operator Role"
            className={cn(
              'w-full flex items-center gap-3 p-2 rounded-full bg-[#FFF9F3] hover:bg-[#FFF0E2] transition-colors text-left cursor-pointer',
              sidebarCollapsed && 'justify-center rounded-2xl'
            )}
          >
            <div className="w-9 h-9 rounded-full bg-[#FFEDD5] text-[#EA580C] flex items-center justify-center text-xs font-bold shrink-0">
              {activeRoleUser.initials}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0 pr-2">
                <div className="text-xs font-bold text-[#3D342E] truncate">
                  {activeRoleUser.name}
                </div>
                <div className="text-[11px] text-[#756A62] truncate">
                  {activeRoleUser.title} · Switch Staff
                </div>
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORT COLUMN */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* TOP BAR — Open, borderless, warm header */}
        <header className="h-18 bg-[#FFF9F3]/90 backdrop-blur-md px-4 lg:px-8 flex items-center justify-between gap-3 sticky top-0 z-20 shrink-0">
          {/* Left: Mobile Brand + Context Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() =>
                setActiveModule(role === 'SUPER_ADMIN' ? 'sa_overview' : 'overview')
              }
              className="md:hidden w-9 h-9 rounded-full bg-[#FFF0E2] ring-2 ring-[#F97316] text-[#F97316] flex items-center justify-center font-bold text-xs shrink-0"
            >
              KO
            </button>
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-2 text-sm truncate"
            >
              <span className="text-[#756A62] hidden sm:inline">
                {currentBreadcrumb.section}
              </span>
              <span className="text-[#756A62]/40 hidden sm:inline" aria-hidden="true">
                /
              </span>
              <span className="font-bold text-[#3D342E] truncate">
                {currentBreadcrumb.title}
              </span>
            </nav>
          </div>

          {/* Center / Right: Global Search + Notifications + Role Switcher */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Global Search Trigger (Cmd + K) — Borderless white pill card */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="min-h-[42px] px-4 py-2 bg-white hover:bg-[#FFFDFB] shadow-[0_4px_14px_rgba(61,52,46,0.04)] rounded-2xl flex items-center gap-2.5 text-xs text-[#756A62] transition-all cursor-pointer"
              aria-label="Search tables, orders, bookings, menu (Cmd+K)"
            >
              <Search className="w-4 h-4 text-[#3D342E] shrink-0" />
              <span className="hidden sm:inline pr-4">
                Search tables, #104, dishes, staff...
              </span>
              <kbd className="hidden md:inline-block text-[10px] font-semibold text-[#EA580C] bg-[#FFF0E2] px-2 py-0.5 rounded-lg">
                ⌘K
              </kbd>
            </button>

            {/* Shared Device / Switch Staff Trigger in Topbar */}
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="min-h-[42px] px-4 py-2 bg-[#FFF0E2] hover:bg-[#FFEDD5] text-[#3D342E] rounded-2xl flex items-center gap-2 text-xs font-semibold transition-colors cursor-pointer"
              title="Shared Device — Switch Staff / Role"
            >
              <UserCheck className="w-4 h-4 text-[#F97316] shrink-0" />
              <span className="hidden lg:inline">
                {isStaffModeRole
                  ? `${activeRoleUser.name} · Switch Staff`
                  : `${activeRoleUser.title} · Switch Staff`}
              </span>
              <span className="lg:hidden">Switch Staff</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#F97316]" />
            </button>

            {/* Actionable Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setHelpOpen(false);
                }}
                aria-label="Operational Notifications"
                className="relative min-h-[42px] min-w-[42px] inline-flex items-center justify-center rounded-2xl bg-white hover:bg-[#FFF0E2] shadow-[0_4px_14px_rgba(61,52,46,0.04)] text-[#3D342E] cursor-pointer"
              >
                <Bell className="w-4 h-4 text-[#F97316]" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#F97316] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setNotificationsOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl z-40 overflow-hidden">
                    <div className="px-5 py-4 flex items-center justify-between bg-[#FFF9F3]">
                      <div>
                        <h3 className="text-xs font-bold text-[#3D342E]">
                          Operational Alerts
                        </h3>
                        <p className="text-[11px] text-[#756A62]">
                          Items requiring attention on the floor or kitchen
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          notifications.forEach((n) => markNotificationRead(n.id))
                        }
                        className="text-xs font-semibold text-[#F97316] hover:text-[#EA580C] cursor-pointer"
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto p-2 space-y-1.5">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className={cn(
                            'p-3.5 rounded-2xl transition-colors',
                            !n.read ? 'bg-[#FFF9F3]' : 'bg-white hover:bg-[#FFF9F3]/60'
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5">
                              {n.severity === 'critical' ? (
                                <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                              ) : n.severity === 'warning' ? (
                                <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                              ) : (
                                <Info className="w-4 h-4 text-[#F97316] shrink-0 mt-0.5" />
                              )}
                              <div>
                                <div className="text-xs font-bold text-[#3D342E]">
                                  {n.title}
                                </div>
                                <p className="text-xs text-[#756A62] mt-0.5 leading-relaxed">
                                  {n.description}
                                </p>
                              </div>
                            </div>
                            <span className="text-[11px] text-[#756A62] shrink-0 tabular-nums">
                              {n.timestamp}
                            </span>
                          </div>
                          <div className="mt-3 pl-6">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                triggerNotificationAction(n);
                                setNotificationsOpen(false);
                              }}
                              icon={<ArrowUpRight className="w-3.5 h-3.5" />}
                            >
                              {n.actionLabel}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Help / Quick Guide */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => {
                  setHelpOpen(!helpOpen);
                  setNotificationsOpen(false);
                }}
                aria-label="Operational Shortcuts & Help"
                className="min-h-[42px] min-w-[42px] inline-flex items-center justify-center rounded-2xl bg-white hover:bg-[#FFF0E2] shadow-[0_4px_14px_rgba(61,52,46,0.04)] text-[#756A62] cursor-pointer"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
              {helpOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setHelpOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-3xl shadow-2xl z-40 p-5 space-y-3">
                    <div className="text-xs font-bold text-[#3D342E]">
                      KnockOUT Operational Workflow
                    </div>
                    <p className="text-xs text-[#756A62] leading-relaxed">
                      <strong className="text-[#3D342E]">Core Service Flow:</strong> Floor → Select Table 04 → Open Drawer → Add Dish → Send to Kitchen → Kitchen (New → Preparing → Ready) → Request Bill → Select UPI → Complete Payment → Table Available.
                    </p>
                    <div className="p-3 rounded-2xl bg-[#FFF9F3] text-[11px] text-[#756A62] space-y-1">
                      <div>⌘K / Ctrl+K : Global Search Palette</div>
                      <div>Switch Staff : Shared POS Terminal PIN Mode</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
          {children}
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION (Role-Adaptive, comfortable touch targets) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(61,52,46,0.06)] z-30 grid grid-cols-4 items-center px-2"
      >
        {mobileBottomTabs.map((item) => {
          const active = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveModule(item.id);
                setMobileMenuOpen(false);
              }}
              className={cn(
                'min-h-[48px] flex flex-col items-center justify-center gap-1 rounded-2xl transition-colors cursor-pointer',
                active ? 'text-[#F97316] bg-[#FFF0E2] font-bold' : 'text-[#756A62]'
              )}
            >
              {item.icon}
              <span className="text-[11px] tracking-tight truncate">{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={cn(
            'min-h-[48px] flex flex-col items-center justify-center gap-1 rounded-2xl transition-colors cursor-pointer',
            mobileMenuOpen ? 'text-[#F97316] bg-[#FFF0E2] font-bold' : 'text-[#756A62]'
          )}
        >
          <Sliders className="w-4 h-4" />
          <span className="text-[11px] tracking-tight">More</span>
        </button>
      </nav>

      {/* MOBILE "MORE" SHEET */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-[#3D342E]/35 backdrop-blur-[1px]"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 bg-white rounded-t-3xl p-5 max-h-[82vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2">
              <div>
                <div className="text-base font-bold text-[#3D342E]">
                  KnockOUT Navigation
                </div>
                <div className="text-xs text-[#756A62]">
                  Active Role: {activeRoleUser.title} ({activeRoleUser.name})
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl text-[#756A62] hover:bg-[#FFF0E2]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {navGroups
                .flatMap((g) => g.items)
                .map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveModule(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={cn(
                      'min-h-[46px] px-3.5 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 text-left transition-colors',
                      activeModule === item.id
                        ? 'bg-[#F97316] text-white shadow-[0_4px_12px_rgba(249,115,22,0.25)]'
                        : 'bg-[#FFF9F3] text-[#3D342E]'
                    )}
                  >
                    <span className={activeModule === item.id ? 'text-white' : 'text-[#F97316]'}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
            </div>
            <div className="pt-2">
              <Button
                variant="outline"
                size="md"
                className="w-full"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsLoginModalOpen(true);
                }}
              >
                Switch Operator Role ({activeRoleUser.title})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL MODALS */}
      <CommandPalette />
      <RoleLoginModal />

      {/* TOAST STACK */}
      <div
        aria-live="polite"
        className="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto bg-white text-[#3D342E] rounded-2xl px-4 py-3.5 shadow-xl flex items-start justify-between gap-3 transition-all duration-150"
          >
            <div className="flex items-start gap-2.5">
              <CheckCircle2
                className={cn(
                  'w-4 h-4 shrink-0 mt-0.5',
                  t.variant === 'success'
                    ? 'text-[#16A34A]'
                    : t.variant === 'warning'
                    ? 'text-[#D97706]'
                    : 'text-[#F97316]'
                )}
              />
              <div>
                <div className="text-xs font-bold text-[#3D342E]">{t.title}</div>
                {t.description && (
                  <div className="text-xs text-[#756A62] mt-0.5">{t.description}</div>
                )}
              </div>
            </div>
            <button
              onClick={() => dismissToast(t.id)}
              className="text-[#756A62] hover:text-[#3D342E] p-1 cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
