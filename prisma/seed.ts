import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  // Create categories (global categories with no tenant)
  const foodCategory = await prisma.category.upsert({
    where: { 
      slug_tenantId: {
        slug: "food",
        tenantId: null
      }
    },
    update: {},
    create: {
      name: "Food & Beverages",
      slug: "food",
      description: "Food and drink items",
      businessType: "restaurant",
      tenantId: null,
    },
  });

  const pharmacyCategory = await prisma.category.upsert({
    where: { 
      slug_tenantId: {
        slug: "pharmacy",
        tenantId: null
      }
    },
    update: {},
    create: {
      name: "Pharmacy",
      slug: "pharmacy",
      description: "Medicines and health products",
      businessType: "pharmacy",
      tenantId: null,
    },
  });

  const groceryCategory = await prisma.category.upsert({
    where: { 
      slug_tenantId: {
        slug: "grocery",
        tenantId: null
      }
    },
    update: {},
    create: {
      name: "Grocery",
      slug: "grocery",
      description: "Daily essentials and groceries",
      businessType: "grocery",
      tenantId: null,
    },
  });

  console.log("Categories created:", { foodCategory, pharmacyCategory, groceryCategory });

  // Create sample tenants (merchants)
  const restaurant = await prisma.tenant.upsert({
    where: { slug: "delicious-bites" },
    update: {},
    create: {
      name: "Delicious Bites",
      slug: "delicious-bites",
      description: "Best food in town",
      businessType: "restaurant",
      address: "123 Main Street, City",
      coordinates: { lat: 40.7128, lng: -74.0060 },
      deliveryRadius: 5,
      minimumOrder: 20,
      deliveryFee: 5,
      operatingHours: {
        monday: { open: "09:00", close: "22:00", closed: false },
        tuesday: { open: "09:00", close: "22:00", closed: false },
        wednesday: { open: "09:00", close: "22:00", closed: false },
        thursday: { open: "09:00", close: "22:00", closed: false },
        friday: { open: "09:00", close: "23:00", closed: false },
        saturday: { open: "10:00", close: "23:00", closed: false },
        sunday: { open: "10:00", close: "21:00", closed: false },
      },
    },
  });

  const pharmacy = await prisma.tenant.upsert({
    where: { slug: "health-plus" },
    update: {},
    create: {
      name: "Health Plus Pharmacy",
      slug: "health-plus",
      description: "Your trusted pharmacy",
      businessType: "pharmacy",
      address: "456 Oak Avenue, City",
      coordinates: { lat: 40.7580, lng: -73.9855 },
      deliveryRadius: 10,
      minimumOrder: 15,
      deliveryFee: 3,
      operatingHours: {
        monday: { open: "08:00", close: "20:00", closed: false },
        tuesday: { open: "08:00", close: "20:00", closed: false },
        wednesday: { open: "08:00", close: "20:00", closed: false },
        thursday: { open: "08:00", close: "20:00", closed: false },
        friday: { open: "08:00", close: "20:00", closed: false },
        saturday: { open: "09:00", close: "18:00", closed: false },
        sunday: { open: "10:00", close: "16:00", closed: false },
      },
    },
  });

  console.log("Tenants created:", { restaurant, pharmacy });

  // Create sample items for restaurant
  const burger = await prisma.item.create({
    data: {
      name: "Classic Burger",
      slug: "classic-burger",
      description: "Juicy beef patty with lettuce, tomato, and our special sauce",
      price: 12.99,
      businessType: "food",
      inventory: 100,
      trackInventory: false,
      unit: "piece",
      deliveryTime: 20,
      tenantId: restaurant.id,
      categoryId: foodCategory.id,
      isFeatured: true,
    },
  });

  const pizza = await prisma.item.create({
    data: {
      name: "Margherita Pizza",
      slug: "margherita-pizza",
      description: "Classic pizza with tomato sauce, mozzarella, and basil",
      price: 15.99,
      businessType: "food",
      inventory: 100,
      trackInventory: false,
      unit: "piece",
      deliveryTime: 25,
      tenantId: restaurant.id,
      categoryId: foodCategory.id,
      isFeatured: true,
    },
  });

  const pasta = await prisma.item.create({
    data: {
      name: "Spaghetti Carbonara",
      slug: "spaghetti-carbonara",
      description: "Creamy pasta with bacon and parmesan",
      price: 13.99,
      businessType: "food",
      inventory: 100,
      trackInventory: false,
      unit: "piece",
      deliveryTime: 20,
      tenantId: restaurant.id,
      categoryId: foodCategory.id,
    },
  });

  // Create sample items for pharmacy
  const paracetamol = await prisma.item.create({
    data: {
      name: "Paracetamol 500mg",
      slug: "paracetamol-500mg",
      description: "Pain relief and fever reducer",
      price: 4.99,
      businessType: "medicine",
      inventory: 200,
      trackInventory: true,
      unit: "box",
      prescriptionRequired: false,
      deliveryTime: 30,
      tenantId: pharmacy.id,
      categoryId: pharmacyCategory.id,
    },
  });

  const vitamins = await prisma.item.create({
    data: {
      name: "Multivitamin Complex",
      slug: "multivitamin-complex",
      description: "Daily vitamin supplement",
      price: 19.99,
      businessType: "medicine",
      inventory: 150,
      trackInventory: true,
      unit: "bottle",
      prescriptionRequired: false,
      deliveryTime: 30,
      tenantId: pharmacy.id,
      categoryId: pharmacyCategory.id,
      isFeatured: true,
    },
  });

  console.log("Items created:", { burger, pizza, pasta, paracetamol, vitamins });

  // Create a test user
  const user = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      email: "test@example.com",
      name: "Test User",
    },
  });

  console.log("User created:", user);

  // Create sample reviews
  await prisma.review.create({
    data: {
      rating: 5,
      comment: "Amazing burger, will order again!",
      userId: user.id,
      itemId: burger.id,
    },
  });

  await prisma.review.create({
    data: {
      rating: 4,
      comment: "Great pizza, fast delivery",
      userId: user.id,
      itemId: pizza.id,
    },
  });

  console.log("Reviews created");

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });