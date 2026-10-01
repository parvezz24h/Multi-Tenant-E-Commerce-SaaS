/**
 * Add a demo catalog (categories + products) and, if the store has no
 * orders yet, demo customers and orders, so the storefront and dashboard
 * have something to show. Safe to re-run: products are upserted by slug and
 * orders are only created once.
 *
 *   pnpm seed:demo <store-slug>
 */
import "dotenv/config";

import { randomBytes } from "node:crypto";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient, type InventoryReason, type OrderStatus } from "../src/generated/prisma/client";

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

type DemoOrder = {
  daysAgo: number;
  customer: { name: string; phone: string; district: string; upazila: string; area: string; addressLine: string };
  items: { slug: string; quantity: number }[];
  /** Path the order took, ending in its current status. */
  path: OrderStatus[];
  note?: string;
};

const DHAKA = "Dhaka";

const ORDERS: DemoOrder[] = [
  {
    daysAgo: 0,
    customer: { name: "Nusrat Jahan", phone: "01711000001", district: DHAKA, upazila: "Mirpur", area: "Section 10", addressLine: "House 14, Road 3" },
    items: [
      { slug: "printed-kurti", quantity: 2 },
      { slug: "silk-hijab", quantity: 1 },
    ],
    path: ["PENDING"],
    note: "Please call before delivery.",
  },
  {
    daysAgo: 1,
    customer: { name: "Tanvir Ahmed", phone: "01811000002", district: "Chattogram", upazila: "Pahartali", area: "Ak Khan", addressLine: "Flat 4B, Green View" },
    items: [{ slug: "premium-cotton-panjabi", quantity: 1 }],
    path: ["PENDING", "CONFIRMED"],
  },
  {
    daysAgo: 2,
    customer: { name: "Farhana Akter", phone: "01911000003", district: DHAKA, upazila: "Dhanmondi", area: "Road 27", addressLine: "House 7" },
    items: [{ slug: "cotton-three-piece", quantity: 1 }],
    path: ["PENDING", "CONFIRMED", "PROCESSING"],
  },
  {
    daysAgo: 3,
    customer: { name: "Rakib Hasan", phone: "01611000004", district: "Sylhet", upazila: "Sylhet Sadar", area: "Zindabazar", addressLine: "12 Chowhatta Road" },
    items: [{ slug: "analog-wrist-watch", quantity: 1 }],
    path: ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED"],
  },
  {
    daysAgo: 6,
    customer: { name: "Nusrat Jahan", phone: "01711000001", district: DHAKA, upazila: "Mirpur", area: "Section 10", addressLine: "House 14, Road 3" },
    items: [
      { slug: "leather-wallet", quantity: 1 },
      { slug: "canvas-tote-bag", quantity: 2 },
    ],
    path: ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"],
  },
  {
    daysAgo: 8,
    customer: { name: "Tanvir Ahmed", phone: "01811000002", district: "Chattogram", upazila: "Pahartali", area: "Ak Khan", addressLine: "Flat 4B, Green View" },
    items: [{ slug: "slim-fit-denim-jeans", quantity: 1 }],
    path: ["PENDING", "CANCELLED"],
  },
];

