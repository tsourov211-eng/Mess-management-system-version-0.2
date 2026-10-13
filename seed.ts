// seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Starting complete mess management seed process...");

    // Common passwords
    const adminPassword = await bcrypt.hash("Tanvir@#", 10);
    const memberPassword = await bcrypt.hash("123456", 10);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed
    const todayDate = new Date(Date.UTC(currentYear, currentMonth, now.getDate(), 0, 0, 0, 0));

    // ─────────────────────────────────────────────────────────────
    // 1. ACTIVE MEMBERS (6 Total: 1 Admin, 1 Manager, 4 Members)
    // ─────────────────────────────────────────────────────────────
    console.log("👤 Creating/Updating active members...");

    // 1. Super Admin
    const admin = await prisma.user.upsert({
        where: { email: "ourmess001@gmail.com" },
        update: {
            name: "Super Admin",
            role: "admin",
            phone: "01521302360",
            password: adminPassword,
            defaultBreakfast: 0.5,
            defaultLunch: 1.0,
            defaultDinner: 1.0,
        },
        create: {
            name: "Super Admin",
            email: "ourmess001@gmail.com",
            phone: "01521302360",
            role: "admin",
            password: adminPassword,
            defaultBreakfast: 0.5,
            defaultLunch: 1.0,
            defaultDinner: 1.0,
        },
    });

    // 2. Manager
    const manager = await prisma.user.upsert({
        where: { email: "manager@gmail.com" },
        update: {
            name: "Rakib Chowdhury",
            role: "manager",
            phone: "01811223344",
            password: memberPassword,
            defaultBreakfast: 0.5,
            defaultLunch: 1.0,
            defaultDinner: 1.0,
        },
        create: {
            name: "Rakib Chowdhury",
            email: "manager@gmail.com",
            phone: "01811223344",
            role: "manager",
            password: memberPassword,
            defaultBreakfast: 0.5,
            defaultLunch: 1.0,
            defaultDinner: 1.0,
        },
    });

    // 3. Member: Tanvir
    const tanvir = await prisma.user.upsert({
        where: { email: "tanvirsourov967@gmail.com" },
        update: {
            name: "Tanvir Hasan",
            role: "member",
            phone: "01953873777",
            password: memberPassword,
            defaultBreakfast: 0.5,
            defaultLunch: 1.0,
            defaultDinner: 1.0,
        },
        create: {
            name: "Tanvir Hasan",
            email: "tanvirsourov967@gmail.com",
            phone: "01953873777",
            role: "member",
            password: memberPassword,
            defaultBreakfast: 0.5,
            defaultLunch: 1.0,
            defaultDinner: 1.0,
        },
    });

    // 4. Member: Arif
    const arif = await prisma.user.upsert({
        where: { email: "arif@gmail.com" },
        update: {
            name: "Arif Rahman",
            role: "member",
            phone: "01712345678",
            password: memberPassword,
            defaultBreakfast: 0.5,
            defaultLunch: 1.0,
            defaultDinner: 1.0,
        },
        create: {
            name: "Arif Rahman",
            email: "arif@gmail.com",
            phone: "01712345678",
            role: "member",
            password: memberPassword,
            defaultBreakfast: 0.5,
            defaultLunch: 1.0,
            defaultDinner: 1.0,
        },
    });

    // 5. Member: Shakil
    const shakil = await prisma.user.upsert({
        where: { email: "shakil@gmail.com" },
        update: {
            name: "Shakil Ahmed",
            role: "member",
            phone: "01612345678",
            password: memberPassword,
            defaultBreakfast: 0.5,
            defaultLunch: 1.0,
            defaultDinner: 1.0,
        },
        create: {
            name: "Shakil Ahmed",
            email: "shakil@gmail.com",
            phone: "01612345678",
            role: "member",
            password: memberPassword,
            defaultBreakfast: 0.5,
            defaultLunch: 1.0,
            defaultDinner: 1.0,
        },
    });

    // 6. Member: Mehedi
    const mehedi = await prisma.user.upsert({
        where: { email: "mehedi@gmail.com" },
        update: {
            name: "Mehedi Hasan",
            role: "member",
            phone: "01312345678",
            password: memberPassword,
            defaultBreakfast: 0.5,
            defaultLunch: 1.0,
            defaultDinner: 1.0,
        },
        create: {
            name: "Mehedi Hasan",
            email: "mehedi@gmail.com",
            phone: "01312345678",
            role: "member",
            password: memberPassword,
            defaultBreakfast: 0.5,
            defaultLunch: 1.0,
            defaultDinner: 1.0,
        },
    });

    const activeMembers = [admin, manager, tanvir, arif, shakil, mehedi];
    console.log(`✅ Configured ${activeMembers.length} active members.`);

    // ─────────────────────────────────────────────────────────────
    // 2. PENDING MEMBERS (2 In Admin Approval Queue)
    // ─────────────────────────────────────────────────────────────
    console.log("⏳ Creating 2 pending approval members...");

    const pendingFahim = await prisma.user.upsert({
        where: { email: "fahim@gmail.com" },
        update: {
            name: "Fahim Shahriar",
            role: "pending",
            phone: "01799887766",
            password: memberPassword,
        },
        create: {
            name: "Fahim Shahriar",
            email: "fahim@gmail.com",
            role: "pending",
            phone: "01799887766",
            password: memberPassword,
        },
    });

    const pendingNayeem = await prisma.user.upsert({
        where: { email: "nayeem@gmail.com" },
        update: {
            name: "Nayeem Islam",
            role: "pending",
            phone: "01899887766",
            password: memberPassword,
        },
        create: {
            name: "Nayeem Islam",
            email: "nayeem@gmail.com",
            role: "pending",
            phone: "01899887766",
            password: memberPassword,
        },
    });

    console.log("✅ Created 2 pending members: Fahim Shahriar & Nayeem Islam.");

    // ─────────────────────────────────────────────────────────────
    // 3. MONTHLY EXPENSE CONFIG (Active Month)
    // ─────────────────────────────────────────────────────────────
    console.log("📊 Setting up monthly overhead expense configuration...");
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const monthKey = `${monthNames[currentMonth]} ${currentYear}`;
    const isoMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;

    await prisma.monthlyExpense.upsert({
        where: { month: isoMonthKey },
        update: {
            seatRent: 12000,
            electricityGas: 3500,
            internet: 1000,
            maid: 3000,
            additional: 500,
            mealCharge: 0,
        },
        create: {
            month: isoMonthKey,
            seatRent: 12000,
            electricityGas: 3500,
            internet: 1000,
            maid: 3000,
            additional: 500,
            mealCharge: 0,
        },
    });
    console.log(`✅ Configured monthly fixed expense for ${isoMonthKey}`);

    // ─────────────────────────────────────────────────────────────
    // 4. DEPOSITS (Payments: Pending Queue + Approved Baseline)
    // ─────────────────────────────────────────────────────────────
    console.log("💳 Creating payment activities...");

    // A. Approved baseline deposits
    const approvedDeposits = [
        { userId: admin.id, amount: 4500, category: "Meal Fund", method: "bKash", status: "Approved", note: "Advance meal fund deposit" },
        { userId: admin.id, amount: 1500, category: "Mess Fund", method: "Cash", status: "Approved", note: "Monthly seat rent & wifi" },
        { userId: manager.id, amount: 3500, category: "Meal Fund", method: "Nagad", status: "Approved", note: "Meal fund contribution" },
        { userId: manager.id, amount: 1500, category: "Mess Fund", method: "bKash", status: "Approved", note: "Mess overhead share" },
        { userId: tanvir.id, amount: 4000, category: "Meal Fund", method: "bKash", status: "Approved", note: "TrxID: BK782910" },
        { userId: tanvir.id, amount: 1500, category: "Mess Fund", method: "bKash", status: "Approved", note: "Seat rent" },
        { userId: arif.id, amount: 3000, category: "Meal Fund", method: "Cash", status: "Approved", note: "Meal deposit cash to manager" },
        { userId: arif.id, amount: 1500, category: "Mess Fund", method: "Cash", status: "Approved", note: "Rent & utility" },
        { userId: shakil.id, amount: 2800, category: "Meal Fund", method: "Nagad", status: "Approved", note: "Nagad TrxID: NG182903" },
        { userId: shakil.id, amount: 1500, category: "Mess Fund", method: "Nagad", status: "Approved", note: "Mess fixed cost" },
        { userId: mehedi.id, amount: 3200, category: "Meal Fund", method: "bKash", status: "Approved", note: "Meal fund" },
        { userId: mehedi.id, amount: 1500, category: "Mess Fund", method: "bKash", status: "Approved", note: "Mess fund" },
    ];

    for (const dep of approvedDeposits) {
        await prisma.deposit.create({
            data: {
                userId: dep.userId,
                amount: dep.amount,
                category: dep.category,
                method: dep.method,
                status: dep.status,
                note: dep.note,
                date: new Date(Date.UTC(currentYear, currentMonth, Math.max(1, now.getDate() - 3), 10, 0, 0)),
            },
        });
    }

    // B. Pending payment requests (to appear in Approval Queue)
    const pendingDeposits = [
        { userId: tanvir.id, amount: 2500, category: "Meal Fund", method: "bKash", status: "Pending", note: "TrxID: BK9283742 - Mid-month refill" },
        { userId: arif.id, amount: 3000, category: "Meal Fund", method: "Nagad", status: "Pending", note: "TrxID: NG8829102" },
        { userId: shakil.id, amount: 1200, category: "Mess Fund", method: "Cash", status: "Pending", note: "Extra utility & maid contribution" },
    ];

    for (const dep of pendingDeposits) {
        await prisma.deposit.create({
            data: {
                userId: dep.userId,
                amount: dep.amount,
                category: dep.category,
                method: dep.method,
                status: dep.status,
                note: dep.note,
                date: now,
            },
        });
    }
    console.log("✅ Created approved & pending payment deposits.");

    // ─────────────────────────────────────────────────────────────
    // 5. BAZAAR EXPENSES (Pending Queue + Approved Records)
    // ─────────────────────────────────────────────────────────────
    console.log("🛒 Creating bazaar expenses...");

    // A. Approved expenses (Today + Past days this month)
    const pastExpenses = [
        { userId: manager.id, amount: 1250, description: "Fresh Fish (Rui & Pangas) & Green Vegetables", daysAgo: 0 },
        { userId: manager.id, amount: 2400, description: "Chicken (Broiler 4kg), Miniket Rice 25kg, Lentils", daysAgo: 2 },
        { userId: tanvir.id, amount: 1650, description: "Soybean Oil 5L, Spices, Onions & Potatoes", daysAgo: 4 },
        { userId: arif.id, amount: 890, description: "Eggs (2 Dozen), Vegetables & Garlic", daysAgo: 6 },
    ];

    for (const exp of pastExpenses) {
        const expDate = new Date(Date.UTC(currentYear, currentMonth, Math.max(1, now.getDate() - exp.daysAgo), 11, 30, 0));
        await prisma.expense.create({
            data: {
                userId: exp.userId,
                amount: exp.amount,
                description: exp.description,
                status: "Approved",
                date: expDate,
            },
        });
    }

    // B. Pending bazaar expenses (to appear in Approval Queue)
    const pendingExpenses = [
        { userId: manager.id, amount: 1850, description: "Beef 1.5kg, Ginger, Garlic & Green Chilies" },
        { userId: tanvir.id, amount: 650, description: "Eggs, Salad Items & Morning Breakfast Paratha Flour" },
    ];

    for (const exp of pendingExpenses) {
        await prisma.expense.create({
            data: {
                userId: exp.userId,
                amount: exp.amount,
                description: exp.description,
                status: "Pending",
                date: now,
            },
        });
    }
    console.log("✅ Created approved & pending bazaar expenses.");

    // ─────────────────────────────────────────────────────────────
    // 6. GUEST MEAL REQUESTS (Pending Queue + Approved)
    // ─────────────────────────────────────────────────────────────
    console.log("🍽️ Creating guest meal requests...");

    // A. Approved guest meal (synced)
    await prisma.guestMealRequest.create({
        data: {
            userId: tanvir.id,
            date: todayDate,
            mealType: "LUNCH",
            guests: 2,
            status: "Approved",
            reviewedBy: "Super Admin",
            reviewedAt: now,
            note: "College friends visiting",
        },
    });

    // B. Pending guest meal requests (to appear in Approval Queue)
    const pendingGuestMeals = [
        { userId: arif.id, guests: 2, mealType: "DINNER", note: "Guests coming from hometown tonight" },
        { userId: shakil.id, guests: 1, mealType: "LUNCH", note: "Cousin joining for lunch tomorrow" },
        { userId: mehedi.id, guests: 1, mealType: "DINNER", note: "Special guest meal" },
    ];

    for (const gm of pendingGuestMeals) {
        await prisma.guestMealRequest.create({
            data: {
                userId: gm.userId,
                date: todayDate,
                mealType: gm.mealType,
                guests: gm.guests,
                status: "Pending",
                note: gm.note,
            },
        });
    }
    console.log("✅ Created approved & pending guest meal requests.");

    // ─────────────────────────────────────────────────────────────
    // 7. BAZAAR SCHEDULE DATES (Pending Queue + Approved)
    // ─────────────────────────────────────────────────────────────
    console.log("📅 Creating bazaar schedule date requests...");

    // A. Approved schedules
    await prisma.bazaarSchedule.create({
        data: {
            userId: manager.id,
            date: todayDate,
            status: "approved",
        },
    });

    await prisma.bazaarSchedule.create({
        data: {
            userId: tanvir.id,
            date: new Date(Date.UTC(currentYear, currentMonth, Math.min(28, now.getDate() + 2), 0, 0, 0)),
            status: "approved",
        },
    });

    // B. Pending bazaar date requests (to appear in "Member Bazaar Date Requests" table)
    const pendingSchedules = [
        { userId: arif.id, dayOffset: 3 },
        { userId: shakil.id, dayOffset: 5 },
        { userId: mehedi.id, dayOffset: 7 },
    ];

    for (const sch of pendingSchedules) {
        await prisma.bazaarSchedule.create({
            data: {
                userId: sch.userId,
                date: new Date(Date.UTC(currentYear, currentMonth, Math.min(28, now.getDate() + sch.dayOffset), 0, 0, 0)),
                status: "pending",
            },
        });
    }
    console.log("✅ Created approved & pending bazaar schedules.");

    // ─────────────────────────────────────────────────────────────
    // 8. DAILY MEAL LOGS (Today & Past Days for All Active Members)
    // ─────────────────────────────────────────────────────────────
    console.log("🍚 Generating meal logs for active members...");

    const daysToLog = Math.min(now.getDate(), 7); // Log past days up to today

    for (let day = 1; day <= daysToLog; day++) {
        const logDate = new Date(Date.UTC(currentYear, currentMonth, day, 0, 0, 0, 0));
        const isToday = day === daysToLog;

        for (const member of activeMembers) {
            await prisma.mealLog.upsert({
                where: {
                    userId_date: {
                        userId: member.id,
                        date: logDate,
                    },
                },
                update: {
                    breakfast: member.defaultBreakfast || 0.5,
                    lunch: member.defaultLunch || 1.0,
                    dinner: member.defaultDinner || 1.0,
                    guest: isToday && member.id === tanvir.id ? 2.0 : 0.0,
                },
                create: {
                    userId: member.id,
                    date: logDate,
                    breakfast: member.defaultBreakfast || 0.5,
                    lunch: member.defaultLunch || 1.0,
                    dinner: member.defaultDinner || 1.0,
                    guest: isToday && member.id === tanvir.id ? 2.0 : 0.0,
                },
            });
        }
    }
    console.log(`✅ Meal logs generated for ${activeMembers.length} active members across ${daysToLog} days.`);

    // ─────────────────────────────────────────────────────────────
    // 9. NOTICE BOARD ANNOUNCEMENTS
    // ─────────────────────────────────────────────────────────────
    console.log("📢 Publishing notices to notice board...");

    const notices = [
        {
            title: "📢 Monthly Deposit & Rent Collection",
            description: "Please submit your monthly meal deposit and seat rent before the 10th of the month.",
            type: "payment",
            isActive: true,
        },
        {
            title: "🛒 Today's Bazaar Duty: Rakib Chowdhury",
            description: "Manager Rakib is going to bazaar today. Please notify any specific dining items.",
            type: "bazaar",
            isActive: true,
        },
        {
            title: "🍛 Guest Meals Update",
            description: "Guest meal requests are active. Please confirm meals at least 3 hours in advance.",
            type: "guest_meal",
            isActive: true,
        },
    ];

    for (const notice of notices) {
        await prisma.notice.create({
            data: notice,
        });
    }
    console.log("✅ Published active notices.");

    console.log("\n=======================================================");
    console.log("🎉 Complete Mess Management Database Seed Successful!");
    console.log("=======================================================");
    console.log("Members Created:");
    console.log(" • 6 Active Members: Admin, Manager, Tanvir, Arif, Shakil, Mehedi");
    console.log(" • 2 Pending Members: Fahim Shahriar & Nayeem Islam (In Admin Approval Queue)");
    console.log("Activities Created:");
    console.log(" • Payment Requests: 3 Pending, 12 Approved");
    console.log(" • Bazaar Expenses: 2 Pending, 4 Approved (Today's Bazaar included)");
    console.log(" • Guest Meal Requests: 3 Pending, 1 Approved");
    console.log(" • Bazaar Schedules: 3 Pending Date Requests, 2 Approved");
    console.log(" • Daily Meals: Complete logs for all active members");
    console.log(" • Monthly Expense Config: Configured for active month");
    console.log(" • Notice Board: 3 active notices");
    console.log("=======================================================\n");
}

main()
    .catch((e) => {
        console.error("❌ Seed Error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });