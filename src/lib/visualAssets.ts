import { MenuCategory, MenuItem } from '../types/operations';

/**
 * Authentic, photorealistic hospitality & culinary photography assets
 * generated specifically for KnockOUT Restaurant & Resource Operations.
 */
export const KNOCKOUT_PHOTOS = {
  restaurantHero: '/src/assets/images/restaurant_interior_hero_1791524200297.jpg',
  artisanGrillPlatter: '/src/assets/images/artisan_grill_platter_1791524210378.jpg',
  signatureBiryani: '/src/assets/images/signature_biryani_1791524220169.jpg',
  freshPressedJuices: '/src/assets/images/fresh_pressed_juices_1791524231095.jpg',
  artisanDessertCoffee: '/src/assets/images/artisan_dessert_1791524242444.jpg',
  chefKitchenBrigade: '/src/assets/images/kitchen_brigade_1791524253473.jpg',
} as const;

export const PRESET_DISH_GALLERY: {
  id: string;
  label: string;
  category: MenuCategory;
  url: string;
}[] = [
  {
    id: 'photo-biryani',
    label: 'Saffron Dum Biryani & Handi',
    category: 'Main Course',
    url: KNOCKOUT_PHOTOS.signatureBiryani,
  },
  {
    id: 'photo-grill',
    label: 'Wood-Fired Coastal Grill & Chicken Starter',
    category: 'Starters',
    url: KNOCKOUT_PHOTOS.artisanGrillPlatter,
  },
  {
    id: 'photo-juice',
    label: 'Cold-Pressed Citrus, Watermelon & Mango Juices',
    category: 'Drinks',
    url: KNOCKOUT_PHOTOS.freshPressedJuices,
  },
  {
    id: 'photo-dessert',
    label: 'Artisan Cheesecake, Soufflé & Specialty Coffee',
    category: 'Desserts',
    url: KNOCKOUT_PHOTOS.artisanDessertCoffee,
  },
  {
    id: 'photo-pass',
    label: 'Chef Pass & Plated House Specials',
    category: 'Main Course',
    url: KNOCKOUT_PHOTOS.restaurantHero,
  },
];

/**
 * Returns the most appropriate real-world photograph for a menu item,
 * using item.imageUrl when present or matching by dish id / category.
 */
export function getMenuItemPhoto(item: Pick<MenuItem, 'id' | 'name' | 'category' | 'imageUrl'>): {
  url: string;
  objectPosition: string;
} {
  if (item.imageUrl && item.imageUrl.trim().length > 0) {
    return { url: item.imageUrl, objectPosition: 'center center' };
  }

  switch (item.id) {
    case 'm-1': // Chicken Biryani
      return { url: KNOCKOUT_PHOTOS.signatureBiryani, objectPosition: 'center 45%' };
    case 'm-2': // Malabar Pepper Chicken Starter
      return { url: KNOCKOUT_PHOTOS.artisanGrillPlatter, objectPosition: '65% 40%' };
    case 'm-3': // Fresh Juice
      return { url: KNOCKOUT_PHOTOS.freshPressedJuices, objectPosition: '50% 55%' };
    case 'm-4': // Fragrant Ghee Rice
      return { url: KNOCKOUT_PHOTOS.signatureBiryani, objectPosition: '30% 60%' };
    case 'm-5': // Charcoal Paneer Tikka
      return { url: KNOCKOUT_PHOTOS.artisanGrillPlatter, objectPosition: '35% 35%' };
    case 'm-6': // Mutton Rogan Josh
      return { url: KNOCKOUT_PHOTOS.restaurantHero, objectPosition: '58% 78%' };
    case 'm-7': // Valencia Orange Cold Press
      return { url: KNOCKOUT_PHOTOS.freshPressedJuices, objectPosition: '20% 60%' };
    case 'm-8': // Avocado & Alphonso Smoothie
      return { url: KNOCKOUT_PHOTOS.freshPressedJuices, objectPosition: '80% 60%' };
    case 'm-9': // Garlic Butter Naan Basket
      return { url: KNOCKOUT_PHOTOS.artisanGrillPlatter, objectPosition: '85% 35%' };
    case 'm-10': // Tender Coconut Elaneer Soufflé
      return { url: KNOCKOUT_PHOTOS.artisanDessertCoffee, objectPosition: '70% 55%' };
    case 'm-11': // Smoked Prawns Mango Curry
      return { url: KNOCKOUT_PHOTOS.artisanGrillPlatter, objectPosition: '40% 65%' };
    case 'm-12': // Saffron Pistachio Tres Leches
      return { url: KNOCKOUT_PHOTOS.artisanDessertCoffee, objectPosition: '30% 55%' };
    default:
      break;
  }

  switch (item.category) {
    case 'Drinks':
      return { url: KNOCKOUT_PHOTOS.freshPressedJuices, objectPosition: 'center center' };
    case 'Desserts':
      return { url: KNOCKOUT_PHOTOS.artisanDessertCoffee, objectPosition: 'center center' };
    case 'Starters':
      return { url: KNOCKOUT_PHOTOS.artisanGrillPlatter, objectPosition: 'center center' };
    case 'Rice':
      return { url: KNOCKOUT_PHOTOS.signatureBiryani, objectPosition: 'center center' };
    case 'Main Course':
    default:
      return { url: KNOCKOUT_PHOTOS.artisanGrillPlatter, objectPosition: 'center center' };
  }
}