async function seedOrders(
  db: PrismaClient,
  store: { id: string; deliveryChargeInsideDhaka: number; deliveryChargeOutsideDhaka: number },
) {
  if ((await db.order.count({ where: { storeId: store.id } })) > 0) return 0;

  for (const demo of ORDERS) {
    const createdAt = new Date(Date.now() - demo.daysAgo * 86_400_000 - 3_600_000);
    await db.$transaction(async (tx) => {
      const customer = await tx.customer.upsert({
        where: { storeId_phone: { storeId: store.id, phone: demo.customer.phone } },
        create: { storeId: store.id, name: demo.customer.name, phone: demo.customer.phone, createdAt },
        update: {},
      });
      if ((await tx.customerAddress.count({ where: { customerId: customer.id } })) === 0) {
        await tx.customerAddress.create({
          data: { ...demo.customer, storeId: store.id, customerId: customer.id, isDefault: true },
        });
      }

      const products = await tx.product.findMany({
        where: { storeId: store.id, slug: { in: demo.items.map((i) => i.slug) } },
      });
      const lines = demo.items.map((i) => {
        const p = products.find((x) => x.slug === i.slug)!;
        return { product: p, quantity: i.quantity, lineTotal: p.price * i.quantity };
      });
      const subtotal = lines.reduce((n, l) => n + l.lineTotal, 0);
      const deliveryCharge =
        demo.customer.district === DHAKA ? store.deliveryChargeInsideDhaka : store.deliveryChargeOutsideDhaka;
      const status = demo.path[demo.path.length - 1]!;

      const { nextOrderNumber } = await tx.store.update({
        where: { id: store.id },
        data: { nextOrderNumber: { increment: 1 } },
        select: { nextOrderNumber: true },
      });

      const { district, upazila, area, addressLine } = demo.customer;
      const order = await tx.order.create({
        data: {
          storeId: store.id,
          orderNumber: nextOrderNumber - 1,
          publicToken: randomBytes(24).toString("base64url"),
          customerId: customer.id,
          status,
          paymentStatus: status === "DELIVERED" ? "PAID" : "UNPAID",
          subtotal,
          deliveryCharge,
          total: subtotal + deliveryCharge,
          customerName: demo.customer.name,
          phone: demo.customer.phone,
          district,
          upazila,
          area,
          addressLine,
          customerNote: demo.note ?? null,
          createdAt,
          items: {
            create: lines.map((l) => ({
              productId: l.product.id,
              name: l.product.name,
              sku: l.product.sku,
              unitPrice: l.product.price,
              quantity: l.quantity,
              lineTotal: l.lineTotal,
            })),
          },
          events: {
            create: demo.path.map((to, i) => ({
              fromStatus: i === 0 ? null : demo.path[i - 1]!,
              toStatus: to,
              createdAt: new Date(createdAt.getTime() + i * 3_600_000),
            })),
          },
        },
      });

      // Stock goes out when the order is placed and back in if it was cancelled.
      for (const l of lines) {
        const moves: { delta: number; reason: InventoryReason }[] = [
          { delta: -l.quantity, reason: "ORDER_PLACED" },
          ...(status === "CANCELLED" ? [{ delta: l.quantity, reason: "ORDER_CANCELLED" as const }] : []),
        ];
        for (const { delta, reason } of moves) {
          const { stock } = await tx.product.update({
            where: { id: l.product.id },
            data: { stock: { increment: delta } },
            select: { stock: true },
          });
          await tx.inventoryAdjustment.create({
            data: { storeId: store.id, productId: l.product.id, delta, stockAfter: stock, reason, orderId: order.id, createdAt },
          });
        }
      }
    });
  }
  return ORDERS.length;
}

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
    const store = await db.store.findUnique({
      where: { slug },
      select: { id: true, name: true, deliveryChargeInsideDhaka: true, deliveryChargeOutsideDhaka: true },
    });
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
      // Stock is only set on create; afterwards it's tracked through adjustments.
      const { stock, ...rest } = data;
      const existing = await db.product.findUnique({
        where: { storeId_slug: { storeId: store.id, slug: p.slug } },
        select: { id: true },
      });
      if (existing) {
        await db.product.update({ where: { id: existing.id }, data: rest });
      } else {
        await db.product.create({
          data: {
            ...rest,
            slug: p.slug,
            storeId: store.id,
            stock,
            inventoryAdjustments: stock
              ? { create: { storeId: store.id, delta: stock, stockAfter: stock, reason: "INITIAL" } }
              : undefined,
          },
        });
      }
    }

    const orders = await seedOrders(db, store);
    console.log(
      `Seeded ${CATEGORIES.length} categories and ${PRODUCTS.length} products into "${store.name}".` +
        (orders ? ` Added ${orders} demo orders.` : " Orders already exist, skipped demo orders."),
    );
  } finally {
    await db.$disconnect();
  }
}

main();
