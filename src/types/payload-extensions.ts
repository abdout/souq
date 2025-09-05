import type { Tenant as BaseTenant, Book as BaseBook, Order as BaseOrder, User as BaseUser } from "@/payload-types";

export interface Tenant extends BaseTenant {
  businessType: 'restaurant' | 'pharmacy' | 'grocery';
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  deliveryRadius: number;
  minimumOrder: number;
  deliveryFee: number;
  operatingHours: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  };
  isActive?: boolean;
  businessLicense?: string;
  email?: string;
}

export interface Book extends BaseBook {
  businessType: 'food' | 'medicine' | 'grocery';
  inventory: number;
  lowStockThreshold?: number;
  trackInventory?: boolean;
  unit: 'piece' | 'kg' | 'liter' | 'pack' | 'box';
  isPerishable?: boolean;
  prescriptionRequired?: boolean;
  deliveryTime: number;
  isPrivate?: boolean;
  isArchived?: boolean;
}

export interface Order extends BaseOrder {
  item: string | Book;
  deliveryAddress: {
    street: string;
    city: string;
    postalCode?: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  orderStatus: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  deliveryFee: number;
  estimatedDelivery?: string;
  specialInstructions?: string;
  orderType: 'delivery' | 'pickup';
}

export interface User extends BaseUser {
  name?: string;
  firstName?: string;
  lastName?: string;
}