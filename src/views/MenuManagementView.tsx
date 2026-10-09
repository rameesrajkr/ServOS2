import React, { useState } from 'react';
import { Plus, Edit3, Copy, Power, Search, Image as ImageIcon } from 'lucide-react';
import { useOperations } from '../context/OperationsContext';
import { MenuCategory, MenuItem, ProductionStation } from '../types/operations';
import {
  Button,
  ContextualDrawer,
  DishPhoto,
  PageHeader,
  SegmentedTabs,
  StatusIndicator,
} from '../components/ui/Primitives';
import { cn, formatINR } from '../lib/utils';
import { PRESET_DISH_GALLERY } from '../lib/visualAssets';

const MENU_SECTIONS = ['Items', 'Categories', 'Modifiers', 'Availability'] as const;
const CATEGORIES: readonly ('All' | MenuCategory)[] = [
  'All',
  'Popular',
  'Starters',
  'Main Course',
  'Rice',
  'Drinks',
  'Desserts',
];

export const MenuManagementView: React.FC = () => {
  const {
    menuItems,
    toggleMenuItemAvailability,
    saveMenuItem,
    duplicateMenuItem,
  } = useOperations();

  const [section, setSection] =
    useState<(typeof MENU_SECTIONS)[number]>('Items');
  const [categoryFilter, setCategoryFilter] =
    useState<'All' | MenuCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const filteredItems = menuItems.filter((item) => {
    if (categoryFilter === 'Popular' && !item.popular) return false;
    if (
      categoryFilter !== 'All' &&
      categoryFilter !== 'Popular' &&
      item.category !== categoryFilter
    ) {
      return false;
    }
    if (
      searchQuery.trim() &&
      !item.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleOpenNewItem = () => {
    setEditingItem({
      id: `m-${Date.now()}`,
      name: '',
      category: 'Main Course',
      price: 280,
      station: 'Kitchen',
      available: true,
      popular: false,
      prepTimeMinutes: 12,
      isVeg: false,
      description: '',
      imageUrl: PRESET_DISH_GALLERY[0].url,
    });
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.name.trim()) return;
    saveMenuItem(editingItem);
    setEditingItem(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Menu & Culinary Catalogue"
        meta={`${menuItems.length} Dishes`}
        subtitle="Manage restaurant dishes, authentic product photography, pricing, station routing, modifiers, and live 86 availability."
        secondaryActions={
          <SegmentedTabs
            options={MENU_SECTIONS}
            value={section}
            onChange={setSection}
          />
        }
        primaryAction={
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleOpenNewItem}
          >
            Add Dish
          </Button>
        }
      />

      {/* FILTER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <SegmentedTabs
          options={CATEGORIES}
          value={categoryFilter}
          onChange={setCategoryFilter}
        />

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#3D342E] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Product here..."
            className="w-full min-h-[42px] pl-10 pr-4 py-2 text-sm bg-white shadow-[0_4px_14px_rgba(61,52,46,0.04)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#F97316]"
          />
        </div>
      </div>

      {/* MENU ITEMS SHOWCASE GRID — Borderless white cards matching POS reference */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={cn(
              'bg-white rounded-3xl p-4 shadow-[0_8px_24px_-4px_rgba(61,52,46,0.045)] flex flex-col justify-between transition-all hover:shadow-[0_14px_32px_-4px_rgba(249,115,22,0.10)]',
              !item.available && 'opacity-70'
            )}
          >
            <div>
              {/* Rounded Product Photograph */}
              <div className="relative h-44 w-full bg-[#FFF0E2] rounded-2xl overflow-hidden">
                <DishPhoto item={item} />
                {item.popular && (
                  <div className="absolute top-3 left-3 bg-[#FBBF24] text-[#3D342E] px-2.5 py-1 rounded-full text-xs font-bold shadow-xs">
                    Bestseller
                  </div>
                )}
              </div>

              {/* Dish Info */}
              <div className="pt-4 pb-2 px-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-[#3D342E] leading-snug">
                      {item.name}
                    </h3>
                    <div className="text-xs text-[#756A62] mt-1">
                      {item.category} · {item.station} Station · {item.prepTimeMinutes}m prep
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2.5">
                  <span className="text-lg font-bold text-[#F97316] tabular-nums">
                    {formatINR(item.price)}
                  </span>
                  <span className="text-xs font-semibold text-[#756A62] inline-flex items-center gap-1.5">
                    <span
                      className={cn(
                        'w-2.5 h-2.5 rounded-full',
                        item.isVeg ? 'bg-[#16A34A]' : 'bg-[#EA580C]'
                      )}
                    />
                    {item.isVeg ? 'Veg' : 'Non Veg'}
                  </span>
                </div>

                <p className="text-xs text-[#756A62] mt-2 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                {item.modifiers && (
                  <div className="mt-2.5 text-xs text-[#756A62]">
                    <span className="font-semibold text-[#3D342E]">Options:</span>{' '}
                    {[
                      item.modifiers.sizes ? 'Portion Sizes' : null,
                      item.modifiers.spiceLevels ? 'Spice Level' : null,
                      item.modifiers.extras ? 'Add-on Extras' : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                )}
              </div>
            </div>

            {/* Clean Borderless Action Footer */}
            <div className="mt-3 pt-3 px-3 py-2.5 bg-[#FFF9F3] rounded-2xl flex items-center justify-between gap-2">
              <StatusIndicator
                status={item.available ? 'Available' : 'Unavailable'}
              />

              <div className="flex items-center gap-1">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Edit3 className="w-3.5 h-3.5" />}
                  onClick={() => setEditingItem(item)}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Power className="w-3.5 h-3.5" />}
                  onClick={() => toggleMenuItemAvailability(item.id)}
                >
                  {item.available ? '86' : 'Enable'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Copy className="w-3.5 h-3.5" />}
                  onClick={() => duplicateMenuItem(item.id)}
                  title="Duplicate dish"
                >
                  Copy
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CONCISE EDIT / CREATE DRAWER WITH DISH PHOTOGRAPHY PICKER */}
      <ContextualDrawer
        open={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        title={
          editingItem?.name ? `Edit · ${editingItem.name}` : 'Create Menu Item'
        }
        subtitle="Configure dish name, photography, price, category, and production station"
      >
        {editingItem && (
          <form onSubmit={handleSaveForm} className="space-y-5">
            {/* Live Dish Photo Preview & Preset Selector */}
            <div className="space-y-2.5">
              <label className="block text-xs font-semibold text-[#3D342E]">
                Dish Photograph
              </label>
              <div className="h-40 w-full rounded-2xl overflow-hidden bg-[#FFF0E2]">
                <DishPhoto item={editingItem} />
              </div>
              <div className="grid grid-cols-1 gap-1.5 pt-1">
                <span className="text-[11px] text-[#756A62] flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[#F97316]" />
                  Choose from verified KnockOUT studio food photography:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_DISH_GALLERY.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() =>
                        setEditingItem({ ...editingItem, imageUrl: preset.url })
                      }
                      className={cn(
                        'px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer',
                        editingItem.imageUrl === preset.url
                          ? 'bg-[#F97316] text-white'
                          : 'bg-[#FFF9F3] text-[#3D342E] hover:bg-[#FFF0E2]'
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3D342E] mb-1.5">
                Dish Name
              </label>
              <input
                type="text"
                required
                value={editingItem.name}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, name: e.target.value })
                }
                placeholder="e.g., Malabar Pepper Chicken"
                className="w-full min-h-[42px] px-3.5 py-2 text-sm bg-white border border-[#E8DDD3] rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#3D342E] mb-1.5">
                  Price (INR ₹)
                </label>
                <input
                  type="number"
                  required
                  min={10}
                  value={editingItem.price}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      price: Number(e.target.value),
                    })
                  }
                  className="w-full min-h-[42px] px-3.5 py-2 text-sm bg-white border border-[#E8DDD3] rounded-xl tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3D342E] mb-1.5">
                  Category
                </label>
                <select
                  value={editingItem.category}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      category: e.target.value as MenuCategory,
                    })
                  }
                  className="w-full min-h-[42px] px-3.5 py-2 text-sm bg-white border border-[#E8DDD3] rounded-xl"
                >
                  <option value="Starters">Starters</option>
                  <option value="Main Course">Main Course</option>
                  <option value="Rice">Rice</option>
                  <option value="Drinks">Drinks</option>
                  <option value="Desserts">Desserts</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#3D342E] mb-1.5">
                  Production Station
                </label>
                <select
                  value={editingItem.station}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      station: e.target.value as ProductionStation,
                    })
                  }
                  className="w-full min-h-[42px] px-3.5 py-2 text-sm bg-white border border-[#E8DDD3] rounded-xl"
                >
                  <option value="Kitchen">Kitchen</option>
                  <option value="Juice">Juice</option>
                  <option value="Other Production">Other Production</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3D342E] mb-1.5">
                  Prep Time (Minutes)
                </label>
                <input
                  type="number"
                  min={1}
                  value={editingItem.prepTimeMinutes}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      prepTimeMinutes: Number(e.target.value),
                    })
                  }
                  className="w-full min-h-[42px] px-3.5 py-2 text-sm bg-white border border-[#E8DDD3] rounded-xl tabular-nums"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-1">
              <label className="inline-flex items-center gap-2 text-sm font-medium text-[#3D342E] cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingItem.isVeg}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, isVeg: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#16A34A] rounded"
                />
                <span>Vegetarian Dish</span>
              </label>

              <label className="inline-flex items-center gap-2 text-sm font-medium text-[#3D342E] cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(editingItem.popular)}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, popular: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#F97316] rounded"
                />
                <span>Feature as Bestseller</span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3D342E] mb-1.5">
                Description
              </label>
              <textarea
                rows={3}
                value={editingItem.description}
                onChange={(e) =>
                  setEditingItem({
                    ...editingItem,
                    description: e.target.value,
                  })
                }
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E8DDD3] rounded-xl"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingItem(null)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save Dish
              </Button>
            </div>
          </form>
        )}
      </ContextualDrawer>
    </div>
  );
};
