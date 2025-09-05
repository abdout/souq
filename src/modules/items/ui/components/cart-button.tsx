import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCart } from "@/modules/checkout/hooks/use-cart";
import Link from "next/link";

interface Props {
  tenantSlug: string;
  bookId: string;
  isPurchased?: boolean;
}

export const CartButton = ({ tenantSlug, bookId, isPurchased }: Props) => {
  const cart = useCart(tenantSlug);

  if (isPurchased) {
    return (
      <Button
        variant="elevated"
        asChild
        className="flex-1 font-medium bg-white"
      >
        <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/library/${bookId}`}>
          View in Library
        </Link>
      </Button>
    );
  }

  return (
    <Button
      variant="elevated"
      className={cn(
        "flex-1 bg-pink-400",
        cart.isBookInCart(bookId) && "bg-white"
      )}
      onClick={() => cart.toggleBook(bookId)}
    >
      {cart.isBookInCart(bookId) ? "Remove from cart" : "Add to cart"}
    </Button>
  );
};
