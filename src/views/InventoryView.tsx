import React, { useState } from 'react';
import {
  ShoppingCart,
  Sliders,
  History,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { useOperations } from '../context/OperationsContext';
import { InventoryItem, ProcurementStage, StockHealth } from '../types/operations';
import {
  Button,
  ContextualDrawer,
  EmptyState,
  MetricCard,
  PageHeader,
  SegmentedTabs,
  StatusIndicator,
} from '../components/ui/Primitives';
import { cn, formatINR } from '../lib/utils';

const PROCUREMENT_STAGES: ProcurementStage[] = [
  'Stock Alert',
  'Purchase Request',
  'Supplier',
  'Order',
  'Receive Stock',
  'Payment',
];

export const InventoryView: React.FC = () => {
  const {
    inventory,
    procurementOrders,
    adjustInventoryStock,
    createPurchaseFromAlert,
    advanceProcurementStage,
  } = useOperations();

  const [healthFilter, setHealthFilter] = useState<'All' | StockHealth>('All');
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [newStockVal, setNewStockVal] = useState<number>(0);
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);

  const criticalCount = inventory.filter((i) => i.status === 'Critical').length;
  const lowCount = inventory.filter((i) => i.status === 'Low').length;
  const totalValue = inventory.reduce(
    (sum, i) => sum + i.currentStock * i.unitCost,
    0
  );

  // Exception-driven sort: Critical first, then Low, then Healthy
  const sortedInventory = [...inventory]
    .filter((i) => (healthFilter === 'All' ? true : i.status === healthFilter))
    .sort((a, b) => {
      const rank = { Critical: 0, Low: 1, Healthy: 2 };
      return rank[a.status] - rank[b.status];
    });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory & Procurement"
        meta={`${criticalCount} Critical · ${lowCount} Low`}
        subtitle="Exception-driven kitchen stock control and supplier procurement pipeline."
      />

      {/* TOP METRICS (Section 24) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Items"
          value={String(inventory.length)}
          subtext="Tracked active SKUs"
          onClick={() => setHealthFilter('All')}
        />
        <MetricCard
          label="Low Stock"
          value={String(lowCount)}
          delta="Needs Reorder"
          deltaTone="warning"
          onClick={() => setHealthFilter('Low')}
        />
        <MetricCard
          label="Critical"
          value={String(criticalCount)}
          delta="Immediate Action"
          deltaTone="warning"
          onClick={() => setHealthFilter('Critical')}
        />
        <MetricCard
          label="Inventory Value"
          value={formatINR(totalValue)}
          subtext="At landed unit cost"
        />
      </div>

      {/* PROCUREMENT WORKFLOW PIPELINE (Section 26) */}
      <section className="bg-white border border-zinc-200/90 rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">
              Active Procurement Workflow
            </h2>
            <p className="text-xs text-zinc-500">
              STOCK ALERT → PURCHASE REQUEST → SUPPLIER → ORDER → RECEIVE STOCK → PAYMENT
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-500 tabular-nums">
            {procurementOrders.length} active POs
          </span>
        </div>

        {/* Stage Progression Header */}
        <div className="hidden lg:grid grid-cols-6 gap-2 text-[11px] font-mono text-zinc-500">
          {PROCUREMENT_STAGES.map((stage, idx) => (
            <div
              key={stage}
              className="px-2.5 py-1.5 bg-zinc-50 rounded border border-zinc-200/70 flex items-center justify-between"
            >
              <span>
                {idx + 1}. {stage}
              </span>
            </div>
          ))}
        </div>

        {/* Active Purchase Orders */}
        <div className="divide-y divide-zinc-200/70">
          {procurementOrders.map((po) => {
            const stageIdx = PROCUREMENT_STAGES.indexOf(po.stage);
            const nextStage = PROCUREMENT_STAGES[stageIdx + 1];

            return (
              <div
                key={po.id}
                className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-zinc-900">
                      {po.poNumber}
                    </span>
                    <span className="text-zinc-300">·</span>
                    <span className="text-sm font-semibold text-zinc-900">
                      {po.itemName} ({po.quantity} {po.unit})
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    Supplier: {po.supplierName} · Value:{' '}
                    <span className="font-mono font-medium text-zinc-800">
                      {formatINR(po.amount)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono px-2.5 py-1 rounded bg-zinc-100 text-zinc-800">
                    Stage: {po.stage}
                  </span>

                  {nextStage ? (
                    <Button
                      variant={nextStage === 'Receive Stock' ? 'success' : 'outline'}
                      size="sm"
                      icon={<ArrowRight className="w-3.5 h-3.5" />}
                      onClick={() => advanceProcurementStage(po.id)}
                    >
                      Advance to {nextStage}
                    </Button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Settled
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FILTER BAR */}
      <div className="flex items-center justify-between">
        <SegmentedTabs
          options={['All', 'Critical', 'Low', 'Healthy'] as const}
          value={healthFilter}
          onChange={setHealthFilter}
        />
      </div>

      {/* INVENTORY TABLE / CARDS */}
      {sortedInventory.length === 0 ? (
        <EmptyState
          title="Inventory is healthy."
          description="Nothing needs your attention."
          actionLabel="Show All Items"
          onAction={() => setHealthFilter('All')}
        />
      ) : (
        <div className="bg-white border border-zinc-200/90 rounded-lg overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-zinc-50 border-b border-zinc-200 text-xs font-medium text-zinc-500">
            <div className="col-span-3">Ingredient</div>
            <div className="col-span-2">Current Stock</div>
            <div className="col-span-2">Minimum Required</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-3 text-right">Actions</div>
          </div>

          <div className="divide-y divide-zinc-200/70">
            {sortedInventory.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'px-5 py-3.5 grid grid-cols-1 md:grid-cols-12 gap-3 items-center',
                  item.status === 'Critical' && 'bg-red-50/20'
                )}
              >
                <div className="md:col-span-3">
                  <div className="text-sm font-semibold text-zinc-900">
                    {item.name}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {item.category} · {item.supplierName}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <span className="text-sm font-bold font-mono text-zinc-900 tabular-nums">
                    {item.currentStock} {item.unit}
                  </span>
                </div>

                <div className="md:col-span-2">
                  <span className="text-xs font-mono text-zinc-500 tabular-nums">
                    Minimum {item.minimumStock} {item.unit}
                  </span>
                </div>

                <div className="md:col-span-2">
                  <StatusIndicator status={item.status} />
                </div>

                {/* Required Actions: Adjust Stock, Create Purchase, View History */}
                <div className="md:col-span-3 flex items-center justify-end gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Sliders className="w-3.5 h-3.5" />}
                    onClick={() => {
                      setAdjustingItem(item);
                      setNewStockVal(item.currentStock);
                    }}
                  >
                    Adjust Stock
                  </Button>
                  <Button
                    variant={item.status !== 'Healthy' ? 'primary' : 'outline'}
                    size="sm"
                    icon={<ShoppingCart className="w-3.5 h-3.5" />}
                    onClick={() =>
                      createPurchaseFromAlert(
                        item.id,
                        Math.max(15, item.minimumStock * 2 - item.currentStock)
                      )
                    }
                  >
                    Create Purchase
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<History className="w-3.5 h-3.5" />}
                    onClick={() => setHistoryItem(item)}
                  >
                    History
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADJUST STOCK DRAWER */}
      <ContextualDrawer
        open={Boolean(adjustingItem)}
        onClose={() => setAdjustingItem(null)}
        title={adjustingItem ? `Adjust Stock · ${adjustingItem.name}` : 'Adjust Stock'}
        subtitle="Record physical stock count or kitchen wastage adjustment"
      >
        {adjustingItem && (
          <div className="space-y-4">
            <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-between text-xs">
              <span>Minimum Threshold:</span>
              <span className="font-mono font-semibold">
                {adjustingItem.minimumStock} {adjustingItem.unit}
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Updated Physical Stock ({adjustingItem.unit})
              </label>
              <input
                type="number"
                min={0}
                value={newStockVal}
                onChange={(e) => setNewStockVal(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono border border-zinc-300 rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAdjustingItem(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  adjustInventoryStock(adjustingItem.id, newStockVal);
                  setAdjustingItem(null);
                }}
              >
                Save Stock Count
              </Button>
            </div>
          </div>
        )}
      </ContextualDrawer>

      {/* VIEW HISTORY DRAWER */}
      <ContextualDrawer
        open={Boolean(historyItem)}
        onClose={() => setHistoryItem(null)}
        title={historyItem ? `Stock Ledger · ${historyItem.name}` : 'Stock History'}
        subtitle="Recent consumption and replenishment events"
      >
        {historyItem && (
          <div className="space-y-3 text-xs">
            <div className="p-3 border border-zinc-200 rounded-lg flex justify-between">
              <div>
                <div className="font-semibold text-zinc-900">
                  Evening Prep Consumption
                </div>
                <div className="text-zinc-500">Logged by Chef Rakesh</div>
              </div>
              <div className="text-right font-mono">
                <div className="text-red-600">-6 {historyItem.unit}</div>
                <div className="text-zinc-400">{historyItem.lastUpdated}</div>
              </div>
            </div>
            <div className="p-3 border border-zinc-200 rounded-lg flex justify-between">
              <div>
                <div className="font-semibold text-zinc-900">
                  Morning Supplier Delivery ({historyItem.supplierName})
                </div>
                <div className="text-zinc-500">Verified at receiving dock</div>
              </div>
              <div className="text-right font-mono">
                <div className="text-emerald-700">+20 {historyItem.unit}</div>
                <div className="text-zinc-400">Yesterday, 7:10 AM</div>
              </div>
            </div>
          </div>
        )}
      </ContextualDrawer>
    </div>
  );
};
