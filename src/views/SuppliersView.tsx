import React, { useState } from 'react';
import { Phone, Mail, CheckCircle2 } from 'lucide-react';
import { useOperations } from '../context/OperationsContext';
import { Supplier } from '../types/operations';
import {
  Button,
  ContextualDrawer,
  PageHeader,
  StatusIndicator,
} from '../components/ui/Primitives';
import { formatINR } from '../lib/utils';

export const SuppliersView: React.FC = () => {
  const { suppliers, paySupplierOutstanding } = useOperations();
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  );

  const totalOutstanding = suppliers.reduce(
    (sum, s) => sum + s.outstandingAmount,
    0
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suppliers"
        meta={`Outstanding: ${formatINR(totalOutstanding)}`}
        subtitle="Manage vendor contracts, purchase deliveries, and outstanding payable balances."
      />

      {/* SUPPLIER LIST (Section 25) */}
      <div className="bg-white border border-zinc-200/90 rounded-lg overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-zinc-50 border-b border-zinc-200 text-xs font-medium text-zinc-500">
          <div className="col-span-3">Supplier</div>
          <div className="col-span-3">Contact</div>
          <div className="col-span-2">Outstanding</div>
          <div className="col-span-2">Last Purchase</div>
          <div className="col-span-2 text-right">Status & Action</div>
        </div>

        <div className="divide-y divide-zinc-200/70">
          {suppliers.map((sup) => (
            <div
              key={sup.id}
              onClick={() => setSelectedSupplier(sup)}
              className="px-5 py-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center hover:bg-zinc-50/70 transition-colors cursor-pointer"
            >
              <div className="md:col-span-3">
                <div className="text-sm font-semibold text-zinc-900">
                  {sup.name}
                </div>
                <div className="text-xs text-zinc-500">{sup.category}</div>
              </div>

              <div className="md:col-span-3 text-xs text-zinc-600">
                <div className="font-medium text-zinc-800">
                  {sup.contactPerson}
                </div>
                <div className="font-mono text-zinc-500">{sup.phone}</div>
              </div>

              <div className="md:col-span-2">
                <span className="text-sm font-bold font-mono text-zinc-900 tabular-nums">
                  {formatINR(sup.outstandingAmount)}
                </span>
              </div>

              <div className="md:col-span-2 text-xs font-mono text-zinc-600">
                {sup.lastPurchaseDate}
              </div>

              <div
                className="md:col-span-2 flex items-center justify-end gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <StatusIndicator
                  status={
                    sup.status === 'Payment Due' ? 'Payment Due' : 'Active'
                  }
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSupplier(sup)}
                >
                  Open
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SUPPLIER DETAIL DRAWER (Section 25) */}
      <ContextualDrawer
        open={Boolean(selectedSupplier)}
        onClose={() => setSelectedSupplier(null)}
        title={selectedSupplier ? selectedSupplier.name : 'Supplier Detail'}
        subtitle={selectedSupplier?.category}
      >
        {selectedSupplier && (
          <div className="space-y-5">
            {/* Contact & Outstanding Card */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Primary Contact</span>
                <span className="font-semibold text-zinc-900">
                  {selectedSupplier.contactPerson}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Phone & Email</span>
                <span className="font-mono text-zinc-700">
                  {selectedSupplier.phone} · {selectedSupplier.email}
                </span>
              </div>
              <div className="pt-2 border-t border-zinc-200 flex items-center justify-between">
                <span className="font-medium text-zinc-700">
                  Outstanding Payable
                </span>
                <span className="text-base font-bold font-mono text-zinc-900 tabular-nums">
                  {formatINR(selectedSupplier.outstandingAmount)}
                </span>
              </div>
            </div>

            {/* Supplied Products */}
            <div>
              <div className="text-xs font-semibold text-zinc-500 mb-2">
                CONTRACTED PRODUCTS
              </div>
              <div className="text-xs text-zinc-700 bg-white border border-zinc-200 rounded-lg p-3">
                {selectedSupplier.products.join(' · ')}
              </div>
            </div>

            {/* Recent Purchases & Payments */}
            <div>
              <div className="text-xs font-semibold text-zinc-500 mb-2">
                PURCHASES & PAYMENTS LEDGER
              </div>
              <div className="border border-zinc-200 rounded-lg divide-y divide-zinc-100">
                {selectedSupplier.recentPurchases.map((pur) => (
                  <div
                    key={pur.id}
                    className="p-3 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-medium text-zinc-900">{pur.items}</div>
                      <div className="text-zinc-500 font-mono">{pur.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-semibold text-zinc-900 tabular-nums">
                        {formatINR(pur.amount)}
                      </div>
                      <StatusIndicator status={pur.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedSupplier.outstandingAmount > 0 && (
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                icon={<CheckCircle2 className="w-4 h-4" />}
                onClick={() => {
                  paySupplierOutstanding(selectedSupplier.id);
                  setSelectedSupplier({
                    ...selectedSupplier,
                    outstandingAmount: 0,
                    status: 'Active',
                  });
                }}
              >
                Settle Outstanding ({formatINR(selectedSupplier.outstandingAmount)})
              </Button>
            )}
          </div>
        )}
      </ContextualDrawer>
    </div>
  );
};
