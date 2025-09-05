import Link from "next/link";

export const StripeVerify = () => {
  return (
    <Link href="/stripe-verify">
      <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
        Verify account
      </button>
    </Link>
  );
};
