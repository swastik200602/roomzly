import { BookingStatus, Furnishing, PrismaClient, PropertyCategory, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

declare const process: { exit: (code?: number) => never };

const prisma = new PrismaClient();

const password = "Password123!";

const imageUrls = [
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80"
];

const owners = [
  {
    email: "owner@roomzly.test",
    firstName: "Vikram",
    lastName: "Rawat",
    phone: "+91 98765 10001",
    bio: "Managing verified student PGs and residential flats across Bidholi, Prem Nagar, and Clement Town."
  },
  {
    email: "owner2@roomzly.test",
    firstName: "Meenakshi",
    lastName: "Negi",
    phone: "+91 98765 10002",
    bio: "Comfortable co-living residences and mountain view studio flats near Graphic Era and Rajpur Road."
  }
];

const residents = [
  { email: "resident@roomzly.test", firstName: "Aman", lastName: "Sharma" },
  { email: "resident2@roomzly.test", firstName: "Rohan", lastName: "Verma" },
  { email: "resident3@roomzly.test", firstName: "Priya", lastName: "Joshi" }
];

const properties = [
  {
    slug: "pine-view-scholar-pg-bidholi",
    code: "101_PG",
    title: "Pine View Scholar Residency (Boys & Girls PG)",
    description: "Fully furnished student PG located just 400m from UPES Bidholi Gate 1. Includes 3-times homestyle meals, high-speed fiber internet, power backup, study desks, and biometric entry.",
    city: "Dehradun",
    neighborhood: "Bidholi",
    locality: "Bidholi",
    state: "Uttarakhand",
    country: "India",
    address: "Near UPES Gate 1, Bidholi, Dehradun",
    formattedAddress: "Bidholi, Dehradun, Uttarakhand 248007, India",
    latitude: 30.4185,
    longitude: 77.9672,
    category: PropertyCategory.PG,
    price: 8500,
    beds: 1,
    baths: 1,
    sqft: 220,
    amenities: ["3 Times Meals", "High-Speed WiFi", "Power Backup", "Study Desk", "CCTV Security", "Laundry Service"],
    furnishing: Furnishing.FURNISHED,
    premium: true
  },
  {
    slug: "himalayan-nest-studio-bidholi",
    code: "102_STD",
    title: "Himalayan Nest 1BHK Student Studio",
    description: "Peaceful mountain-facing 1BHK studio apartment near UPES Knowledge City. Private balcony, modular kitchenette, inverter backup, and quiet study environment.",
    city: "Dehradun",
    neighborhood: "Bidholi",
    locality: "Bidholi",
    state: "Uttarakhand",
    country: "India",
    address: "Paundha Road, Bidholi, Dehradun",
    formattedAddress: "Paundha Road, Bidholi, Dehradun, Uttarakhand 248007, India",
    latitude: 30.4140,
    longitude: 77.9695,
    category: PropertyCategory.STUDIO,
    price: 13500,
    beds: 1,
    baths: 1,
    sqft: 450,
    amenities: ["Mountain View", "Kitchenette", "Balcony", "Power Backup", "High-Speed WiFi", "Two Wheeler Parking"],
    furnishing: Furnishing.FURNISHED,
    premium: false
  },
  {
    slug: "prem-nagar-student-haven-pg",
    code: "103_PG",
    title: "Prem Nagar Scholar Haven (Twin Sharing PG)",
    description: "Modern student co-living PG right in the heart of Prem Nagar market. Direct connectivity to college buses, walking distance to grocery stores, gym, and cafes.",
    city: "Dehradun",
    neighborhood: "Prem Nagar",
    locality: "Prem Nagar",
    state: "Uttarakhand",
    country: "India",
    address: "Main Market Road, Prem Nagar, Dehradun",
    formattedAddress: "Prem Nagar, Dehradun, Uttarakhand 248007, India",
    latitude: 30.3392,
    longitude: 77.9548,
    category: PropertyCategory.PG,
    price: 7500,
    beds: 1,
    baths: 1,
    sqft: 240,
    amenities: ["Meals Included", "Wifi", "RO Water", "Weekly Housekeeping", "Attached Washroom", "Geyser"],
    furnishing: Furnishing.FURNISHED,
    premium: true
  },
  {
    slug: "doon-valley-2bhk-flat-prem-nagar",
    code: "104_APT",
    title: "Doon Valley 2BHK Student Flat",
    description: "Spacious semi-furnished 2BHK flat ideal for a group of 3-4 college students sharing rent. Close to BFIT campus with easy transport access.",
    city: "Dehradun",
    neighborhood: "Suddhowala",
    locality: "Suddhowala",
    state: "Uttarakhand",
    country: "India",
    address: "Chakrata Highway, Suddhowala, Dehradun",
    formattedAddress: "Suddhowala, Dehradun, Uttarakhand 248007, India",
    latitude: 30.3445,
    longitude: 77.9460,
    category: PropertyCategory.APARTMENT,
    price: 16000,
    beds: 2,
    baths: 2,
    sqft: 980,
    amenities: ["Car Parking", "Balcony", "Kitchen Cabinets", "Geyser", "24x7 Water", "Inverter Wiring"],
    furnishing: Furnishing.SEMI_FURNISHED,
    premium: false
  },
  {
    slug: "graphic-heights-coliving-clement-town",
    code: "105_PG",
    title: "Graphic Heights Premium Student PG",
    description: "Luxury student accommodation 200m from Graphic Era University. AC rooms, air cooler options, high-speed fiber, gym corner, and hygienic multi-cuisine food.",
    city: "Dehradun",
    neighborhood: "Clement Town",
    locality: "Clement Town",
    state: "Uttarakhand",
    country: "India",
    address: "Near Subhash Nagar, Clement Town, Dehradun",
    formattedAddress: "Clement Town, Dehradun, Uttarakhand 248002, India",
    latitude: 30.2690,
    longitude: 78.0140,
    category: PropertyCategory.PG,
    price: 9500,
    beds: 1,
    baths: 1,
    sqft: 260,
    amenities: ["AC", "Nutritious Meals", "Gym", "High-Speed WiFi", "Lounge Area", "Biometric Entry"],
    furnishing: Furnishing.FURNISHED,
    premium: true
  },
  {
    slug: "subhash-nagar-1bhk-clement-town",
    code: "106_APT",
    title: "Subhash Nagar 1BHK Student Apartment",
    description: "Furnished 1BHK flat for students or young working professionals. 5 minutes walk to Graphic Era campus, quiet neighborhood with safe gated entry.",
    city: "Dehradun",
    neighborhood: "Clement Town",
    locality: "Clement Town",
    state: "Uttarakhand",
    country: "India",
    address: "Lane 3, Subhash Nagar, Clement Town, Dehradun",
    formattedAddress: "Subhash Nagar, Clement Town, Dehradun, Uttarakhand 248002, India",
    latitude: 30.2715,
    longitude: 78.0118,
    category: PropertyCategory.APARTMENT,
    price: 12500,
    beds: 1,
    baths: 1,
    sqft: 520,
    amenities: ["Refrigerator", "RO Purifier", "Balcony", "Gated Security", "WiFi", "Two Wheeler Parking"],
    furnishing: Furnishing.FURNISHED,
    premium: false
  },
  {
    slug: "dit-foothills-residency-makkawala",
    code: "107_PG",
    title: "DIT Foothills Student Residence",
    description: "Serene hillside PG located just 300m from DIT University campus. Spectacular Mussoorie view, quiet study hours, 3 buffet meals, and weekly room cleaning.",
    city: "Dehradun",
    neighborhood: "Makkawala",
    locality: "Makkawala",
    state: "Uttarakhand",
    country: "India",
    address: "Mussoorie Diversion Road, Makkawala, Dehradun",
    formattedAddress: "Makkawala, Dehradun, Uttarakhand 248009, India",
    latitude: 30.4015,
    longitude: 78.0725,
    category: PropertyCategory.PG,
    price: 8500,
    beds: 1,
    baths: 1,
    sqft: 230,
    amenities: ["Hill View", "Buffet Meals", "Fast WiFi", "Power Backup", "Study Tables", "Security Guard"],
    furnishing: Furnishing.FURNISHED,
    premium: true
  },
  {
    slug: "pacific-hills-2bhk-rajpur-road",
    code: "108_APT",
    title: "Pacific Hills 2BHK View Apartment",
    description: "Modern 2BHK apartment situated near Mussoorie Diversion on Rajpur Road. Ideal for senior students or faculty looking for comfortable living close to cafes and DIT.",
    city: "Dehradun",
    neighborhood: "Rajpur Road",
    locality: "Rajpur Road",
    state: "Uttarakhand",
    country: "India",
    address: "Near Pacific Mall, Rajpur Road, Dehradun",
    formattedAddress: "Rajpur Road, Dehradun, Uttarakhand 248001, India",
    latitude: 30.3620,
    longitude: 78.0690,
    category: PropertyCategory.APARTMENT,
    price: 22000,
    beds: 2,
    baths: 2,
    sqft: 1100,
    amenities: ["Mountain View", "Lift", "Covered Parking", "Modular Kitchen", "Clubhouse", "24x7 Security"],
    furnishing: Furnishing.SEMI_FURNISHED,
    premium: true
  },
  {
    slug: "doon-central-coliving-dbs",
    code: "109_PG",
    title: "Doon Central Co-living (Near DBS)",
    description: "Central Dehradun co-living space 5 minutes from Doon Business School. Includes dedicated silent library room, high-speed fiber, healthy home food, and gym.",
    city: "Dehradun",
    neighborhood: "Chakrata Road",
    locality: "Chakrata Road",
    state: "Uttarakhand",
    country: "India",
    address: "Chakrata Road, Near DBS, Dehradun",
    formattedAddress: "Chakrata Road, Dehradun, Uttarakhand 248001, India",
    latitude: 30.3175,
    longitude: 78.0295,
    category: PropertyCategory.PG,
    price: 8000,
    beds: 1,
    baths: 1,
    sqft: 250,
    amenities: ["Library Room", "Home Meals", "AC", "WiFi", "Laundry", "Daily Housekeeping"],
    furnishing: Furnishing.FURNISHED,
    premium: false
  },
  {
    slug: "greenwood-residency-selaqui",
    code: "110_PG",
    title: "Greenwood Student Residency (Near Tula's)",
    description: "Budget-friendly and spacious student hostel near Tula's Institute and Selaqui Pharma Hub. Regular transport, warm food, sports lawn, and power backup.",
    city: "Dehradun",
    neighborhood: "Selaqui",
    locality: "Selaqui",
    state: "Uttarakhand",
    country: "India",
    address: "Dhoolkot Road, Selaqui, Dehradun",
    formattedAddress: "Selaqui, Dehradun, Uttarakhand 248011, India",
    latitude: 30.3820,
    longitude: 77.8835,
    category: PropertyCategory.PG,
    price: 7000,
    beds: 1,
    baths: 1,
    sqft: 240,
    amenities: ["Nutritious Food", "Sports Lawn", "Power Backup", "WiFi", "Geyser", "CCTV"],
    furnishing: Furnishing.FURNISHED,
    premium: false
  },
  {
    slug: "shankarpur-scholar-residence-jbit",
    code: "111_PG",
    title: "Shankarpur Scholar Residency (Near JBIT)",
    description: "Peaceful student hostel just 250m from JBIT campus entrance on Chakrata Road. Ideal for engineering students with nutritious food, study tables, and power backup.",
    city: "Dehradun",
    neighborhood: "Shankarpur",
    locality: "Shankarpur",
    state: "Uttarakhand",
    country: "India",
    address: "23 Milestone, Chakrata Road, Shankarpur, Dehradun",
    formattedAddress: "Shankarpur, Dehradun, Uttarakhand 248197, India",
    latitude: 30.3795,
    longitude: 77.8265,
    category: PropertyCategory.PG,
    price: 6500,
    beds: 1,
    baths: 1,
    sqft: 220,
    amenities: ["Meals Included", "High-Speed WiFi", "Power Backup", "RO Water", "Study Room", "CCTV Security"],
    furnishing: Furnishing.FURNISHED,
    premium: true
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
    bio: "Roomzly Dehradun student operations admin."
  });

  const ownerUsers = await Promise.all(owners.map((owner) => upsertUser({ ...owner, role: UserRole.OWNER, passwordHash })));
  const residentUsers = await Promise.all(
    residents.map((resident) => upsertUser({ ...resident, role: UserRole.RESIDENT, passwordHash }))
  );

  // Clean up previous non-Dehradun seed properties if they exist
  const oldSlugs = [
    "bandra-skyline-apartment",
    "koramangala-managed-pg",
    "gurugram-golf-course-villa",
    "pune-baner-studio",
    "delhi-defence-colony-floor",
    "hyderabad-hitech-city-loft"
  ];
  await prisma.property.deleteMany({
    where: { slug: { in: oldSlugs } }
  }).catch(() => { });

  const seeded = [];
  for (const [index, property] of properties.entries()) {
    const owner = ownerUsers[index % ownerUsers.length]!;
    const created = await prisma.property.upsert({
      where: { slug: property.slug },
      update: {
        ...property,
        ownerId: owner.id,
        verified: true,
        active: true,
        premium: property.premium,
        viewCount: 650 + index * 120
      },
      create: {
        ...property,
        ownerId: owner.id,
        verified: true,
        active: true,
        rating: 4.7 + (index % 3) * 0.1,
        reviewCount: 4 + (index % 5),
        viewCount: 650 + index * 120,
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
        checkIn: new Date(`2026-09-${String(10 + (index % 10)).padStart(2, "0")}T00:00:00.000Z`),
        checkOut: new Date(`2026-09-${String(15 + (index % 10)).padStart(2, "0")}T00:00:00.000Z`),
        moveInDate: new Date(`2026-09-${String(10 + (index % 10)).padStart(2, "0")}T00:00:00.000Z`),
        nights: 5,
        total: Number(property.price),
        status: index % 3 === 0 ? BookingStatus.PENDING : BookingStatus.CONFIRMED,
        notes: "Campus semester booking"
      }
    });

    await prisma.review.upsert({
      where: { propertyId_userId: { propertyId: property.id, userId: reviewer.id } },
      update: {},
      create: {
        propertyId: property.id,
        userId: reviewer.id,
        rating: 4 + (index % 2),
        body: "Great location for college students. Fast wifi, clean washroom, and food quality is actually homestyle."
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
        description: "Demo report: rent looks unusually low for this area and should be verified."
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
        { threadId: thread.id, senderId: residentUsers[0]!.id, body: "Hi Vikram ji! Is 3-times food and high-speed wifi included with the Bidholi PG?" },
        { threadId: thread.id, senderId: ownerUsers[0]!.id, body: "Yes Aman, all 3 buffet meals, high-speed fiber wifi, and power backup are fully included in the monthly rent." }
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
