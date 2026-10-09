import React, { useState } from 'react';
import {
  Plus,
  Minus,
  Search,
  SlidersHorizontal,
  Send,
  X,
  Trash2,
  Flame,
  LayoutGrid,
  Utensils,
  Soup,
  CupSoda,
  CakeSlice,
} from 'lucide-react';
import { useOperations } from '../../context/OperationsContext';
import { MenuCategory, MenuItem } from '../../types/operations';
import { Button, DishPhoto } from '../ui/Primitives';
import { cn, formatINR } from '../../lib/utils';

const CATEGORIES: MenuCategory[] = [
  'Popular',
  'Starters',
  'Main Course',
  'Rice',
  'Drinks',
  'Desserts',
];

const CATEGORY_ICONS: Record<MenuCategory, React.ReactNode> = {
  Popular: <LayoutGrid className="w-5 h-5 text-[#F97316]" />,
  Starters: <Flame className="w-5 h-5 text-[#F97316]" />,
  'Main Course': <Utensils className="w-5 h-5 text-[#F97316]" />,
  Rice: <Soup className="w-5 h-5 text-[#F97316]" />,
  Drinks: <CupSoda className="w-5 h-5 text-[#F97316]" />,
  Desserts: <CakeSlice className="w-5 h-5 text-[#F97316]" />,
};

interface DraftCartItem {
  key: string;
  menuItem: MenuItem;
  quantity: number;
  size?: string;
  spice?: string;
  extras: string[];
  notes?: string;
  unitPrice: number;
}

