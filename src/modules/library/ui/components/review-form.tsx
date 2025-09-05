import { z } from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { ReviewsGetOneOutput } from "@/modules/reviews/types";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { StarPicker } from "@/components/start-picker";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Props {
  bookId: string;
  initialData?: ReviewsGetOneOutput;
}

const formSchema = z.object({
  rating: z.number().min(1, { message: "Rating is required" }).max(5),
  description: z.string().min(1, { message: "Description is required" }),
});

export const ReviewForm = ({ bookId, initialData }: Props) => {
  const [isPreview, setIsPreview] = useState(!!initialData);

  const trpc = useTRPC();

  const queryClient = useQueryClient();
  const createBookReview = useMutation(
    trpc.reviews.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.reviews.getOne.queryOptions({
            bookId,
          })
        );
        setIsPreview(true);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const updateBookReview = useMutation(
    trpc.reviews.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.reviews.getOne.queryOptions({
            bookId,
          })
        );
        setIsPreview(true);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rating: initialData?.rating ?? 0,
      description: initialData?.description ?? "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (initialData) {
      updateBookReview.mutate({
        reviewId: initialData.id,
        rating: values.rating,
        description: values.description,
      });
    } else {
      createBookReview.mutate({
        bookId,
        rating: values.rating,
        description: values.description,
      });
    }
  };

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-y-4"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <p className="font-medium">
          {isPreview ? "Your rating:" : "Liked it? Give it a rating"}
        </p>
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <StarPicker
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isPreview}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder="Want to leave a written review?"
                  disabled={isPreview}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {!isPreview && (
          <Button
            variant="elevated"
            disabled={createBookReview.isPending || updateBookReview.isPending}
            type="submit"
            size="lg"
            className="bg-black text-white hover:bg-[#87E64B] hover:text-primary w-fit"
          >
            {initialData ? "Update review" : "Post review"}
          </Button>
        )}
      </form>
      {isPreview && (
        <Button
          onClick={() => setIsPreview(false)}
          size="lg"
          type="button"
          variant="elevated"
          className="w-fit mt-4"
        >
          Edit
        </Button>
      )}
    </Form>
  );
};

export const ReviewFormSkeleton = () => {
  return (
    <div className="flex flex-col gap-y-4">
      <p className="font-medium">Liked it? Give it a rating</p>
      <StarPicker disabled />
      <Textarea placeholder="Want to leave a written review?" disabled />

      <Button
        variant="elevated"
        disabled
        type="button"
        size="lg"
        className="bg-black text-white hover:bg-[#87E64B] hover:text-primary w-fit"
      >
        Post review
      </Button>
    </div>
  );
};
