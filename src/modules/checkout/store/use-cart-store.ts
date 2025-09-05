import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface CartItem {
  itemId: string;
  quantity: number;
  specialInstructions?: string;
}

interface TenantCart {
  items: CartItem[];
  deliveryAddress?: {
    street: string;
    city: string;
    postalCode?: string;
    country: string;
    coordinates?: { lat: number; lng: number };
    instructions?: string;
  };
  orderType: 'delivery' | 'pickup';
  // Legacy support for old cart data
  bookIds?: string[];
}

interface CartState {
  tenantCarts: Record<string, TenantCart>;
  addItem: (tenantSlug: string, itemId: string, quantity?: number) => void;
  removeItem: (tenantSlug: string, itemId: string) => void;
  updateItemQuantity: (tenantSlug: string, itemId: string, quantity: number) => void;
  updateItemInstructions: (tenantSlug: string, itemId: string, instructions: string) => void;
  setDeliveryAddress: (tenantSlug: string, address: TenantCart['deliveryAddress']) => void;
  setOrderType: (tenantSlug: string, orderType: 'delivery' | 'pickup') => void;
  clearCart: (tenantSlug: string) => void;
  clearAllCarts: () => void;
  // Legacy methods for backward compatibility
  addBook: (tenantSlug: string, bookId: string) => void;
  removeBook: (tenantSlug: string, bookId: string) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      tenantCarts: {},
      
      addItem: (tenantSlug, itemId, quantity = 1) =>
        set((state) => {
          const currentCart = state.tenantCarts[tenantSlug] || { items: [], orderType: 'delivery' };
          const existingItemIndex = currentCart.items.findIndex(item => item.itemId === itemId);
          
          let updatedItems;
          if (existingItemIndex >= 0) {
            // Update quantity if item exists
            updatedItems = [...currentCart.items];
            const existingItem = updatedItems[existingItemIndex]!;
            updatedItems[existingItemIndex] = {
              itemId: existingItem.itemId,
              quantity: existingItem.quantity + quantity,
              specialInstructions: existingItem.specialInstructions,
            };
          } else {
            // Add new item
            updatedItems = [...currentCart.items, { itemId, quantity }];
          }
          
          return {
            tenantCarts: {
              ...state.tenantCarts,
              [tenantSlug]: {
                ...currentCart,
                items: updatedItems,
              },
            },
          };
        }),

      removeItem: (tenantSlug, itemId) =>
        set((state) => {
          const currentCart = state.tenantCarts[tenantSlug];
          if (!currentCart) {
            return {
              tenantCarts: {
                ...state.tenantCarts,
                [tenantSlug]: {
                  items: [],
                  orderType: 'delivery' as const,
                },
              },
            };
          }
          return {
            tenantCarts: {
              ...state.tenantCarts,
              [tenantSlug]: {
                ...currentCart,
                items: currentCart.items.filter(
                  item => item.itemId !== itemId
                ),
              },
            },
          };
        }),

      updateItemQuantity: (tenantSlug, itemId, quantity) =>
        set((state) => {
          const currentCart = state.tenantCarts[tenantSlug];
          if (!currentCart) return state;

          const updatedItems = currentCart.items.map(item =>
            item.itemId === itemId ? { ...item, quantity } : item
          ).filter(item => item.quantity > 0); // Remove items with 0 quantity

          return {
            tenantCarts: {
              ...state.tenantCarts,
              [tenantSlug]: {
                ...currentCart,
                items: updatedItems,
              },
            },
          };
        }),

      updateItemInstructions: (tenantSlug, itemId, instructions) =>
        set((state) => {
          const currentCart = state.tenantCarts[tenantSlug];
          if (!currentCart) return state;

          const updatedItems = currentCart.items.map(item =>
            item.itemId === itemId 
              ? { ...item, specialInstructions: instructions }
              : item
          );

          return {
            tenantCarts: {
              ...state.tenantCarts,
              [tenantSlug]: {
                ...currentCart,
                items: updatedItems,
              },
            },
          };
        }),

