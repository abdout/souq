import { Footer } from "@/modules/tenants/ui/components/footer";
import { NavbarStatic } from "@/modules/tenants/ui/components/navbar-static";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="min-h-screen bg-[#F4F4F0] flex flex-col">
      <NavbarStatic slug={slug} />
      <div className="flex-1">
        <div className="max-w-[--breakpoint-xl] mx-auto px-4 lg:px-12">
          {children}
        </div>
      </div>
      <Footer />
    </div>
  );
}