import React, { useState, useEffect } from 'react';
import {
  Flame,
  Clock,
  CheckCircle2,
  Play,
  ArrowLeft,
  Utensils,
  CupSoda,
  Sparkles,
} from 'lucide-react';
import { useOperations } from '../context/OperationsContext';
import { OrderStatus, ProductionStation } from '../types/operations';
import { Button, SegmentedTabs } from '../components/ui/Primitives';
import { cn } from '../lib/utils';

const STATION_TABS = ['All Stations', 'Kitchen', 'Juice', 'Other Production'] as const;

const COLUMNS: {
  id: OrderStatus;
  title: string;
  subtitle: string;
}[] = [
  { id: 'New', title: 'NEW', subtitle: 'Just fired from floor/POS' },
  { id: 'Preparing', title: 'PREPARING', subtitle: 'Active on range / station' },
  { id: 'Ready', title: 'READY', subtitle: 'Awaiting runner pickup' },
  { id: 'Served', title: 'COMPLETED', subtitle: 'Dispatched from pass' },
];

export const KitchenDisplayView: React.FC<{
  defaultStation?: 'All Stations' | ProductionStation;
}> = ({ defaultStation = 'All Stations' }) => {
  const {
    orders,
    advanceOrderStatus,
    setActiveModule,
    setSelectedTableId,
  } = useOperations();

  const [stationFilter, setStationFilter] = useState<
    (typeof STATION_TABS)[number]
  >(defaultStation);

  useEffect(() => {
    setStationFilter(defaultStation);
  }, [defaultStation]);

  // Filter orders that have items belonging to the active station
  const stationOrders = orders.filter((o) => {
    if (o.status === 'Cancelled') return false;
    if (stationFilter === 'All Stations') return true;
    return o.items.some((item) => item.station === stationFilter);
  });

  const getColumnOrders = (colId: OrderStatus) => {
    if (colId === 'Served') {
      return stationOrders.filter(
        (o) => o.status === 'Served' || o.status === 'Completed'
      );
    }
    return stationOrders.filter((o) => o.status === colId);
  };

  return (
    <div className="space-y-5">
      {/* PRODUCTION BOARD HEADER — Borderless White Surface */}
      <div className="bg-white rounded-3xl p-5 shadow-[0_8px_24px_-4px_rgba(61,52,46,0.045)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F97316]">
              {stationFilter === 'Juice' ? (
                <CupSoda className="w-4 h-4 text-[#0D9488]" />
              ) : (
                <Flame className="w-4 h-4 text-[#F97316]" />
              )}
              LIVE PRODUCTION DISPLAY
            </span>
            <span className="text-[#E6DDD5]">·</span>
            <span className="text-xs text-[#756A62] tabular-nums">
              Avg Prep Time: 11m 20s
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#3D342E] mt-1">
            {stationFilter === 'Juice'
              ? 'Juice & Cold-Press Production Queue'
              : 'Kitchen Production Board (KDS)'}
          </h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <SegmentedTabs
            options={STATION_TABS}
            value={stationFilter}
            onChange={setStationFilter}
          />
          <Button
            variant="secondary"
            size="md"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => setActiveModule('floor')}
          >
            Back to Floor
          </Button>
        </div>
      </div>

      {/* 4-COLUMN PRODUCTION BOARD (Section 18 & 19) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {COLUMNS.map((col) => {
          const colOrders = getColumnOrders(col.id);

          return (
            <div
              key={col.id}
              className="bg-[#FFF0E2]/70 rounded-3xl p-4 flex flex-col min-h-[520px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-2 pb-3">
                <div>
                  <h2 className="text-sm font-bold tracking-wide text-[#3D342E]">
                    {col.title}
                  </h2>
                  <p className="text-xs text-[#756A62]">{col.subtitle}</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-white text-xs font-bold text-[#F97316] tabular-nums shadow-2xs">
                  {colOrders.length}
                </span>
              </div>

              {/* Ticket Cards */}
              <div className="mt-2 space-y-3.5 flex-1">
                {colOrders.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#756A62]">
                    No tickets in {col.title}
                  </div>
                ) : (
                  colOrders.map((order) => {
                    const visibleItems =
                      stationFilter === 'All Stations'
                        ? order.items
                        : order.items.filter((i) => i.station === stationFilter);

                    const isDelayed =
                      (order.status === 'New' || order.status === 'Preparing') &&
                      order.elapsedMinutes >= 12;

                    return (
                      <div
                        key={order.id}
                        className={cn(
                          'bg-white rounded-2xl p-4 flex flex-col justify-between transition-all shadow-[0_8px_24px_-4px_rgba(61,52,46,0.045)]',
                          isDelayed && 'ring-2 ring-[#F97316]'
                        )}
                      >
                        {/* Top Ticket Header: Order # + Table + Elapsed Time */}
                        <div>
                          <div className="flex items-start justify-between gap-2 pb-3 px-3 py-2.5 rounded-xl bg-[#FFF9F3]">
                            <div>
                              <div className="text-base font-bold text-[#F97316] tabular-nums">
                                {order.orderNumber}
                              </div>
                              <div className="text-xs font-bold text-[#3D342E] uppercase tracking-tight mt-0.5">
                                {order.tableName
                                  ? order.tableName.toUpperCase()
                                  : `PARCEL · ${order.customerName}`}
                              </div>
                            </div>

                            <div
                              className={cn(
                                'inline-flex items-center gap-1 text-xs font-semibold tabular-nums',
                                isDelayed ? 'text-[#DC2626]' : 'text-[#756A62]'
                              )}
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>{order.elapsedMinutes} min</span>
                            </div>
                          </div>

                          {/* Large Readable Items List */}
                          <ul className="py-3 space-y-2 px-1">
                            {visibleItems.map((item) => (
                              <li
                                key={item.id}
                                className="flex items-start justify-between gap-2 text-sm"
                              >
                                <div className="font-semibold text-[#3D342E] leading-snug">
                                  {item.name}
                                  {(item.size || item.spice || item.notes) && (
                                    <div className="text-xs font-normal text-[#EA580C] mt-0.5">
                                      {[item.size, item.spice, item.notes]
                                        .filter(Boolean)
                                        .join(' · ')}
                                    </div>
                                  )}
                                </div>
                                <span className="font-bold text-[#F97316] shrink-0 tabular-nums">
                                  × {item.quantity}
                                </span>
                              </li>
                            ))}
                          </ul>

                          {order.notes && (
                            <div className="mb-3 px-3 py-2 bg-[#FFF0E2] rounded-xl text-xs text-[#3D342E]">
                              <span className="font-semibold text-[#EA580C]">Note:</span> {order.notes}
                            </div>
                          )}
                        </div>

                        {/* Contextual Next Action Buttons */}
                        <div className="pt-2 flex items-center gap-2">
                          {order.status === 'New' && (
                            <>
                              <Button
                                variant="primary"
                                size="md"
                                className="flex-1"
                                icon={<Play className="w-3.5 h-3.5" />}
                                onClick={() =>
                                  advanceOrderStatus(order.id, 'Preparing')
                                }
                              >
                                Start
                              </Button>
                              <Button
                                variant="outline"
                                size="md"
                                onClick={() => advanceOrderStatus(order.id, 'Ready')}
                              >
                                Ready
                              </Button>
                            </>
                          )}

                          {order.status === 'Preparing' && (
                            <Button
                              variant="secondary"
                              size="md"
                              className="w-full"
                              icon={<CheckCircle2 className="w-4 h-4" />}
                              onClick={() => advanceOrderStatus(order.id, 'Ready')}
                            >
                              Mark Ready
                            </Button>
                          )}

                          {order.status === 'Ready' && (
                            <div className="w-full flex items-center gap-2">
                              <Button
                                variant="success"
                                size="md"
                                className="flex-1"
                                icon={<Utensils className="w-3.5 h-3.5" />}
                                onClick={() => advanceOrderStatus(order.id, 'Served')}
                              >
                                Mark Served
                              </Button>
                              {order.tableId && (
                                <Button
                                  variant="outline"
                                  size="md"
                                  onClick={() => {
                                    setActiveModule('floor');
                                    setSelectedTableId(order.tableId || null);
                                  }}
                                >
                                  Table
                                </Button>
                              )}
                            </div>
                          )}

                          {(order.status === 'Served' ||
                            order.status === 'Completed') && (
                            <div className="w-full flex items-center justify-between text-xs text-zinc-500">
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                                <Sparkles className="w-3.5 h-3.5" /> Dispatched
                              </span>
                              {order.tableId && (
                                <button
                                  onClick={() => {
                                    setActiveModule('floor');
                                    setSelectedTableId(order.tableId || null);
                                  }}
                                  className="text-xs font-medium text-zinc-700 hover:underline cursor-pointer"
                                >
                                  Open {order.tableName} →
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
