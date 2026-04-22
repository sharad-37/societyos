// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // ─── 1. Create Society ──────────────────────────────────
  const society = await prisma.society.upsert({
    where: { registration_no: "MH/MUM/HSG/2010/001" },
    update: {},
    create: {
      name: "Sunshine Apartments CHS",
      registration_no: "MH/MUM/HSG/2010/001",
      address: "123, Sunshine Road, Andheri West",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400058",
      total_flats: 48,
      total_floors: 8,
      total_wings: 3,
      contact_email: "secretary@sunshineapts.com",
      contact_phone: "9876543210",
      is_active: true,
    },
  });
  console.log(`✅ Society: ${society.name}`);

  // ─── 2. Create Flats ────────────────────────────────────
  const flatData = [
    {
      flat_number: "A-101",
      floor: 1,
      wing: "A",
      monthly_amount: 2500,
    },
    {
      flat_number: "A-102",
      floor: 1,
      wing: "A",
      monthly_amount: 2500,
    },
    {
      flat_number: "B-201",
      floor: 2,
      wing: "B",
      monthly_amount: 3000,
    },
    {
      flat_number: "B-202",
      floor: 2,
      wing: "B",
      monthly_amount: 3000,
    },
    {
      flat_number: "C-301",
      floor: 3,
      wing: "C",
      monthly_amount: 3500,
    },
  ];

  const flats = await Promise.all(
    flatData.map((flat) =>
      prisma.flat.upsert({
        where: {
          society_id_flat_number: {
            society_id: society.id,
            flat_number: flat.flat_number,
          },
        },
        update: {},
        create: {
          society_id: society.id,
          flat_number: flat.flat_number,
          floor: flat.floor,
          wing: flat.wing,
          area_sqft: 850,
          bedrooms: 2,
          status: "OCCUPIED",
          monthly_amount: flat.monthly_amount,
          is_commercial: false,
        },
      }),
    ),
  );
  console.log(`✅ ${flats.length} flats created`);

  // ─── 3. Create Users ────────────────────────────────────
  const userData = [
    {
      flatIndex: 0,
      email: "president@sunshineapts.com",
      phone: "9876543001",
      full_name: "Ramesh Sharma",
      role: "PRESIDENT" as const,
    },
    {
      flatIndex: 1,
      email: "secretary@sunshineapts.com",
      phone: "9876543002",
      full_name: "Priya Mehta",
      role: "SECRETARY" as const,
    },
    {
      flatIndex: 2,
      email: "treasurer@sunshineapts.com",
      phone: "9876543003",
      full_name: "Suresh Patel",
      role: "TREASURER" as const,
    },
    {
      flatIndex: 3,
      email: "resident1@gmail.com",
      phone: "9876543004",
      full_name: "Anita Joshi",
      role: "RESIDENT" as const,
    },
    {
      flatIndex: 4,
      email: "mananisharad1@gmail.com",
      phone: "9876543005",
      full_name: "Sharad Manani",
      role: "RESIDENT" as const,
    },
  ];

  const users = await Promise.all(
    userData.map((u) =>
      prisma.user.upsert({
        where: {
          society_id_email: {
            society_id: society.id,
            email: u.email,
          },
        },
        update: {},
        create: {
          society_id: society.id,
          flat_id: flats[u.flatIndex].id,
          email: u.email,
          phone: u.phone,
          full_name: u.full_name,
          role: u.role,
          status: "ACTIVE",
          is_owner: true,
        },
      }),
    ),
  );
  console.log(`✅ ${users.length} users created`);

  // ─── 4. Create Sample Notice ─────────────────────────────
  const secretary = users.find((u) => u.email === "secretary@sunshineapts.com");

  if (secretary) {
    await prisma.notice.create({
      data: {
        society_id: society.id,
        created_by: secretary.id,
        title: "Monthly Meeting — Welcome to SocietyOS",
        content:
          "Dear Residents, welcome to SocietyOS! " +
          "This platform will help us manage our society digitally. " +
          "Please login and explore the features available to you.",
        category: "GENERAL",
        is_pinned: true,
        is_urgent: false,
      },
    });
    console.log("✅ Sample notice created");
  }

  // ─── 5. Create Sample Complaint ──────────────────────────
  const resident = users.find((u) => u.email === "mananisharad1@gmail.com");

  if (resident) {
    await prisma.complaint
      .create({
        data: {
          society_id: society.id,
          raised_by: resident.id,
          complaint_number: "COMP-2024-0001",
          category: "PLUMBING",
          priority: "HIGH",
          title: "Water leakage in bathroom",
          description:
            "There is a water leak from the pipe under the bathroom sink. " +
            "Water is dripping continuously.",
          status: "OPEN",
          location: "Flat C-301, Bathroom",
        },
      })
      .catch(() => {
        // Ignore if already exists
      });
    console.log("✅ Sample complaint created");
  }

  // ─── 6. Create Amenity ───────────────────────────────────
  await prisma.amenity
    .create({
      data: {
        society_id: society.id,
        name: "Community Hall",
        description: "Large hall for meetings and celebrations",
        capacity: 100,
        location: "Ground Floor",
        booking_price: 500,
        slot_duration_min: 120,
        open_time: "08:00",
        close_time: "22:00",
        requires_approval: true,
        advance_days: 7,
        is_active: true,
      },
    })
    .catch(() => {
      // Ignore if already exists
    });
  console.log("✅ Amenity created");

  console.log("");
  console.log("🎉 Seed completed!");
  console.log("");
  console.log("📧 Login with these emails:");
  console.log("   mananisharad1@gmail.com     (RESIDENT)");
  console.log("   president@sunshineapts.com  (PRESIDENT)");
  console.log("   secretary@sunshineapts.com  (SECRETARY)");
  console.log("   treasurer@sunshineapts.com  (TREASURER)");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
