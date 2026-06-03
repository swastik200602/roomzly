import { BookingStatus, Furnishing, PrismaClient, PropertyCategory, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const password = "Password123!";

const imageUrls = [
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1200&q=80"
];

const owners = [
  { email: "owner@roomzly.test", firstName: "Anika", lastName: "Patel", phone: "+91 98765 10001", bio: "Curated premium homes across Mumbai and Pune." },
  { email: "owner2@roomzly.test", firstName: "Kabir", lastName: "Mehra", phone: "+91 98765 10002", bio: "Managed PGs and co-living residences in Bengaluru." }
];

const residents = [
  { email: "resident@roomzly.test", firstName: "Elena", lastName: "Rossi" },
  { email: "resident2@roomzly.test", firstName: "Rohan", lastName: "Iyer" },
  { email: "resident3@roomzly.test", firstName: "Maya", lastName: "Kapoor" }
];

const properties = [
  {
    slug: "bandra-skyline-apartment",
    code: "101_APT",
    title: "Bandra Skyline Apartment",
    description: "A sunlit 3BHK with sea-facing balconies, concierge access, and a quiet work nook near Carter Road.",
    city: "Mumbai",
    neighborhood: "Bandra West",
    locality: "Bandra West",
    state: "Maharashtra",
    country: "India",
    address: "Carter Road, Bandra West, Mumbai",
    formattedAddress: "Carter Road, Bandra West, Mumbai, Maharashtra, India",
    latitude: 19.0705,
    longitude: 72.8226,
    category: PropertyCategory.APARTMENT,
    price: 185000,
    beds: 3,
    baths: 2.5,
    sqft: 1680,
    amenities: ["Sea view", "Concierge", "Parking", "Gym", "Power backup", "Modular kitchen"],
    furnishing: Furnishing.FURNISHED,
    premium: true
  },
  {
    slug: "koramangala-managed-pg",
    code: "102_PG",
    title: "Koramangala Managed PG",
    description: "Professionally managed twin-sharing PG with meals, weekly housekeeping, biometric entry, and fast wifi.",
    city: "Bengaluru",
    neighborhood: "Koramangala",
    locality: "Koramangala",
    state: "Karnataka",
    country: "India",
    address: "5th Block, Koramangala, Bengaluru",
    formattedAddress: "5th Block, Koramangala, Bengaluru, Karnataka, India",
    latitude: 12.9346,
    longitude: 77.6139,
    category: PropertyCategory.PG,
    price: 18500,
    beds: 1,
    baths: 1,
    sqft: 260,
    amenities: ["Meals", "Wifi", "Laundry", "Housekeeping", "Security", "Common lounge"],
    furnishing: Furnishing.FURNISHED,
    premium: false
  },
  {
    slug: "gurugram-golf-course-villa",
    code: "103_VLA",
    title: "Golf Course Villa",
    description: "A private villa with landscaped garden, staff quarters, home office, and direct access to Golf Course Road.",
    city: "Gurugram",
    neighborhood: "DLF Phase 5",
    locality: "DLF Phase 5",
    state: "Haryana",
    country: "India",
    address: "Golf Course Road, Gurugram",
    formattedAddress: "Golf Course Road, DLF Phase 5, Gurugram, Haryana, India",
    latitude: 28.4355,
    longitude: 77.1054,
    category: PropertyCategory.VILLA,
    price: 320000,
    beds: 4,
    baths: 4,
    sqft: 4200,
    amenities: ["Garden", "Clubhouse", "Two-car garage", "Staff room", "Home office", "Security"],
    furnishing: Furnishing.SEMI_FURNISHED,
    premium: true
  },
  {
    slug: "pune-baner-studio",
    code: "104_STD",
    title: "Baner Work Studio",
    description: "Compact studio apartment for a solo resident, close to Balewadi High Street and major tech offices.",
    city: "Pune",
    neighborhood: "Baner",
    locality: "Baner",
    state: "Maharashtra",
    country: "India",
    address: "Baner Road, Pune",
    formattedAddress: "Baner Road, Pune, Maharashtra, India",
    latitude: 18.559,
    longitude: 73.7868,
    category: PropertyCategory.STUDIO,
    price: 32000,
    beds: 1,
    baths: 1,
    sqft: 480,
    amenities: ["Lift", "Wifi ready", "Parking", "Balcony", "Gated society"],
    furnishing: Furnishing.SEMI_FURNISHED,
    premium: false
  },
  {
    slug: "delhi-defence-colony-floor",
    code: "105_APT",
    title: "Defence Colony Floor",
    description: "Independent builder floor with generous living spaces, servant room, and quick access to South Delhi markets.",
    city: "New Delhi",
    neighborhood: "Defence Colony",
    locality: "Defence Colony",
    state: "Delhi",
    country: "India",
    address: "Defence Colony, New Delhi",
    formattedAddress: "Defence Colony, New Delhi, Delhi, India",
    latitude: 28.5734,
    longitude: 77.2307,
    category: PropertyCategory.APARTMENT,
    price: 210000,
    beds: 3,
    baths: 3,
    sqft: 2200,
    amenities: ["Independent floor", "Servant room", "Parking", "Private lift", "Park nearby"],
    furnishing: Furnishing.UNFURNISHED,
    premium: true
  },
  {
    slug: "hyderabad-hitech-city-loft",
    code: "106_LFT",
    title: "HITEC City Co-living Loft",
    description: "Design-forward co-living loft with private rooms, shared studio kitchen, event lounge, and metro access.",
    city: "Hyderabad",
    neighborhood: "HITEC City",
    locality: "HITEC City",
    state: "Telangana",
    country: "India",
    address: "Madhapur, Hyderabad",
    formattedAddress: "Madhapur, HITEC City, Hyderabad, Telangana, India",
    latitude: 17.4483,
    longitude: 78.3915,
    category: PropertyCategory.LOFT,
    price: 28500,
    beds: 1,
    baths: 1,
    sqft: 340,
    amenities: ["Co-working", "Wifi", "Events", "Housekeeping", "Metro nearby", "Cafe"],
    furnishing: Furnishing.FURNISHED,
    premium: false
  }
];

async function upsertUser(input: {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  passwordHash: string;
  phone?: string;
  bio?: string;
}) {
  return prisma.user.upsert({
    where: { email: input.email },
    update: {
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
      verified: true,
      phone: input.phone,
      bio: input.bio,
      active: true
    },
    create: {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      passwordHash: input.passwordHash,
      role: input.role,
      verified: true,
      phone: input.phone,
      bio: input.bio
    }
  });
}

async function main() {
  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await upsertUser({
    email: "admin@roomzly.test",
    firstName: "Naina",
    lastName: "Admin",
    role: UserRole.ADMIN,
    passwordHash,
    phone: "+91 98765 10000",
    bio: "Roomzly operations admin."
  });

  const ownerUsers = await Promise.all(owners.map((owner) => upsertUser({ ...owner, role: UserRole.OWNER, passwordHash })));
  const residentUsers = await Promise.all(
    residents.map((resident) => upsertUser({ ...resident, role: UserRole.RESIDENT, passwordHash }))
  );

  const seeded = [];
  for (const [index, property] of properties.entries()) {
    const owner = ownerUsers[index % ownerUsers.length]!;
    const created = await prisma.property.upsert({
      where: { slug: property.slug },
      update: {
        ...property,
        ownerId: owner.id,
        verified: index !== 1,
        active: true,
        premium: property.premium,
        viewCount: 500 + index * 175
      },
      create: {
        ...property,
        ownerId: owner.id,
        verified: index !== 1,
        active: true,
        rating: 4.6 + index * 0.04,
        reviewCount: 0,
        viewCount: 500 + index * 175,
        images: {
          create: [0, 1, 2].map((offset) => ({
            url: imageUrls[(index + offset) % imageUrls.length]!,
            publicId: `seed/${property.slug}/${offset}`,
            order: offset
          }))
        }
      }
    });
    seeded.push(created);
  }

  for (const [index, property] of seeded.entries()) {
    const reviewer = residentUsers[index % residentUsers.length]!;
    await prisma.booking.upsert({
      where: { id: `seed-booking-${index + 1}` },
      update: {},
      create: {
        id: `seed-booking-${index + 1}`,
        propertyId: property.id,
        guestId: reviewer.id,
        checkIn: new Date(`2026-07-${String(10 + index).padStart(2, "0")}T00:00:00.000Z`),
        checkOut: new Date(`2026-07-${String(15 + index).padStart(2, "0")}T00:00:00.000Z`),
        moveInDate: new Date(`2026-07-${String(10 + index).padStart(2, "0")}T00:00:00.000Z`),
        nights: 5,
        total: Number(property.price) * 5,
        status: index % 3 === 0 ? BookingStatus.PENDING : BookingStatus.CONFIRMED,
        notes: "Seed booking"
      }
    });

    await prisma.review.upsert({
      where: { propertyId_userId: { propertyId: property.id, userId: reviewer.id } },
      update: {},
      create: {
        propertyId: property.id,
        userId: reviewer.id,
        rating: 4 + (index % 2),
        body: "Clean, responsive owner, and the listing details matched the visit experience."
      }
    });
  }

  await Promise.all([
    prisma.wishlist.upsert({
      where: { userId_propertyId: { userId: residentUsers[0]!.id, propertyId: seeded[0]!.id } },
      update: {},
      create: { userId: residentUsers[0]!.id, propertyId: seeded[0]!.id }
    }),
    prisma.report.upsert({
      where: { id: "seed-report-1" },
      update: {},
      create: {
        id: "seed-report-1",
        reporterId: residentUsers[1]!.id,
        targetType: "PROPERTY",
        targetId: seeded[1]!.id,
        propertyId: seeded[1]!.id,
        reportedUserId: seeded[1]!.ownerId,
        type: "FAKE_LISTING",
        description: "Demo report: rent looks unusually low for this area and should be checked."
      }
    })
  ]);

  const existingThread = await prisma.messageThread.findFirst({
    where: {
      propertyId: seeded[0]!.id,
      AND: [
        { participants: { some: { userId: ownerUsers[0]!.id } } },
        { participants: { some: { userId: residentUsers[0]!.id } } }
      ]
    },
    select: { id: true }
  });

  const thread =
    existingThread ??
    (await prisma.messageThread.create({
      data: {
        propertyId: seeded[0]!.id,
        participants: {
          createMany: {
            data: [{ userId: ownerUsers[0]!.id }, { userId: residentUsers[0]!.id }]
          }
        }
      },
      select: { id: true }
    }));

  const seedMessageCount = await prisma.message.count({ where: { threadId: thread.id } });
  if (seedMessageCount === 0) {
    await prisma.message.createMany({
      data: [
        { threadId: thread.id, senderId: residentUsers[0]!.id, body: "Hi! Is parking included with the Bandra apartment?" },
        { threadId: thread.id, senderId: ownerUsers[0]!.id, body: "Yes, one reserved parking spot is included." }
      ]
    });
  }

  console.info(`Seed complete. Demo password: ${password}`);
  console.info("Users: admin@roomzly.test, owner@roomzly.test, owner2@roomzly.test, resident@roomzly.test");
  void admin;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