      setDeliveryAddress: (tenantSlug, address) =>
        set((state) => ({
          tenantCarts: {
            ...state.tenantCarts,
            [tenantSlug]: {
              ...state.tenantCarts[tenantSlug],
              items: state.tenantCarts[tenantSlug]?.items || [],
              orderType: state.tenantCarts[tenantSlug]?.orderType || 'delivery',
              deliveryAddress: address,
            },
          },
        })),

      setOrderType: (tenantSlug, orderType) =>
        set((state) => ({
          tenantCarts: {
            ...state.tenantCarts,
            [tenantSlug]: {
              ...state.tenantCarts[tenantSlug],
              items: state.tenantCarts[tenantSlug]?.items || [],
              orderType,
            },
          },
        })),

      clearCart: (tenantSlug) =>
        set((state) => ({
          tenantCarts: {
            ...state.tenantCarts,
            [tenantSlug]: {
              items: [],
              orderType: 'delivery',
            },
          },
        })),

      clearAllCarts: () =>
        set({
          tenantCarts: {},
        }),

      // Legacy methods for backward compatibility
      addBook: (tenantSlug, bookId) =>
        set((state) => {
          const currentCart = state.tenantCarts[tenantSlug] || { items: [], orderType: 'delivery' };
          
          // Migrate legacy bookIds to items if needed
          if (currentCart.bookIds && currentCart.bookIds.length > 0) {
            const legacyItems = currentCart.bookIds.map(id => ({ itemId: id, quantity: 1 }));
            const newItems = [...legacyItems, { itemId: bookId, quantity: 1 }];
            
            return {
              tenantCarts: {
                ...state.tenantCarts,
                [tenantSlug]: {
                  ...currentCart,
                  items: newItems,
                  bookIds: undefined, // Remove legacy data
                },
              },
            };
          }
          
          // Add as item
          const existingItemIndex = currentCart.items.findIndex(item => item.itemId === bookId);
          let updatedItems;
          
          if (existingItemIndex >= 0) {
            updatedItems = [...currentCart.items];
            const existingItem = updatedItems[existingItemIndex]!;
            updatedItems[existingItemIndex] = {
              itemId: existingItem.itemId,
              quantity: existingItem.quantity + 1,
              specialInstructions: existingItem.specialInstructions,
            };
          } else {
            updatedItems = [...currentCart.items, { itemId: bookId, quantity: 1 }];
          }
          
          return {
            tenantCarts: {
              ...state.tenantCarts,
              [tenantSlug]: {
                ...currentCart,
                items: updatedItems,
              },
            },
          };
        }),

      removeBook: (tenantSlug, bookId) =>
        set((state) => {
          const currentCart = state.tenantCarts[tenantSlug];
          if (!currentCart) {
            return {
              tenantCarts: {
                ...state.tenantCarts,
                [tenantSlug]: {
                  items: [],
                  orderType: 'delivery' as const,
                  bookIds: undefined,
                },
              },
            };
          }
          return {
            tenantCarts: {
              ...state.tenantCarts,
              [tenantSlug]: {
                ...currentCart,
                items: currentCart.items.filter(
                  item => item.itemId !== bookId
                ),
                // Also handle legacy bookIds
                bookIds: currentCart.bookIds?.filter(
                  id => id !== bookId
                ),
              },
            },
          };
        }),
    }),
    {
      name: "lexi-cart",
      storage: createJSONStorage(() => localStorage),
      // Migrate old cart data on load
      onRehydrateStorage: () => (state) => {
        if (state) {
          Object.keys(state.tenantCarts).forEach(tenantSlug => {
            const cart = state.tenantCarts[tenantSlug];
            if (cart && cart.bookIds && cart.bookIds.length > 0 && (!cart.items || cart.items.length === 0)) {
              // Migrate legacy bookIds to items
              state.tenantCarts[tenantSlug] = {
                ...cart,
                items: cart.bookIds.map(id => ({ itemId: id, quantity: 1 })),
                orderType: cart.orderType || 'delivery',
                bookIds: undefined,
              };
            }
          });
        }
      },
    }
  )
);
