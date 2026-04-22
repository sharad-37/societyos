// prisma/seed.ts
// ============================================================
// SEED FILE — Creates sample data for development
// Run with: npx prisma db seed
// ============================================================

import { FlatStatus, PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // ─── 1. Create Society ──────────────────────────────────
  const society = await prisma.society.create({
    data: {
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
    },
  });
  console.log(`✅ Society created: ${society.name} (${society.id})`);

  // ─── 2. Create Flats ────────────────────────────────────
  const flatData = [
    { flat_number: "A-101", floor: 1, wing: "A", monthly_amount: 2500 },
    { flat_number: "A-102", floor: 1, wing: "A", monthly_amount: 2500 },
    { flat_number: "B-201", floor: 2, wing: "B", monthly_amount: 3000 },
    { flat_number: "B-202", floor: 2, wing: "B", monthly_amount: 3000 },
    { flat_number: "C-301", floor: 3, wing: "C", monthly_amount: 3500 },
  ];

  const flats = await Promise.all(
    flatData.map((flat) =>
      prisma.flat.create({
        data: {
          society_id: society.id,
          ...flat,
          area_sqft: 850,
          bedrooms: 2,
          status: FlatStatus.OCCUPIED,
        },
      }),
    ),
  );
  console.log(`✅ ${flats.length} flats created`);

  // ─── 3. Create Users ────────────────────────────────────
  const users = await Promise.all([
    // President
    prisma.user.create({
      data: {
        society_id: society.id,
        flat_id: flats[0].id,
        email: "president@sunshineapts.com",
        phone: "9876543001",
        full_name: "Ramesh Sharma",
        role: UserRole.PRESIDENT,
        status: "ACTIVE",
        is_owner: true,
      },
    }),
    // Secretary
    prisma.user.create({
      data: {
        society_id: society.id,
        flat_id: flats[1].id,
        email: "secretary@sunshineapts.com",
        phone: "9876543002",
        full_name: "Priya Mehta",
        role: UserRole.SECRETARY,
        status: "ACTIVE",
        is_owner: true,
      },
    }),
    // Treasurer
    prisma.user.create({
      data: {
        society_id: society.id,
        flat_id: flats[2].id,
        email: "treasurer@sunshineapts.com",
        phone: "9876543003",
        full_name: "Suresh Patel",
        role: UserRole.TREASURER,
        status: "ACTIVE",
        is_owner: true,
      },
    }),
    // Residents
    prisma.user.create({
      data: {
        society_id: society.id,
        flat_id: flats[3].id,
        email: "resident1@gmail.com",
        phone: "9876543004",
        full_name: "Anita Joshi",
        role: UserRole.RESIDENT,
        status: "ACTIVE",
        is_owner: false,
      },
    }),
    prisma.user.create({
      data: {
        society_id: society.id,
        flat_id: flats[4].id,
        email: "sharad@gmail.com",
        phone: "9876543005",
        full_name: "Sharad Manani",
        role: UserRole.RESIDENT,
        status: "ACTIVE",
        is_owner: true,
      },
    }),
  ]);
  console.log(`✅ ${users.length} users created`);

  // ─── 4. Create Sample Bills ─────────────────────────────
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  await Promise.all(
    flats.map((flat, index) =>
      prisma.bill.create({
        data: {
          society_id: society.id,
          flat_id: flat.id,
          user_id: users[index].id,
          bill_number: `BILL-${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(index + 1).padStart(3, "0")}`,
          billing_month: currentMonth,
          billing_year: currentYear,
          amount: flat.monthly_amount,
          total_amount: flat.monthly_amount,
          due_date: new Date(currentYear, currentMonth - 1, 10),
          status: index === 0 ? "PAID" : "PENDING",
        },
      }),
    ),
  );
  console.log(`✅ ${flats.length} bills created`);

  // ─── 5. Create Sample Notice ─────────────────────────────
  await prisma.notice.create({
    data: {
      society_id: society.id,
      created_by: users[1].id,
      title: "Monthly Meeting — July 2024",
      content:
        "Dear Residents, the monthly society meeting will be held on 15th July 2024 at 7:00 PM in the community hall. Agenda: Maintenance updates, budget review, and upcoming repairs. All residents are requested to attend.",
      category: "MEETING",
      is_pinned: true,
      is_urgent: false,
    },
  });
  console.log("✅ Sample notice created");

  // ─── 6. Create Sample Complaint ─────────────────────────
  await prisma.complaint.create({
    data: {
      society_id: society.id,
      raised_by: users[3].id,
      complaint_number: "COMP-2024-001",
      category: "PLUMBING",
      priority: "HIGH",
      title: "Water leakage in bathroom",
      description:
        "There is a significant water leakage from the pipe under the bathroom sink in flat B-202. Water is dripping continuously and damaging the cabinet below.",
      status: "OPEN",
      location: "Flat B-202, Bathroom",
    },
  });
  console.log("✅ Sample complaint created");

  // ─── 7. Create Amenity ───────────────────────────────────
  await prisma.amenity.create({
    data: {
      society_id: society.id,
      name: "Community Hall",
      description: "Large hall suitable for meetings and celebrations",
      capacity: 100,
      location: "Ground Floor",
      booking_price: 500,
      slot_duration_min: 120,
      open_time: "08:00",
      close_time: "22:00",
      requires_approval: true,
      advance_days: 7,
    },
  });
  console.log("✅ Sample amenity created");

  console.log("");
  console.log("🎉 Seed completed successfully!");
  console.log("");
  console.log("📧 Test user emails:");
  console.log("   president@sunshineapts.com  (PRESIDENT)");
  console.log("   secretary@sunshineapts.com  (SECRETARY)");
  console.log("   treasurer@sunshineapts.com  (TREASURER)");
  console.log("   resident1@gmail.com          (RESIDENT)");
  console.log("   sharad@gmail.com             (RESIDENT)");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
