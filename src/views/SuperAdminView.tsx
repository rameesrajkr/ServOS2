import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Ban,
  Eye,
  ShieldCheck,
  Layers,
  Building2,
  Package,
  History,
  AlertTriangle,
  Lock,
  Sparkles,
  Search,
  Sliders,
  ArrowUpRight,
  CheckSquare,
  Square,
  Users,
  Info,
  Plus,
  Receipt,
  Wallet,
  CreditCard,
  MoreHorizontal,
  FileText,
  Calendar,
  ArrowRight,
  Copy,
  Archive,
  Check,
  DollarSign,
} from 'lucide-react';
import { useOperations } from '../context/OperationsContext';
import {
  BillingCycle,
  CompanyInvoice,
  CompanyPaymentRecord,
  CompanyTenant,
  CreditAdjustmentRecord,
  InvoiceStatus,
  ModuleId,
  PaymentTerms,
  ServiceCatalogItem,
  ServiceGroupCategory,
  ServiceId,
  SubscriptionPlanId,
  SubscriptionPlanPackage,
  SubscriptionStatus,
  UserRole,
} from '../types/operations';
import {
  FEATURE_CATALOG,
  RESOURCE_MANAGEMENT_SUB_SERVICES,
  getBasePriceForService,
  getDependentServices,
  getMissingDependencies,
  getServiceById,
  getServiceGroupForCatalogItem,
} from '../lib/mock-data/serviceCatalog';
import {
  MODULAR_SERVICE_PRICING,
  calculateCompanyBillingBreakdown,
  previewServiceChangeBillingImpact,
} from '../lib/billingEngine';
import {
  Button,
  ContextualDrawer,
  MetricCard,
  PageHeader,
  StatusIndicator,
} from '../components/ui/Primitives';
import { cn, formatINR } from '../lib/utils';

type PrimaryWorkspace =
  | 'overview'
  | 'companies'
  | 'company_detail'
  | 'services'
  | 'packages'
  | 'subscriptions'
  | 'billing'
  | 'admin';

type CompanyDetailTab =
  | 'overview'
  | 'services'
  | 'subscription'
  | 'billing'
  | 'users'
  | 'audit';

const SERVICE_GROUPS_ORDER: ServiceGroupCategory[] = [
  'Restaurant Operations',
  'Business Management',
  'Resource Management',
  'Platform Services',
  'Future V2 Services — Planned Only',
];

const ROLES_LIST: { id: UserRole; label: string }[] = [
  { id: 'COMPANY_ADMIN', label: 'Manager' },
  { id: 'WAITER', label: 'Waiter' },
  { id: 'HEAD_CHEF', label: 'Chef' },
  { id: 'JUICER', label: 'Juicer' },
  { id: 'FINANCE', label: 'Finance' },
];

