import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"
import { PrismaClient, type ProductType } from "../src/generated/prisma/client"

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error("DATABASE_URL is not set")
}
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Seeding database...")

  // Clean existing data
  await prisma.review.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.cartItem.deleteMany()
  await prisma.cart.deleteMany()
  await prisma.wishlistItem.deleteMany()
  await prisma.wishlist.deleteMany()
  await prisma.productVariant.deleteMany()
  await prisma.productImage.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.address.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.passwordResetToken.deleteMany()
  await prisma.user.deleteMany()
  await prisma.coupon.deleteMany()
  await prisma.adminNotification.deleteMany()

  // Admin user
  const adminPassword = await bcrypt.hash("admin123", 12)
  const admin = await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@shoply.dev",
      password: adminPassword,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  })
  console.log("  ✓ Admin user created: admin@shoply.dev / admin123")

  // Demo client user
  const clientPassword = await bcrypt.hash("client123", 12)
  await prisma.user.create({
    data: {
      name: "Demo Client",
      email: "client@shoply.dev",
      password: clientPassword,
      role: "CLIENT",
      emailVerified: new Date(),
    },
  })
  console.log("  ✓ Client user created: client@shoply.dev / client123")

  // Categories
  const categories = await Promise.all([
    prisma.category.create({ data: { name: "Apparel", slug: "apparel", description: "Clothing and accessories" } }),
    prisma.category.create({ data: { name: "Home", slug: "home", description: "Home goods and decor" } }),
    prisma.category.create({ data: { name: "Tech", slug: "tech", description: "Electronics and gadgets" } }),
    prisma.category.create({ data: { name: "Books", slug: "books", description: "Physical books" } }),
    prisma.category.create({ data: { name: "Courses", slug: "courses", description: "Digital courses and learning" } }),
    prisma.category.create({ data: { name: "Templates", slug: "templates", description: "Digital templates and assets" } }),
  ])
  console.log(`  ✓ ${categories.length} categories created`)

  const [apparel, home, tech, books, courses, templates] = categories

  // Helper: physical product with image
  async function createPhysical(opts: {
    name: string
    slug: string
    shortDesc: string
    description: string
    price: number
    comparePrice?: number
    categoryId: string
    imageId: string
    stock: number
    featured?: boolean
    variants?: { name: string; value: string; stock: number }[]
  }) {
    const { variants, ...rest } = opts
    const product = await prisma.product.create({
      data: {
        name: rest.name,
        slug: rest.slug,
        shortDesc: rest.shortDesc,
        description: rest.description,
        price: rest.price,
        comparePrice: rest.comparePrice,
        categoryId: rest.categoryId,
        stock: rest.stock,
        featured: rest.featured ?? false,
        type: "PHYSICAL" as ProductType,
        requiresShipping: true,
        images: {
          create: [
            {
              url: `https://picsum.photos/seed/${rest.imageId}/800/800`,
              alt: rest.name,
              position: 0,
            },
          ],
        },
      },
    })
    if (variants) {
      for (const v of variants) {
        await prisma.productVariant.create({
          data: { productId: product.id, name: v.name, value: v.value, stock: v.stock },
        })
      }
    }
    return product
  }

  async function createDigital(opts: {
    name: string
    slug: string
    shortDesc: string
    description: string
    price: number
    comparePrice?: number
    categoryId: string
    imageId: string
    downloadLimit?: number
    featured?: boolean
  }) {
    return prisma.product.create({
      data: {
        name: opts.name,
        slug: opts.slug,
        shortDesc: opts.shortDesc,
        description: opts.description,
        price: opts.price,
        comparePrice: opts.comparePrice,
        categoryId: opts.categoryId,
        stock: 9999,
        featured: opts.featured ?? false,
        type: "DIGITAL" as ProductType,
        requiresShipping: false,
        downloadLimit: opts.downloadLimit,
        images: {
          create: [
            {
              url: `https://picsum.photos/seed/${opts.imageId}/800/800`,
              alt: opts.name,
              position: 0,
            },
          ],
        },
      },
    })
  }

  // Physical products
  await createPhysical({
    name: "Classic Cotton Tee",
    slug: "classic-cotton-tee",
    shortDesc: "Soft, breathable cotton t-shirt",
    description: "Made from 100% organic cotton, our classic tee offers everyday comfort and a timeless fit. Pre-shrunk and ethically sourced.",
    price: 29.99,
    comparePrice: 39.99,
    categoryId: apparel.id,
    imageId: "tee",
    stock: 50,
    featured: true,
    variants: [
      { name: "Size", value: "S", stock: 10 },
      { name: "Size", value: "M", stock: 15 },
      { name: "Size", value: "L", stock: 15 },
      { name: "Size", value: "XL", stock: 10 },
    ],
  })

  await createPhysical({
    name: "Merino Wool Sweater",
    slug: "merino-wool-sweater",
    shortDesc: "Warm, soft, and naturally odor-resistant",
    description: "Crafted from premium merino wool, this sweater is perfect for layering. Machine washable and built to last.",
    price: 89.0,
    categoryId: apparel.id,
    imageId: "sweater",
    stock: 30,
    featured: true,
    variants: [
      { name: "Size", value: "M", stock: 10 },
      { name: "Size", value: "L", stock: 10 },
      { name: "Size", value: "XL", stock: 10 },
    ],
  })

  await createPhysical({
    name: "Canvas Tote Bag",
    slug: "canvas-tote-bag",
    shortDesc: "Durable, spacious, and stylish",
    description: "A reliable everyday tote made from heavy-duty canvas. Reinforced straps and an inner pocket.",
    price: 24.99,
    categoryId: apparel.id,
    imageId: "tote",
    stock: 100,
  })

  await createPhysical({
    name: "Ceramic Coffee Mug",
    slug: "ceramic-coffee-mug",
    shortDesc: "Hand-glazed stoneware mug",
    description: "Start your morning right with this 12oz ceramic mug. Dishwasher and microwave safe.",
    price: 18.0,
    categoryId: home.id,
    imageId: "mug",
    stock: 80,
    featured: true,
  })

  await createPhysical({
    name: "Linen Throw Blanket",
    slug: "linen-throw-blanket",
    shortDesc: "Soft, breathable, and naturally textured",
    description: "100% European linen. Perfect for the couch, bed, or as a decor piece. Gets softer with every wash.",
    price: 79.0,
    comparePrice: 99.0,
    categoryId: home.id,
    imageId: "blanket",
    stock: 40,
    variants: [
      { name: "Color", value: "Oat", stock: 20 },
      { name: "Color", value: "Charcoal", stock: 20 },
    ],
  })

  await createPhysical({
    name: "Minimalist Desk Lamp",
    slug: "minimalist-desk-lamp",
    shortDesc: "Adjustable LED with warm and cool modes",
    description: "Modern, energy-efficient desk lamp with touch controls and 3 brightness levels.",
    price: 59.0,
    categoryId: home.id,
    imageId: "lamp",
    stock: 25,
  })

  await createPhysical({
    name: "Wireless Noise-Cancelling Headphones",
    slug: "wireless-headphones",
    shortDesc: "Premium sound, 30h battery",
    description: "Active noise cancellation, multipoint Bluetooth, plush memory-foam earcups. 30-hour battery life.",
    price: 199.0,
    comparePrice: 249.0,
    categoryId: tech.id,
    imageId: "headphones",
    stock: 20,
    featured: true,
  })

  await createPhysical({
    name: "Mechanical Keyboard",
    slug: "mechanical-keyboard",
    shortDesc: "Tactile switches, RGB backlight",
    description: "75% layout, hot-swappable switches, USB-C, customizable RGB. Aluminum frame.",
    price: 129.0,
    categoryId: tech.id,
    imageId: "keyboard",
    stock: 15,
  })

  await createPhysical({
    name: "Bamboo Phone Stand",
    slug: "bamboo-phone-stand",
    shortDesc: "Adjustable viewing angle",
    description: "Sustainable bamboo stand for phones and small tablets. Folds flat for travel.",
    price: 22.0,
    categoryId: tech.id,
    imageId: "stand",
    stock: 60,
  })

  await createPhysical({
    name: "The Art of Focus",
    slug: "art-of-focus-book",
    shortDesc: "A guide to deep work",
    description: "Hardcover, 240 pages. Practical strategies for productive work in a distracted world.",
    price: 24.0,
    categoryId: books.id,
    imageId: "book1",
    stock: 35,
  })

  await createPhysical({
    name: "Designing Simple Things",
    slug: "designing-simple-things",
    shortDesc: "Essays on design",
    description: "A collection of essays on the craft of designing simple, useful products.",
    price: 28.0,
    categoryId: books.id,
    imageId: "book2",
    stock: 25,
  })

  await createPhysical({
    name: "Field Notes Notebook",
    slug: "field-notes-notebook",
    shortDesc: "3-pack pocket notebooks",
    description: "Classic pocket-sized notebooks. 48 pages, graph paper. Perfect for sketches and notes.",
    price: 14.0,
    categoryId: books.id,
    imageId: "notebook",
    stock: 100,
  })

  // Digital products
  await createDigital({
    name: "Next.js Full Course",
    slug: "nextjs-full-course",
    shortDesc: "Build production apps from scratch",
    description: "A 12-hour video course covering Next.js 15, App Router, Server Components, Server Actions, and deployment. Includes source code.",
    price: 49.0,
    comparePrice: 99.0,
    categoryId: courses.id,
    imageId: "course1",
    downloadLimit: 5,
    featured: true,
  })

  await createDigital({
    name: "TypeScript Mastery",
    slug: "typescript-mastery",
    shortDesc: "From basics to advanced patterns",
    description: "Comprehensive TypeScript course with 80+ lessons. Covers generics, conditional types, template literal types, and more.",
    price: 39.0,
    categoryId: courses.id,
    imageId: "course2",
    downloadLimit: 3,
  })

  await createDigital({
    name: "Prisma & PostgreSQL Bootcamp",
    slug: "prisma-postgres-bootcamp",
    shortDesc: "Master modern database workflows",
    description: "Learn Prisma ORM with PostgreSQL, including migrations, relations, and optimization techniques.",
    price: 34.0,
    categoryId: courses.id,
    imageId: "course3",
    downloadLimit: 3,
  })

  await createDigital({
    name: "SaaS Landing Page Pack",
    slug: "saas-landing-pack",
    shortDesc: "20+ Figma sections",
    description: "A complete Figma file with 20+ landing page sections, ready to remix. Includes dark and light variants.",
    price: 29.0,
    comparePrice: 49.0,
    categoryId: templates.id,
    imageId: "figma1",
    featured: true,
  })

  await createDigital({
    name: "Icon Library Pro",
    slug: "icon-library-pro",
    shortDesc: "500+ hand-crafted SVG icons",
    description: "A premium icon set with 500+ icons in 3 styles (line, duotone, filled). SVG and Figma formats.",
    price: 19.0,
    categoryId: templates.id,
    imageId: "icons",
  })

  await createDigital({
    name: "Email Templates Bundle",
    slug: "email-templates-bundle",
    shortDesc: "React Email templates",
    description: "20 production-ready email templates built with React Email. Includes welcome, receipts, password reset, and more.",
    price: 25.0,
    categoryId: templates.id,
    imageId: "emails",
  })

  // Coupons
  await prisma.coupon.create({
    data: {
      code: "WELCOME10",
      type: "PERCENT",
      value: 10,
      minPurchase: 50,
      maxUses: 1000,
      active: true,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90),
    },
  })
  await prisma.coupon.create({
    data: {
      code: "SAVE20",
      type: "FIXED",
      value: 20,
      minPurchase: 100,
      maxUses: 500,
      active: true,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60),
    },
  })
  console.log("  ✓ 2 coupons created: WELCOME10, SAVE20")

  console.log("✅ Seed completed")
  console.log(`   Admin:  ${admin.email} / admin123`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