export const FastOrderSheet: React.FC<{
  tableId: string | null;
  onClose: () => void;
  onSentToKitchen?: () => void;
}> = ({ tableId, onClose, onSentToKitchen }) => {
  const { tables, menuItems, sendOrderToKitchen } = useOperations();

  const [selectedCategory, setSelectedCategory] = useState<MenuCategory>('Popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<DraftCartItem[]>([]);
  const [orderNote, setOrderNote] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [modSize, setModSize] = useState<string>('');
  const [modSpice, setModSpice] = useState<string>('Medium');
  const [modExtras, setModExtras] = useState<string[]>([]);
  const [modNote, setModNote] = useState<string>('');
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  const targetTable = tableId ? tables.find((t) => t.id === tableId) : null;

  const filteredItems = menuItems.filter((item) => {
    if (!item.available) return false;
    if (searchQuery.trim()) {
      return (
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedCategory === 'Popular') {
      return Boolean(item.popular);
    }
    return item.category === selectedCategory;
  });

  // Immediate 1-click add
  const handleQuickAddItem = (item: MenuItem) => {
    const key = `${item.id}-default`;
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.key === key);
      if (idx > -1) {
        return prev.map((c, i) => (i === idx ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [
        ...prev,
        {
          key,
          menuItem: item,
          quantity: 1,
          extras: [],
          unitPrice: item.price,
        },
      ];
    });
  };

  // Decrement default item directly from card stepper
  const handleQuickDecrementItem = (item: MenuItem) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.menuItem.id === item.id);
      if (idx === -1) return prev;
      return prev
        .map((c, i) => (i === idx ? { ...c, quantity: c.quantity - 1 } : c))
        .filter((c) => c.quantity > 0);
    });
  };

  // Add with custom modifiers
  const handleAddCustomizedItem = () => {
    if (!customizingItem) return;
    const sizeObj = customizingItem.modifiers?.sizes?.find((s) => s.label === modSize);
    const extrasDelta = modExtras.reduce((sum, extLabel) => {
      const found = customizingItem.modifiers?.extras?.find((e) => e.label === extLabel);
      return sum + (found?.price || 0);
    }, 0);
    const unitPrice = customizingItem.price + (sizeObj?.priceDelta || 0) + extrasDelta;

    const key = `${customizingItem.id}-${modSize}-${modSpice}-${modExtras.join(',')}-${modNote}`;
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.key === key);
      if (idx > -1) {
        return prev.map((c, i) => (i === idx ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [
        ...prev,
        {
          key,
          menuItem: customizingItem,
          quantity: 1,
          size: modSize || undefined,
          spice: modSpice || undefined,
          extras: modExtras,
          notes: modNote || undefined,
          unitPrice,
        },
      ];
    });
    setCustomizingItem(null);
    setModExtras([]);
    setModNote('');
  };

  const updateCartQuantity = (key: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.key === key ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0)
    );
  };

  const cartSubtotal = cart.reduce((sum, c) => sum + c.unitPrice * c.quantity, 0);
  const cartTax = Math.round(cartSubtotal * 0.05);
  const cartTotal = cartSubtotal + cartTax;
  const totalItemsCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const handleFireOrder = () => {
    if (cart.length === 0) return;
    sendOrderToKitchen(
      tableId,
      cart.map((c) => ({
        menuItemId: c.menuItem.id,
        name: c.menuItem.name,
        price: c.unitPrice,
        quantity: c.quantity,
        station: c.menuItem.station,
        size: c.size,
        spice: c.spice,
        extras: c.extras.length > 0 ? c.extras : undefined,
        notes: c.notes,
      })),
      {
        customerName: customerName.trim() || undefined,
        note: orderNote.trim() || undefined,
      }
    );
    if (onSentToKitchen) {
      onSentToKitchen();
    } else {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[#3D342E]/35 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Fast Order Creation POS"
    >
      <div className="m-auto w-full h-full md:h-[92vh] md:max-w-6xl bg-[#FFF9F3] md:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* TOP POS BAR — Borderless warm search header */}
        <div className="h-18 px-5 sm:px-7 bg-[#FFF9F3] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1.5 rounded-2xl bg-[#F97316] text-white text-xs font-bold">
              {targetTable ? targetTable.name : 'TAKEAWAY PARCEL'}
            </span>
            <div>
              <h2 className="text-base font-bold text-[#3D342E]">
                Fast Order Terminal
              </h2>
              <p className="text-xs text-[#756A62] hidden sm:block">
                Select category or tap any dish to add immediately
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-[#3D342E] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Product here..."
                className="w-full min-h-[44px] pl-10 pr-4 py-2 text-xs bg-white rounded-2xl shadow-[0_4px_14px_rgba(61,52,46,0.04)] focus:outline-none focus:ring-2 focus:ring-[#F97316]"
              />
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Order Terminal"
            className="min-h-[42px] min-w-[42px] inline-flex items-center justify-center rounded-2xl bg-white text-[#756A62] hover:text-[#3D342E] shadow-[0_4px_14px_rgba(61,52,46,0.04)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MAIN POS BODY */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* LEFT & CENTER WORKSPACE: CATEGORY CARDS + DISH GRID */}
          <div className="flex-1 flex flex-col overflow-y-auto px-5 sm:px-7 pb-6 space-y-5">
            {/* HORIZONTAL CATEGORY CARDS (Matching Reference Image) */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 shrink-0">
              {CATEGORIES.map((cat) => {
                const active = selectedCategory === cat && !searchQuery;
                const count =
                  cat === 'Popular'
                    ? menuItems.filter((m) => m.popular && m.available).length
                    : menuItems.filter((m) => m.category === cat && m.available).length;
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setSearchQuery('');
                    }}
                    className={cn(
                      'p-3.5 rounded-2xl text-left transition-all cursor-pointer flex flex-col justify-between min-h-[92px]',
                      active
                        ? 'bg-[#FFEDD5] shadow-[0_6px_16px_rgba(249,115,22,0.12)]'
                        : 'bg-white hover:bg-[#FFFDFB] shadow-[0_4px_14px_rgba(61,52,46,0.04)]'
                    )}
                  >
                    <div>{CATEGORY_ICONS[cat]}</div>
                    <div className="mt-2">
                      <div className="text-xs font-bold text-[#3D342E] truncate">
                        {cat}
                      </div>
                      <div className="text-[11px] text-[#756A62] mt-0.5 tabular-nums">
                        {count} Items
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* MENU ITEMS GRID — Borderless white cards with soft peach CTA & orange stepper */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => {
                const inCartCount = cart
                  .filter((c) => c.menuItem.id === item.id)
                  .reduce((s, c) => s + c.quantity, 0);

                return (
                  <div
                    key={item.id}
                    className={cn(
                      'bg-white rounded-3xl p-3.5 flex flex-col justify-between transition-all shadow-[0_8px_24px_-4px_rgba(61,52,46,0.045)]',
                      inCartCount > 0 && 'ring-2 ring-[#F97316]'
                    )}
                  >
                    <div>
                      <div
                        onClick={() => handleQuickAddItem(item)}
                        className="h-36 w-full bg-[#FFF0E2] rounded-2xl relative overflow-hidden cursor-pointer select-none"
                      >
                        <DishPhoto item={item} />
                        {item.popular && (
                          <div className="absolute top-2.5 left-2.5 bg-[#FBBF24] text-[#3D342E] px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                            Bestseller
                          </div>
                        )}
                      </div>

                      <div className="pt-3 pb-2 px-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-sm font-bold text-[#3D342E] leading-snug line-clamp-2">
                            {item.name}
                          </div>
                          {item.modifiers && (
                            <button
                              type="button"
                              onClick={() => {
                                setCustomizingItem(item);
                                setModSize(item.modifiers?.sizes?.[0]?.label || '');
                                setModSpice(item.modifiers?.spiceLevels?.[1] || 'Medium');
                                setModExtras([]);
                                setModNote('');
                              }}
                              title="Customize portion or spice"
                              className="p-1.5 rounded-lg bg-[#FFF9F3] hover:bg-[#FFF0E2] text-[#F97316] shrink-0 cursor-pointer"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-bold text-[#F97316] tabular-nums">
                            {formatINR(item.price)}
                          </span>
                          <span className="text-[11px] font-medium text-[#756A62] inline-flex items-center gap-1">
                            <span
                              className={cn(
                                'w-2 h-2 rounded-full',
                                item.isVeg ? 'bg-[#16A34A]' : 'bg-[#EA580C]'
                              )}
                            />
                            {item.isVeg ? 'Veg' : 'Non Veg'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action: Soft Peach "Add to Dish" or Inline Orange Stepper */}
                    <div className="pt-1.5">
                      {inCartCount > 0 ? (
                        <div className="w-full min-h-[40px] px-3 py-1.5 rounded-xl bg-[#FFF9F3] flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => handleQuickDecrementItem(item)}
                            className="w-7 h-7 rounded-full bg-[#F97316] hover:bg-[#EA580C] text-white flex items-center justify-center cursor-pointer transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-sm font-bold text-[#3D342E] tabular-nums">
                            {inCartCount}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuickAddItem(item)}
                            className="w-7 h-7 rounded-full bg-[#F97316] hover:bg-[#EA580C] text-white flex items-center justify-center cursor-pointer transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleQuickAddItem(item)}
                          className="w-full min-h-[40px] py-2 rounded-xl bg-[#FFEDD5] hover:bg-[#FED7AA] text-[#3D342E] text-xs font-bold transition-colors cursor-pointer"
                        >
                          Add to Dish
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: CURRENT ORDER TICKET PANEL (Borderless White Panel Matching Reference Image) */}
          <div
            className={cn(
              'md:w-92 bg-white shadow-[-4px_0_24px_rgba(61,52,46,0.04)] flex flex-col shrink-0',
              mobileCartOpen
                ? 'fixed inset-0 z-50 md:static'
                : 'hidden md:flex'
            )}
          >
            <div className="px-6 pt-5 pb-3 flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-[#3D342E]">
                  {targetTable ? targetTable.name : 'Takeaway Counter'}
                </div>
                <div className="text-xs text-[#756A62]">
                  {targetTable?.waiterName || 'Server: Arun'}
                </div>
              </div>
              {mobileCartOpen && (
                <button
                  onClick={() => setMobileCartOpen(false)}
                  className="md:hidden p-2 rounded-xl bg-[#FFF9F3] text-[#756A62]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Mode Pill Bar (Dine In / Take Away) */}
            <div className="px-6 pb-3">
              <div className="grid grid-cols-2 gap-1 p-1 bg-[#FFF9F3] rounded-2xl text-xs font-semibold">
                <div
                  className={cn(
                    'py-2 rounded-xl text-center',
                    targetTable
                      ? 'bg-[#FFEDD5] text-[#3D342E]'
                      : 'text-[#756A62]'
                  )}
                >
                  Dine In
                </div>
                <div
                  className={cn(
                    'py-2 rounded-xl text-center',
                    !targetTable
                      ? 'bg-[#FFEDD5] text-[#3D342E]'
                      : 'text-[#756A62]'
                  )}
                >
                  Take Away
                </div>
              </div>
            </div>

            {!targetTable && (
              <div className="px-6 pb-3">
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Guest Name for Parcel (e.g., John)..."
                  className="w-full px-3.5 py-2 text-xs bg-[#FFF9F3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                />
              </div>
            )}

            {/* Cart Items List with Dish Thumbnails */}
            <div className="flex-1 overflow-y-auto px-6 py-2 space-y-2.5">
              {cart.length === 0 ? (
                <div className="py-12 text-center bg-[#FFF9F3] rounded-2xl p-6">
                  <p className="text-xs font-bold text-[#3D342E]">
                    No dishes added yet
                  </p>
                  <p className="text-[11px] text-[#756A62] mt-1">
                    Tap &ldquo;Add to Dish&rdquo; on any item to build the order immediately.
                  </p>
                </div>
              ) : (
                cart.map((c) => (
                  <div
                    key={c.key}
                    className="p-3 rounded-2xl bg-[#FFF9F3] flex items-center gap-3"
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#FFF0E2] shrink-0">
                      <DishPhoto item={c.menuItem} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-[#3D342E] truncate">
                        {c.menuItem.name}
                      </div>
                      {(c.size || c.spice || c.extras.length > 0 || c.notes) && (
                        <div className="text-[10px] text-[#756A62] truncate mt-0.5">
                          {[c.size, c.spice, ...c.extras, c.notes]
                            .filter(Boolean)
                            .join(' · ')}
                        </div>
                      )}
                      <div className="mt-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-bold text-[#F97316] tabular-nums">
                            {formatINR(c.unitPrice)}
                          </span>
                          <span className="text-[#756A62] font-semibold">
                            {c.quantity}X
                          </span>
                        </div>
                        <span className="text-xs font-bold text-[#F97316] tabular-nums">
                          {formatINR(c.unitPrice * c.quantity)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(c.key, 1)}
                        className="w-6 h-6 rounded-full bg-white text-[#3D342E] hover:bg-[#FFEDD5] flex items-center justify-center cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(c.key, -1)}
                        className="w-6 h-6 rounded-full bg-white text-[#756A62] hover:bg-[#FFEDD5] flex items-center justify-center cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        {c.quantity === 1 ? (
                          <Trash2 className="w-3 h-3 text-[#DC2626]" />
                        ) : (
                          <Minus className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Kitchen Note & Totals Footer */}
            <div className="p-6 space-y-3.5">
              <input
                type="text"
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder="Add kitchen note (e.g., Less oil, serve starter first)..."
                className="w-full px-3.5 py-2 text-xs bg-[#FFF9F3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F97316]"
              />

              <div className="bg-[#FFF9F3] rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between text-[#756A62]">
                  <span>Sub Total ({totalItemsCount} items)</span>
                  <span className="font-semibold text-[#3D342E] tabular-nums">
                    {formatINR(cartSubtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-[#756A62]">
                  <span>Tax 5%</span>
                  <span className="font-semibold text-[#3D342E] tabular-nums">
                    {formatINR(cartTax)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#3D342E] pt-2 border-t border-dashed border-[#E8DDD3]">
                  <span>Total Amount</span>
                  <span className="text-base tabular-nums">{formatINR(cartTotal)}</span>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full rounded-2xl py-3"
                disabled={cart.length === 0}
                onClick={handleFireOrder}
                icon={<Send className="w-4 h-4" />}
              >
                Place Order ({totalItemsCount})
              </Button>
            </div>
          </div>
        </div>

        {/* MOBILE STICKY CART TRIGGER */}
        {cart.length > 0 && !mobileCartOpen && (
          <div className="md:hidden p-3.5 bg-white shadow-[0_-4px_20px_rgba(61,52,46,0.06)] flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-[#3D342E]">
                {totalItemsCount} items in ticket
              </div>
              <div className="text-sm font-bold text-[#F97316] tabular-nums">
                {formatINR(cartTotal)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setMobileCartOpen(true)}
              >
                Review Cart
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleFireOrder}
                icon={<Flame className="w-4 h-4" />}
              >
                Place Order
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* MODIFIER POPOVER / MODAL */}
      {customizingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3D342E]/35 backdrop-blur-[1px]">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2">
              <div>
                <h3 className="text-base font-bold text-[#3D342E]">
                  Customize {customizingItem.name}
                </h3>
                <p className="text-xs text-[#756A62]">
                  Select size, spice level, or add-ons
                </p>
              </div>
              <button
                onClick={() => setCustomizingItem(null)}
                className="p-2 rounded-xl text-[#756A62] hover:bg-[#FFF0E2]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {customizingItem.modifiers?.sizes && (
              <div>
                <label className="block text-xs font-semibold text-[#3D342E] mb-1.5">
                  Portion Size
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {customizingItem.modifiers.sizes.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => setModSize(s.label)}
                      className={cn(
                        'px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors',
                        modSize === s.label
                          ? 'bg-[#F97316] text-white'
                          : 'bg-[#FFF9F3] text-[#3D342E] hover:bg-[#FFF0E2]'
                      )}
                    >
                      <span>{s.label}</span>
                      <span className="tabular-nums">
                        {s.priceDelta >= 0 ? `+₹${s.priceDelta}` : `-₹${Math.abs(s.priceDelta)}`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {customizingItem.modifiers?.spiceLevels && (
              <div>
                <label className="block text-xs font-semibold text-[#3D342E] mb-1.5">
                  Spice Level
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {customizingItem.modifiers.spiceLevels.map((sp) => (
                    <button
                      key={sp}
                      type="button"
                      onClick={() => setModSpice(sp)}
                      className={cn(
                        'py-2 px-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors',
                        modSpice === sp
                          ? 'bg-[#F97316] text-white'
                          : 'bg-[#FFF9F3] text-[#3D342E] hover:bg-[#FFF0E2]'
                      )}
                    >
                      {sp}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {customizingItem.modifiers?.extras && (
              <div>
                <label className="block text-xs font-semibold text-[#3D342E] mb-1.5">
                  Extras
                </label>
                <div className="space-y-1.5">
                  {customizingItem.modifiers.extras.map((ext) => {
                    const checked = modExtras.includes(ext.label);
                    return (
                      <button
                        key={ext.label}
                        type="button"
                        onClick={() =>
                          setModExtras((prev) =>
                            checked
                              ? prev.filter((x) => x !== ext.label)
                              : [...prev, ext.label]
                          )
                        }
                        className={cn(
                          'w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors',
                          checked
                            ? 'bg-[#FFEDD5] text-[#EA580C]'
                            : 'bg-[#FFF9F3] text-[#3D342E] hover:bg-[#FFF0E2]'
                        )}
                      >
                        <span>{ext.label}</span>
                        <span className="tabular-nums">+₹{ext.price}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#3D342E] mb-1">
                Item Note
              </label>
              <input
                type="text"
                value={modNote}
                onChange={(e) => setModNote(e.target.value)}
                placeholder="e.g., No coriander, extra crispy"
                className="w-full px-3.5 py-2 text-xs bg-[#FFF9F3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F97316]"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setCustomizingItem(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleAddCustomizedItem}>
                Add to Order
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
