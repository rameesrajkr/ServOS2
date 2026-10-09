import React, { useState } from 'react';
import {
  Save,
  RotateCcw,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Building2,
  Layers,
  ArrowUpRight,
  Receipt,
  CreditCard,
  Calendar,
  FileText,
} from 'lucide-react';
import { useOperations } from '../context/OperationsContext';
import { Button, PageHeader, StatusIndicator } from '../components/ui/Primitives';
import { cn, formatINR } from '../lib/utils';
import { CompanyInvoice, ServiceCategory, UserRole } from '../types/operations';
import { calculateCompanyBillingBreakdown } from '../lib/billingEngine';

const SETTINGS_SECTIONS = [
  'Active Services',
  'Subscription & Billing',
  'Roles & Permissions',
  'Company',
  'Users',
  'Tables',
  'Menu',
  'Payment Methods',
  'Notifications',
  'System',
] as const;

const CONFIGURABLE_ROLES: { id: UserRole; label: string }[] = [
  { id: 'COMPANY_ADMIN', label: 'Manager / Admin' },
  { id: 'WAITER', label: 'Waiter' },
  { id: 'HEAD_CHEF', label: 'Head Chef' },
  { id: 'JUICER', label: 'Juicer' },
  { id: 'FINANCE', label: 'Finance' },
];

const SERVICE_CATEGORIES_ORDER: ServiceCategory[] = [
  'Core',
  'Restaurant',
  'Inventory',
  'Resource Management',
  'Finance',
  'Insights',
];

