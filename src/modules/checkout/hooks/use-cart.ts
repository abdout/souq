import { useCallback, useMemo } from "react";
import { useCartStore } from "../store/use-cart-store";
import { useShallow } from "zustand/react/shallow";

export const useCart = (tenantSlug: string) => {
  // New item-based actions
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateItemQuantity = useCartStore((state) => state.updateItemQuantity);
  const updateItemInstructions = useCartStore((state) => state.updateItemInstructions);
  const setDeliveryAddress = useCartStore((state) => state.setDeliveryAddress);
  const setOrderType = useCartStore((state) => state.setOrderType);
  const clearCart = useCartStore((state) => state.clearCart);
  const clearAllCarts = useCartStore((state) => state.clearAllCarts);
  
  // Legacy actions for backward compatibility
  const addBook = useCartStore((state) => state.addBook);
  const removeBook = useCartStore((state) => state.removeBook);

  const cart = useCartStore(
    useShallow((state) => state.tenantCarts[tenantSlug] || { items: [], orderType: 'delivery' as const })
  );

  // Legacy support - derive bookIds from items
  const bookIds = useMemo(() => {
    if (cart.bookIds && cart.bookIds.length > 0) {
      return cart.bookIds;
    }
    return cart.items.map(item => item.itemId);
  }, [cart.bookIds, cart.items]);

  // New methods
  const handleAddItem = useCallback(
    (itemId: string, quantity = 1) => {
      addItem(tenantSlug, itemId, quantity);
    },
    [addItem, tenantSlug]
  );

  const handleRemoveItem = useCallback(
    (itemId: string) => {
      removeItem(tenantSlug, itemId);
    },
    [removeItem, tenantSlug]
  );

  const handleUpdateQuantity = useCallback(
    (itemId: string, quantity: number) => {
      updateItemQuantity(tenantSlug, itemId, quantity);
    },
    [updateItemQuantity, tenantSlug]
  );

  const handleUpdateInstructions = useCallback(
    (itemId: string, instructions: string) => {
      updateItemInstructions(tenantSlug, itemId, instructions);
    },
    [updateItemInstructions, tenantSlug]
  );

  const handleSetDeliveryAddress = useCallback(
    (address: typeof cart.deliveryAddress) => {
      setDeliveryAddress(tenantSlug, address);
    },
    [setDeliveryAddress, tenantSlug]
  );

  const handleSetOrderType = useCallback(
    (orderType: 'delivery' | 'pickup') => {
      setOrderType(tenantSlug, orderType);
    },
    [setOrderType, tenantSlug]
  );

  // Legacy methods
  const toggleBook = useCallback(
    (bookId: string) => {
      const itemExists = cart.items.some(item => item.itemId === bookId);
      if (itemExists) {
        removeBook(tenantSlug, bookId);
      } else {
        addBook(tenantSlug, bookId);
      }
    },
    [addBook, removeBook, cart.items, tenantSlug]
  );

  const isBookInCart = useCallback(
    (bookId: string) => {
      return cart.items.some(item => item.itemId === bookId) || bookIds.includes(bookId);
    },
    [cart.items, bookIds]
  );

  const isItemInCart = useCallback(
    (itemId: string) => {
      return cart.items.some(item => item.itemId === itemId);
    },
    [cart.items]
  );

  const getItemQuantity = useCallback(
    (itemId: string) => {
      const item = cart.items.find(item => item.itemId === itemId);
      return item?.quantity || 0;
    },
    [cart.items]
  );

  const getItemInstructions = useCallback(
    (itemId: string) => {
      const item = cart.items.find(item => item.itemId === itemId);
      return item?.specialInstructions || '';
    },
    [cart.items]
  );

  const clearTenantCart = useCallback(() => {
    clearCart(tenantSlug);
  }, [tenantSlug, clearCart]);

  const handleAddBook = useCallback(
    (bookId: string) => {
      addBook(tenantSlug, bookId);
    },
    [addBook, tenantSlug]
  );

  const handleRemoveBook = useCallback(
    (bookId: string) => {
      removeBook(tenantSlug, bookId);
    },
    [removeBook, tenantSlug]
  );

  const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalUniqueItems = cart.items.length;

  return {
    // New item-based interface
    items: cart.items,
    deliveryAddress: cart.deliveryAddress,
    orderType: cart.orderType,
    addItem: handleAddItem,
    removeItem: handleRemoveItem,
    updateItemQuantity: handleUpdateQuantity,
    updateItemInstructions: handleUpdateInstructions,
    setDeliveryAddress: handleSetDeliveryAddress,
    setOrderType: handleSetOrderType,
    isItemInCart,
    getItemQuantity,
    getItemInstructions,
    
    // Legacy interface for backward compatibility
    bookIds,
    addBook: handleAddBook,
    removeBook: handleRemoveBook,
    toggleBook,
    isBookInCart,
    
    // Common interface
    clearCart: clearTenantCart,
    clearAllCarts,
    totalItems,
    totalUniqueItems,
    isEmpty: cart.items.length === 0,
  };
};
