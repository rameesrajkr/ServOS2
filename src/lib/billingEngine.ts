import {
  CompanyInvoice,
  CompanyTenant,
  InvoiceLineItem,
  InvoiceStatus,
  ServiceCatalogItem,
  ServiceId,
  SubscriptionPlanPackage,
} from '../types/operations';

/**
 * Currency-safe integer paise conversion helpers (1 INR = 100 paise)
 * Prevents floating-point arithmetic inaccuracies in invoice totals.
 */
export function toPaise(rupees: number): number {
  return Math.round((Number(rupees) || 0) * 100);
}

export function fromPaise(paise: number): number {
  return Math.round(paise) / 100;
}

export function safeAddINR(...amounts: number[]): number {
  const totalPaise = amounts.reduce((sum, val) => sum + toPaise(val), 0);
  return fromPaise(totalPaise);
}

export function safeSubtractINR(a: number, b: number): number {
  return fromPaise(Math.max(0, toPaise(a) - toPaise(b)));
}

export function calculateTaxINR(
  taxableAmount: number,
  taxRatePercent: number
): number {
  const taxablePaise = toPaise(taxableAmount);
  const taxPaise = Math.round((taxablePaise * (taxRatePercent || 0)) / 100);
  return fromPaise(taxPaise);
}

/**
 * Authoritative Modular Service Group Base Prices (INR / month)
 * Used for itemized company-specific service billing & add-on calculations.
 */
export const MODULAR_SERVICE_PRICING: Record<
  string,
  {
    groupKey: string;
    label: string;
    description: string;
    monthlyPrice: number;
    triggerServiceIds: ServiceId[];
  }
> = {
  restaurant_ops: {
    groupKey: 'restaurant_ops',
    label: 'Restaurant Operations Suite',
    description:
      'Floor & Tables, POS Orders, Kitchen KDS, Juice Station, Bookings, Takeaway & Billing',
    monthlyPrice: 2000,
    triggerServiceIds: [
      'floor',
      'orders',
      'kitchen',
      'juice',
      'bookings',
      'takeaway',
      'billing',
      'menu',
    ],
  },
  inventory_mgmt: {
    groupKey: 'inventory_mgmt',
    label: 'Inventory & Procurement Management',
    description:
      'Ingredient Stock Tracking, Low-Stock Alerts, Suppliers & Purchase Orders',
    monthlyPrice: 800,
    triggerServiceIds: [
      'inventory',
      'suppliers',
      'procurement',
      'stock_management',
    ],
  },
  resource_mgmt: {
    groupKey: 'resource_mgmt',
    label: 'Resource & Workforce Management',
    description:
      'Staff Directory, PIN Access, Attendance, Clock In/Out, Breaks, Shifts, Schedule, Leave & Tasks',
    monthlyPrice: 1000,
    triggerServiceIds: [
      'resource_management',
      'staff',
      'attendance',
      'clock_in_out',
      'breaks',
      'shifts',
      'schedule',
      'leave',
      'tasks',
    ],
  },
  resource_planning_addon: {
    groupKey: 'resource_planning_addon',
    label: 'Operational Resource Planning',
    description: 'Demand-to-staffing capacity forecasting and shift recommendations',
    monthlyPrice: 400,
    triggerServiceIds: ['resource_planning'],
  },
  finance_mgmt: {
    groupKey: 'finance_mgmt',
    label: 'Finance & Accounting Ledger',
    description:
      'Daily Revenue & Expense Ledger, Vendor Payouts & Tax/GST Summaries',
    monthlyPrice: 900,
    triggerServiceIds: [
      'finance',
      'expenses',
      'transactions',
      'supplier_payments',
      'financial_reports',
    ],
  },
  advanced_insights: {
    groupKey: 'advanced_insights',
    label: 'Advanced Reports & Analytics',
    description:
      'Item Sales Velocity, Hourly Throughput & Multi-Shift Performance Insights',
    monthlyPrice: 600,
    triggerServiceIds: ['reports', 'analytics'],
  },
};

/**
 * Calculates itemized billing line items and totals for a specific company
 * based on its actual enabled services, custom service prices, discount, and tax rate.
 * Does NOT double-charge services and does NOT charge for disabled services.
 */
