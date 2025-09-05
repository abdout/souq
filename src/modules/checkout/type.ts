import type Stripe from "stripe";

export type ItemMetadata = {
  stripeAccountId: string;
  id: string;
  name: string;
  price: number;
};

// Keep legacy export for backward compatibility during transition
export type BookMetadata = ItemMetadata;

export type CheckoutMetadata = {
  userId: string;
};

export type ExpandedLineItem = Stripe.LineItem & {
  price: Stripe.Price & {
    item: Stripe.Product & {
      metadata: ItemMetadata;
    };
  };
};
