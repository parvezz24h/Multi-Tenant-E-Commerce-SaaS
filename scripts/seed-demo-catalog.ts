/**
 * Add a demo catalog (categories + products) to an existing store so the
 * storefront has something to show before product management (Phase 3).
 * Safe to re-run: rows are upserted by slug.
 *
 *   pnpm seed:demo <store-slug>
 */
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

const taka = (amount: number) => Math.round(amount * 100);

const CATEGORIES = [
  { slug: "women", name: "Women", sortOrder: 1 },
  { slug: "men", name: "Men", sortOrder: 2 },
  { slug: "accessories", name: "Accessories", sortOrder: 3 },
  { slug: "home-living", name: "Home & Living", sortOrder: 4 },
];

type DemoProduct = {
  slug: string;
  name: string;
  category: string;
  price: number;
  compareAt?: number;
  stock: number;
  featured?: boolean;
  description: string;
};

const PRODUCTS: DemoProduct[] = [
  {
    slug: "cotton-three-piece",
    name: "Cotton Three-Piece",
    category: "women",
    price: 1850,
    compareAt: 2200,
    stock: 24,
    featured: true,
    description: "Soft printed cotton salwar kameez with matching orna.\nMachine washable. Unstitched.",
  },
  {
    slug: "dhakai-jamdani-saree",
    name: "Dhakai Jamdani Saree",
    category: "women",
    price: 6500,
    stock: 3,
    featured: true,
    description: "Handwoven Jamdani saree from Rupganj artisans. Comes with blouse piece.",
  },
  {
    slug: "printed-kurti",
    name: "Printed Kurti",
    category: "women",
    price: 950,
    stock: 40,
    description: "Everyday cotton kurti with block print. Sizes S–XL.",
  },
  {
    slug: "silk-hijab",
    name: "Silk Hijab",
    category: "women",
    price: 450,
    compareAt: 600,
    stock: 60,
    description: "Lightweight, breathable silk hijab in solid colors.",
  },
  {
    slug: "premium-cotton-panjabi",
    name: "Premium Cotton Panjabi",
    category: "men",
    price: 1800,
    compareAt: 2100,
    stock: 18,
    featured: true,
    description: "Fine cotton panjabi with embroidered collar. Perfect for Eid and weddings.",
  },
  {
    slug: "casual-polo-shirt",
    name: "Casual Polo Shirt",
    category: "men",
    price: 650,
    stock: 35,
    description: "Pique cotton polo shirt. Regular fit.",
  },
  {
    slug: "slim-fit-denim-jeans",
    name: "Slim Fit Denim Jeans",
    category: "men",
    price: 1400,
    stock: 22,
    featured: true,
    description: "Stretch denim with a modern slim fit. Waist 28–38.",
  },
  {
    slug: "check-lungi",
    name: "Check Lungi",
    category: "men",
    price: 550,
    stock: 50,
    description: "Classic check-pattern cotton lungi. Stitched.",
  },
  {
    slug: "leather-wallet",
    name: "Genuine Leather Wallet",
    category: "accessories",
    price: 750,
    stock: 30,
    description: "Slim bifold wallet in genuine cow leather.",
  },
  {
    slug: "analog-wrist-watch",
    name: "Analog Wrist Watch",
    category: "accessories",
    price: 2500,
    compareAt: 3200,
    stock: 8,
    featured: true,
    description: "Stainless steel case with leather strap. 1-year warranty.",
  },
  {
    slug: "canvas-tote-bag",
    name: "Canvas Tote Bag",
    category: "accessories",
    price: 400,
    stock: 45,
    description: "Sturdy canvas tote with inner pocket.",
  },
  {
    slug: "polarized-sunglasses",
    name: "Polarized Sunglasses",
    category: "accessories",
    price: 600,
    stock: 0,
    description: "UV400 polarized lenses. Currently sold out.",
  },
  {
    slug: "nakshi-kantha-cushion-cover",
    name: "Nakshi Kantha Cushion Cover",
    category: "home-living",
    price: 350,
    stock: 25,
    featured: true,
    description: "Hand-stitched Nakshi Kantha cushion cover, 16×16 inches.",
  },
  {
    slug: "handwoven-bed-sheet-set",
    name: "Handwoven Bed Sheet Set",
    category: "home-living",
    price: 2200,
    stock: 12,
    description: "King-size cotton bed sheet with two pillow covers.",
  },
];

async function main() {
  const slug = process.argv[2]?.trim().toLowerCase();
  if (!slug) {
    console.error("Usage: pnpm seed:demo <store-slug>");
    process.exit(1);
  }

  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  try {
    const store = await db.store.findUnique({ where: { slug }, select: { id: true, name: true } });
    if (!store) {
      console.error(`No store with slug "${slug}".`);
      process.exit(1);
    }

    const categoryIds = new Map<string, string>();
    for (const c of CATEGORIES) {
      const row = await db.category.upsert({
        where: { storeId_slug: { storeId: store.id, slug: c.slug } },
        create: { ...c, storeId: store.id },
        update: { name: c.name, sortOrder: c.sortOrder },
      });
      categoryIds.set(c.slug, row.id);
    }

    for (const p of PRODUCTS) {
      const data = {
        name: p.name,
        description: p.description,
        price: taka(p.price),
        compareAtPrice: p.compareAt ? taka(p.compareAt) : null,
        stock: p.stock,
        featured: p.featured ?? false,
        status: "ACTIVE" as const,
        sku: p.slug.toUpperCase().replace(/-/g, "").slice(0, 10),
        categoryId: categoryIds.get(p.category)!,
      };
      await db.product.upsert({
        where: { storeId_slug: { storeId: store.id, slug: p.slug } },
        create: { ...data, slug: p.slug, storeId: store.id },
        update: data,
      });
    }

    console.log(
      `Seeded ${CATEGORIES.length} categories and ${PRODUCTS.length} products into "${store.name}".`,
    );
  } finally {
    await db.$disconnect();
  }
}

main();
