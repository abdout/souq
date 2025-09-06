import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

// This endpoint helps seed tenant data for production
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");
    
    // Simple secret check for production
    if (secret !== process.env.PAYLOAD_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const payload = await getPayload({ config });
    
    // Check if delicious-bites tenant exists
    const existing = await payload.find({
      collection: "tenants",
      where: {
        slug: {
          equals: "delicious-bites",
        },
      },
    });
    
    if (existing.docs.length > 0) {
      return NextResponse.json({
        message: "Tenant already exists",
        tenant: existing.docs[0],
      });
    }
    
    // Create the delicious-bites tenant
    const tenant = await payload.create({
      collection: "tenants",
      data: {
        name: "Delicious Bites",
        slug: "delicious-bites",
        businessType: "restaurant",
        address: "123 Main Street, City",
        coordinates: {
          lat: 24.7136,
          lng: 46.6753,
        },
        deliveryRadius: 15,
        minimumOrder: 20,
        deliveryFee: 5,
        operatingHours: {
          monday: { open: "09:00", close: "22:00", closed: false },
          tuesday: { open: "09:00", close: "22:00", closed: false },
          wednesday: { open: "09:00", close: "22:00", closed: false },
          thursday: { open: "09:00", close: "22:00", closed: false },
          friday: { open: "09:00", close: "23:00", closed: false },
          saturday: { open: "10:00", close: "23:00", closed: false },
          sunday: { open: "10:00", close: "22:00", closed: false },
        },
        isActive: true,
        stripeAccountId: "",
        businessLicense: "",
        stripeDetailsSubmitted: false,
      },
    });
    
    return NextResponse.json({
      message: "Tenant created successfully",
      tenant,
    });
    
  } catch (error: any) {
    console.error("Error seeding tenant:", error);
    return NextResponse.json(
      { 
        error: "Failed to seed tenant",
        details: error.message,
      },
      { status: 500 }
    );
  }
}