export const SuperAdminView: React.FC = () => {
  const {
    activeModule,
    setActiveModule,
    companies,
    activeCompanyId,
    setActiveCompanyId,
    setRole,
    serviceCatalog,
    featureCatalog,
    subscriptionPlans,
    companyInvoices,
    companyPayments,
    creditAdjustments,
    serviceAuditLogs,
    hasService,
    hasFeature,
    getServiceEntitlementSource,
    hasPermission,
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
    updateCompanyStatus,
    addToast,
  } = useOperations();

  // ============================================================
  // WORKSPACE ROUTING & SUB-VIEWS (Maps Sidebar ModuleIds cleanly)
  // ============================================================
  const [workspace, setWorkspace] = useState<PrimaryWorkspace>('overview');
  const [selectedCompanyId, setSelectedCompanyId] =
    useState<string>('comp-abc');
  const [companyDetailTab, setCompanyDetailTab] =
    useState<CompanyDetailTab>('overview');
  const [servicesSubView, setServicesSubView] = useState<
    'catalog' | 'features' | 'entitlements'
  >('catalog');
  const [billingSubView, setBillingSubView] = useState<
    'invoices' | 'payments' | 'balances' | 'credits' | 'pricing'
  >('invoices');
  const [subscriptionFilterStatus, setSubscriptionFilterStatus] =
    useState<string>('All');
  const [adminSubView, setAdminSubView] = useState<
    'audit' | 'permissions' | 'admins' | 'settings'
  >('audit');

  // Sync left sidebar ModuleId clicks into the right workspace & sub-tab
  useEffect(() => {
    switch (activeModule) {
      case 'sa_overview':
      case 'sa_alerts':
      case 'sa_activity':
        setWorkspace('overview');
        break;
      case 'sa_companies':
        setWorkspace('companies');
        setStatusFilter('All');
        break;
      case 'sa_applications':
        setWorkspace('companies');
        setStatusFilter('Pending');
        break;
      case 'sa_company_details':
        setWorkspace('company_detail');
        setCompanyDetailTab('overview');
        break;
      case 'sa_company_services':
        setWorkspace('company_detail');
        setCompanyDetailTab('services');
        break;
      case 'sa_system':
      case 'sa_services':
        setWorkspace('services');
        setServicesSubView('catalog');
        break;
      case 'sa_features':
        setWorkspace('services');
        setServicesSubView('features');
        break;
      case 'sa_entitlements':
        setWorkspace('services');
        setServicesSubView('entitlements');
        break;
      case 'sa_packages':
      case 'sa_custom_packages':
        setWorkspace('packages');
        break;
      case 'sa_subscriptions':
        setWorkspace('subscriptions');
        setSubscriptionFilterStatus('All');
        break;
      case 'sa_sub_pending':
        setWorkspace('subscriptions');
        setSubscriptionFilterStatus('Pending Activation');
        break;
      case 'sa_sub_renewals':
        setWorkspace('subscriptions');
        setSubscriptionFilterStatus('Active');
        break;
      case 'sa_sub_expired':
        setWorkspace('subscriptions');
        setSubscriptionFilterStatus('Expired');
        break;
      case 'sa_sub_suspended':
        setWorkspace('subscriptions');
        setSubscriptionFilterStatus('Suspended');
        break;
      case 'sa_pricing':
        setWorkspace('billing');
        setBillingSubView('pricing');
        break;
      case 'sa_invoices':
      case 'sa_billing_history':
        setWorkspace('billing');
        setBillingSubView('invoices');
        break;
      case 'sa_payments':
        setWorkspace('billing');
        setBillingSubView('payments');
        break;
      case 'sa_balances':
        setWorkspace('billing');
        setBillingSubView('balances');
        break;
      case 'sa_credits':
        setWorkspace('billing');
        setBillingSubView('credits');
        break;
      case 'sa_audit':
        setWorkspace('admin');
        setAdminSubView('audit');
        break;
      case 'sa_permissions':
        setWorkspace('admin');
        setAdminSubView('permissions');
        break;
      case 'sa_admins':
        setWorkspace('admin');
        setAdminSubView('admins');
        break;
      case 'sa_settings':
        setWorkspace('admin');
        setAdminSubView('settings');
        break;
      default:
        break;
    }
  }, [activeModule]);

  const selectedCompany =
    companies.find((c) => c.id === selectedCompanyId) || companies[0];

  const openCompanyWorkspace = (
    compId: string,
    initialTab: CompanyDetailTab = 'overview'
  ) => {
    setSelectedCompanyId(compId);
    setCompanyDetailTab(initialTab);
    setWorkspace('company_detail');
    setOpenActionMenuCompanyId(null);
  };

  // ============================================================
  // STATE: COMPANY DIRECTORY FILTERS & CONTEXTUAL ACTION MENU
  // ============================================================
  const [companySearch, setCompanySearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [serviceFilter, setServiceFilter] = useState<string>('All');
  const [planFilter, setPlanFilter] = useState<string>('All');
  const [billingStatusFilter, setBillingStatusFilter] = useState<string>('All');
  const [openActionMenuCompanyId, setOpenActionMenuCompanyId] = useState<
    string | null
  >(null);

  // ============================================================
  // STATE: SERVICE CHANGE CONFIRMATION & PRORATION / BILLING PREVIEW
  // ============================================================
  const [stagedServiceChange, setStagedServiceChange] = useState<{
    companyId: string;
    serviceId: ServiceId;
    willEnable: boolean;
    dependentIds: ServiceId[];
    missingDeps: ServiceId[];
  } | null>(null);
  const [serviceChangeEffectivePolicy, setServiceChangeEffectivePolicy] =
    useState<'immediate_preview' | 'next_renewal'>('immediate_preview');
  const [serviceChangeReason, setServiceChangeReason] = useState(
    'Updated per client service configuration request'
  );
  const [cascadeDependents, setCascadeDependents] = useState(true);

  // ============================================================
  // STATE: FEATURE CONFIGURATION & CUSTOM SERVICE PRICE DRAWER
  // ============================================================
  const [configuringServiceForFeatures, setConfiguringServiceForFeatures] =
    useState<ServiceCatalogItem | null>(null);
  const [customPriceDraft, setCustomPriceDraft] = useState<string>('');

  // ============================================================
  // STATE: PACKAGE BUILDER / CUSTOM PACKAGE DRAWER (Section 9)
  // ============================================================
  const [editingPackage, setEditingPackage] =
    useState<SubscriptionPlanPackage | null>(null);
  const [isCreatingNewPackage, setIsCreatingNewPackage] = useState(false);
  const [migrateExistingOnSave, setMigrateExistingOnSave] = useState(false);

  // ============================================================
  // STATE: INVOICE DETAIL & RECORD PAYMENT DRAWERS (Sections 11 & 13)
  // ============================================================
  const [selectedInvoice, setSelectedInvoice] =
    useState<CompanyInvoice | null>(null);
  const [paymentModalInvoice, setPaymentModalInvoice] =
    useState<CompanyInvoice | null>(null);
  const [paymentAmountInput, setPaymentAmountInput] = useState<string>('');
  const [paymentMethodInput, setPaymentMethodInput] =
    useState<CompanyPaymentRecord['paymentMethod']>('UPI');
  const [paymentRefInput, setPaymentRefInput] = useState<string>('');
  const [paymentVerificationInput, setPaymentVerificationInput] =
    useState<CompanyPaymentRecord['verificationSource']>('Manual Admin Record');

  // ============================================================
  // STATE: CREDIT / ADJUSTMENT MODAL
  // ============================================================
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [creditCompanyId, setCreditCompanyId] = useState('comp-abc');
  const [creditType, setCreditType] =
    useState<CreditAdjustmentRecord['type']>('Credit Note');
  const [creditAmount, setCreditAmount] = useState('500');
  const [creditReason, setCreditReason] = useState(
    'Service SLA credit adjustment'
  );

  // ============================================================
  // STATE: 10-STEP COMPANY ONBOARDING WORKFLOW DRAWER (Section 16)
  // ============================================================
  const [onboardingCompany, setOnboardingCompany] =
    useState<CompanyTenant | null>(null);
  const [onboardingPlanId, setOnboardingPlanId] =
    useState<SubscriptionPlanId>('professional');
  const [onboardingServices, setOnboardingServices] = useState<ServiceId[]>([]);
  const [onboardingCycle, setOnboardingCycle] =
    useState<BillingCycle>('Monthly');
  const [onboardingDiscount, setOnboardingDiscount] = useState<number>(200);
  const [onboardingTerms, setOnboardingTerms] =
    useState<PaymentTerms>('Net 15');
  const [onboardingGenerateInvoice, setOnboardingGenerateInvoice] =
    useState(true);
  const [onboardingValidationError, setOnboardingValidationError] =
    useState<string>('');

  // ============================================================
  // STATE: CATALOG & AUDIT FILTERS
  // ============================================================
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogGroupFilter, setCatalogGroupFilter] = useState<string>('All');
  const [auditCompanyFilter, setAuditCompanyFilter] = useState<string>('All');
  const [auditActionFilter, setAuditActionFilter] = useState<string>('All');

  // ============================================================
  // COMPUTED PLATFORM METRICS (Section 3)
  // ============================================================
  const totalCompaniesCount = companies.length;
  const activeCompaniesCount = companies.filter(
    (c) => c.status === 'Active'
  ).length;
  const pendingAppsCount = companies.filter(
    (c) => c.status === 'Pending'
  ).length;
  const suspendedCompaniesCount = companies.filter(
    (c) => c.status === 'Suspended'
  ).length;
  const activeSubscriptionsCount = companies.filter(
    (c) => c.subscriptionStatus === 'Active'
  ).length;

  const v1Services = serviceCatalog.filter((s) => s.version === 'V1');

  const totalMrr = companies
    .filter((c) => c.status === 'Active')
    .reduce((sum, c) => {
      const calc = calculateCompanyBillingBreakdown(
        { ...c, billingCycle: 'Monthly' },
        hasService
      );
      return sum + calc.subtotal - calc.discount;
    }, 0);

  const unpaidInvoices = companyInvoices.filter(
    (inv) => inv.balanceDue > 0 && inv.status !== 'Void'
  );
  const totalOutstandingINR = unpaidInvoices.reduce(
    (sum, inv) => sum + inv.balanceDue,
    0
  );
  const renewalsDueCount = companies.filter(
    (c) => c.status === 'Active' && c.renewalDate.includes('Oct')
  ).length;

  // ============================================================
  // HANDLERS: SERVICE CHANGE WITH BILLING PREVIEW & DEPENDENCY CHECK
  // ============================================================
  const initiateServiceToggle = (companyId: string, serviceId: ServiceId) => {
    const currentlyActive = hasService(serviceId, companyId);
    const willEnable = !currentlyActive;

    const activeIdsForCompany = v1Services
      .filter((s) => hasService(s.id, companyId))
      .map((s) => s.id);

    const missingDeps = willEnable
      ? getMissingDependencies(serviceId, activeIdsForCompany)
      : [];

    const dependentIds = !willEnable
      ? getDependentServices(serviceId)
          .map((item) => item.id)
          .filter((depId) => hasService(depId, companyId))
      : [];

    setStagedServiceChange({
      companyId,
      serviceId,
      willEnable,
      dependentIds,
      missingDeps,
    });
    setCascadeDependents(true);
    setServiceChangeEffectivePolicy('immediate_preview');
    setServiceChangeReason(
      willEnable
        ? `Enabled ${getServiceById(serviceId)?.name} per client requirement`
        : `Disabled ${getServiceById(serviceId)?.name} — historical records retained`
    );
  };

  const confirmStagedServiceChange = () => {
    if (!stagedServiceChange) return;
    const {
      companyId,
      serviceId,
      willEnable,
      dependentIds,
      missingDeps,
    } = stagedServiceChange;

    const policyNote =
      serviceChangeEffectivePolicy === 'next_renewal'
        ? ' (Effective Next Renewal)'
        : ' (Immediate Activation)';

    toggleCompanyService(
      companyId,
      serviceId,
      willEnable,
      `${serviceChangeReason}${policyNote}`,
      willEnable ? missingDeps : cascadeDependents ? dependentIds : []
    );
    setStagedServiceChange(null);
  };

  const openFeatureConfigDrawer = (svc: ServiceCatalogItem) => {
    setConfiguringServiceForFeatures(svc);
    const existingCustomPrice =
      selectedCompany.customServicePrices?.[svc.id];
    setCustomPriceDraft(
      existingCustomPrice !== undefined
        ? String(existingCustomPrice)
        : String(getBasePriceForService(svc.id))
    );
  };

  const openOnboardingWizard = (comp: CompanyTenant) => {
    setOnboardingCompany(comp);
    setOnboardingPlanId(comp.planId || 'professional');
    setOnboardingServices(
      comp.requestedServices && comp.requestedServices.length > 0
        ? comp.requestedServices
        : [
            'dashboard',
            'company_management',
            'user_management',
            'floor',
            'orders',
            'kitchen',
            'menu',
            'billing',
            'inventory',
            'suppliers',
            'resource_management',
            'staff',
            'attendance',
            'clock_in_out',
            'shifts',
            'tasks',
          ]
    );
    setOnboardingCycle(comp.billingCycle || 'Monthly');
    setOnboardingDiscount(comp.discountAmount || 0);
    setOnboardingTerms(comp.paymentTerms || 'Net 15');
    setOnboardingValidationError('');
  };

  const handleCompleteOnboarding = () => {
    if (!onboardingCompany) return;
    const nonCoreServices = onboardingServices.filter(
      (id) =>
        id !== 'dashboard' &&
        id !== 'company_management' &&
        id !== 'user_management'
    );
    if (nonCoreServices.length === 0) {
      setOnboardingValidationError(
        'Validation Error: Please select at least one operational service before activating the subscription.'
      );
      return;
    }

    approveCompanyOnboarding(onboardingCompany.id, onboardingServices, {
      planId: onboardingPlanId,
      billingCycle: onboardingCycle,
      discountAmount: onboardingDiscount,
      paymentTerms: onboardingTerms,
      generateFirstInvoice: onboardingGenerateInvoice,
    });
    setSelectedCompanyId(onboardingCompany.id);
    setOnboardingCompany(null);
    setWorkspace('company_detail');
    setCompanyDetailTab('overview');
  };

  const openPaymentModal = (inv: CompanyInvoice) => {
    setPaymentModalInvoice(inv);
    setPaymentAmountInput(String(inv.balanceDue));
    setPaymentMethodInput('UPI');
    setPaymentRefInput(`UTR-${Math.floor(10000000 + Math.random() * 89999999)}`);
    setPaymentVerificationInput('Manual Admin Record');
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalInvoice) return;
    const amt = Number(paymentAmountInput);
    if (!amt || amt <= 0) {
      addToast('Invalid Payment Amount', 'Enter a positive amount in INR.', 'danger');
      return;
    }
    recordCompanyInvoicePayment(
      paymentModalInvoice.id,
      amt,
      paymentMethodInput,
      paymentRefInput,
      paymentVerificationInput
    );
    setPaymentModalInvoice(null);
    // Refresh selectedInvoice if open
    if (selectedInvoice?.id === paymentModalInvoice.id) {
      setSelectedInvoice(null);
    }
  };

  const openNewCustomPackageBuilder = (forCompanyId?: string) => {
    const targetComp = companies.find((c) => c.id === forCompanyId);
    setIsCreatingNewPackage(true);
    setMigrateExistingOnSave(true);
    setEditingPackage({
      id: `custom-${Date.now().toString().slice(-4)}`,
      name: targetComp
        ? `${targetComp.name.split('—')[0].trim()} Custom Package`
        : 'Custom Hospitality Package',
      displayBadge: 'Custom Negotiated',
      isCustomPackage: true,
      assignedCompanyId: targetComp?.id || 'comp-abc',
      billingCycle: 'Monthly',
      monthlyPrice: 3500,
      annualPrice: 37800,
      changePolicy: 'New Subscriptions Only',
      description:
        'Tailored combination of services, feature entitlements, and negotiated pricing.',
      includedServices: [
        'dashboard',
        'company_management',
        'user_management',
        'floor',
        'orders',
        'kitchen',
        'billing',
        'menu',
        'inventory',
        'suppliers',
        'resource_management',
        'staff',
        'attendance',
        'clock_in_out',
      ],
      limits: {
        maxStaff: 25,
        maxUsers: 12,
        maxTables: 35,
        monthlyOrdersLimit: 10000,
      },
      status: 'Active',
    });
  };

  // Filtered Companies for Company Directory (Section 4)
  const filteredCompanies = companies.filter((c) => {
    if (companySearch.trim()) {
      const q = companySearch.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchOwner = c.owner.toLowerCase().includes(q);
      const matchCode = c.companyCode.toLowerCase().includes(q);
      if (!matchName && !matchOwner && !matchCode) return false;
    }
    if (statusFilter !== 'All' && c.status !== statusFilter) return false;
    if (planFilter !== 'All' && c.planId !== planFilter) return false;
    if (
      serviceFilter !== 'All' &&
      !hasService(serviceFilter as ServiceId, c.id)
    ) {
      return false;
    }
    if (billingStatusFilter === 'Paid / Current' && c.outstandingAmount > 0) {
      return false;
    }
    if (billingStatusFilter === 'Balance Due' && c.outstandingAmount <= 0) {
      return false;
    }
    return true;
  });

  // Live billing breakdown for selectedCompany
  const selectedCompanyBilling = calculateCompanyBillingBreakdown(
    selectedCompany,
    hasService
  );

  // Staged service change billing preview
  const stagedBillingPreview = stagedServiceChange
    ? previewServiceChangeBillingImpact(
        companies.find((c) => c.id === stagedServiceChange.companyId) ||
          selectedCompany,
        stagedServiceChange.serviceId,
        stagedServiceChange.willEnable,
        hasService
      )
    : null;

  return (
    <div className="space-y-6">
      {/* SUPER ADMIN CONTEXT BANNER (Sections 3, 11, 13, 18) — Borderless White Surface */}
      <div className="bg-white shadow-[0_8px_24px_-4px_rgba(61,52,46,0.045)] px-5 py-3.5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-2xl bg-[#FFF0E2] text-[#F97316] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="text-[#756A62]">
            <strong className="text-[#3D342E]">
              KnockOUT Super Admin Control Center:
            </strong>{' '}
            Multi-tenant modular service provisioning, feature entitlements &amp; company-specific billing engine (Mock INR ₹).
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0 text-[11px]">
          <span className="text-[#756A62]">
            Selected Client: <strong className="text-[#3D342E]">{selectedCompany.name}</strong> ({selectedCompany.companyCode})
          </span>
          <button
            type="button"
            onClick={() => {
              setActiveCompanyId(selectedCompany.id);
              setRole('COMPANY_ADMIN');
              setActiveModule('overview');
            }}
            className="text-[#F97316] hover:text-[#EA580C] font-bold underline cursor-pointer"
          >
            Preview Client Cockpit →
          </button>
        </div>
      </div>

      {/* TOP WORKSPACE NAVIGATION BAR — Soft Orange Container with Orange Active Pill */}
      <div className="flex items-center justify-between gap-2 flex-wrap bg-[#FFF0E2] p-1 rounded-full">
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'overview', label: 'Platform Dashboard', mod: 'sa_overview' },
            { id: 'companies', label: `Companies (${companies.length})`, mod: 'sa_companies' },
            {
              id: 'company_detail',
              label: `Client Workspace: ${selectedCompany.name.split('—')[0].trim()}`,
              mod: 'sa_company_details',
            },
            { id: 'services', label: 'Service & Feature Catalog', mod: 'sa_services' },
            { id: 'packages', label: 'Packages & Custom Plans', mod: 'sa_packages' },
            { id: 'subscriptions', label: 'Subscriptions', mod: 'sa_subscriptions' },
            { id: 'billing', label: 'Billing, Invoices & Payments', mod: 'sa_invoices' },
            { id: 'admin', label: 'Audit Logs & Admin', mod: 'sa_audit' },
          ].map((item) => {
            const active = workspace === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setWorkspace(item.id as PrimaryWorkspace);
                  setActiveModule(item.mod as ModuleId);
                }}
                className={cn(
                  'min-h-[38px] px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer',
                  active
                    ? 'bg-[#F97316] text-white shadow-xs'
                    : 'text-[#756A62] hover:text-[#3D342E]'
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* =======================================================================
          WORKSPACE 1: PLATFORM DASHBOARD (Section 3)
         ======================================================================= */}
      {workspace === 'overview' && (
        <div className="space-y-6">
          <PageHeader
            title="Platform Dashboard"
            meta="Multi-Tenant SaaS Operations"
            subtitle="Client Requirements → Company Setup → Service Selection → Feature Configuration → Pricing → Subscription Activation → Invoice Generation → Payment Tracking."
            secondaryActions={
              <Button
                variant="outline"
                size="md"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => openNewCustomPackageBuilder()}
              >
                Create Custom Package
              </Button>
            }
            primaryAction={
              <Button
                variant="primary"
                size="md"
                icon={<Building2 className="w-4 h-4" />}
                onClick={() => {
                  setWorkspace('companies');
                  setActiveModule('sa_companies');
                }}
              >
                Open Company Directory
              </Button>
            }
          />

          {/* 8 REQUIRED PLATFORM KPI CARDS (Section 3) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Total Companies"
              value={String(totalCompaniesCount)}
              delta="Multi-Tenant Cluster"
              deltaTone="neutral"
              subtext="Restaurants, Cafes & Hospitality Groups"
              onClick={() => setWorkspace('companies')}
            />
            <MetricCard
              label="Active Companies"
              value={String(activeCompaniesCount)}
              delta={`${activeSubscriptionsCount} Active Subscriptions`}
              deltaTone="positive"
              subtext="Operational cockpits online"
              onClick={() => {
                setStatusFilter('Active');
                setWorkspace('companies');
              }}
            />
            <MetricCard
              label="Pending Applications"
              value={String(pendingAppsCount)}
              delta="Action Required"
              deltaTone="warning"
              subtext="Spice Route Kitchens awaiting review"
              onClick={() => {
                const pendingComp = companies.find((c) => c.status === 'Pending');
                if (pendingComp) openOnboardingWizard(pendingComp);
              }}
            />
            <MetricCard
              label="Active Subscriptions"
              value={String(activeSubscriptionsCount)}
              delta={`${subscriptionPlans.length} Active Packages`}
              deltaTone="positive"
              subtext="Monthly & Custom Negotiated terms"
              onClick={() => setWorkspace('subscriptions')}
            />
            <MetricCard
              label="Monthly Recurring Revenue"
              value={formatINR(totalMrr)}
              delta="Calculated from Active Services"
              deltaTone="positive"
              subtext="Excludes GST (Mock Prototype Data)"
              onClick={() => {
                setWorkspace('billing');
                setBillingSubView('pricing');
              }}
            />
            <MetricCard
              label="Outstanding Invoices"
              value={formatINR(totalOutstandingINR)}
              delta={`${unpaidInvoices.length} Unpaid / Partial`}
              deltaTone="warning"
              subtext="Click to record payments"
              onClick={() => {
                setWorkspace('billing');
                setBillingSubView('invoices');
              }}
            />
            <MetricCard
              label="Renewals Due"
              value={String(renewalsDueCount)}
              delta="Next 14 Days"
              deltaTone="neutral"
              subtext="Green Leaf Café (Oct 19)"
              onClick={() => {
                setWorkspace('subscriptions');
                setSubscriptionFilterStatus('Active');
              }}
            />
            <MetricCard
              label="Suspended Companies"
              value={String(suspendedCompaniesCount)}
              delta="Past Due Billing"
              deltaTone="warning"
              subtext="Coastal Spice Bistro (₹2,360 overdue)"
              onClick={() => openCompanyWorkspace('comp-suspended', 'billing')}
            />
          </div>

          {/* SECTION 15: COMPANY-SPECIFIC CONFIGURATION SHOWCASE CARDS */}
          <section className="bg-white border border-zinc-200/90 rounded-lg p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">
                  Company-Specific Service Entitlement Profiles (Section 15)
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Every company has distinct service combinations, feature entitlements, and billing line items. Click any company to configure or preview its live cockpit.
                </p>
              </div>
              <span className="text-xs font-mono text-teal-700">
                Single Source of Truth
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Example 1: ABC Restaurant */}
              <div className="p-4 border border-zinc-200 rounded-lg bg-zinc-50/60 flex flex-col justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-zinc-900">
                      ABC Restaurant (COMP-102)
                    </span>
                    <StatusIndicator status="Active" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-600">Restaurant Operations:</span>
                      <span className="font-mono font-semibold text-emerald-700">✓ Enabled</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-600">Inventory:</span>
                      <span className="font-mono font-semibold text-emerald-700">✓ Enabled</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-600">Resource Management:</span>
                      <span className="font-mono text-zinc-500">
                        {hasService('resource_management', 'comp-abc')
                          ? '✓ Enabled'
                          : '✕ Disabled'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-600">Finance:</span>
                      <span className="font-mono font-semibold text-emerald-700">✓ Enabled</span>
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-zinc-200/70 flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openCompanyWorkspace('comp-abc', 'services')}
                  >
                    Configure Services
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setActiveCompanyId('comp-abc');
                      setRole('COMPANY_ADMIN');
                      setActiveModule('overview');
                    }}
                  >
                    Verify Client UI →
                  </Button>
                </div>
              </div>

              {/* Example 2: Green Leaf Café */}
              <div className="p-4 border border-zinc-200 rounded-lg bg-zinc-50/60 flex flex-col justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-zinc-900">
                      Green Leaf Café (COMP-103)
                    </span>
                    <StatusIndicator status="Active" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-600">Restaurant Operations:</span>
                      <span className="font-mono font-semibold text-emerald-700">✓ Enabled</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-600">Inventory:</span>
                      <span className="font-mono text-zinc-500">
                        {hasService('inventory', 'comp-greenleaf')
                          ? '✓ Enabled'
                          : '✕ Disabled'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-600">Resource Management:</span>
                      <span className="font-mono font-semibold text-emerald-700">✓ Enabled</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-600">Finance:</span>
                      <span className="font-mono text-zinc-500">
                        {hasService('finance', 'comp-greenleaf')
                          ? '✓ Enabled'
                          : '✕ Disabled'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-zinc-200/70 flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      openCompanyWorkspace('comp-greenleaf', 'services')
                    }
                  >
                    Configure Services
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setActiveCompanyId('comp-greenleaf');
                      setRole('COMPANY_ADMIN');
                      setActiveModule('overview');
                    }}
                  >
                    Verify Client UI →
                  </Button>
                </div>
              </div>

              {/* Example 3: Royal Foods Group */}
              <div className="p-4 border border-zinc-200 rounded-lg bg-zinc-50/60 flex flex-col justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-zinc-900">
                      Royal Foods Group (COMP-104)
                    </span>
                    <StatusIndicator status="Active" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-600">Restaurant Operations:</span>
                      <span className="font-mono font-semibold text-emerald-700">✓ Enabled</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-600">Inventory & Resource Mgmt:</span>
                      <span className="font-mono font-semibold text-emerald-700">✓ Enabled</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-600">Finance:</span>
                      <span className="font-mono font-semibold text-emerald-700">✓ Enabled</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-600">Advanced Reports:</span>
                      <span className="font-mono font-semibold text-emerald-700">✓ Enabled</span>
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-zinc-200/70 flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openCompanyWorkspace('comp-royal', 'services')}
                  >
                    Configure Services
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setActiveCompanyId('comp-royal');
                      setRole('COMPANY_ADMIN');
                      setActiveModule('overview');
                    }}
                  >
                    Verify Client UI →
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* ATTENTION REQUIRED & RECENT COMPANY ACTIVITY (Section 3) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* ATTENTION REQUIRED (7 cols) */}
            <section className="lg:col-span-7 bg-white border border-zinc-200/90 rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-200/80 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-zinc-900">
                    Attention Required
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Unpaid invoices, pending applications, failed billing operations & upcoming renewals
                  </p>
                </div>
                <span className="text-xs font-mono text-amber-700 font-semibold">
                  5 Actionable Items
                </span>
              </div>

              <div className="divide-y divide-zinc-200/70">
                {/* Alert 1: Unpaid / Partially Paid Invoice */}
                <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <StatusIndicator status="Partially Paid" />
                      <span className="text-sm font-semibold text-zinc-900">
                        ABC Restaurant — Invoice INV-2026-1042 Balance Due
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      ₹1,500 paid of ₹4,012 · Remaining balance: ₹2,512 (Due Oct 15, 2026).
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      const inv = companyInvoices.find(
                        (i) => i.id === 'inv-abc-oct'
                      );
                      if (inv) openPaymentModal(inv);
                    }}
                  >
                    Record Payment
                  </Button>
                </div>

                {/* Alert 2: Failed Billing / Overdue Suspended Account */}
                <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <StatusIndicator status="Overdue" />
                      <span className="text-sm font-semibold text-zinc-900">
                        Coastal Spice Bistro — Failed Card Charge & Overdue Invoice
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      INV-2026-0988 (₹2,360) failed auto-debit (`RZP-FAIL-77192011`). Account suspended.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const inv = companyInvoices.find(
                          (i) => i.id === 'inv-coastal-sep'
                        );
                        if (inv) openPaymentModal(inv);
                      }}
                    >
                      Settle ₹2,360
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        openCompanyWorkspace('comp-suspended', 'overview')
                      }
                    >
                      Inspect
                    </Button>
                  </div>
                </div>

                {/* Alert 3: Company Awaiting Approval (10-Step Onboarding) */}
                <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <StatusIndicator status="Pending Activation" />
                      <span className="text-sm font-semibold text-zinc-900">
                        Spice Route Kitchens (COMP-105) — Awaiting Onboarding
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Requested Restaurant Operations + Inventory + Resource Management (Chennai, TN).
                    </p>
                  </div>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => {
                      const comp = companies.find(
                        (c) => c.id === 'comp-pending'
                      );
                      if (comp) openOnboardingWizard(comp);
                    }}
                  >
                    Launch Onboarding →
                  </Button>
                </div>

                {/* Alert 4: Expiring Subscription / Renewal Due */}
                <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <StatusIndicator status="Active" />
                      <span className="text-sm font-semibold text-zinc-900">
                        Green Leaf Café — Custom Package Renewal Due Oct 19
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Custom Negotiated Package (₹3,000/mo + GST). Review terms or generate renewal invoice.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      openCompanyWorkspace('comp-greenleaf', 'subscription')
                    }
                  >
                    Review Renewal
                  </Button>
                </div>

                {/* Alert 5: Incomplete Service Configuration Opportunity */}
                <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Info className="w-3.5 h-3.5 text-teal-700" />
                      <span className="text-sm font-semibold text-zinc-900">
                        ABC Restaurant — Resource Management Suite Not Provisioned
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      14 staff profiles on outlet, but Resource Management (+₹1,000/mo) is currently disabled.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openCompanyWorkspace('comp-abc', 'services')}
                  >
                    Configure Services
                  </Button>
                </div>
              </div>
            </section>

            {/* RECENT COMPANY ACTIVITY (5 cols) */}
            <section className="lg:col-span-5 bg-white border border-zinc-200/90 rounded-lg p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <div>
                    <h2 className="text-base font-semibold text-zinc-900">
                      Recent Company Activity
                    </h2>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Registrations, service changes, invoices & payments
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setWorkspace('admin');
                      setAdminSubView('audit');
                    }}
                    className="text-xs font-medium text-teal-700 hover:underline cursor-pointer"
                  >
                    Full Audit Log →
                  </button>
                </div>

                <div className="divide-y divide-zinc-100 mt-3 max-h-[380px] overflow-y-auto pr-1">
                  {serviceAuditLogs.slice(0, 7).map((entry) => (
                    <div key={entry.id} className="py-3 text-xs space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            'font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded border',
                            entry.action.includes('ACTIVATED') ||
                              entry.action.includes('ONBOARDED') ||
                              entry.action.includes('PAYMENT')
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : entry.action.includes('DEACTIVATED') ||
                                entry.action.includes('SUSPENDED')
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-zinc-100 text-zinc-800 border-zinc-200'
                          )}
                        >
                          {entry.action}
                        </span>
                        <span className="font-mono text-[11px] text-zinc-400">
                          {entry.dateLabel} · {entry.timestamp}
                        </span>
                      </div>
                      <div className="font-semibold text-zinc-900">
                        {entry.companyName} — {entry.serviceName}
                      </div>
                      {(entry.previousValue || entry.newValue) && (
                        <div className="font-mono text-[11px] text-zinc-600 bg-zinc-50 px-2 py-1 rounded border border-zinc-200/70">
                          {entry.previousValue} →{' '}
                          <strong className="text-zinc-900">
                            {entry.newValue}
                          </strong>
                        </div>
                      )}
                      <div className="text-zinc-500">{entry.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* =======================================================================
          WORKSPACE 2: COMPANY DIRECTORY (Section 4)
         ======================================================================= */}
      {workspace === 'companies' && (
        <div className="space-y-6">
          <PageHeader
            title="Company Directory"
            meta={`${filteredCompanies.length} of ${companies.length} Companies`}
            subtitle="Search and filter companies by status, enabled service, subscription plan, or billing balance."
            primaryAction={
              <Button
                variant="primary"
                size="md"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => {
                  const pending = companies.find((c) => c.status === 'Pending');
                  if (pending) openOnboardingWizard(pending);
                }}
              >
                Review Pending Onboarding ({pendingAppsCount})
              </Button>
            }
          />

          {/* FILTERS BAR (Section 4) */}
          <div className="bg-white border border-zinc-200/90 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                placeholder="Search name, owner, COMP-102..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by Company Status"
              className="px-2.5 py-1.5 text-xs border border-zinc-300 rounded-lg bg-white text-zinc-800"
            >
              <option value="All">Status: All</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending Application</option>
              <option value="Suspended">Suspended</option>
            </select>

            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              aria-label="Filter by Enabled Service"
              className="px-2.5 py-1.5 text-xs border border-zinc-300 rounded-lg bg-white text-zinc-800"
            >
              <option value="All">Enabled Service: All</option>
              <option value="floor">Floor & Tables</option>
              <option value="orders">POS Orders</option>
              <option value="inventory">Inventory Management</option>
              <option value="resource_management">Resource Management</option>
              <option value="finance">Finance & Ledger</option>
              <option value="reports">Advanced Reports</option>
            </select>

            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              aria-label="Filter by Subscription Plan"
              className="px-2.5 py-1.5 text-xs border border-zinc-300 rounded-lg bg-white text-zinc-800"
            >
              <option value="All">Subscription Plan: All</option>
              {subscriptionPlans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <select
              value={billingStatusFilter}
              onChange={(e) => setBillingStatusFilter(e.target.value)}
              aria-label="Filter by Billing Status"
              className="px-2.5 py-1.5 text-xs border border-zinc-300 rounded-lg bg-white text-zinc-800"
            >
              <option value="All">Billing Status: All</option>
              <option value="Paid / Current">Paid / Zero Balance</option>
              <option value="Balance Due">Outstanding Balance Due</option>
            </select>
          </div>

          {/* DESKTOP TABLE (Hidden on Mobile, Section 4) */}
          <div className="hidden md:block bg-white border border-zinc-200/90 rounded-lg overflow-visible">
            <div className="grid grid-cols-12 gap-3 px-5 py-3 bg-zinc-50 border-b border-zinc-200 text-xs font-medium text-zinc-500">
              <div className="col-span-3">Company Name & ID</div>
              <div className="col-span-2">Owner & Type</div>
              <div className="col-span-2">Active Services</div>
              <div className="col-span-2">Plan & Billing Cycle</div>
              <div className="col-span-1">Sub Status</div>
              <div className="col-span-1 text-right">Outstanding</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            <div className="divide-y divide-zinc-200/70">
              {filteredCompanies.map((comp) => {
                const enabledCount = v1Services.filter((s) =>
                  hasService(s.id, comp.id)
                ).length;
                const hasRM = hasService('resource_management', comp.id);
                const hasInv = hasService('inventory', comp.id);
                const hasFin = hasService('finance', comp.id);
                const menuOpen = openActionMenuCompanyId === comp.id;

                return (
                  <div
                    key={comp.id}
                    className="px-5 py-4 grid grid-cols-12 gap-3 items-center hover:bg-zinc-50/70 text-xs"
                  >
                    <div className="col-span-3">
                      <button
                        type="button"
                        onClick={() => openCompanyWorkspace(comp.id, 'overview')}
                        className="text-sm font-semibold text-zinc-900 hover:text-teal-700 text-left cursor-pointer"
                      >
                        {comp.name}
                      </button>
                      <div className="font-mono text-[11px] text-zinc-500 mt-0.5">
                        {comp.companyCode} · {comp.location} · Reg:{' '}
                        {comp.createdDate}
                      </div>
                    </div>

                    <div className="col-span-2">
                      <div className="font-medium text-zinc-900">
                        {comp.owner}
                      </div>
                      <div className="text-zinc-500">{comp.businessType}</div>
                    </div>

                    <div className="col-span-2">
                      <div className="font-mono font-semibold text-zinc-900">
                        {enabledCount} / {v1Services.length} Services
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700">
                          Ops
                        </span>
                        {hasInv && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-50 text-teal-800">
                            Inv
                          </span>
                        )}
                        {hasRM && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800">
                            RM
                          </span>
                        )}
                        {hasFin && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-800">
                            Fin
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="col-span-2">
                      <div className="font-semibold text-zinc-900">
                        {comp.plan}
                      </div>
                      <div className="font-mono text-zinc-500">
                        {comp.billingCycle} · Renews {comp.renewalDate}
                      </div>
                    </div>

                    <div className="col-span-1">
                      <StatusIndicator status={comp.subscriptionStatus} />
                    </div>

                    <div className="col-span-1 text-right font-mono font-semibold tabular-nums">
                      {comp.outstandingAmount > 0 ? (
                        <span className="text-amber-700">
                          {formatINR(comp.outstandingAmount)}
                        </span>
                      ) : (
                        <span className="text-emerald-700">₹0</span>
                      )}
                    </div>

                    <div className="col-span-1 flex items-center justify-end gap-1 relative">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openCompanyWorkspace(comp.id, 'overview')}
                      >
                        Open
                      </Button>

                      {/* Contextual Action Menu Dropdown (Section 4) */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenActionMenuCompanyId(
                              menuOpen ? null : comp.id
                            )
                          }
                          aria-label="Company Actions"
                          className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-600 cursor-pointer"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {menuOpen && (
                          <div className="absolute right-0 mt-1 w-52 bg-white border border-zinc-200 rounded-lg shadow-xl py-1 z-30 text-xs">
                            <button
                              type="button"
                              onClick={() =>
                                openCompanyWorkspace(comp.id, 'overview')
                              }
                              className="w-full px-3 py-2 text-left hover:bg-zinc-50 font-medium text-zinc-800 cursor-pointer"
                            >
                              View Company Details
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                openCompanyWorkspace(comp.id, 'services')
                              }
                              className="w-full px-3 py-2 text-left hover:bg-zinc-50 font-medium text-teal-700 cursor-pointer"
                            >
                              Configure Services & Features
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                openCompanyWorkspace(comp.id, 'subscription')
                              }
                              className="w-full px-3 py-2 text-left hover:bg-zinc-50 text-zinc-700 cursor-pointer"
                            >
                              Manage Subscription
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenActionMenuCompanyId(null);
                                const inv = generateCompanyInvoice(comp.id, {
                                  status: 'Draft',
                                });
                                if (inv) setSelectedInvoice(inv);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-zinc-50 text-zinc-700 cursor-pointer"
                            >
                              Generate Draft Invoice
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                openCompanyWorkspace(comp.id, 'billing')
                              }
                              className="w-full px-3 py-2 text-left hover:bg-zinc-50 text-zinc-700 cursor-pointer"
                            >
                              View Billing History
                            </button>
                            <div className="border-t border-zinc-100 my-1" />
                            {comp.status === 'Pending' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenActionMenuCompanyId(null);
                                  openOnboardingWizard(comp);
                                }}
                                className="w-full px-3 py-2 text-left hover:bg-emerald-50 text-emerald-700 font-semibold cursor-pointer"
                              >
                                Complete Onboarding
                              </button>
                            )}
                            {comp.status === 'Active' ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenActionMenuCompanyId(null);
                                  updateCompanyStatus(comp.id, 'Suspended');
                                }}
                                className="w-full px-3 py-2 text-left hover:bg-red-50 text-red-600 cursor-pointer"
                              >
                                Suspend Company
                              </button>
                            ) : (
                              comp.status === 'Suspended' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionMenuCompanyId(null);
                                    updateCompanyStatus(comp.id, 'Active');
                                  }}
                                  className="w-full px-3 py-2 text-left hover:bg-emerald-50 text-emerald-700 cursor-pointer"
                                >
                                  Reactivate Company
                                </button>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* MOBILE RESPONSIVE COMPANY CARDS (Section 4 & 17) */}
          <div className="md:hidden space-y-3">
            {filteredCompanies.map((comp) => {
              const enabledCount = v1Services.filter((s) =>
                hasService(s.id, comp.id)
              ).length;
              return (
                <div
                  key={comp.id}
                  className="bg-white border border-zinc-200 rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-zinc-900">
                        {comp.name}
                      </div>
                      <div className="text-xs font-mono text-zinc-500">
                        {comp.companyCode} · {comp.businessType} · {comp.owner}
                      </div>
                    </div>
                    <StatusIndicator status={comp.subscriptionStatus} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-50 p-2.5 rounded border border-zinc-200/70">
                    <div>
                      <span className="text-zinc-500 block">Plan & Cycle</span>
                      <span className="font-semibold text-zinc-900">
                        {comp.plan} ({comp.billingCycle})
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">
                        Active Services / Balance
                      </span>
                      <span className="font-mono font-semibold text-zinc-900">
                        {enabledCount} svcs · Due:{' '}
                        {formatINR(comp.outstandingAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => openCompanyWorkspace(comp.id, 'overview')}
                    >
                      Open Workspace
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openCompanyWorkspace(comp.id, 'services')}
                    >
                      Configure Services
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openCompanyWorkspace(comp.id, 'billing')}
                    >
                      Invoices
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =======================================================================
          WORKSPACE 3: DEDICATED 6-TAB COMPANY DETAIL WORKSPACE (Sections 5, 7, 8, 10, 11, 12)
         ======================================================================= */}
      {workspace === 'company_detail' && (
        <div className="space-y-6">
          {/* Company Selector & Header */}
          <div className="bg-white border border-zinc-200/90 rounded-xl p-5 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-xs font-mono bg-zinc-900 text-white px-2 py-0.5 rounded">
                    {selectedCompany.companyCode}
                  </span>
                  <h1 className="text-xl font-semibold text-zinc-900">
                    {selectedCompany.name}
                  </h1>
                  <StatusIndicator
                    status={selectedCompany.subscriptionStatus}
                  />
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  {selectedCompany.businessType} · {selectedCompany.location} ·
                  Owner: {selectedCompany.owner} · Plan:{' '}
                  <strong className="text-zinc-800">
                    {selectedCompany.plan}
                  </strong>{' '}
                  ({selectedCompany.billingCycle})
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={selectedCompany.id}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  aria-label="Switch Company in Detail Workspace"
                  className="px-3 py-1.5 text-xs font-medium border border-zinc-300 rounded-lg bg-zinc-50 text-zinc-900"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      Switch: {c.name} ({c.companyCode})
                    </option>
                  ))}
                </select>

                <Button
                  variant="outline"
                  size="sm"
                  icon={<Receipt className="w-3.5 h-3.5" />}
                  onClick={() => {
                    const inv = generateCompanyInvoice(selectedCompany.id, {
                      status: 'Draft',
                    });
                    if (inv) setSelectedInvoice(inv);
                  }}
                >
                  Generate Invoice
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  icon={<ArrowUpRight className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setActiveCompanyId(selectedCompany.id);
                    setRole('COMPANY_ADMIN');
                    setActiveModule('overview');
                  }}
                >
                  Open {selectedCompany.name.split('—')[0].trim()} Cockpit
                </Button>
              </div>
            </div>

            {/* 6 REQUIRED COMPANY DETAIL TABS (Section 5) */}
            <div className="flex items-center gap-1 pt-2 border-t border-zinc-100 overflow-x-auto">
              {[
                { id: 'overview', label: '1. Overview' },
                { id: 'services', label: '2. Services & Features' },
                { id: 'subscription', label: '3. Subscription' },
                { id: 'billing', label: '4. Billing & Invoices' },
                { id: 'users', label: '5. Users & Access' },
                { id: 'audit', label: '6. Activity & Audit' },
              ].map((t) => {
                const active = companyDetailTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() =>
                      setCompanyDetailTab(t.id as CompanyDetailTab)
                    }
                    className={cn(
                      'px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer',
                      active
                        ? 'bg-zinc-900 text-white'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                    )}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* -----------------------------------------------------------
              COMPANY TAB 1: OVERVIEW (Section 5)
             ----------------------------------------------------------- */}
          {companyDetailTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  label="Subscription Status"
                  value={selectedCompany.subscriptionStatus}
                  delta={selectedCompany.plan}
                  deltaTone="positive"
                  subtext={`${selectedCompany.billingCycle} · Start: ${selectedCompany.subscriptionStartDate}`}
                />
                <MetricCard
                  label="Calculated Monthly Total"
                  value={formatINR(selectedCompanyBilling.total)}
                  delta={`Subtotal ${formatINR(selectedCompanyBilling.subtotal)}`}
                  deltaTone="neutral"
                  subtext={`Includes 18% GST (${formatINR(selectedCompanyBilling.taxAmount)})`}
                />
                <MetricCard
                  label="Outstanding Balance"
                  value={formatINR(selectedCompany.outstandingAmount)}
                  delta={selectedCompany.paymentTerms}
                  deltaTone={
                    selectedCompany.outstandingAmount > 0
                      ? 'warning'
                      : 'positive'
                  }
                  subtext={`Next renewal: ${selectedCompany.renewalDate}`}
                />
                <MetricCard
                  label="Enabled V1 Services"
                  value={`${
                    v1Services.filter((s) =>
                      hasService(s.id, selectedCompany.id)
                    ).length
                  } / ${v1Services.length}`}
                  delta={`${selectedCompanyBilling.lineItems.length} Billable Groups`}
                  deltaTone="positive"
                  subtext="Click Services & Features to modify"
                  onClick={() => setCompanyDetailTab('services')}
                />
              </div>

              {/* Quick Actions Bar (Section 5) */}
              <div className="bg-white border border-zinc-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs font-medium text-zinc-700">
                  Quick Company Actions:
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setCompanyDetailTab('services')}
                  >
                    Configure Services
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCompanyDetailTab('subscription')}
                  >
                    Change Subscription
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const inv = generateCompanyInvoice(selectedCompany.id, {
                        status: 'Draft',
                      });
                      if (inv) setSelectedInvoice(inv);
                    }}
                  >
                    Generate Draft Invoice
                  </Button>
                  {selectedCompany.status === 'Active' ? (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() =>
                        updateCompanyStatus(selectedCompany.id, 'Suspended')
                      }
                    >
                      Suspend Access
                    </Button>
                  ) : (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() =>
                        updateCompanyStatus(selectedCompany.id, 'Active')
                      }
                    >
                      Reactivate Access
                    </Button>
                  )}
                </div>
              </div>

              {/* Company Profile & Live Billing Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-6 bg-white border border-zinc-200 rounded-lg p-5 space-y-3 text-xs">
                  <h3 className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-2">
                    Company Information & Terms
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-zinc-500 block">Company Name</span>
                      <span className="font-semibold text-zinc-900">
                        {selectedCompany.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Company ID</span>
                      <span className="font-mono font-semibold text-zinc-900">
                        {selectedCompany.companyCode}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Business Type</span>
                      <span className="font-semibold text-zinc-900">
                        {selectedCompany.businessType}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">GSTIN</span>
                      <span className="font-mono text-zinc-900">
                        {selectedCompany.gstin || '29AABCK8491F1Z5'}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">
                        Subscription Start — Renewal
                      </span>
                      <span className="font-mono text-zinc-900">
                        {selectedCompany.subscriptionStartDate} →{' '}
                        {selectedCompany.renewalDate}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">
                        Billing Cycle & Terms
                      </span>
                      <span className="font-mono text-zinc-900">
                        {selectedCompany.billingCycle} ·{' '}
                        {selectedCompany.paymentTerms}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6 bg-white border border-zinc-200 rounded-lg p-5 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                    <h3 className="text-sm font-semibold text-zinc-900">
                      Current Entitled Billing Breakdown
                    </h3>
                    <span className="font-mono text-zinc-500">
                      Mock INR (₹)
                    </span>
                  </div>
                  <div className="space-y-2">
                    {selectedCompanyBilling.lineItems.map((li) => (
                      <div
                        key={li.id}
                        className="flex items-center justify-between py-1 border-b border-zinc-100 last:border-b-0"
                      >
                        <div>
                          <div className="font-medium text-zinc-900">
                            {li.label}
                          </div>
                          <div className="text-[11px] text-zinc-500">
                            {li.description}
                          </div>
                        </div>
                        <span className="font-mono font-semibold text-zinc-900 tabular-nums">
                          {formatINR(li.amount)}
                        </span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-zinc-200 flex justify-between font-mono">
                      <span className="text-zinc-500">
                        Subtotal − Discount ({formatINR(selectedCompanyBilling.discount)}) + GST (18%):
                      </span>
                      <span className="font-bold text-zinc-900">
                        {formatINR(selectedCompanyBilling.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* -----------------------------------------------------------
              COMPANY TAB 2: SERVICES & FEATURES CONFIGURATION (Sections 7, 8, 12)
             ----------------------------------------------------------- */}
          {companyDetailTab === 'services' && (
            <div className="space-y-6">
              {/* Billing Summary Banner for Active Services */}
              <div className="bg-zinc-900 text-white rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-mono uppercase tracking-wider text-teal-400">
                    COMPANY SERVICE & FEATURE CONFIGURATION —{' '}
                    {selectedCompany.name} ({selectedCompany.companyCode})
                  </div>
                  <div className="text-sm text-zinc-300">
                    Toggle entire services or click{' '}
                    <strong className="text-white">Configure Features</strong>{' '}
                    to enable/disable individual sub-features and set custom negotiated pricing.
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-zinc-800 border border-zinc-700 px-4 py-2.5 rounded-lg text-xs font-mono shrink-0">
                  <div>
                    <span className="text-zinc-400 block text-[10px]">
                      SUBTOTAL
                    </span>
                    <span className="font-semibold text-white">
                      {formatINR(selectedCompanyBilling.subtotal)}/mo
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px]">
                      DISCOUNT
                    </span>
                    <span className="font-semibold text-emerald-400">
                      -{formatINR(selectedCompanyBilling.discount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px]">
                      TOTAL (+18% GST)
                    </span>
                    <span className="font-bold text-teal-300 text-sm">
                      {formatINR(selectedCompanyBilling.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Suite Toggle for Resource Management */}
              <div className="p-4 bg-teal-50/50 border border-teal-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-zinc-900">
                    Resource Management Suite Quick Control ({selectedCompany.name})
                  </div>
                  <p className="text-xs text-zinc-600">
                    Enable or disable all 9 Resource Management modules (Staff, PIN Access, Attendance, Clock In/Out, Breaks, Shifts, Schedule, Leave, Tasks, Resource Planning) at once, or toggle them individually below.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() =>
                      initiateServiceToggle(
                        selectedCompany.id,
                        'resource_management'
                      )
                    }
                  >
                    {hasService('resource_management', selectedCompany.id)
                      ? 'Disable Resource Mgmt Suite'
                      : 'Enable Resource Mgmt Suite (+₹1,000/mo)'}
                  </Button>
                </div>
              </div>

              {/* Service Groups (Restaurant Operations, Business Management, Resource Management, Platform Services, Future V2) */}
              {SERVICE_GROUPS_ORDER.map((groupName) => {
                const servicesInGroup = serviceCatalog.filter(
                  (s) => getServiceGroupForCatalogItem(s) === groupName
                );
                const isPlannedV2 =
                  groupName === 'Future V2 Services — Planned Only';

                return (
                  <div
                    key={groupName}
                    className="bg-white border border-zinc-200/90 rounded-lg overflow-hidden"
                  >
                    <div className="px-5 py-3 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-900">
                          {groupName}
                        </h3>
                      </div>
                      <span className="text-xs font-mono text-zinc-500">
                        {isPlannedV2
                          ? 'Planned V2 — Not Sellable'
                          : `${
                              servicesInGroup.filter((s) =>
                                hasService(s.id, selectedCompany.id)
                              ).length
                            } / ${servicesInGroup.length} Enabled`}
                      </span>
                    </div>

                    <div className="divide-y divide-zinc-200/70">
                      {servicesInGroup.map((svc) => {
                        const isEnabled = hasService(
                          svc.id,
                          selectedCompany.id
                        );
                        const entSource = getServiceEntitlementSource(
                          svc.id,
                          selectedCompany.id
                        );
                        const svcFeatures = featureCatalog.filter(
                          (f) => f.serviceId === svc.id
                        );
                        const enabledFeaturesCount = svcFeatures.filter((f) =>
                          hasFeature(f.id, selectedCompany.id)
                        ).length;
                        const customPrice =
                          selectedCompany.customServicePrices?.[svc.id];
                        const displayPrice =
                          customPrice !== undefined
                            ? customPrice
                            : getBasePriceForService(svc.id);
                        const isCore =
                          svc.id === 'dashboard' ||
                          svc.id === 'company_management' ||
                          svc.id === 'user_management';

                        return (
                          <div
                            key={svc.id}
                            className="px-5 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-zinc-50/60"
                          >
                            <div className="space-y-1 max-w-2xl">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <span className="text-sm font-semibold text-zinc-900">
                                  {svc.name}
                                </span>
                                <span className="text-[11px] font-mono text-zinc-400">
                                  ({svc.id})
                                </span>
                                <StatusIndicator
                                  status={
                                    isPlannedV2
                                      ? 'Planned V2'
                                      : isEnabled
                                      ? 'Enabled'
                                      : 'Disabled'
                                  }
                                />
                                {!isPlannedV2 && (
                                  <span className="text-[11px] font-mono text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                                    {entSource.source}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-zinc-600">
                                {svc.description}
                              </p>
                              <div className="flex items-center gap-4 text-[11px] text-zinc-500 font-mono pt-0.5 flex-wrap">
                                {!isPlannedV2 && (
                                  <span>
                                    Price:{' '}
                                    <strong className="text-zinc-900">
                                      {displayPrice === 0
                                        ? 'Included (Core)'
                                        : `${formatINR(displayPrice)}/mo`}
                                    </strong>
                                    {customPrice !== undefined &&
                                      ' (Custom Negotiated)'}
                                  </span>
                                )}
                                {svcFeatures.length > 0 && (
                                  <span>
                                    Features: {enabledFeaturesCount}/
                                    {svcFeatures.length} active
                                  </span>
                                )}
                                {svc.dependencies.length > 0 && (
                                  <span>
                                    Dependencies:{' '}
                                    {svc.dependencies
                                      .map((d) => getServiceById(d)?.name || d)
                                      .join(', ')}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap shrink-0">
                              {isPlannedV2 ? (
                                <span className="text-xs font-mono text-zinc-400 px-2.5 py-1 bg-zinc-100 rounded border border-zinc-200">
                                  Planned Only (V2)
                                </span>
                              ) : (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    icon={<Sliders className="w-3.5 h-3.5" />}
                                    onClick={() => openFeatureConfigDrawer(svc)}
                                  >
                                    Configure Features & Price
                                  </Button>

                                  {!isCore && (
                                    <Button
                                      variant={isEnabled ? 'outline' : 'primary'}
                                      size="sm"
                                      onClick={() =>
                                        initiateServiceToggle(
                                          selectedCompany.id,
                                          svc.id
                                        )
                                      }
                                    >
                                      {isEnabled
                                        ? 'Disable Service'
                                        : 'Enable Service'}
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* -----------------------------------------------------------
              COMPANY TAB 3: SUBSCRIPTION MANAGEMENT (Section 10)
             ----------------------------------------------------------- */}
          {companyDetailTab === 'subscription' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Subscription Configuration Form */}
                <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-lg p-5 space-y-4">
                  <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-zinc-900">
                        Subscription Plan & Commercial Terms
                      </h3>
                      <p className="text-xs text-zinc-500">
                        Assign a standard package, create a custom negotiated package, or update billing terms
                      </p>
                    </div>
                    <StatusIndicator
                      status={selectedCompany.subscriptionStatus}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-medium text-zinc-700 mb-1">
                        Assigned Package / Plan
                      </label>
                      <select
                        value={selectedCompany.planId}
                        onChange={(e) =>
                          updateCompanyPlan(
                            selectedCompany.id,
                            e.target.value,
                            true
                          )
                        }
                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg bg-white text-zinc-900 font-medium"
                      >
                        {subscriptionPlans.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({formatINR(p.monthlyPrice)}/mo)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-medium text-zinc-700 mb-1">
                        Subscription Lifecycle Status
                      </label>
                      <select
                        value={selectedCompany.subscriptionStatus}
                        onChange={(e) =>
                          updateCompanyDetails(selectedCompany.id, {
                            subscriptionStatus: e.target
                              .value as SubscriptionStatus,
                            status:
                              e.target.value === 'Suspended'
                                ? 'Suspended'
                                : e.target.value === 'Pending Activation'
                                ? 'Pending'
                                : 'Active',
                          })
                        }
                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg bg-white text-zinc-900 font-medium"
                      >
                        <option value="Draft">Draft</option>
                        <option value="Pending Activation">
                          Pending Activation
                        </option>
                        <option value="Active">Active</option>
                        <option value="Past Due">Past Due</option>
                        <option value="Expired">Expired</option>
                        <option value="Suspended">Suspended</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-medium text-zinc-700 mb-1">
                        Billing Cycle
                      </label>
                      <select
                        value={selectedCompany.billingCycle}
                        onChange={(e) =>
                          updateCompanyDetails(selectedCompany.id, {
                            billingCycle: e.target.value as BillingCycle,
                          })
                        }
                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg bg-white text-zinc-900"
                      >
                        <option value="Monthly">Monthly Subscription</option>
                        <option value="Annual">
                          Annual Subscription (12 Months)
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-medium text-zinc-700 mb-1">
                        Payment Terms
                      </label>
                      <select
                        value={selectedCompany.paymentTerms}
                        onChange={(e) =>
                          updateCompanyDetails(selectedCompany.id, {
                            paymentTerms: e.target.value as PaymentTerms,
                          })
                        }
                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg bg-white text-zinc-900"
                      >
                        <option value="Due on Receipt">Due on Receipt</option>
                        <option value="Net 7">Net 7 Days</option>
                        <option value="Net 15">Net 15 Days</option>
                        <option value="Net 30">Net 30 Days</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-medium text-zinc-700 mb-1">
                        Negotiated Cycle Discount (INR ₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={selectedCompany.discountAmount}
                        onChange={(e) =>
                          updateCompanyDetails(selectedCompany.id, {
                            discountAmount: Number(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-zinc-700 mb-1">
                        Tax Configuration (GST %)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={28}
                        value={selectedCompany.taxRatePercent}
                        onChange={(e) =>
                          updateCompanyDetails(selectedCompany.id, {
                            taxRatePercent: Number(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg font-mono"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Sparkles className="w-3.5 h-3.5 text-teal-700" />}
                      onClick={() =>
                        openNewCustomPackageBuilder(selectedCompany.id)
                      }
                    >
                      Create Custom Package for {selectedCompany.name.split('—')[0].trim()}
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        updateCompanyDetails(selectedCompany.id, {
                          renewalDate: 'Dec 1, 2026',
                          subscriptionStatus: 'Active',
                          status: 'Active',
                        })
                      }
                    >
                      Renew Subscription Cycle
                    </Button>
                  </div>
                </div>

                {/* Live Subscription Pricing & Quotas Card */}
                <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-lg p-5 space-y-4 text-xs">
                  <h3 className="text-base font-semibold text-zinc-900 border-b border-zinc-100 pb-3">
                    Subscription Summary & Quotas
                  </h3>
                  <div className="space-y-2 font-mono">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Start Date:</span>
                      <span className="text-zinc-900">
                        {selectedCompany.subscriptionStartDate}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Renewal Date:</span>
                      <span className="text-zinc-900">
                        {selectedCompany.renewalDate}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Entitled Subtotal:</span>
                      <span className="text-zinc-900">
                        {formatINR(selectedCompanyBilling.subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Discount:</span>
                      <span className="text-emerald-700">
                        -{formatINR(selectedCompanyBilling.discount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">
                        GST ({selectedCompanyBilling.taxRatePercent}%):
                      </span>
                      <span className="text-zinc-900">
                        {formatINR(selectedCompanyBilling.taxAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-zinc-200 text-sm font-bold">
                      <span className="text-zinc-900">Net Cycle Total:</span>
                      <span className="text-teal-700">
                        {formatINR(selectedCompanyBilling.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* -----------------------------------------------------------
              COMPANY TAB 4: BILLING & INVOICES FOR THIS COMPANY (Sections 11 & 13)
             ----------------------------------------------------------- */}
          {companyDetailTab === 'billing' && (
            <div className="space-y-6">
              <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3">
                  <div>
                    <h3 className="text-base font-semibold text-zinc-900">
                      Invoices for {selectedCompany.name}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Generated directly from {selectedCompany.name}’s enabled services, discount, and GST rules
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        generateCompanyInvoice(selectedCompany.id, {
                          status: 'Draft',
                        })
                      }
                    >
                      + Generate Draft Invoice
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        generateCompanyInvoice(selectedCompany.id, {
                          status: 'Issued',
                        })
                      }
                    >
                      + Issue Finalized Invoice
                    </Button>
                  </div>
                </div>

                <div className="divide-y divide-zinc-200/70">
                  {companyInvoices
                    .filter((i) => i.companyId === selectedCompany.id)
                    .map((inv) => (
                      <div
                        key={inv.id}
                        className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono font-semibold text-sm text-zinc-900">
                              {inv.invoiceNumber}
                            </span>
                            <StatusIndicator status={inv.status} />
                            <span className="text-zinc-500">
                              Period: {inv.billingPeriod}
                            </span>
                          </div>
                          <div className="text-zinc-500 font-mono">
                            Subtotal: {formatINR(inv.subtotal)} · Discount:{' '}
                            {formatINR(inv.discount)} · GST:{' '}
                            {formatINR(inv.taxAmount)} ·{' '}
                            <strong className="text-zinc-900">
                              Total: {formatINR(inv.total)}
                            </strong>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right font-mono">
                            <div className="text-emerald-700">
                              Paid: {formatINR(inv.amountPaid)}
                            </div>
                            <div className="font-semibold text-zinc-900">
                              Balance: {formatINR(inv.balanceDue)}
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedInvoice(inv)}
                          >
                            Inspect
                          </Button>
                          {inv.status === 'Draft' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() =>
                                updateInvoiceStatus(inv.id, 'Issued')
                              }
                            >
                              Finalize
                            </Button>
                          )}
                          {inv.balanceDue > 0 && inv.status !== 'Void' && (
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => openPaymentModal(inv)}
                            >
                              Record Payment
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* -----------------------------------------------------------
              COMPANY TAB 5: USERS & ACCESS (Sections 7 & 14)
             ----------------------------------------------------------- */}
          {companyDetailTab === 'users' && (
            <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-4">
              <div className="border-b border-zinc-100 pb-3">
                <h3 className="text-base font-semibold text-zinc-900">
                  5-Layer Entitlement & Role Matrix — {selectedCompany.name}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Distinguishes: (1) Platform Availability → (2) Company Subscription → (3) Feature Entitlement → (4) Role Permission → (5) Operational Availability.
                </p>
              </div>

              <div className="border border-zinc-200 rounded-lg overflow-hidden">
                <div className="grid grid-cols-12 bg-zinc-50 border-b border-zinc-200 px-4 py-2.5 text-xs font-semibold text-zinc-600">
                  <div className="col-span-4">Service Module</div>
                  <div className="col-span-2">Company Entitlement</div>
                  {ROLES_LIST.map((r) => (
                    <div key={r.id} className="col-span-1 text-center">
                      {r.label}
                    </div>
                  ))}
                  <div className="col-span-1 text-right">Operational</div>
                </div>

                <div className="divide-y divide-zinc-200/70 max-h-[420px] overflow-y-auto">
                  {v1Services.map((svc) => {
                    const companyEnabled = hasService(
                      svc.id,
                      selectedCompany.id
                    );
                    return (
                      <div
                        key={svc.id}
                        className={cn(
                          'grid grid-cols-12 items-center px-4 py-2.5 text-xs',
                          !companyEnabled && 'bg-zinc-50/70 opacity-65'
                        )}
                      >
                        <div className="col-span-4 font-medium text-zinc-900 truncate pr-2">
                          {svc.name}
                        </div>
                        <div className="col-span-2">
                          <StatusIndicator
                            status={companyEnabled ? 'Enabled' : 'Disabled'}
                          />
                        </div>
                        {ROLES_LIST.map((r) => {
                          const allowed = hasPermission(
                            svc.id,
                            r.id,
                            selectedCompany.id
                          );
                          return (
                            <div
                              key={r.id}
                              className="col-span-1 flex justify-center"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  toggleCompanyRolePermission(
                                    selectedCompany.id,
                                    r.id,
                                    svc.id
                                  )
                                }
                                className={cn(
                                  'w-7 h-6 rounded text-xs font-mono font-semibold border transition-colors cursor-pointer flex items-center justify-center',
                                  allowed
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                    : 'bg-zinc-100 border-zinc-200 text-zinc-400'
                                )}
                              >
                                {allowed ? '✓' : '—'}
                              </button>
                            </div>
                          );
                        })}
                        <div className="col-span-1 text-right font-mono text-[11px]">
                          {companyEnabled &&
                          selectedCompany.status === 'Active' ? (
                            <span className="text-emerald-700">Live</span>
                          ) : (
                            <span className="text-zinc-400">Blocked</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* -----------------------------------------------------------
              COMPANY TAB 6: ACTIVITY & AUDIT FOR THIS COMPANY (Section 19)
             ----------------------------------------------------------- */}
          {companyDetailTab === 'audit' && (
            <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-4">
              <h3 className="text-base font-semibold text-zinc-900 border-b border-zinc-100 pb-3">
                Audit History for {selectedCompany.name} ({selectedCompany.companyCode})
              </h3>
              <div className="divide-y divide-zinc-100">
                {serviceAuditLogs
                  .filter((l) => l.companyId === selectedCompany.id)
                  .map((log) => (
                    <div
                      key={log.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200">
                            {log.action}
                          </span>
                          <span className="font-semibold text-zinc-900">
                            {log.serviceName}
                          </span>
                        </div>
                        {(log.previousValue || log.newValue) && (
                          <div className="font-mono text-[11px] text-zinc-600">
                            Previous: {log.previousValue} → New:{' '}
                            <strong className="text-zinc-900">
                              {log.newValue}
                            </strong>
                          </div>
                        )}
                        <div className="text-zinc-500">{log.reason}</div>
                      </div>
                      <div className="font-mono text-[11px] text-zinc-400 text-right shrink-0">
                        <div>{log.changedBy}</div>
                        <div>
                          {log.dateLabel} · {log.timestamp}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =======================================================================
          WORKSPACE 4: SERVICE CATALOG & FEATURE CATALOG (Sections 6 & 7)
         ======================================================================= */}
      {workspace === 'services' && (
        <div className="space-y-6">
          <PageHeader
            title="Service & Feature Catalog"
            meta={`${v1Services.length} V1 Implemented · 10 Future V2 Planned`}
            subtitle="Central catalog of all KnockOUT services, base pricing models, feature definitions, and cross-company entitlements."
            secondaryActions={
              <div className="flex items-center gap-1 bg-zinc-200/70 p-1 rounded-lg">
                {[
                  { id: 'catalog', label: 'Service Catalog' },
                  { id: 'features', label: `Feature Catalog (${featureCatalog.length})` },
                  { id: 'entitlements', label: 'Cross-Company Matrix' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() =>
                      setServicesSubView(
                        tab.id as 'catalog' | 'features' | 'entitlements'
                      )
                    }
                    className={cn(
                      'px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer',
                      servicesSubView === tab.id
                        ? 'bg-white text-zinc-900 shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-900'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            }
          />

          {servicesSubView === 'catalog' && (
            <div className="space-y-4">
              <div className="bg-white border border-zinc-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-wrap flex-1">
                  <div className="relative min-w-[240px] flex-1 max-w-sm">
                    <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      placeholder="Search service name, ID, or description..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-zinc-300 rounded-lg"
                    />
                  </div>
                  <select
                    value={catalogGroupFilter}
                    onChange={(e) => setCatalogGroupFilter(e.target.value)}
                    aria-label="Filter by Service Group"
                    className="px-2.5 py-1.5 text-xs border border-zinc-300 rounded-lg bg-white text-zinc-800"
                  >
                    <option value="All">All Service Groups (5)</option>
                    {SERVICE_GROUPS_ORDER.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {serviceCatalog
                  .filter((s) => {
                    const grp = getServiceGroupForCatalogItem(s);
                    if (
                      catalogGroupFilter !== 'All' &&
                      grp !== catalogGroupFilter
                    )
                      return false;
                    if (
                      catalogSearch.trim() &&
                      !s.name
                        .toLowerCase()
                        .includes(catalogSearch.toLowerCase()) &&
                      !s.id.toLowerCase().includes(catalogSearch.toLowerCase())
                    )
                      return false;
                    return true;
                  })
                  .map((svc) => {
                    const grp = getServiceGroupForCatalogItem(svc);
                    const isPlannedV2 = svc.platformStatus === 'COMING SOON';
                    const basePrice = getBasePriceForService(svc.id);
                    const features = featureCatalog.filter(
                      (f) => f.serviceId === svc.id
                    );

                    return (
                      <div
                        key={svc.id}
                        className={cn(
                          'bg-white border rounded-lg p-5 flex flex-col justify-between gap-4',
                          isPlannedV2
                            ? 'border-zinc-200/70 bg-zinc-50/60'
                            : 'border-zinc-200/90'
                        )}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                                {grp} · {svc.id}
                              </span>
                              <h3 className="text-sm font-semibold text-zinc-900 mt-0.5">
                                {svc.name}
                              </h3>
                            </div>
                            <StatusIndicator
                              status={isPlannedV2 ? 'Planned V2' : 'Available'}
                            />
                          </div>

                          <p className="text-xs text-zinc-600">
                            {svc.description}
                          </p>

                          <div className="pt-2 border-t border-zinc-100 space-y-1 text-[11px] font-mono text-zinc-500">
                            <div className="flex justify-between">
                              <span>Base Price:</span>
                              <span className="font-semibold text-zinc-900">
                                {isPlannedV2
                                  ? 'Not Sellable (V2)'
                                  : basePrice === 0
                                  ? 'Core Included'
                                  : `${formatINR(basePrice)}/mo · Monthly Fixed`}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Available Features:</span>
                              <span className="text-zinc-800">
                                {features.length} defined
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Dependencies:</span>
                              <span className="text-zinc-800">
                                {svc.dependencies.length === 0
                                  ? 'None'
                                  : svc.dependencies.join(', ')}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                          <span className="text-xs font-mono text-zinc-500">
                            {isPlannedV2
                              ? 'Future V2 Roadmap'
                              : `${
                                  companies.filter((c) =>
                                    hasService(svc.id, c.id)
                                  ).length
                                }/${companies.length} demo companies`}
                          </span>
                          {!isPlannedV2 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openFeatureConfigDrawer(svc)}
                            >
                              Inspect Features
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {servicesSubView === 'features' && (
            <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
              <div className="px-5 py-3.5 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between text-xs font-semibold text-zinc-600">
                <span>
                  Feature-Level Entitlement Catalog ({featureCatalog.length} Granular Features)
                </span>
                <span>
                  Target Company: {selectedCompany.name} ({selectedCompany.companyCode})
                </span>
              </div>
              <div className="divide-y divide-zinc-200/70">
                {featureCatalog.map((feat) => {
                  const parentSvc = getServiceById(feat.serviceId);
                  const activeForSelected = hasFeature(
                    feat.id,
                    selectedCompany.id
                  );
                  return (
                    <div
                      key={feat.id}
                      className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-900">
                            {feat.name}
                          </span>
                          <span className="font-mono text-[11px] text-zinc-400">
                            ({feat.id})
                          </span>
                          <span className="text-[11px] bg-zinc-100 px-2 py-0.5 rounded text-zinc-700">
                            Parent: {parentSvc?.name}
                          </span>
                        </div>
                        <p className="text-zinc-500 mt-0.5">
                          {feat.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <StatusIndicator
                          status={activeForSelected ? 'Enabled' : 'Disabled'}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            toggleCompanyFeature(selectedCompany.id, feat.id)
                          }
                        >
                          {activeForSelected
                            ? 'Disable Feature'
                            : 'Enable Feature'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {servicesSubView === 'entitlements' && (
            <div className="bg-white border border-zinc-200 rounded-lg overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold">
                    <th className="p-3.5">Service Module</th>
                    {companies.map((c) => (
                      <th key={c.id} className="p-3.5 text-center">
                        <div>{c.name.split('—')[0].trim()}</div>
                        <div className="font-mono text-[10px] text-zinc-400">
                          {c.companyCode}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/70">
                  {v1Services.map((svc) => (
                    <tr key={svc.id} className="hover:bg-zinc-50">
                      <td className="p-3 font-medium text-zinc-900">
                        {svc.name}{' '}
                        <span className="text-zinc-400 font-normal">
                          ({svc.category})
                        </span>
                      </td>
                      {companies.map((c) => {
                        const enabled = hasService(svc.id, c.id);
                        return (
                          <td key={c.id} className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => initiateServiceToggle(c.id, svc.id)}
                              className={cn(
                                'px-2 py-1 rounded font-mono text-[11px] font-semibold border cursor-pointer',
                                enabled
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : 'bg-zinc-100 text-zinc-400 border-zinc-200'
                              )}
                            >
                              {enabled ? '✓ ON' : 'OFF'}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =======================================================================
          WORKSPACE 5: SERVICE PACKAGES & CUSTOM PLANS (Section 9)
         ======================================================================= */}
      {workspace === 'packages' && (
        <div className="space-y-6">
          <PageHeader
            title="Service Packages & Custom Plans"
            meta={`${subscriptionPlans.length} Active & Custom Packages`}
            subtitle="Configure standard packages (Starter, Growth, Professional, Enterprise) or build company-specific Custom Negotiated Packages."
            primaryAction={
              <Button
                variant="primary"
                size="md"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => openNewCustomPackageBuilder()}
              >
                Create Custom Package
              </Button>
            }
          />

          <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-600 flex items-center justify-between">
            <span>
              <strong className="text-zinc-900">
                Package Mutation Policy (Section 9):
              </strong>{' '}
              Editing a reusable package applies to new subscriptions by default unless you explicitly enable migration for existing subscribed companies in the package editor.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {subscriptionPlans.map((pkg) => {
              const assignedClients = companies.filter(
                (c) => c.planId === pkg.id
              );
              return (
                <div
                  key={pkg.id}
                  className={cn(
                    'bg-white border rounded-xl p-5 flex flex-col justify-between gap-4',
                    pkg.isCustomPackage
                      ? 'border-teal-600/80 ring-1 ring-teal-600/20'
                      : 'border-zinc-200/90'
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase tracking-wider text-teal-700 font-semibold">
                        {pkg.isCustomPackage
                          ? 'CUSTOM NEGOTIATED PACKAGE'
                          : pkg.displayBadge}
                      </span>
                      <StatusIndicator status={pkg.status} />
                    </div>

                    <div className="flex items-baseline justify-between">
                      <h3 className="text-lg font-semibold text-zinc-900">
                        {pkg.name}
                      </h3>
                      <div className="text-xl font-bold font-mono text-zinc-900 tabular-nums">
                        {formatINR(pkg.monthlyPrice)}
                        <span className="text-xs font-normal text-zinc-500">
                          /mo
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-500">{pkg.description}</p>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="p-2 bg-zinc-50 border border-zinc-200 rounded">
                        <span className="text-[10px] text-zinc-400 block">
                          STAFF / USERS
                        </span>
                        <span>
                          {pkg.limits.maxStaff} Staff · {pkg.limits.maxUsers}{' '}
                          Users
                        </span>
                      </div>
                      <div className="p-2 bg-zinc-50 border border-zinc-200 rounded">
                        <span className="text-[10px] text-zinc-400 block">
                          TABLES / CYCLE
                        </span>
                        <span>
                          {pkg.limits.maxTables} Tables ·{' '}
                          {pkg.billingCycle || 'Monthly'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-zinc-900 mb-1.5">
                        Included Services ({pkg.includedServices.length})
                      </div>
                      <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                        {pkg.includedServices.map((sId) => (
                          <span
                            key={sId}
                            className="text-[10px] bg-zinc-100 text-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200"
                          >
                            {getServiceById(sId)?.name || sId}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-100 space-y-2">
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>Subscribed Companies:</span>
                      <span className="font-mono font-semibold text-zinc-900">
                        {assignedClients.length > 0
                          ? assignedClients
                              .map((c) => c.name.split('—')[0].trim())
                              .join(', ')
                          : 'None'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setIsCreatingNewPackage(false);
                          setMigrateExistingOnSave(false);
                          setEditingPackage({ ...pkg });
                        }}
                      >
                        Edit Package
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Copy className="w-3.5 h-3.5" />}
                        onClick={() =>
                          createSubscriptionPackage({
                            ...pkg,
                            id: `${pkg.id}-copy-${Date.now().toString().slice(-3)}`,
                            name: `${pkg.name} (Copy)`,
                            isCustomPackage: true,
                          })
                        }
                      >
                        Duplicate
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => archiveSubscriptionPlan(pkg.id)}
                      >
                        {pkg.status === 'Active' ? 'Archive' : 'Restore'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =======================================================================
          WORKSPACE 6: SUBSCRIPTIONS LIFECYCLE (Section 10)
         ======================================================================= */}
      {workspace === 'subscriptions' && (
        <div className="space-y-6">
          <PageHeader
            title="Subscription Management"
            meta={`${companies.length} Tenant Subscriptions`}
            subtitle="Monitor subscription statuses (Draft, Pending Activation, Active, Past Due, Expired, Suspended, Cancelled), renewal dates, and payment terms."
            secondaryActions={
              <div className="flex items-center gap-1 bg-zinc-200/70 p-1 rounded-lg">
                {[
                  'All',
                  'Active',
                  'Pending Activation',
                  'Suspended',
                ].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setSubscriptionFilterStatus(st)}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer',
                      subscriptionFilterStatus === st
                        ? 'bg-white text-zinc-900 shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-900'
                    )}
                  >
                    {st}
                  </button>
                ))}
              </div>
            }
          />

          <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 bg-zinc-50 border-b border-zinc-200 text-xs font-medium text-zinc-500">
              <div className="col-span-3">Company</div>
              <div className="col-span-2">Plan & Cycle</div>
              <div className="col-span-2">Start → Renewal</div>
              <div className="col-span-2">Calculated Net Total</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            <div className="divide-y divide-zinc-200/70">
              {companies
                .filter(
                  (c) =>
                    subscriptionFilterStatus === 'All' ||
                    c.subscriptionStatus === subscriptionFilterStatus
                )
                .map((comp) => {
                  const bill = calculateCompanyBillingBreakdown(
                    comp,
                    hasService
                  );
                  return (
                    <div
                      key={comp.id}
                      className="px-5 py-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-xs"
                    >
                      <div className="md:col-span-3">
                        <div className="font-semibold text-sm text-zinc-900">
                          {comp.name}
                        </div>
                        <div className="font-mono text-zinc-500">
                          {comp.companyCode} · {comp.paymentTerms}
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <div className="font-semibold text-zinc-900">
                          {comp.plan}
                        </div>
                        <div className="text-zinc-500">{comp.billingCycle}</div>
                      </div>
                      <div className="md:col-span-2 font-mono text-zinc-600">
                        <div>Start: {comp.subscriptionStartDate}</div>
                        <div>Renews: {comp.renewalDate}</div>
                      </div>
                      <div className="md:col-span-2 font-mono">
                        <div className="font-semibold text-zinc-900">
                          {formatINR(bill.total)} /{' '}
                          {comp.billingCycle === 'Annual' ? 'yr' : 'mo'}
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          Subtotal {formatINR(bill.subtotal)} − Disc{' '}
                          {formatINR(bill.discount)}
                        </div>
                      </div>
                      <div className="md:col-span-1">
                        <StatusIndicator status={comp.subscriptionStatus} />
                      </div>
                      <div className="md:col-span-2 flex items-center justify-end gap-1.5 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            openCompanyWorkspace(comp.id, 'subscription')
                          }
                        >
                          Manage Terms
                        </Button>
                        {comp.status === 'Pending' && (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => openOnboardingWizard(comp)}
                          >
                            Activate
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          WORKSPACE 7: BILLING ENGINE, INVOICES, PAYMENTS & CREDITS (Sections 11, 12, 13)
         ======================================================================= */}
      {workspace === 'billing' && (
        <div className="space-y-6">
          <PageHeader
            title="Billing Engine, Invoices & Payment Reconciliation"
            meta={`${companyInvoices.length} Invoices · ${formatINR(totalOutstandingINR)} Outstanding`}
            subtitle="Generate accurate company-specific invoices from enabled services, record manual or provider-verified payments, and manage credits."
            secondaryActions={
              <div className="flex items-center gap-1 bg-zinc-200/70 p-1 rounded-lg overflow-x-auto">
                {[
                  { id: 'invoices', label: `Invoices (${companyInvoices.length})` },
                  { id: 'payments', label: `Payments (${companyPayments.length})` },
                  { id: 'balances', label: 'Outstanding Balances' },
                  { id: 'credits', label: `Credits (${creditAdjustments.length})` },
                  { id: 'pricing', label: 'Pricing Rules' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() =>
                      setBillingSubView(
                        tab.id as
                          | 'invoices'
                          | 'payments'
                          | 'balances'
                          | 'credits'
                          | 'pricing'
                      )
                    }
                    className={cn(
                      'px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer whitespace-nowrap',
                      billingSubView === tab.id
                        ? 'bg-white text-zinc-900 shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-900'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            }
            primaryAction={
              <Button
                variant="primary"
                size="md"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => {
                  const inv = generateCompanyInvoice(selectedCompany.id, {
                    status: 'Draft',
                  });
                  if (inv) setSelectedInvoice(inv);
                }}
              >
                Generate Draft Invoice ({selectedCompany.name.split('—')[0].trim()})
              </Button>
            }
          />

          {/* SUB-VIEW 1: INVOICES */}
          {billingSubView === 'invoices' && (
            <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
              <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 bg-zinc-50 border-b border-zinc-200 text-xs font-medium text-zinc-500">
                <div className="col-span-2">Invoice # & Period</div>
                <div className="col-span-3">Company</div>
                <div className="col-span-2">Subtotal / Discount / GST</div>
                <div className="col-span-2">Total / Paid / Balance</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              <div className="divide-y divide-zinc-200/70">
                {companyInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="px-5 py-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-xs hover:bg-zinc-50/70"
                  >
                    <div className="md:col-span-2">
                      <button
                        type="button"
                        onClick={() => setSelectedInvoice(inv)}
                        className="font-mono font-semibold text-sm text-zinc-900 hover:text-teal-700 cursor-pointer"
                      >
                        {inv.invoiceNumber}
                      </button>
                      <div className="text-zinc-500">{inv.billingPeriod}</div>
                      <div className="text-[11px] font-mono text-zinc-400">
                        Due: {inv.dueDate}
                      </div>
                    </div>

                    <div className="md:col-span-3">
                      <div className="font-semibold text-zinc-900">
                        {inv.companyName}
                      </div>
                      <div className="font-mono text-[11px] text-zinc-500">
                        {inv.companyCode} · {inv.lineItems.length} service items
                      </div>
                    </div>

                    <div className="md:col-span-2 font-mono text-[11px] text-zinc-600">
                      <div>Sub: {formatINR(inv.subtotal)}</div>
                      <div>
                        Disc: -{formatINR(inv.discount)} · GST:{' '}
                        {formatINR(inv.taxAmount)}
                      </div>
                    </div>

                    <div className="md:col-span-2 font-mono tabular-nums">
                      <div className="font-bold text-zinc-900">
                        Total: {formatINR(inv.total)}
                      </div>
                      <div className="text-[11px] text-emerald-700">
                        Paid: {formatINR(inv.amountPaid)} · Bal:{' '}
                        <strong
                          className={
                            inv.balanceDue > 0
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          }
                        >
                          {formatINR(inv.balanceDue)}
                        </strong>
                      </div>
                    </div>

                    <div className="md:col-span-1">
                      <StatusIndicator status={inv.status} />
                    </div>

                    <div className="md:col-span-2 flex items-center justify-end gap-1.5 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedInvoice(inv)}
                      >
                        View Bill
                      </Button>
                      {inv.status === 'Draft' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => updateInvoiceStatus(inv.id, 'Issued')}
                        >
                          Finalize
                        </Button>
                      )}
                      {inv.balanceDue > 0 && inv.status !== 'Void' && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => openPaymentModal(inv)}
                        >
                          Record Payment
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUB-VIEW 2: PAYMENTS TRACKING (Section 13) */}
          {billingSubView === 'payments' && (
            <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
              <div className="px-5 py-3.5 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-800">
                  Payment Ledger (Distinguishes Manual Admin Entry vs Verified Payment Provider)
                </span>
                <span className="font-mono text-zinc-500">
                  Mock Prototype Records
                </span>
              </div>

              <div className="divide-y divide-zinc-200/70">
                {companyPayments.map((pay) => (
                  <div
                    key={pay.id}
                    className="px-5 py-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-xs"
                  >
                    <div className="md:col-span-2 font-mono">
                      <div className="font-semibold text-zinc-900">
                        {pay.invoiceNumber}
                      </div>
                      <div className="text-zinc-500">{pay.paymentDate}</div>
                    </div>
                    <div className="md:col-span-3">
                      <div className="font-semibold text-zinc-900">
                        {pay.companyName}
                      </div>
                      <div className="font-mono text-[11px] text-zinc-500">
                        Ref: {pay.transactionReference}
                      </div>
                    </div>
                    <div className="md:col-span-2 font-mono">
                      <div>Method: {pay.paymentMethod}</div>
                      <div className="text-[11px] text-teal-700">
                        {pay.verificationSource}
                      </div>
                    </div>
                    <div className="md:col-span-3 font-mono tabular-nums">
                      <div>
                        Invoice: {formatINR(pay.invoiceAmount)} ·{' '}
                        <strong className="text-emerald-700">
                          Paid: {formatINR(pay.amountPaid)}
                        </strong>
                      </div>
                      <div className="text-zinc-500">
                        Remaining Balance: {formatINR(pay.balanceAfter)}
                      </div>
                    </div>
                    <div className="md:col-span-2 flex justify-end">
                      <StatusIndicator status={pay.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUB-VIEW 3: OUTSTANDING BALANCES */}
          {billingSubView === 'balances' && (
            <div className="bg-white border border-zinc-200 rounded-lg divide-y divide-zinc-200/70">
              {companies.map((c) => (
                <div
                  key={c.id}
                  className="px-5 py-4 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-sm text-zinc-900">
                      {c.name} ({c.companyCode})
                    </div>
                    <div className="text-zinc-500">
                      Plan: {c.plan} · Terms: {c.paymentTerms}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={cn(
                        'font-mono text-sm font-bold tabular-nums',
                        c.outstandingAmount > 0
                          ? 'text-amber-700'
                          : 'text-emerald-700'
                      )}
                    >
                      {formatINR(c.outstandingAmount)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openCompanyWorkspace(c.id, 'billing')}
                    >
                      Open Ledger
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SUB-VIEW 4: CREDITS & ADJUSTMENTS */}
          {billingSubView === 'credits' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => setCreditModalOpen(true)}
                >
                  Issue Credit / Billing Adjustment
                </Button>
              </div>
              <div className="bg-white border border-zinc-200 rounded-lg divide-y divide-zinc-200/70">
                {creditAdjustments.map((cred) => (
                  <div
                    key={cred.id}
                    className="px-5 py-4 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-zinc-900">
                        {cred.companyName} — {cred.type}
                      </div>
                      <div className="text-zinc-500">{cred.reason}</div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="font-bold text-emerald-700">
                        {formatINR(cred.amount)}
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {cred.createdAt} · {cred.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUB-VIEW 5: MODULAR SERVICE PRICING RULES */}
          {billingSubView === 'pricing' && (
            <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-4">
              <div className="border-b border-zinc-100 pb-3">
                <h3 className="text-base font-semibold text-zinc-900">
                  Authoritative Modular Service Pricing Rules (Mock INR)
                </h3>
                <p className="text-xs text-zinc-500">
                  Defines how company invoices are calculated from enabled service groups without double-charging included features.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.values(MODULAR_SERVICE_PRICING).map((grp) => (
                  <div
                    key={grp.groupKey}
                    className="p-4 border border-zinc-200 rounded-lg flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-sm text-zinc-900">
                        {grp.label}
                      </div>
                      <p className="text-zinc-500 mt-1">{grp.description}</p>
                      <div className="text-[11px] font-mono text-zinc-400 mt-2">
                        Covers: {grp.triggerServiceIds.join(', ')}
                      </div>
                    </div>
                    <div className="font-mono font-bold text-sm text-teal-700 shrink-0">
                      {formatINR(grp.monthlyPrice)}/mo
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =======================================================================
          WORKSPACE 8: PLATFORM ADMINISTRATION & AUDIT LOGS (Section 19)
         ======================================================================= */}
      {workspace === 'admin' && (
        <div className="space-y-6">
          <PageHeader
            title="Platform Administration & Audit Logs"
            meta={`${serviceAuditLogs.length} Recorded Audit Events`}
            subtitle="Immutable audit trail recording Actor, Company, Action, Timestamp, Previous Value, and New Value."
            secondaryActions={
              <div className="flex items-center gap-1 bg-zinc-200/70 p-1 rounded-lg">
                {[
                  { id: 'audit', label: 'Audit Logs' },
                  { id: 'permissions', label: 'Role Matrix' },
                  { id: 'admins', label: 'Admin Users' },
                  { id: 'settings', label: 'Platform Settings' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() =>
                      setAdminSubView(
                        t.id as 'audit' | 'permissions' | 'admins' | 'settings'
                      )
                    }
                    className={cn(
                      'px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer',
                      adminSubView === t.id
                        ? 'bg-white text-zinc-900 shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-900'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            }
          />

          {adminSubView === 'audit' && (
            <div className="space-y-4">
              <div className="bg-white border border-zinc-200 rounded-lg p-4 flex items-center gap-3 flex-wrap">
                <select
                  value={auditCompanyFilter}
                  onChange={(e) => setAuditCompanyFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-zinc-300 rounded-lg bg-white"
                >
                  <option value="All">All Companies</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <select
                  value={auditActionFilter}
                  onChange={(e) => setAuditActionFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-zinc-300 rounded-lg bg-white"
                >
                  <option value="All">All Audit Actions</option>
                  <option value="SERVICE ACTIVATED">SERVICE ACTIVATED</option>
                  <option value="SERVICE DEACTIVATED">SERVICE DEACTIVATED</option>
                  <option value="FEATURE ENTITLEMENT CHANGED">
                    FEATURE ENTITLEMENT CHANGED
                  </option>
                  <option value="PLAN UPDATED">PLAN UPDATED</option>
                  <option value="CUSTOM PACKAGE CREATED">
                    CUSTOM PACKAGE CREATED
                  </option>
                  <option value="INVOICE GENERATED">INVOICE GENERATED</option>
                  <option value="PAYMENT RECORDED">PAYMENT RECORDED</option>
                  <option value="COMPANY SUSPENDED">COMPANY SUSPENDED</option>
                  <option value="COMPANY REACTIVATED">COMPANY REACTIVATED</option>
                  <option value="COMPANY ONBOARDED">COMPANY ONBOARDED</option>
                </select>
              </div>

              <div className="bg-white border border-zinc-200 rounded-lg divide-y divide-zinc-200/70">
                {serviceAuditLogs
                  .filter((l) => {
                    if (
                      auditCompanyFilter !== 'All' &&
                      l.companyId !== auditCompanyFilter
                    )
                      return false;
                    if (
                      auditActionFilter !== 'All' &&
                      l.action !== auditActionFilter
                    )
                      return false;
                    return true;
                  })
                  .map((log) => (
                    <div
                      key={log.id}
                      className="px-5 py-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-xs"
                    >
                      <div className="md:col-span-2">
                        <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 inline-block">
                          {log.action}
                        </span>
                      </div>
                      <div className="md:col-span-3">
                        <div className="font-semibold text-zinc-900">
                          {log.companyName}
                        </div>
                        <div className="text-zinc-500">{log.serviceName}</div>
                      </div>
                      <div className="md:col-span-4 font-mono text-[11px]">
                        {log.previousValue || log.newValue ? (
                          <div className="bg-zinc-50 p-2 rounded border border-zinc-200/80">
                            <span className="text-zinc-500">
                              {log.previousValue || '—'}
                            </span>{' '}
                            →{' '}
                            <strong className="text-zinc-900">
                              {log.newValue || '—'}
                            </strong>
                          </div>
                        ) : (
                          <span className="text-zinc-500">{log.reason}</span>
                        )}
                      </div>
                      <div className="md:col-span-3 text-right font-mono text-[11px] text-zinc-500">
                        <div className="text-zinc-800">{log.changedBy}</div>
                        <div>
                          {log.dateLabel} · {log.timestamp}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {adminSubView !== 'audit' && (
            <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-3 text-xs">
              <h3 className="text-base font-semibold text-zinc-900">
                Platform Administration — {adminSubView.toUpperCase()}
              </h3>
              <p className="text-zinc-600">
                Platform-level Super Admin controls, default GST tax rules (18%), data retention policies (historical records preserved on service deactivation), and role templates are active.
              </p>
            </div>
          )}
        </div>
      )}

      {/* =======================================================================
          MODAL / DRAWER 1: SERVICE CHANGE BILLING IMPACT & PRORATION PREVIEW (Sections 8 & 12)
         ======================================================================= */}
      <ContextualDrawer
        open={Boolean(stagedServiceChange)}
        onClose={() => setStagedServiceChange(null)}
        title={
          stagedServiceChange
            ? stagedServiceChange.willEnable
              ? `Confirm Service Activation: ${
                  getServiceById(stagedServiceChange.serviceId)?.name
                }`
              : `Confirm Service Deactivation: ${
                  getServiceById(stagedServiceChange.serviceId)?.name
                }`
            : 'Service Change Preview'
        }
        subtitle="Review billing impact, effective date policy, dependency effects, and data retention rules before saving."
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setStagedServiceChange(null)}
            >
              Cancel
            </Button>
            <Button
              variant={stagedServiceChange?.willEnable ? 'success' : 'danger'}
              size="md"
              onClick={confirmStagedServiceChange}
            >
              {stagedServiceChange?.willEnable
                ? 'Confirm & Enable Service'
                : 'Confirm & Disable Service'}
            </Button>
          </div>
        }
      >
        {stagedServiceChange && stagedBillingPreview && (
          <div className="space-y-4 text-xs">
            {/* Billing Impact Preview Box (Sections 8 & 12) */}
            <div className="p-4 bg-zinc-900 text-white rounded-xl space-y-2.5 font-mono">
              <div className="text-[10px] uppercase tracking-wider text-teal-400">
                BILLING IMPACT PREVIEW (MOCK INR)
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">
                  Current monthly subscription:
                </span>
                <span>
                  {formatINR(stagedBillingPreview.currentMonthlySubtotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">
                  {stagedServiceChange.willEnable
                    ? 'Additional service impact:'
                    : 'Service removal credit/delta:'}
                </span>
                <span
                  className={
                    stagedBillingPreview.deltaMonthly >= 0
                      ? 'text-teal-300 font-semibold'
                      : 'text-amber-300 font-semibold'
                  }
                >
                  {stagedBillingPreview.deltaMonthly >= 0 ? '+' : ''}
                  {formatINR(stagedBillingPreview.deltaMonthly)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-zinc-700 text-sm font-bold">
                <span>New monthly total (before GST):</span>
                <span className="text-white">
                  {formatINR(stagedBillingPreview.newMonthlySubtotal)}
                </span>
              </div>
              <div className="text-[11px] text-zinc-400 pt-1">
                Prorated preview ({stagedBillingPreview.remainingDaysInCycle}/30 days remaining in Oct cycle):{' '}
                <strong className="text-zinc-200">
                  {formatINR(Math.abs(stagedBillingPreview.proratedPreviewAmount))}
                </strong>{' '}
                (Preview only — does not mutate already-issued invoices).
              </div>
            </div>

            {/* Effective Date Policy Selector (Section 12) */}
            <div className="space-y-2">
              <label className="block font-semibold text-zinc-900">
                Effective Date & Billing Policy
              </label>
              <label className="p-3 border border-zinc-200 rounded-lg flex items-start gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="effPolicy"
                  checked={
                    serviceChangeEffectivePolicy === 'immediate_preview'
                  }
                  onChange={() =>
                    setServiceChangeEffectivePolicy('immediate_preview')
                  }
                  className="mt-0.5"
                />
                <div>
                  <div className="font-semibold text-zinc-900">
                    Immediate Service Activation / Deactivation (Effective Oct 7, 2026)
                  </div>
                  <div className="text-zinc-500">
                    Updates client entitlements immediately. Existing issued invoices remain untouched.
                  </div>
                </div>
              </label>
              <label className="p-3 border border-zinc-200 rounded-lg flex items-start gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="effPolicy"
                  checked={serviceChangeEffectivePolicy === 'next_renewal'}
                  onChange={() =>
                    setServiceChangeEffectivePolicy('next_renewal')
                  }
                  className="mt-0.5"
                />
                <div>
                  <div className="font-semibold text-zinc-900">
                    Effective at Next Renewal Cycle ({selectedCompany.renewalDate})
                  </div>
                  <div className="text-zinc-500">
                    Schedules billing adjustment for the next renewal invoice.
                  </div>
                </div>
              </label>
            </div>

            {/* Dependency Warnings */}
            {!stagedServiceChange.willEnable &&
              stagedServiceChange.dependentIds.length > 0 && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                  <div className="font-semibold text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>
                      Dependent Services ({stagedServiceChange.dependentIds.length})
                    </span>
                  </div>
                  <p className="text-amber-800">
                    The following active services depend on this module:{' '}
                    {stagedServiceChange.dependentIds
                      .map((id) => getServiceById(id)?.name || id)
                      .join(', ')}
                  </p>
                  <label className="flex items-center gap-2 font-medium text-amber-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cascadeDependents}
                      onChange={(e) => setCascadeDependents(e.target.checked)}
                    />
                    <span>Also disable dependent services</span>
                  </label>
                </div>
              )}

            {/* Safe Data Retention Policy */}
            <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg space-y-1 text-zinc-600">
              <div className="font-semibold text-zinc-900">
                Data Safety & Access Policy:
              </div>
              <div>
                • Historical company data is never deleted when a service is disabled.
              </div>
              <div>
                • Unrelated enabled services remain 100% operational.
              </div>
            </div>

            <div>
              <label className="block font-medium text-zinc-700 mb-1">
                Audit Log Reason
              </label>
              <input
                type="text"
                value={serviceChangeReason}
                onChange={(e) => setServiceChangeReason(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
              />
            </div>
          </div>
        )}
      </ContextualDrawer>

      {/* =======================================================================
          MODAL / DRAWER 2: FEATURE CONFIGURATION & CUSTOM PRICE (Sections 7 & 8)
         ======================================================================= */}
      <ContextualDrawer
        open={Boolean(configuringServiceForFeatures)}
        onClose={() => setConfiguringServiceForFeatures(null)}
        title={
          configuringServiceForFeatures
            ? `${configuringServiceForFeatures.name} — Features & Pricing`
            : 'Configure Features'
        }
        subtitle={`Company: ${selectedCompany.name} (${selectedCompany.companyCode})`}
      >
        {configuringServiceForFeatures && (
          <div className="space-y-5 text-xs">
            {/* Custom Negotiated Service Price */}
            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg space-y-3">
              <div className="font-semibold text-zinc-900">
                Custom Negotiated Monthly Price Override (INR ₹)
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={customPriceDraft}
                  onChange={(e) => setCustomPriceDraft(e.target.value)}
                  className="flex-1 px-3 py-2 border border-zinc-300 rounded-lg font-mono"
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    setCompanyCustomServicePrice(
                      selectedCompany.id,
                      configuringServiceForFeatures.id,
                      Number(customPriceDraft)
                    )
                  }
                >
                  Apply Custom Price
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCompanyCustomServicePrice(
                      selectedCompany.id,
                      configuringServiceForFeatures.id,
                      undefined
                    )
                  }
                >
                  Reset
                </Button>
              </div>
            </div>

            {/* Granular Feature Toggles */}
            <div className="space-y-2.5">
              <div className="font-semibold text-zinc-900">
                Feature-Level Entitlements for {selectedCompany.name}
              </div>
              {featureCatalog
                .filter(
                  (f) => f.serviceId === configuringServiceForFeatures.id
                )
                .map((feat) => {
                  const enabled = hasFeature(feat.id, selectedCompany.id);
                  return (
                    <div
                      key={feat.id}
                      className="p-3 border border-zinc-200 rounded-lg flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-semibold text-zinc-900">
                          {feat.name}
                        </div>
                        <div className="text-zinc-500">{feat.description}</div>
                      </div>
                      <Button
                        variant={enabled ? 'outline' : 'primary'}
                        size="sm"
                        onClick={() =>
                          toggleCompanyFeature(selectedCompany.id, feat.id)
                        }
                      >
                        {enabled ? 'Enabled ✓' : 'Disabled'}
                      </Button>
                    </div>
                  );
                })}

              {/* If Resource Management umbrella is selected, also show all 9 RM sub-services */}
              {configuringServiceForFeatures.id === 'resource_management' && (
                <div className="pt-2 space-y-2">
                  <div className="font-semibold text-zinc-900">
                    Resource Management Module Features:
                  </div>
                  {RESOURCE_MANAGEMENT_SUB_SERVICES.map((subId) => {
                    const subItem = getServiceById(subId);
                    const subActive = hasService(subId, selectedCompany.id);
                    return (
                      <div
                        key={subId}
                        className="p-3 border border-zinc-200 rounded-lg flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="font-semibold text-zinc-900">
                            {subItem?.name}
                          </div>
                          <div className="text-[11px] text-zinc-500">
                            {subItem?.description}
                          </div>
                        </div>
                        <Button
                          variant={subActive ? 'outline' : 'primary'}
                          size="sm"
                          onClick={() =>
                            initiateServiceToggle(selectedCompany.id, subId)
                          }
                        >
                          {subActive ? 'Enabled ✓' : 'Disabled'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </ContextualDrawer>

      {/* =======================================================================
          MODAL / DRAWER 3: INVOICE DETAIL & LINE ITEMS (Section 11)
         ======================================================================= */}
      <ContextualDrawer
        open={Boolean(selectedInvoice)}
        onClose={() => setSelectedInvoice(null)}
        title={
          selectedInvoice
            ? `Invoice ${selectedInvoice.invoiceNumber}`
            : 'Invoice Detail'
        }
        subtitle={
          selectedInvoice
            ? `${selectedInvoice.companyName} (${selectedInvoice.companyCode}) · Period: ${selectedInvoice.billingPeriod}`
            : undefined
        }
        footer={
          selectedInvoice ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {selectedInvoice.status === 'Draft' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      updateInvoiceStatus(selectedInvoice.id, 'Issued');
                      setSelectedInvoice({
                        ...selectedInvoice,
                        status: 'Issued',
                      });
                    }}
                  >
                    Finalize & Issue Invoice
                  </Button>
                )}
                {selectedInvoice.status !== 'Void' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      updateInvoiceStatus(selectedInvoice.id, 'Void');
                      setSelectedInvoice({
                        ...selectedInvoice,
                        status: 'Void',
                      });
                    }}
                  >
                    Void Invoice
                  </Button>
                )}
              </div>
              {selectedInvoice.balanceDue > 0 &&
                selectedInvoice.status !== 'Void' && (
                  <Button
                    variant="success"
                    size="md"
                    onClick={() => openPaymentModal(selectedInvoice)}
                  >
                    Record Payment ({formatINR(selectedInvoice.balanceDue)})
                  </Button>
                )}
            </div>
          ) : undefined
        }
      >
        {selectedInvoice && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-amber-900 font-mono text-[11px]">
              MOCK PROTOTYPE INVOICE — Calculated from {selectedInvoice.companyName}’s configured services.
            </div>

            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div>
                <div className="font-semibold text-sm text-zinc-900">
                  {selectedInvoice.companyName}
                </div>
                <div className="text-zinc-500 font-mono">
                  Issue: {selectedInvoice.issueDate} · Due:{' '}
                  {selectedInvoice.dueDate}
                </div>
              </div>
              <StatusIndicator status={selectedInvoice.status} />
            </div>

            {/* Line Items Table */}
            <div className="border border-zinc-200 rounded-lg overflow-hidden">
              <div className="grid grid-cols-12 bg-zinc-50 px-3 py-2 border-b border-zinc-200 font-semibold text-zinc-600">
                <div className="col-span-7">Service Item</div>
                <div className="col-span-2 text-right">Rate</div>
                <div className="col-span-3 text-right">Amount</div>
              </div>
              <div className="divide-y divide-zinc-100">
                {selectedInvoice.lineItems.map((li) => (
                  <div
                    key={li.id}
                    className="grid grid-cols-12 px-3 py-2.5 items-center"
                  >
                    <div className="col-span-7">
                      <div className="font-semibold text-zinc-900">
                        {li.label}
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        {li.description}
                      </div>
                    </div>
                    <div className="col-span-2 text-right font-mono text-zinc-600">
                      {formatINR(li.unitPrice)}
                    </div>
                    <div className="col-span-3 text-right font-mono font-semibold text-zinc-900">
                      {formatINR(li.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals Breakdown */}
            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-zinc-500">Subtotal:</span>
                <span className="text-zinc-900">
                  {formatINR(selectedInvoice.subtotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Discount:</span>
                <span className="text-emerald-700">
                  -{formatINR(selectedInvoice.discount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">
                  Tax ({selectedInvoice.taxRatePercent}% GST):
                </span>
                <span className="text-zinc-900">
                  {formatINR(selectedInvoice.taxAmount)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-zinc-200 text-sm font-bold">
                <span>Total Due:</span>
                <span>{formatINR(selectedInvoice.total)}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Amount Paid:</span>
                <span>{formatINR(selectedInvoice.amountPaid)}</span>
              </div>
              <div className="flex justify-between font-bold text-amber-800">
                <span>Balance Due:</span>
                <span>{formatINR(selectedInvoice.balanceDue)}</span>
              </div>
            </div>
          </div>
        )}
      </ContextualDrawer>

      {/* =======================================================================
          MODAL / DRAWER 4: RECORD MOCK PAYMENT (Section 13)
         ======================================================================= */}
      <ContextualDrawer
        open={Boolean(paymentModalInvoice)}
        onClose={() => setPaymentModalInvoice(null)}
        title={
          paymentModalInvoice
            ? `Record Payment — ${paymentModalInvoice.invoiceNumber}`
            : 'Record Payment'
        }
        subtitle={
          paymentModalInvoice
            ? `${paymentModalInvoice.companyName} · Balance Due: ${formatINR(
                paymentModalInvoice.balanceDue
              )}`
            : undefined
        }
      >
        {paymentModalInvoice && (
          <form onSubmit={handleSubmitPayment} className="space-y-4 text-xs">
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-600">
              Distinguishes manual admin payment entry from verified payment-provider webhooks. Supports partial or full settlement.
            </div>

            <div>
              <label className="block font-medium text-zinc-700 mb-1">
                Payment Amount (INR ₹) — Max {formatINR(paymentModalInvoice.balanceDue)}
              </label>
              <input
                type="number"
                required
                min={1}
                max={paymentModalInvoice.balanceDue}
                value={paymentAmountInput}
                onChange={(e) => setPaymentAmountInput(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg font-mono text-sm"
              />
            </div>

            <div>
              <label className="block font-medium text-zinc-700 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethodInput}
                onChange={(e) =>
                  setPaymentMethodInput(
                    e.target.value as CompanyPaymentRecord['paymentMethod']
                  )
                }
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg bg-white"
              >
                <option value="UPI">UPI Transfer</option>
                <option value="NEFT / RTGS">NEFT / RTGS Bank Transfer</option>
                <option value="Corporate Card">Corporate Card</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-zinc-700 mb-1">
                Verification Source
              </label>
              <select
                value={paymentVerificationInput}
                onChange={(e) =>
                  setPaymentVerificationInput(
                    e.target.value as CompanyPaymentRecord['verificationSource']
                  )
                }
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg bg-white"
              >
                <option value="Manual Admin Record">
                  Manual Admin Record (Reconciled by Super Admin)
                </option>
                <option value="Verified Payment Provider">
                  Verified Payment Provider Transaction
                </option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-zinc-700 mb-1">
                Transaction / UTR Reference
              </label>
              <input
                type="text"
                required
                value={paymentRefInput}
                onChange={(e) => setPaymentRefInput(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg font-mono"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setPaymentModalInvoice(null)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="success" size="md">
                Record Payment & Update Invoice
              </Button>
            </div>
          </form>
        )}
      </ContextualDrawer>

      {/* =======================================================================
          MODAL / DRAWER 5: PACKAGE & CUSTOM PACKAGE BUILDER (Section 9)
         ======================================================================= */}
      <ContextualDrawer
        open={Boolean(editingPackage)}
        onClose={() => setEditingPackage(null)}
        title={
          isCreatingNewPackage
            ? 'Create Custom / Service Package'
            : `Edit Package: ${editingPackage?.name}`
        }
        subtitle="Select included services, set monthly/annual pricing, configure limits, and assign to a company."
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setEditingPackage(null)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                if (!editingPackage) return;
                if (isCreatingNewPackage) {
                  createSubscriptionPackage(editingPackage);
                } else {
                  saveSubscriptionPlan(editingPackage, migrateExistingOnSave);
                }
                setEditingPackage(null);
              }}
            >
              {isCreatingNewPackage ? 'Create & Assign Package' : 'Save Package'}
            </Button>
          </div>
        }
      >
        {editingPackage && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-zinc-700 mb-1">
                  Package Name
                </label>
                <input
                  type="text"
                  value={editingPackage.name}
                  onChange={(e) =>
                    setEditingPackage({
                      ...editingPackage,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-medium text-zinc-700 mb-1">
                  Monthly Price (INR ₹)
                </label>
                <input
                  type="number"
                  value={editingPackage.monthlyPrice}
                  onChange={(e) =>
                    setEditingPackage({
                      ...editingPackage,
                      monthlyPrice: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-zinc-700 mb-1">
                Assign Custom Package to Company (Optional)
              </label>
              <select
                value={editingPackage.assignedCompanyId || ''}
                onChange={(e) =>
                  setEditingPackage({
                    ...editingPackage,
                    assignedCompanyId: e.target.value || undefined,
                    isCustomPackage: Boolean(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg bg-white"
              >
                <option value="">Reusable Platform Package (All Clients)</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    Assign to {c.name} ({c.companyCode})
                  </option>
                ))}
              </select>
            </div>

            {!isCreatingNewPackage && (
              <label className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={migrateExistingOnSave}
                  onChange={(e) => setMigrateExistingOnSave(e.target.checked)}
                />
                <span>
                  Migrate existing subscribed companies to these updated package terms immediately (otherwise applies to new subscriptions only)
                </span>
              </label>
            )}

            <div>
              <div className="font-semibold text-zinc-900 mb-2">
                Select Included Services ({editingPackage.includedServices.length})
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {v1Services.map((svc) => {
                  const checked = editingPackage.includedServices.includes(
                    svc.id
                  );
                  return (
                    <label
                      key={svc.id}
                      className="p-2.5 border border-zinc-200 rounded-lg flex items-center justify-between cursor-pointer hover:bg-zinc-50"
                    >
                      <span>
                        <strong className="text-zinc-900">{svc.name}</strong>{' '}
                        <span className="text-zinc-400">({svc.category})</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const next = checked
                            ? editingPackage.includedServices.filter(
                                (id) => id !== svc.id
                              )
                            : [...editingPackage.includedServices, svc.id];
                          setEditingPackage({
                            ...editingPackage,
                            includedServices: next,
                          });
                        }}
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </ContextualDrawer>

      {/* =======================================================================
          MODAL / DRAWER 6: 10-STEP COMPANY ONBOARDING WORKFLOW (Section 16)
         ======================================================================= */}
      <ContextualDrawer
        open={Boolean(onboardingCompany)}
        onClose={() => setOnboardingCompany(null)}
        title={
          onboardingCompany
            ? `10-Step Company Onboarding: ${onboardingCompany.name}`
            : 'Company Onboarding'
        }
        subtitle={
          onboardingCompany
            ? `${onboardingCompany.companyCode} · ${onboardingCompany.businessType} · ${onboardingCompany.location}`
            : undefined
        }
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setOnboardingCompany(null)}
            >
              Cancel
            </Button>
            <Button
              variant="success"
              size="md"
              icon={<CheckCircle2 className="w-4 h-4" />}
              onClick={handleCompleteOnboarding}
            >
              Confirm & Activate Subscription
            </Button>
          </div>
        }
      >
        {onboardingCompany && (
          <div className="space-y-4 text-xs">
            {onboardingValidationError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium">
                {onboardingValidationError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-zinc-700 mb-1">
                  1. Select Base Package
                </label>
                <select
                  value={onboardingPlanId}
                  onChange={(e) => setOnboardingPlanId(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg bg-white"
                >
                  {subscriptionPlans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatINR(p.monthlyPrice)}/mo)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium text-zinc-700 mb-1">
                  2. Billing Cycle & Terms
                </label>
                <select
                  value={onboardingCycle}
                  onChange={(e) =>
                    setOnboardingCycle(e.target.value as BillingCycle)
                  }
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg bg-white"
                >
                  <option value="Monthly">Monthly · Net 15</option>
                  <option value="Annual">Annual · Net 30</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-zinc-900">
                  3. Configure Entitled Services ({onboardingServices.length} selected)
                </span>
                <button
                  type="button"
                  onClick={() => setOnboardingServices(['dashboard'])}
                  className="text-[11px] text-zinc-500 underline cursor-pointer"
                >
                  Clear All (Test Validation)
                </button>
              </div>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {v1Services.map((svc) => {
                  const checked = onboardingServices.includes(svc.id);
                  return (
                    <label
                      key={svc.id}
                      className="p-2.5 border border-zinc-200 rounded-lg flex items-center justify-between cursor-pointer"
                    >
                      <span>
                        <strong className="text-zinc-900">{svc.name}</strong>{' '}
                        <span className="text-zinc-400">({svc.category})</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setOnboardingValidationError('');
                          setOnboardingServices((prev) =>
                            prev.includes(svc.id)
                              ? prev.filter((id) => id !== svc.id)
                              : [...prev, svc.id]
                          );
                        }}
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            <label className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={onboardingGenerateInvoice}
                onChange={(e) =>
                  setOnboardingGenerateInvoice(e.target.checked)
                }
              />
              <span>
                Generate & issue initial subscription invoice upon activation
              </span>
            </label>
          </div>
        )}
      </ContextualDrawer>

      {/* =======================================================================
          MODAL / DRAWER 7: ISSUE CREDIT / ADJUSTMENT
         ======================================================================= */}
      <ContextualDrawer
        open={creditModalOpen}
        onClose={() => setCreditModalOpen(false)}
        title="Issue Credit or Billing Adjustment"
        subtitle="Apply a promotional credit, SLA credit note, or proration adjustment to a company."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addCreditAdjustment(
              creditCompanyId,
              creditType,
              Number(creditAmount) || 0,
              creditReason
            );
            setCreditModalOpen(false);
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="block font-medium text-zinc-700 mb-1">
              Company
            </label>
            <select
              value={creditCompanyId}
              onChange={(e) => setCreditCompanyId(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg bg-white"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-medium text-zinc-700 mb-1">
              Adjustment Type
            </label>
            <select
              value={creditType}
              onChange={(e) =>
                setCreditType(
                  e.target.value as CreditAdjustmentRecord['type']
                )
              }
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg bg-white"
            >
              <option value="Credit Note">Credit Note</option>
              <option value="Promotional Discount">Promotional Discount</option>
              <option value="Proration Credit">Proration Credit</option>
              <option value="Debit Adjustment">Debit Adjustment</option>
            </select>
          </div>
          <div>
            <label className="block font-medium text-zinc-700 mb-1">
              Amount (INR ₹)
            </label>
            <input
              type="number"
              required
              min={1}
              value={creditAmount}
              onChange={(e) => setCreditAmount(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg font-mono"
            />
          </div>
          <div>
            <label className="block font-medium text-zinc-700 mb-1">
              Reason
            </label>
            <input
              type="text"
              required
              value={creditReason}
              onChange={(e) => setCreditReason(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setCreditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Apply Adjustment
            </Button>
          </div>
        </form>
      </ContextualDrawer>
    </div>
  );
};
