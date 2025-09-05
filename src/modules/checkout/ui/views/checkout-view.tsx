"use client";

import { useTRPC } from "@/trpc/client";
import { useCart } from "../../hooks/use-cart";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { generateTenantURL } from "@/lib/utils";
import { CheckoutItem } from "../components/checkout-item";
import { CheckoutSidebar } from "../components/checkout-sidebar";
import { InboxIcon, LoaderIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCheckoutStates } from "../../hooks/use-checkout-states";

interface CheckoutViewProps {
  tenantSlug: string;
}

export const CheckoutView = ({ tenantSlug }: CheckoutViewProps) => {
  const router = useRouter();
  const [states, setStates] = useCheckoutStates();

  const { bookIds, clearCart, removeBook } = useCart(tenantSlug);

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data, error, isLoading } = useQuery(
    trpc.checkout.getItems.queryOptions({
      ids: bookIds,
    })
  );

  const purchase = useMutation(
    trpc.checkout.purchase.mutationOptions({
      onMutate: () => {
        setStates({ success: false, cancel: false });
      },
      onSuccess: (data) => {
        window.location.href = data.url;
      },
      onError: (error) => {
        if (error?.data?.code === "UNAUTHORIZED") {
          // TODO: Modify when subdomains enabled
          router.push("/sign-in");
        }
        toast.error(error.message);
      },
    })
  );

  useEffect(() => {
    if (states.success) {
      setStates({ success: false, cancel: false });
      clearCart();
      queryClient.invalidateQueries(trpc.library.getMany.infiniteQueryFilter());
      router.push("/library");
    }
  }, [
    states.success,
    clearCart,
    router,
    setStates,
    queryClient,
    trpc.library.getMany,
  ]);

  useEffect(() => {
    if ((error as any)?.data?.code === "NOT_FOUND") {
      clearCart();
      toast.warning("Invalid books found, cart cleared");
    }
  }, [error, clearCart]);

  if (isLoading) {
    return (
      <div className="lg:pt-16 pt-4 px-4 lg:px-12">
        <div className="border border-black border-dashed flex items-center justify-center p-8 flex-col gap-y-4 bg-white w-full rounded-lg">
          <LoaderIcon className="text-muted-foreground animate-spin" />
        </div>
      </div>
    );
  }

  if ((data as any)?.totalDocs === 0) {
    return (
      <div className="lg:pt-16 pt-4 px-4 lg:px-12">
        <div className="border border-black border-dashed flex items-center justify-center p-8 flex-col gap-y-4 bg-white w-full rounded-lg">
          <InboxIcon />
          <p className="text-base font-medium">No books found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:pt-16 pt-4 px-4 lg:px-12">
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 lg:gap-16">
        <div className="lg:col-span-4">
          <div className="border rounded-md overflow-hidden bg-white">
            {(data as any)?.docs.map((book: any, index: number) => (
              <CheckoutItem
                key={book.id}
                isLast={index === (data as any).docs.length - 1}
                imageUrl={book.image?.url}
                name={book.name}
                bookUrl={`${generateTenantURL(book.tenant.slug)}/books/${book.id}`}
                tenantUrl={generateTenantURL(book.tenant.slug)}
                tenantName={book.tenant.name}
                price={book.price}
                onRemove={() => removeBook(book.id)}
              />
            ))}
          </div>
        </div>

        <div className="lg:col-span-3">
          <CheckoutSidebar
            total={(data as any)?.totalPrice || 0}
            onPurchase={() => purchase.mutate({ tenantSlug, itemIds: bookIds })}
            isCanceled={states.cancel}
            disabled={purchase.isPending}
          />
        </div>
      </div>
    </div>
  );
};
