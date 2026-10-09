import React, { useState } from 'react';
import { Plus, CheckCircle2, ShoppingBag, Clock } from 'lucide-react';
import { useOperations } from '../context/OperationsContext';
import { Order } from '../types/operations';
import {
  Button,
  ContextualDrawer,
  EmptyState,
  PageHeader,
  SegmentedTabs,
  StatusIndicator,
} from '../components/ui/Primitives';
import { FastOrderSheet } from '../components/floor/FastOrderSheet';
import { formatINR } from '../lib/utils';

const TAKEAWAY_TABS = ['New', 'Preparing', 'Ready', 'Completed'] as const;

export const TakeawayView: React.FC = () => {
  const { orders, advanceOrderStatus, completeTakeawayOrder } = useOperations();

  const [activeTab, setActiveTab] =
    useState<(typeof TAKEAWAY_TABS)[number]>('Preparing');
  const [selectedParcel, setSelectedParcel] = useState<Order | null>(null);
  const [newParcelOpen, setNewParcelOpen] = useState(false);

  const takeawayOrders = orders.filter((o) => o.type === 'Takeaway');

  const filtered = takeawayOrders.filter((o) => {
    if (activeTab === 'Completed') {
      return o.status === 'Completed' || o.status === 'Served';
    }
    return o.status === activeTab;
  });

  const tabCounts = TAKEAWAY_TABS.reduce((acc, tab) => {
    acc[tab] = takeawayOrders.filter((o) =>
      tab === 'Completed'
        ? o.status === 'Completed' || o.status === 'Served'
        : o.status === tab
    ).length;
    return acc;
  }, {} as Record<(typeof TAKEAWAY_TABS)[number], number>);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Takeaway / Parcel"
        meta={`${takeawayOrders.length} Active Parcels`}
        subtitle="Manage counter pickup orders, packaging readiness, and parcel handovers."
        primaryAction={
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setNewParcelOpen(true)}
          >
            New Takeaway Order
          </Button>
        }
      />

      <SegmentedTabs
        options={TAKEAWAY_TABS}
        value={activeTab}
        onChange={setActiveTab}
        counts={tabCounts}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="w-5 h-5" />}
          title={`No ${activeTab.toLowerCase()} takeaway orders`}
          description="New counter pickup and parcel orders will appear here."
          actionLabel="Create Takeaway Order"
          onAction={() => setNewParcelOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((parcel) => {
            const itemCount = parcel.items.reduce((s, i) => s + i.quantity, 0);
            return (
              <div
                key={parcel.id}
                className="bg-white rounded-3xl p-5 shadow-[0_8px_24px_-4px_rgba(61,52,46,0.045)] flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-base font-bold text-[#F97316] tabular-nums">
                        {parcel.orderNumber}
                      </div>
                      <div className="text-sm font-bold text-[#3D342E] mt-0.5">
                        {parcel.customerName || 'Walk-in Guest'} · Pickup
                      </div>
                    </div>
                    <StatusIndicator
                      status={parcel.isPaid ? 'Paid' : 'Pending'}
                    />
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-xs text-[#756A62]">
                    <span>{itemCount} items</span>
                    <span>·</span>
                    <span className="font-bold text-[#F97316] tabular-nums">
                      {formatINR(parcel.total)}
                    </span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Clock className="w-3 h-3 text-[#F97316]" /> {parcel.elapsedMinutes}m
                    </span>
                  </div>

                  <div className="mt-3 p-3 rounded-2xl bg-[#FFF9F3] space-y-1.5 text-xs text-[#3D342E]">
                    {parcel.items.map((i) => (
                      <div key={i.id} className="flex justify-between">
                        <span className="font-medium">{i.name}</span>
                        <span className="font-bold text-[#F97316] tabular-nums">×{i.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-1 flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedParcel(parcel)}
                  >
                    Open
                  </Button>
                  {parcel.status !== 'Ready' && parcel.status !== 'Completed' && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1"
                      onClick={() => advanceOrderStatus(parcel.id, 'Ready')}
                    >
                      Mark Ready
                    </Button>
                  )}
                  {parcel.status === 'Ready' && (
                    <Button
                      variant="success"
                      size="sm"
                      className="flex-1"
                      icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      onClick={() => completeTakeawayOrder(parcel.id)}
                    >
                      Complete
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAKEAWAY DETAIL DRAWER */}
      <ContextualDrawer
        open={Boolean(selectedParcel)}
        onClose={() => setSelectedParcel(null)}
        title={selectedParcel ? `Takeaway ${selectedParcel.orderNumber}` : 'Parcel'}
        subtitle={
          selectedParcel
            ? `${selectedParcel.customerName} · ${selectedParcel.customerPhone || 'Counter Pickup'}`
            : undefined
        }
      >
        {selectedParcel && (
          <div className="space-y-4">
            <div className="p-4 bg-[#FFF9F3] rounded-2xl flex items-center justify-between">
              <StatusIndicator status={selectedParcel.status} />
              <span className="text-sm font-bold text-[#F97316] tabular-nums">
                {formatINR(selectedParcel.total)} (
                {selectedParcel.isPaid ? 'Paid' : 'Pay on Pickup'})
              </span>
            </div>

            <div className="space-y-2">
              {selectedParcel.items.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-[#FFF9F3] flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-[#3D342E]">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="font-bold text-[#F97316] tabular-nums">
                    {formatINR(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={() => {
                  advanceOrderStatus(selectedParcel.id, 'Ready');
                  setSelectedParcel(null);
                }}
              >
                Mark Ready
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={() => {
                  completeTakeawayOrder(selectedParcel.id);
                  setSelectedParcel(null);
                }}
              >
                Complete Handover
              </Button>
            </div>
          </div>
        )}
      </ContextualDrawer>

      {newParcelOpen && (
        <FastOrderSheet
          tableId={null}
          onClose={() => setNewParcelOpen(false)}
        />
      )}
    </div>
  );
};
