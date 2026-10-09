import React, { useState } from 'react';
import {
  Search,
  Plus,
  Clock,
  Receipt,
  ArrowUpRight,
} from 'lucide-react';
import { useOperations } from '../context/OperationsContext';
import { Order, OrderStatus, OrderType } from '../types/operations';
import {
  Button,
  ContextualDrawer,
  EmptyState,
  PageHeader,
  SegmentedTabs,
  StatusIndicator,
} from '../components/ui/Primitives';
import { FastOrderSheet } from '../components/floor/FastOrderSheet';
import { BillingDrawer } from '../components/floor/BillingDrawer';
import { formatINR } from '../lib/utils';

const ORDER_TABS = [
  'All',
  'Active',
  'Preparing',
  'Ready',
  'Served',
  'Completed',
  'Cancelled',
] as const;

export const OrdersView: React.FC = () => {
  const {
    orders,
    tables,
    advanceOrderStatus,
    setActiveModule,
    setSelectedTableId,
    billingTableId,
    setBillingTableId,
  } = useOperations();

  const [activeTab, setActiveTab] = useState<(typeof ORDER_TABS)[number]>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | OrderType>('All');
  const [waiterFilter, setWaiterFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectingOrder, setInspectingOrder] = useState<Order | null>(null);
  const [creatingNewOrder, setCreatingNewOrder] = useState(false);

  const waiters = Array.from(new Set(orders.map((o) => o.waiterName)));

  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'Active') {
      if (
        order.status !== 'New' &&
        order.status !== 'Preparing' &&
        order.status !== 'Ready' &&
        order.status !== 'Served'
      ) {
        return false;
      }
    } else if (activeTab !== 'All' && order.status !== activeTab) {
      return false;
    }

    if (typeFilter !== 'All' && order.type !== typeFilter) return false;
    if (waiterFilter !== 'All' && order.waiterName !== waiterFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        order.orderNumber.toLowerCase().includes(q) ||
        (order.tableName && order.tableName.toLowerCase().includes(q)) ||
        (order.customerName && order.customerName.toLowerCase().includes(q))
      );
    }

    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        meta={`${orders.length} Total Today`}
        subtitle="Track dine-in and takeaway tickets, kitchen SLA timers, and bill settlement status."
        primaryAction={
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setCreatingNewOrder(true)}
          >
            New Order
          </Button>
        }
      />

      {/* TABS & FILTERS (Section 17) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <SegmentedTabs
          options={ORDER_TABS}
          value={activeTab}
          onChange={setActiveTab}
        />

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#F97316] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Order #104, Table 12..."
              className="pl-9 pr-3.5 py-2 text-xs bg-white border border-[#E6DDD5] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#F97316]"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'All' | OrderType)}
            className="px-3.5 py-2 text-xs font-semibold text-[#3D342E] bg-white border border-[#E6DDD5] rounded-2xl"
            aria-label="Filter by Order Type"
          >
            <option value="All">All Order Types</option>
            <option value="Dine-In">Dine-In</option>
            <option value="Takeaway">Takeaway</option>
          </select>

          <select
            value={waiterFilter}
            onChange={(e) => setWaiterFilter(e.target.value)}
            className="px-3.5 py-2 text-xs font-semibold text-[#3D342E] bg-white border border-[#E6DDD5] rounded-2xl"
            aria-label="Filter by Waiter"
          >
            <option value="All">All Waiters</option>
            {waiters.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ORDERS LIST / TABLE — Borderless White Surface */}
      {filteredOrders.length === 0 ? (
        <EmptyState
          title="No active orders matching filter"
          description="Orders created by your team will appear here."
          actionLabel="Create Order"
          onAction={() => setCreatingNewOrder(true)}
        />
      ) : (
        <div className="bg-white rounded-3xl shadow-[0_8px_24px_-4px_rgba(61,52,46,0.045)] p-4 space-y-2.5 overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2.5 bg-[#FFF0E2]/70 rounded-2xl text-xs font-bold text-[#756A62]">
            <div className="col-span-2">Order</div>
            <div className="col-span-3">Table / Guest</div>
            <div className="col-span-2">Items</div>
            <div className="col-span-2">Status & Elapsed</div>
            <div className="col-span-1 text-right">Amount</div>
            <div className="col-span-2 text-right">Action</div>
          </div>

          <div className="space-y-2">
            {filteredOrders.map((order) => {
              const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);
              return (
                <div
                  key={order.id}
                  className="px-4 py-3.5 rounded-2xl bg-[#FFF9F3] hover:bg-[#FFF0E2]/70 grid grid-cols-1 md:grid-cols-12 gap-3 items-center transition-colors"
                >
                  <div className="md:col-span-2 flex items-center justify-between md:block">
                    <span className="text-sm font-bold text-[#F97316] tabular-nums">
                      {order.orderNumber}
                    </span>
                    <div className="text-xs text-[#756A62]">{order.type}</div>
                  </div>

                  <div className="md:col-span-3">
                    <div className="text-sm font-bold text-[#3D342E]">
                      {order.tableName || order.customerName}
                    </div>
                    <div className="text-xs text-[#756A62]">
                      Server: {order.waiterName}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <div className="text-xs font-bold text-[#3D342E]">
                      {totalQty} items
                    </div>
                    <div className="text-[11px] text-[#756A62] truncate">
                      {order.items.map((i) => i.name).join(', ')}
                    </div>
                  </div>

                  <div className="md:col-span-2 flex items-center gap-2">
                    <StatusIndicator status={order.status} />
                    <span className="text-[#E6DDD5]">·</span>
                    <span className="text-xs text-[#756A62] tabular-nums inline-flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#F97316]" />
                      {order.elapsedMinutes} min
                    </span>
                  </div>

                  <div className="md:col-span-1 md:text-right">
                    <div className="text-sm font-bold text-[#F97316] tabular-nums">
                      {formatINR(order.total)}
                    </div>
                    <div className="text-[11px] text-[#756A62]">
                      {order.isPaid ? `Paid (${order.paymentMethod})` : 'Unpaid'}
                    </div>
                  </div>

                  <div className="md:col-span-2 flex justify-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setInspectingOrder(order)}
                    >
                      Open
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ORDER CONTEXTUAL DRAWER */}
      <ContextualDrawer
        open={Boolean(inspectingOrder)}
        onClose={() => setInspectingOrder(null)}
        title={
          inspectingOrder
            ? `Order ${inspectingOrder.orderNumber} · ${
                inspectingOrder.tableName || inspectingOrder.customerName
              }`
            : 'Order Details'
        }
        subtitle={
          inspectingOrder
            ? `${inspectingOrder.type} · Created at ${inspectingOrder.createdAt}`
            : undefined
        }
      >
        {inspectingOrder && (
          <div className="space-y-5">
            <div className="flex items-center justify-between bg-[#FFF9F3] rounded-2xl p-4">
              <StatusIndicator status={inspectingOrder.status} />
              <span className="text-xs font-bold text-[#F97316] tabular-nums">
                Elapsed: {inspectingOrder.elapsedMinutes} min
              </span>
            </div>

            <div className="space-y-2">
              {inspectingOrder.items.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-[#FFF9F3] flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-[#3D342E]">
                      {item.name} × {item.quantity}
                    </div>
                    <div className="text-[#756A62] mt-0.5">
                      {item.station} · {item.status}
                    </div>
                  </div>
                  <span className="font-bold text-[#F97316] tabular-nums">
                    {formatINR(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-[#FFF9F3] rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between text-[#756A62]">
                <span>Subtotal</span>
                <span className="font-bold text-[#3D342E] tabular-nums">
                  {formatINR(inspectingOrder.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-[#756A62]">
                <span>Tax</span>
                <span className="font-bold text-[#3D342E] tabular-nums">
                  {formatINR(inspectingOrder.tax)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[#3D342E] pt-2">
                <span>Total</span>
                <span className="text-base text-[#F97316] tabular-nums">
                  {formatINR(inspectingOrder.total)}
                </span>
              </div>
            </div>

            {/* Contextual Status Transitions */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-[#756A62]">
                NEXT OPERATIONAL ACTION
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {inspectingOrder.status !== 'Completed' && (
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => {
                      const next: OrderStatus =
                        inspectingOrder.status === 'New'
                          ? 'Preparing'
                          : inspectingOrder.status === 'Preparing'
                          ? 'Ready'
                          : 'Served';
                      advanceOrderStatus(inspectingOrder.id, next);
                      setInspectingOrder((prev) =>
                        prev ? { ...prev, status: next } : null
                      );
                    }}
                  >
                    Mark{' '}
                    {inspectingOrder.status === 'New'
                      ? 'Preparing'
                      : inspectingOrder.status === 'Preparing'
                      ? 'Ready'
                      : 'Served'}
                  </Button>
                )}

                {inspectingOrder.tableId && !inspectingOrder.isPaid && (
                  <Button
                    variant="primary"
                    size="md"
                    icon={<Receipt className="w-4 h-4" />}
                    onClick={() => {
                      const tId = inspectingOrder.tableId!;
                      setInspectingOrder(null);
                      setBillingTableId(tId);
                    }}
                  >
                    Settle Bill
                  </Button>
                )}

                {inspectingOrder.tableId && (
                  <Button
                    variant="outline"
                    size="md"
                    className="col-span-2"
                    icon={<ArrowUpRight className="w-4 h-4" />}
                    onClick={() => {
                      const tId = inspectingOrder.tableId!;
                      setInspectingOrder(null);
                      setActiveModule('floor');
                      setSelectedTableId(tId);
                    }}
                  >
                    View {inspectingOrder.tableName} on Floor
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </ContextualDrawer>

      {creatingNewOrder && (
        <FastOrderSheet
          tableId={tables[3]?.id || 't-04'}
          onClose={() => setCreatingNewOrder(false)}
        />
      )}

      {billingTableId && (
        <BillingDrawer
          tableId={billingTableId}
          onClose={() => setBillingTableId(null)}
        />
      )}
    </div>
  );
};