export function calculateCompanyBillingBreakdown(
  company: CompanyTenant,
  hasServiceFn: (serviceId: ServiceId, companyId?: string) => boolean,
  _plans?: SubscriptionPlanPackage[],
  _catalog?: ServiceCatalogItem[]
): {
  lineItems: InvoiceLineItem[];
  subtotal: number;
  discount: number;
  taxableAmount: number;
  taxRatePercent: number;
  taxAmount: number;
  total: number;
} {
  const lineItems: InvoiceLineItem[] = [];
  const multiplier = company.billingCycle === 'Annual' ? 12 : 1;

  Object.values(MODULAR_SERVICE_PRICING).forEach((group, idx) => {
    const enabledInGroup = group.triggerServiceIds.filter((sId) =>
      hasServiceFn(sId, company.id)
    );
    if (enabledInGroup.length === 0) {
      return; // Do not bill for disabled/excluded service groups
    }

    // Check if the company has a custom negotiated price override on any primary service in this group
    const primaryId = group.triggerServiceIds[0];
    const customOverride = company.customServicePrices?.[primaryId];
    const unitMonthlyPrice =
      customOverride !== undefined ? customOverride : group.monthlyPrice;
    const lineAmount = fromPaise(toPaise(unitMonthlyPrice) * multiplier);

    lineItems.push({
      id: `li-${company.id}-${idx + 1}`,
      serviceId: primaryId,
      label: group.label,
      description: `${enabledInGroup.length}/${group.triggerServiceIds.length} active modules (${
        company.billingCycle === 'Annual' ? 'Annual Term' : 'Monthly Term'
      })`,
      pricingModel:
        customOverride !== undefined ? 'Custom Negotiated' : 'Monthly Fixed',
      quantity: multiplier,
      unitPrice: unitMonthlyPrice,
      amount: lineAmount,
      isIncludedInPackage: true,
    });
  });

  const subtotal = safeAddINR(...lineItems.map((li) => li.amount));
  const discount = Math.min(subtotal, company.discountAmount || 0);
  const taxableAmount = safeSubtractINR(subtotal, discount);
  const taxRatePercent = company.taxRatePercent ?? 18;
  const taxAmount = calculateTaxINR(taxableAmount, taxRatePercent);
  const total = safeAddINR(taxableAmount, taxAmount);

  return {
    lineItems,
    subtotal,
    discount,
    taxableAmount,
    taxRatePercent,
    taxAmount,
    total,
  };
}

/**
 * Calculates the financial impact of enabling or disabling a service before saving (Sections 8 & 12).
 */
export function previewServiceChangeBillingImpact(
  company: CompanyTenant,
  targetServiceId: ServiceId,
  willEnable: boolean,
  hasServiceFn: (serviceId: ServiceId, companyId?: string) => boolean
): {
  currentMonthlySubtotal: number;
  deltaMonthly: number;
  newMonthlySubtotal: number;
  proratedPreviewAmount: number;
  remainingDaysInCycle: number;
  affectedGroupName: string;
} {
  const currentBreakdown = calculateCompanyBillingBreakdown(
    { ...company, billingCycle: 'Monthly' },
    hasServiceFn
  );

  // Simulate hasService after change
  const simulatedHasService = (sId: ServiceId, cId?: string) => {
    if (sId === targetServiceId) return willEnable;
    if (
      targetServiceId === 'resource_management' &&
      [
        'staff',
        'attendance',
        'clock_in_out',
        'breaks',
        'shifts',
        'schedule',
        'leave',
        'tasks',
      ].includes(sId)
    ) {
      return willEnable;
    }
    return hasServiceFn(sId, cId);
  };

  const proposedBreakdown = calculateCompanyBillingBreakdown(
    { ...company, billingCycle: 'Monthly' },
    simulatedHasService
  );

  const deltaPaise =
    toPaise(proposedBreakdown.subtotal) - toPaise(currentBreakdown.subtotal);
  const deltaMonthly = fromPaise(deltaPaise);

  // Remaining days in October 2026 (from Oct 7 to Oct 31 = 24 days out of 30)
  const remainingDaysInCycle = 24;
  const proratedPreviewAmount = fromPaise(
    Math.round((deltaPaise * remainingDaysInCycle) / 30)
  );

  const matchedGroup = Object.values(MODULAR_SERVICE_PRICING).find((g) =>
    g.triggerServiceIds.includes(targetServiceId)
  );

  return {
    currentMonthlySubtotal: currentBreakdown.subtotal,
    deltaMonthly,
    newMonthlySubtotal: proposedBreakdown.subtotal,
    proratedPreviewAmount,
    remainingDaysInCycle,
    affectedGroupName: matchedGroup?.label || targetServiceId,
  };
}

/**
 * Generates a new Draft or Issued CompanyInvoice from the company's current service entitlements
 */
export function buildCompanyInvoiceFromEntitlements(
  company: CompanyTenant,
  hasServiceFn: (serviceId: ServiceId, companyId?: string) => boolean,
  options?: {
    billingPeriod?: string;
    status?: InvoiceStatus;
    invoiceSequence?: number;
    customDiscount?: number;
  }
): CompanyInvoice {
  const modifiedCompany: CompanyTenant =
    options?.customDiscount !== undefined
      ? { ...company, discountAmount: options.customDiscount }
      : company;

  const breakdown = calculateCompanyBillingBreakdown(
    modifiedCompany,
    hasServiceFn
  );
  const seq = options?.invoiceSequence || Math.floor(100 + Math.random() * 899);

  return {
    id: `inv-${company.id}-${Date.now()}`,
    invoiceNumber: `INV-2026-${seq}`,
    companyId: company.id,
    companyName: company.name,
    companyCode: company.companyCode,
    billingPeriod: options?.billingPeriod || 'October 2026',
    issueDate: 'Oct 7, 2026',
    dueDate: 'Oct 22, 2026',
    status: options?.status || 'Draft',
    lineItems: breakdown.lineItems,
    subtotal: breakdown.subtotal,
    discount: breakdown.discount,
    taxRatePercent: breakdown.taxRatePercent,
    taxAmount: breakdown.taxAmount,
    total: breakdown.total,
    amountPaid: 0,
    balanceDue: breakdown.total,
    notes: `Generated from active service entitlements (${breakdown.lineItems.length} service groups). Prototype mock invoice.`,
  };
}