export const SettingsView: React.FC = () => {
  const {
    activeCompany,
    serviceCatalog,
    companyInvoices,
    companyPayments,
    hasService,
    getServiceEntitlementSource,
    hasPermission,
    toggleCompanyRolePermission,
    setRole,
    setActiveModule,
    addToast,
    resetDemoState,
  } = useOperations();

  const [activeSection, setActiveSection] =
    useState<(typeof SETTINGS_SECTIONS)[number]>('Active Services');
  const [selectedClientInvoice, setSelectedClientInvoice] =
    useState<CompanyInvoice | null>(null);
  const [companyName, setCompanyName] = useState(activeCompany.name);
  const [gstNumber, setGstNumber] = useState(activeCompany.gstin || '29AABCK8491F1Z5');
  const [upiId, setUpiId] = useState('knockout.dining@hdfcbank');

  const v1Services = serviceCatalog.filter((s) => s.version === 'V1');
  const activeV1Services = v1Services.filter((s) =>
    hasService(s.id, activeCompany.id)
  );
  const lockedV1Services = v1Services.filter(
    (s) => !hasService(s.id, activeCompany.id)
  );

  const tenantInvoices = companyInvoices.filter(
    (inv) => inv.companyId === activeCompany.id
  );
  const currentInvoice = tenantInvoices[0] || null;
  const tenantPayments = companyPayments.filter(
    (pay) => pay.companyId === activeCompany.id
  );
  const liveBillingBreakdown = calculateCompanyBillingBreakdown(
    activeCompany,
    (sId) => hasService(sId, activeCompany.id)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings & Service Entitlements"
        meta={`${activeCompany.name} · ${activeCompany.plan}`}
        subtitle="Inspect active company services, subscription limits, role permission matrix, and outlet parameters."
        secondaryActions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              icon={<ShieldCheck className="w-4 h-4 text-teal-700" />}
              onClick={() => {
                setRole('SUPER_ADMIN');
                setActiveModule('sa_companies');
              }}
            >
              Manage in Super Admin
            </Button>
            <Button
              variant="outline"
              size="md"
              icon={<RotateCcw className="w-4 h-4" />}
              onClick={resetDemoState}
            >
              Reset Demo State
            </Button>
          </div>
        }
        primaryAction={
          <Button
            variant="primary"
            size="md"
            icon={<Save className="w-4 h-4" />}
            onClick={() =>
              addToast(
                `${activeSection} settings saved`,
                `Changes applied to ${activeCompany.name}.`,
                'success'
              )
            }
          >
            Save Changes
          </Button>
        }
      />

      {/* SETTINGS SIDEBAR + CONTENT PANEL */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        <nav
          aria-label="Settings Sections"
          className="md:col-span-3 bg-white border border-zinc-200/90 rounded-lg p-2 space-y-0.5"
        >
          {SETTINGS_SECTIONS.map((sec) => {
            const active = activeSection === sec;
            return (
              <button
                key={sec}
                onClick={() => setActiveSection(sec)}
                className={cn(
                  'w-full px-3 py-2 rounded-md text-xs font-medium text-left transition-colors cursor-pointer flex items-center justify-between',
                  active
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                )}
              >
                <span>{sec}</span>
                {sec === 'Active Services' && (
                  <span
                    className={cn(
                      'font-mono text-[10px]',
                      active ? 'text-zinc-300' : 'text-zinc-400'
                    )}
                  >
                    {activeV1Services.length}/{v1Services.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="md:col-span-9 bg-white border border-zinc-200/90 rounded-lg p-6 space-y-6">
          <div className="border-b border-zinc-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">
                {activeSection} — {activeCompany.name}
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                {activeCompany.businessType} · {activeCompany.location} · Plan:{' '}
                <span className="font-semibold text-zinc-800">
                  {activeCompany.plan}
                </span>
              </p>
            </div>
            <span className="text-xs font-mono text-zinc-500 tabular-nums">
              Billing: {formatINR(activeCompany.mrr)} / month
            </span>
          </div>

          {/* ============================================================
              CLIENT SELF-VIEW: ACTIVE SERVICES & SUBSCRIPTION LIMITS
             ============================================================ */}
          {activeSection === 'Active Services' && (
            <div className="space-y-6">
              {/* Plan & Usage Limits Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg">
                  <div className="text-[11px] font-medium text-zinc-500">
                    Staff Profiles Limit
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-base font-semibold font-mono text-zinc-900 tabular-nums">
                      {activeCompany.limitsUsage.staffCurrent} /{' '}
                      {activeCompany.limitsUsage.staffMax >= 999
                        ? 'Unlimited'
                        : activeCompany.limitsUsage.staffMax}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-700">
                      Within Limit
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg">
                  <div className="text-[11px] font-medium text-zinc-500">
                    Operator Logins
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-base font-semibold font-mono text-zinc-900 tabular-nums">
                      {activeCompany.limitsUsage.usersCurrent} /{' '}
                      {activeCompany.limitsUsage.usersMax >= 999
                        ? 'Unlimited'
                        : activeCompany.limitsUsage.usersMax}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-700">
                      Active
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg">
                  <div className="text-[11px] font-medium text-zinc-500">
                    Floor Tables Limit
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-base font-semibold font-mono text-zinc-900 tabular-nums">
                      {activeCompany.limitsUsage.tablesCurrent} /{' '}
                      {activeCompany.limitsUsage.tablesMax === 0
                        ? '0 (Cloud Kitchen)'
                        : activeCompany.limitsUsage.tablesMax >= 999
                        ? 'Unlimited'
                        : activeCompany.limitsUsage.tablesMax}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500">
                      Configured
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg">
                  <div className="text-[11px] font-medium text-zinc-500">
                    Monthly Orders
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-base font-semibold font-mono text-zinc-900 tabular-nums">
                      {activeCompany.limitsUsage.monthlyOrdersCurrent.toLocaleString('en-IN')}{' '}
                      /{' '}
                      {activeCompany.limitsUsage.monthlyOrdersLimit >= 999999
                        ? 'Unlimited'
                        : activeCompany.limitsUsage.monthlyOrdersLimit.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] font-mono text-teal-700">
                      Metered
                    </span>
                  </div>
                </div>
              </div>

              {/* Active Services List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900">
                      Active Services ({activeV1Services.length})
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Effective Services = Plan Services + Custom Add-ons − Disabled Overrides
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {activeV1Services.map((svc) => {
                    const src = getServiceEntitlementSource(
                      svc.id,
                      activeCompany.id
                    );
                    return (
                      <div
                        key={svc.id}
                        className="p-3 border border-zinc-200 rounded-lg bg-white flex items-start justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="text-xs font-semibold text-zinc-900 truncate">
                              {svc.name}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-500 mt-1">
                            {svc.category} ·{' '}
                            <span className="font-mono text-teal-700">
                              {src.source}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Locked / Inactive Services (Upgrade Required) */}
              {lockedV1Services.length > 0 && (
                <div className="pt-2 border-t border-zinc-100">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-900">
                        Not Included / Disabled Services ({lockedV1Services.length})
                      </h3>
                      <p className="text-xs text-zinc-500">
                        Upgrade subscription tier or request add-on provisioning from Super Admin
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<ArrowUpRight className="w-3.5 h-3.5" />}
                      onClick={() => {
                        setRole('SUPER_ADMIN');
                        setActiveModule('sa_companies');
                      }}
                    >
                      Enable in Super Admin
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {lockedV1Services.map((svc) => {
                      const src = getServiceEntitlementSource(
                        svc.id,
                        activeCompany.id
                      );
                      return (
                        <div
                          key={svc.id}
                          className="p-3 border border-zinc-200/80 rounded-lg bg-zinc-50/70 flex items-start justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                              <span className="text-xs font-medium text-zinc-700 truncate">
                                {svc.name}
                              </span>
                            </div>
                            <div className="text-[11px] text-zinc-500 mt-1">
                              {src.isOverriddenDisabled
                                ? 'Disabled by Super Admin'
                                : 'Upgrade Required'}
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              addToast(
                                `Upgrade Requested: ${svc.name}`,
                                `Sent activation request for ${activeCompany.name} to KnockOUT Super Admin.`,
                                'success'
                              )
                            }
                            className="text-[11px] font-medium text-teal-700 hover:underline shrink-0 cursor-pointer"
                          >
                            Request
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================
              CLIENT-SIDE COMPANY BILLING VIEW (Section 16 - Read-Only)
             ============================================================ */}
          {activeSection === 'Subscription & Billing' && (
            <div className="space-y-6">
              {/* Read-Only Governance Notice */}
              <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-zinc-700">
                  <span className="font-semibold text-zinc-900">
                    Read-Only Tenant Billing View:
                  </span>{' '}
                  Platform pricing, service entitlements, and invoice issuance are governed by KnockOUT Super Admin. Company admins cannot edit pricing or self-enable unpaid services directly.
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<ArrowUpRight className="w-3.5 h-3.5" />}
                  onClick={() =>
                    addToast(
                      'Service Upgrade Request Sent',
                      `Submitted upgrade request for ${activeCompany.name} (${activeCompany.companyCode}) to Platform Billing.`,
                      'success'
                    )
                  }
                >
                  Request Service Upgrade
                </Button>
              </div>

              {/* Subscription Summary Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 bg-white border border-zinc-200 rounded-lg">
                  <div className="text-[11px] font-medium text-zinc-500">
                    Current Subscription Plan
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-zinc-900">
                      {activeCompany.plan}
                    </span>
                    <StatusIndicator status={activeCompany.subscriptionStatus} />
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1 font-mono">
                    Code: {activeCompany.companyCode}
                  </div>
                </div>

                <div className="p-3.5 bg-white border border-zinc-200 rounded-lg">
                  <div className="text-[11px] font-medium text-zinc-500">
                    Billing Cycle & Terms
                  </div>
                  <div className="mt-1 text-sm font-semibold text-zinc-900">
                    {activeCompany.billingCycle} · {activeCompany.paymentTerms}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-zinc-400" />
                    <span>Next Renewal: {activeCompany.renewalDate}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-white border border-zinc-200 rounded-lg">
                  <div className="text-[11px] font-medium text-zinc-500">
                    Enabled Billable Modules
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-sm font-semibold font-mono text-zinc-900 tabular-nums">
                      {liveBillingBreakdown.lineItems.length} Modules ({activeV1Services.length} Services)
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1 font-mono">
                    Est. Monthly Total: {formatINR(liveBillingBreakdown.total)} (incl. GST)
                  </div>
                </div>

                <div className="p-3.5 bg-white border border-zinc-200 rounded-lg">
                  <div className="text-[11px] font-medium text-zinc-500">
                    Payment Status & Balance Due
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span
                      className={cn(
                        'text-sm font-semibold font-mono tabular-nums',
                        activeCompany.outstandingAmount > 0
                          ? 'text-amber-700'
                          : 'text-emerald-700'
                      )}
                    >
                      {formatINR(activeCompany.outstandingAmount)}
                    </span>
                    <StatusIndicator
                      status={
                        activeCompany.outstandingAmount > 0 ? 'Payment Due' : 'Paid'
                      }
                    />
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    {activeCompany.outstandingAmount > 0
                      ? 'Open invoice balance awaiting settlement'
                      : 'All issued invoices settled'}
                  </div>
                </div>
              </div>

              {/* Active Service Pricing Breakdown (Read-Only) */}
              <div className="border border-zinc-200 rounded-lg overflow-hidden">
                <div className="bg-zinc-50 px-4 py-2.5 border-b border-zinc-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-900">
                      Enabled Services & Monthly Rate Breakdown
                    </h3>
                    <p className="text-[11px] text-zinc-500">
                      Calculated directly from {activeCompany.name}&apos;s active service entitlements
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-500">
                    GSTIN: {activeCompany.gstin}
                  </span>
                </div>
                <div className="divide-y divide-zinc-200/70">
                  {liveBillingBreakdown.lineItems.map((item) => (
                    <div
                      key={item.id}
                      className="px-4 py-2.5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-medium text-zinc-900">
                          {item.label}
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          {item.description} · Model: {item.pricingModel}
                        </div>
                      </div>
                      <div className="font-mono font-semibold text-zinc-900 tabular-nums">
                        {formatINR(item.amount)} / mo
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-zinc-50/80 px-4 py-3 border-t border-zinc-200 space-y-1 text-xs">
                  <div className="flex justify-between text-zinc-600">
                    <span>Monthly Services Subtotal</span>
                    <span className="font-mono tabular-nums">
                      {formatINR(liveBillingBreakdown.subtotal)}
                    </span>
                  </div>
                  {liveBillingBreakdown.discount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Negotiated Package Discount</span>
                      <span className="font-mono tabular-nums">
                        -{formatINR(liveBillingBreakdown.discount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-zinc-600">
                    <span>GST ({liveBillingBreakdown.taxRatePercent}%)</span>
                    <span className="font-mono tabular-nums">
                      {formatINR(liveBillingBreakdown.taxAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold text-zinc-900 pt-1 border-t border-zinc-200/80">
                    <span>Estimated Cycle Total (INR)</span>
                    <span className="font-mono tabular-nums">
                      {formatINR(liveBillingBreakdown.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Current Invoice Card */}
              {currentInvoice && (
                <div className="border border-zinc-200 rounded-lg p-4 bg-white space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <Receipt className="w-4 h-4 text-teal-700" />
                      <div>
                        <div className="text-xs font-semibold text-zinc-900 flex items-center gap-2">
                          <span>Current Invoice: {currentInvoice.invoiceNumber}</span>
                          <StatusIndicator status={currentInvoice.status} />
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          Period: {currentInvoice.billingPeriod} · Issued: {currentInvoice.issueDate} · Due: {currentInvoice.dueDate}
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-xs text-zinc-500">
                        Total: {formatINR(currentInvoice.total)} · Paid: {formatINR(currentInvoice.amountPaid)}
                      </div>
                      <div className="text-sm font-semibold text-zinc-900 tabular-nums">
                        Balance Due: {formatINR(currentInvoice.balanceDue)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentInvoice.lineItems.map((li) => (
                      <div
                        key={li.id}
                        className="px-3 py-2 bg-zinc-50 border border-zinc-200/80 rounded flex items-center justify-between text-xs"
                      >
                        <span className="text-zinc-800 font-medium truncate pr-2">
                          {li.label}
                        </span>
                        <span className="font-mono text-zinc-900 tabular-nums shrink-0">
                          {formatINR(li.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Invoice History Table */}
              <div className="border border-zinc-200 rounded-lg overflow-hidden">
                <div className="bg-zinc-50 px-4 py-2.5 border-b border-zinc-200 flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-zinc-900">
                    Invoice History ({tenantInvoices.length})
                  </h3>
                  <span className="text-[11px] text-zinc-500">
                    Recorded Payments: {tenantPayments.length}
                  </span>
                </div>
                {tenantInvoices.length === 0 ? (
                  <div className="p-6 text-center text-xs text-zinc-500">
                    No invoices generated for {activeCompany.name} yet.
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-200/70">
                    {tenantInvoices.map((inv) => (
                      <div
                        key={inv.id}
                        className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:bg-zinc-50/70"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-zinc-900">
                              {inv.invoiceNumber}
                            </span>
                            <StatusIndicator status={inv.status} />
                            <span className="text-zinc-500">
                              {inv.billingPeriod}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-500 mt-0.5">
                            Issued {inv.issueDate} · Due {inv.dueDate} · {inv.lineItems.length} service items
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right font-mono tabular-nums">
                            <div className="font-semibold text-zinc-900">
                              {formatINR(inv.total)}
                            </div>
                            <div className="text-[11px] text-zinc-500">
                              Balance: {formatINR(inv.balanceDue)}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<FileText className="w-3.5 h-3.5" />}
                            onClick={() =>
                              setSelectedClientInvoice(
                                selectedClientInvoice?.id === inv.id ? null : inv
                              )
                            }
                          >
                            {selectedClientInvoice?.id === inv.id ? 'Hide' : 'View'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedClientInvoice && (
                <div className="p-4 bg-zinc-50 border border-zinc-300 rounded-lg space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                    <div className="font-semibold text-zinc-900">
                      Invoice Breakdown — {selectedClientInvoice.invoiceNumber} ({selectedClientInvoice.billingPeriod})
                    </div>
                    <button
                      onClick={() => setSelectedClientInvoice(null)}
                      className="text-zinc-500 hover:text-zinc-900 font-mono text-[11px] cursor-pointer"
                    >
                      Close ✕
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {selectedClientInvoice.lineItems.map((li) => (
                      <div key={li.id} className="flex justify-between">
                        <span className="text-zinc-700">{li.label}</span>
                        <span className="font-mono text-zinc-900 tabular-nums">
                          {formatINR(li.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-zinc-200 pt-2 space-y-1">
                    <div className="flex justify-between text-zinc-600">
                      <span>Subtotal</span>
                      <span className="font-mono">{formatINR(selectedClientInvoice.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-600">
                      <span>Discount</span>
                      <span className="font-mono">-{formatINR(selectedClientInvoice.discount)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-600">
                      <span>GST ({selectedClientInvoice.taxRatePercent}%)</span>
                      <span className="font-mono">{formatINR(selectedClientInvoice.taxAmount)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-zinc-900 pt-1 border-t border-zinc-200">
                      <span>Total Due</span>
                      <span className="font-mono">{formatINR(selectedClientInvoice.total)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================
              SERVICE + ROLE PERMISSION MATRIX (Section 18)
             ============================================================ */}
          {activeSection === 'Roles & Permissions' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-semibold text-zinc-900">
                    Access Enforcement Formula:
                  </span>{' '}
                  <span className="font-mono text-zinc-700">
                    Access Allowed = Service Enabled for {activeCompany.name} AND Role Has Permission
                  </span>
                </div>
                <span className="text-[11px] text-zinc-500">
                  Click any cell to toggle role access
                </span>
              </div>

              <div className="border border-zinc-200 rounded-lg overflow-hidden">
                <div className="grid grid-cols-12 bg-zinc-50 border-b border-zinc-200 px-4 py-2.5 text-[11px] font-semibold text-zinc-600">
                  <div className="col-span-4">Service Module</div>
                  <div className="col-span-2">Tenant State</div>
                  {CONFIGURABLE_ROLES.map((r) => (
                    <div key={r.id} className="col-span-1 text-center truncate" title={r.label}>
                      {r.label.split(' ')[0]}
                    </div>
                  ))}
                  <div className="col-span-1 text-right">Category</div>
                </div>

                <div className="divide-y divide-zinc-200/70 max-h-[460px] overflow-y-auto">
                  {SERVICE_CATEGORIES_ORDER.flatMap((cat) =>
                    v1Services.filter((s) => s.category === cat)
                  ).map((svc) => {
                    const enabledForTenant = hasService(svc.id, activeCompany.id);
                    return (
                      <div
                        key={svc.id}
                        className={cn(
                          'grid grid-cols-12 items-center px-4 py-2.5 text-xs',
                          !enabledForTenant && 'bg-zinc-50/70 opacity-65'
                        )}
                      >
                        <div className="col-span-4 font-medium text-zinc-900 truncate pr-2">
                          {svc.name}
                        </div>
                        <div className="col-span-2">
                          {enabledForTenant ? (
                            <span className="font-mono text-[11px] text-emerald-700 font-semibold">
                              ✓ Active
                            </span>
                          ) : (
                            <span className="font-mono text-[11px] text-zinc-400">
                              ✕ Disabled
                            </span>
                          )}
                        </div>
                        {CONFIGURABLE_ROLES.map((r) => {
                          const allowed = hasPermission(
                            svc.id,
                            r.id,
                            activeCompany.id
                          );
                          return (
                            <div key={r.id} className="col-span-1 flex justify-center">
                              <button
                                type="button"
                                onClick={() =>
                                  toggleCompanyRolePermission(
                                    activeCompany.id,
                                    r.id,
                                    svc.id
                                  )
                                }
                                className={cn(
                                  'w-7 h-6 rounded text-[11px] font-mono font-semibold border transition-colors cursor-pointer flex items-center justify-center',
                                  allowed
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                                    : 'bg-zinc-100 border-zinc-200 text-zinc-400 hover:bg-zinc-200'
                                )}
                                title={`${r.label}: ${allowed ? 'Allowed' : 'Denied'} (Click to toggle)`}
                              >
                                {allowed ? '✓' : '—'}
                              </button>
                            </div>
                          );
                        })}
                        <div className="col-span-1 text-right text-[10px] font-mono text-zinc-400 truncate">
                          {svc.category.split(' ')[0]}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'Company' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Outlet Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  GSTIN Number
                </label>
                <input
                  type="text"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono border border-zinc-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Default Currency
                </label>
                <input
                  type="text"
                  disabled
                  value="INR (₹) — Indian Rupee"
                  className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Service Hours
                </label>
                <input
                  type="text"
                  defaultValue="11:30 AM – 11:30 PM IST"
                  className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg"
                />
              </div>
            </div>
          )}

          {activeSection === 'Payment Methods' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Merchant UPI VPA (Dynamic QR)
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full max-w-md px-3 py-2 text-sm font-mono border border-zinc-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {['UPI Dynamic QR', 'Card POS Terminal', 'Cash Drawer'].map(
                  (mode) => (
                    <div
                      key={mode}
                      className="p-3.5 border border-zinc-200 rounded-lg flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-zinc-900">{mode}</span>
                      <span className="text-emerald-700 font-mono">Active</span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {activeSection !== 'Active Services' &&
            activeSection !== 'Subscription & Billing' &&
            activeSection !== 'Roles & Permissions' &&
            activeSection !== 'Company' &&
            activeSection !== 'Payment Methods' && (
              <div className="space-y-3 text-xs text-zinc-600">
                <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg">
                  <div className="font-semibold text-zinc-900">
                    Active {activeSection} Policy
                  </div>
                  <p className="mt-1">
                    All changes to {activeSection} synchronize automatically across Waiter POS, Kitchen Display (KDS), and Finance terminals.
                  </p>
                </div>
                <div className="p-4 border border-zinc-200 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-zinc-900">
                      Real-Time Station Sync & Role Enforcement
                    </div>
                    <div className="text-zinc-500 mt-0.5">
                      Enforce role-based access and audit logging for {activeSection}
                    </div>
                  </div>
                  <span className="font-mono text-emerald-700 font-semibold">
                    Enabled
                  </span>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
