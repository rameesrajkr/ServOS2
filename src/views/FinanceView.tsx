import React, { useState } from 'react';
import { Plus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useOperations } from '../context/OperationsContext';
import { PaymentMethod } from '../types/operations';
import {
  Button,
  ContextualDrawer,
  MetricCard,
  PageHeader,
  SegmentedTabs,
  StatusIndicator,
} from '../components/ui/Primitives';
import { formatINR } from '../lib/utils';

const FINANCE_SECTIONS = [
  'Transactions',
  'Expenses',
  'Supplier Payments',
  'Bills',
] as const;

export const FinanceView: React.FC = () => {
  const { transactions, orders, suppliers, addExpenseTransaction, paySupplierOutstanding } =
    useOperations();

  const [section, setSection] =
    useState<(typeof FINANCE_SECTIONS)[number]>('Transactions');
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('UPI');

  const inflowTotal =
    284000 +
    transactions
      .filter((t) => t.type === 'Inflow')
      .reduce((sum, t) => sum + t.amount, 0);
  const outflowTotal =
    64200 +
    transactions
      .filter((t) => t.type === 'Outflow' && t.status === 'Completed')
      .reduce((sum, t) => sum + t.amount, 0);
  const netProfit = inflowTotal - outflowTotal;
  const pendingSettlements =
    suppliers.reduce((sum, s) => sum + s.outstandingAmount, 0) +
    orders
      .filter((o) => !o.isPaid && o.status !== 'Cancelled')
      .reduce((sum, o) => sum + o.total, 0);

  const visibleTransactions = transactions.filter((tx) => {
    if (section === 'Expenses') return tx.type === 'Outflow';
    if (section === 'Supplier Payments')
      return tx.category === 'Supplier Payment';
    if (section === 'Bills') return tx.type === 'Inflow';
    return true;
  });

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !Number(amount)) return;
    addExpenseTransaction(title.trim(), Number(amount), 'Utility Expense', method);
    setTitle('');
    setAmount('');
    setExpenseModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance"
        meta="October 7, 2026"
        subtitle="Daily cashflow overview, dine-in/takeaway settlements, operational expenses, and vendor payouts."
        primaryAction={
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setExpenseModalOpen(true)}
          >
            Add Expense
          </Button>
        }
      />

      {/* OVERVIEW METRICS (Section 29: Revenue, Expenses, Net, Pending) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Revenue"
          value={formatINR(inflowTotal)}
          delta="+12.4%"
          deltaTone="positive"
          subtext="UPI 64% · Card 24% · Cash 12%"
        />
        <MetricCard
          label="Expenses"
          value={formatINR(outflowTotal)}
          subtext="Ingredients, utilities & payouts"
        />
        <MetricCard
          label="Net Operating Margin"
          value={formatINR(netProfit)}
          delta="77.4%"
          deltaTone="positive"
          subtext="Today’s net cashflow"
        />
        <MetricCard
          label="Pending"
          value={formatINR(pendingSettlements)}
          delta="Unsettled"
          deltaTone="warning"
          subtext="Active bills + vendor dues"
        />
      </div>

      {/* PAYMENT CHANNEL BREAKDOWN BAR */}
      <div className="bg-white border border-zinc-200/90 rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-zinc-900">
            Payment Mode Reconciliation
          </span>
          <span className="font-mono text-zinc-500">
            UPI: ₹1,81,760 · Card: ₹68,160 · Cash: ₹34,080
          </span>
        </div>
        <div className="w-full h-3 rounded-full bg-zinc-100 overflow-hidden flex">
          <div className="bg-teal-700 h-full" style={{ width: '64%' }} title="UPI 64%" />
          <div className="bg-zinc-800 h-full" style={{ width: '24%' }} title="Card 24%" />
          <div className="bg-amber-500 h-full" style={{ width: '12%' }} title="Cash 12%" />
        </div>
      </div>

      {/* SECTION TABS */}
      <SegmentedTabs
        options={FINANCE_SECTIONS}
        value={section}
        onChange={setSection}
      />

      {/* TRANSACTIONS LEDGER */}
      <div className="bg-white border border-zinc-200/90 rounded-lg overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-zinc-50 border-b border-zinc-200 text-xs font-medium text-zinc-500">
          <div className="col-span-2">Reference</div>
          <div className="col-span-4">Description</div>
          <div className="col-span-2">Category & Mode</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Amount</div>
        </div>

        <div className="divide-y divide-zinc-200/70">
          {visibleTransactions.map((tx) => (
            <div
              key={tx.id}
              className="px-5 py-3.5 grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
            >
              <div className="md:col-span-2 font-mono text-xs font-semibold text-zinc-700">
                {tx.reference}
                <div className="text-[11px] font-normal text-zinc-400">
                  {tx.timestamp}
                </div>
              </div>

              <div className="md:col-span-4 text-sm font-medium text-zinc-900">
                {tx.title}
              </div>

              <div className="md:col-span-2 text-xs text-zinc-600">
                <div>{tx.category}</div>
                <div className="font-mono text-zinc-400">{tx.method}</div>
              </div>

              <div className="md:col-span-2 flex items-center gap-2">
                <StatusIndicator status={tx.status} />
                {tx.status === 'Pending' &&
                  tx.category === 'Supplier Payment' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => paySupplierOutstanding('sup-1')}
                    >
                      Pay Now
                    </Button>
                  )}
              </div>

              <div className="md:col-span-2 md:text-right font-mono text-sm font-bold tabular-nums flex items-center md:justify-end gap-1">
                {tx.type === 'Inflow' ? (
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5 text-zinc-600" />
                )}
                <span
                  className={
                    tx.type === 'Inflow' ? 'text-emerald-700' : 'text-zinc-900'
                  }
                >
                  {tx.type === 'Inflow' ? '+' : '-'}
                  {formatINR(tx.amount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ADD EXPENSE DRAWER */}
      <ContextualDrawer
        open={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        title="Add Operational Expense"
        subtitle="Record direct kitchen, utility, or maintenance expense"
      >
        <form onSubmit={handleSaveExpense} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Expense Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Ice Cube Bulk Delivery"
              className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Amount (INR ₹)
            </label>
            <input
              type="number"
              required
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1500"
              className="w-full px-3 py-2 text-sm font-mono border border-zinc-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Payment Method
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg bg-white"
            >
              <option value="UPI">UPI</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setExpenseModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Expense
            </Button>
          </div>
        </form>
      </ContextualDrawer>
    </div>
  );
};
