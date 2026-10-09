import React, { useState } from 'react';
import {
  CheckCircle2,
  CreditCard,
  Smartphone,
  Banknote,
  Printer,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { useOperations } from '../../context/OperationsContext';
import { PaymentMethod } from '../../types/operations';
import { Button, ContextualDrawer, ErrorState } from '../ui/Primitives';
import { cn, formatINR } from '../../lib/utils';

export const BillingDrawer: React.FC<{
  tableId: string | null;
  onClose: () => void;
}> = ({ tableId, onClose }) => {
  const { tables, orders, completeTablePayment, setSelectedTableId } = useOperations();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('UPI');
  const [discountInput, setDiscountInput] = useState<number>(50);
  const [simulateError, setSimulateError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedReceipt, setCompletedReceipt] = useState<{
    tableName: string;
    orderNumber: string;
    amount: number;
    method: PaymentMethod;
  } | null>(null);

  if (!tableId) return null;

  const table = tables.find((t) => t.id === tableId);
  const order = table?.currentOrderId
    ? orders.find((o) => o.id === table.currentOrderId)
    : undefined;

  const displayItems =
    order?.items && order.items.length > 0
      ? order.items
      : [
          { id: 'b-1', name: 'Chicken Biryani', quantity: 2, price: 300 },
          { id: 'b-2', name: 'Fragrant Ghee Rice', quantity: 1, price: 250 },
          { id: 'b-3', name: 'Fresh Juice', quantity: 2, price: 100 },
        ];

  const subtotal = order
    ? order.subtotal
    : displayItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const tax = order ? order.tax : 100;
  const total = Math.max(0, subtotal - discountInput + tax);

  const handleCompletePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const res = completeTablePayment(tableId, selectedMethod, discountInput);
      if (res) {
        setCompletedReceipt({
          tableName: table?.name || 'TABLE 04',
          orderNumber: res.orderNumber,
          amount: res.amount,
          method: res.method,
        });
      }
    }, 180);
  };

  const handleCloseAfterSuccess = () => {
    setCompletedReceipt(null);
    setSelectedTableId(null);
    onClose();
  };

  return (
    <ContextualDrawer
      open={Boolean(tableId)}
      onClose={handleCloseAfterSuccess}
      title={completedReceipt ? 'Payment Complete' : `Billing · ${table?.name || 'Table'}`}
      subtitle={
        completedReceipt
          ? 'Receipt generated and table released to floor'
          : `${order?.orderNumber || '#101'} · Final invoice & payment settlement`
      }
    >
      {completedReceipt ? (
        <div className="py-6 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <div className="text-xs uppercase tracking-wider text-[#15803D] font-bold">
              PAYMENT SUCCESSFUL
            </div>
            <h3 className="text-2xl font-bold text-[#3D342E] tabular-nums mt-1">
              {formatINR(completedReceipt.amount)}
            </h3>
            <p className="text-xs text-[#756A62] mt-1">
              Settled via {completedReceipt.method} · Order {completedReceipt.orderNumber}
            </p>
          </div>

          <div className="bg-[#FFF9F3] rounded-2xl p-4 text-left space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#756A62]">Table Status Transition</span>
              <span className="font-bold text-[#15803D]">
                {completedReceipt.tableName} → AVAILABLE
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#756A62]">Settlement Reference</span>
              <span className="font-semibold text-[#3D342E] tabular-nums">
                TXN-UPI-984120
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <Button
              variant="outline"
              size="md"
              className="flex-1"
              icon={<Printer className="w-4 h-4" />}
              onClick={handleCloseAfterSuccess}
            >
              Print GST Receipt
            </Button>
            <Button
              variant="primary"
              size="md"
              className="flex-1"
              icon={<ArrowRight className="w-4 h-4" />}
              onClick={handleCloseAfterSuccess}
            >
              Return to Floor
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Header Table Badge */}
          <div className="flex items-center justify-between bg-[#FFF9F3] rounded-2xl px-4 py-3.5">
            <div>
              <div className="text-sm font-bold text-[#3D342E]">
                {table?.name || 'TABLE 04'}
              </div>
              <div className="text-xs text-[#756A62]">
                {table?.guestCount || 2} Guests · Waiter: {table?.waiterName || 'Karthik R.'}
              </div>
            </div>
            <span className="text-xs text-[#EA580C] font-semibold">
              Waiting for Bill
            </span>
          </div>

          {/* Itemized Bill */}
          <div>
            <div className="text-xs font-semibold text-[#756A62] mb-2">
              ITEMIZED BILL
            </div>
            <div className="bg-[#FFF9F3] rounded-2xl p-2 space-y-1">
              {displayItems.map((item) => (
                <div
                  key={item.id}
                  className="px-3.5 py-2.5 bg-white rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="text-[#3D342E] font-semibold">
                    {item.name}{' '}
                    <span className="text-[#F97316] font-bold ml-1">
                      {item.quantity}X
                    </span>
                  </div>
                  <div className="font-bold text-[#F97316] tabular-nums">
                    {formatINR(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subtotal, Discount, Tax, Total */}
          <div className="bg-[#FFF9F3] rounded-2xl p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-[#756A62]">
              <span>Sub Total</span>
              <span className="font-semibold text-[#3D342E] tabular-nums">
                {formatINR(subtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[#756A62]">
              <span>Discount (INR ₹)</span>
              <input
                type="number"
                min={0}
                max={subtotal}
                value={discountInput}
                onChange={(e) => setDiscountInput(Math.max(0, Number(e.target.value)))}
                className="w-20 px-2.5 py-1 text-right text-xs bg-white rounded-lg border border-[#E8DDD3] tabular-nums"
              />
            </div>
            <div className="flex items-center justify-between text-[#756A62]">
              <span>Tax (GST)</span>
              <span className="font-semibold text-[#3D342E] tabular-nums">
                {formatINR(tax)}
              </span>
            </div>
            <div className="pt-2.5 border-t border-dashed border-[#E8DDD3] flex items-center justify-between text-base font-bold text-[#3D342E]">
              <span>Total Amount</span>
              <span className="tabular-nums">{formatINR(total)}</span>
            </div>
          </div>

          {/* Payment Method Selection (Matching Reference Image: Cash / Credit-Debit Card / QR Code) */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-[#3D342E]">
                SELECT PAYMENT METHOD
              </span>
              <button
                type="button"
                onClick={() => setSimulateError(!simulateError)}
                className="text-[11px] text-[#756A62] hover:text-[#3D342E] inline-flex items-center gap-1 cursor-pointer"
              >
                <AlertTriangle className="w-3 h-3 text-[#F97316]" />
                <span>{simulateError ? 'Hide Error Demo' : 'Test Payment Error State'}</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  { id: 'Cash', label: 'Cash', icon: <Banknote className="w-5 h-5" /> },
                  { id: 'Card', label: 'Credit-Debit Card', icon: <CreditCard className="w-5 h-5" /> },
                  { id: 'UPI', label: 'QR Code / UPI', icon: <Smartphone className="w-5 h-5" /> },
                ] as { id: PaymentMethod; label: string; icon: React.ReactNode }[]
              ).map((m) => {
                const active = selectedMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setSelectedMethod(m.id);
                      setSimulateError(false);
                    }}
                    className={cn(
                      'min-h-[68px] p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-xs font-semibold transition-all cursor-pointer',
                      active
                        ? 'bg-[#FFEDD5] text-[#EA580C]'
                        : 'bg-[#FFF9F3] text-[#3D342E] hover:bg-[#FFF0E2]'
                    )}
                  >
                    <span className={active ? 'text-[#F97316]' : 'text-[#3D342E]'}>
                      {m.icon}
                    </span>
                    <span className="text-[11px] text-[#3D342E]">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {simulateError && (
            <ErrorState
              title="Payment could not be completed."
              reason="UPI payment verification failed due to gateway timeout."
              primaryActionLabel="Try Again"
              onPrimaryAction={() => {
                setSimulateError(false);
                handleCompletePayment();
              }}
              secondaryActionLabel="Choose Another Method"
              onSecondaryAction={() => {
                setSimulateError(false);
                setSelectedMethod('Card');
              }}
            />
          )}

          {/* Primary Complete Payment Action — Solid Brand Orange */}
          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              className="w-full rounded-2xl py-3.5"
              loading={isProcessing}
              onClick={handleCompletePayment}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              Complete Payment ({formatINR(total)} via {selectedMethod})
            </Button>
          </div>
        </div>
      )}
    </ContextualDrawer>
  );
};
