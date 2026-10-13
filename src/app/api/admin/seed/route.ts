import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { safeErrorResponse } from "@/lib/security";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const adminPassword = await bcrypt.hash("Tanvir@#", 10);
    const memberPassword = await bcrypt.hash("123456", 10);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const todayDate = new Date(Date.UTC(currentYear, currentMonth, now.getDate(), 0, 0, 0, 0));

    // 1. ACTIVE MEMBERS (6 Active: Admin, Manager, 4 Members)
    const admin = await prisma.user.upsert({
      where: { email: "ourmess001@gmail.com" },
      update: { name: "Super Admin", role: "admin", phone: "01521302360", password: adminPassword },
      create: { name: "Super Admin", email: "ourmess001@gmail.com", phone: "01521302360", role: "admin", password: adminPassword },
    });

    const manager = await prisma.user.upsert({
      where: { email: "manager@gmail.com" },
      update: { name: "Rakib Chowdhury", role: "manager", phone: "01811223344", password: memberPassword },
      create: { name: "Rakib Chowdhury", email: "manager@gmail.com", phone: "01811223344", role: "manager", password: memberPassword },
    });

    const tanvir = await prisma.user.upsert({
      where: { email: "tanvirsourov967@gmail.com" },
      update: { name: "Tanvir Hasan", role: "member", phone: "01953873777", password: memberPassword },
      create: { name: "Tanvir Hasan", email: "tanvirsourov967@gmail.com", phone: "01953873777", role: "member", password: memberPassword },
    });

    const arif = await prisma.user.upsert({
      where: { email: "arif@gmail.com" },
      update: { name: "Arif Rahman", role: "member", phone: "01712345678", password: memberPassword },
      create: { name: "Arif Rahman", email: "arif@gmail.com", phone: "01712345678", role: "member", password: memberPassword },
    });

    const shakil = await prisma.user.upsert({
      where: { email: "shakil@gmail.com" },
      update: { name: "Shakil Ahmed", role: "member", phone: "01612345678", password: memberPassword },
      create: { name: "Shakil Ahmed", email: "shakil@gmail.com", phone: "01612345678", role: "member", password: memberPassword },
    });

    const mehedi = await prisma.user.upsert({
      where: { email: "mehedi@gmail.com" },
      update: { name: "Mehedi Hasan", role: "member", phone: "01312345678", password: memberPassword },
      create: { name: "Mehedi Hasan", email: "mehedi@gmail.com", phone: "01312345678", role: "member", password: memberPassword },
    });

    const activeMembers = [admin, manager, tanvir, arif, shakil, mehedi];

    // 2. PENDING MEMBERS (2 in Admin Approval Queue)
    await prisma.user.upsert({
      where: { email: "fahim@gmail.com" },
      update: { name: "Fahim Shahriar", role: "pending", phone: "01799887766", password: memberPassword },
      create: { name: "Fahim Shahriar", email: "fahim@gmail.com", role: "pending", phone: "01799887766", password: memberPassword },
    });

    await prisma.user.upsert({
      where: { email: "nayeem@gmail.com" },
      update: { name: "Nayeem Islam", role: "pending", phone: "01899887766", password: memberPassword },
      create: { name: "Nayeem Islam", email: "nayeem@gmail.com", role: "pending", phone: "01899887766", password: memberPassword },
    });

    // 3. MONTHLY EXPENSE
    const isoMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
    await prisma.monthlyExpense.upsert({
      where: { month: isoMonthKey },
      update: { seatRent: 12000, electricityGas: 3500, internet: 1000, maid: 3000, additional: 500, mealCharge: 0 },
      create: { month: isoMonthKey, seatRent: 12000, electricityGas: 3500, internet: 1000, maid: 3000, additional: 500, mealCharge: 0 },
    });

    // 4. DEPOSITS (Pending & Approved)
    const approvedDeposits = [
      { userId: admin.id, amount: 4500, category: "Meal Fund", method: "bKash" },
      { userId: admin.id, amount: 1500, category: "Mess Fund", method: "Cash" },
      { userId: manager.id, amount: 3500, category: "Meal Fund", method: "Nagad" },
      { userId: manager.id, amount: 1500, category: "Mess Fund", method: "bKash" },
      { userId: tanvir.id, amount: 4000, category: "Meal Fund", method: "bKash" },
      { userId: tanvir.id, amount: 1500, category: "Mess Fund", method: "bKash" },
      { userId: arif.id, amount: 3000, category: "Meal Fund", method: "Cash" },
      { userId: arif.id, amount: 1500, category: "Mess Fund", method: "Cash" },
      { userId: shakil.id, amount: 2800, category: "Meal Fund", method: "Nagad" },
      { userId: shakil.id, amount: 1500, category: "Mess Fund", method: "Nagad" },
      { userId: mehedi.id, amount: 3200, category: "Meal Fund", method: "bKash" },
      { userId: mehedi.id, amount: 1500, category: "Mess Fund", method: "bKash" },
    ];
    for (const dep of approvedDeposits) {
      await prisma.deposit.create({
        data: { ...dep, status: "Approved", date: new Date(Date.UTC(currentYear, currentMonth, Math.max(1, now.getDate() - 3), 10, 0, 0)) },
      });
    }

    const pendingDeposits = [
      { userId: tanvir.id, amount: 2500, category: "Meal Fund", method: "bKash", note: "TrxID: BK9283742" },
      { userId: arif.id, amount: 3000, category: "Meal Fund", method: "Nagad", note: "TrxID: NG8829102" },
      { userId: shakil.id, amount: 1200, category: "Mess Fund", method: "Cash", note: "Extra utility contribution" },
    ];
    for (const dep of pendingDeposits) {
      await prisma.deposit.create({
        data: { ...dep, status: "Pending", date: now },
      });
    }

    // 5. BAZAAR EXPENSES (Pending & Approved)
    const pastExpenses = [
      { userId: manager.id, amount: 1250, description: "Fresh Fish & Green Vegetables", daysAgo: 0 },
      { userId: manager.id, amount: 2400, description: "Chicken 4kg, Miniket Rice 25kg, Lentils", daysAgo: 2 },
      { userId: tanvir.id, amount: 1650, description: "Soybean Oil 5L, Spices & Potatoes", daysAgo: 4 },
      { userId: arif.id, amount: 890, description: "Eggs & Vegetables", daysAgo: 6 },
    ];
    for (const exp of pastExpenses) {
      await prisma.expense.create({
        data: {
          userId: exp.userId,
          amount: exp.amount,
          description: exp.description,
          status: "Approved",
          date: new Date(Date.UTC(currentYear, currentMonth, Math.max(1, now.getDate() - exp.daysAgo), 11, 30, 0)),
        },
      });
    }

    const pendingExpenses = [
      { userId: manager.id, amount: 1850, description: "Beef 1.5kg, Ginger, Garlic & Green Chilies" },
      { userId: tanvir.id, amount: 650, description: "Eggs, Salad Items & Breakfast Flour" },
    ];
    for (const exp of pendingExpenses) {
      await prisma.expense.create({
        data: { ...exp, status: "Pending", date: now },
      });
    }

    // 6. GUEST MEAL REQUESTS (Pending & Approved)
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

    const pendingGuestMeals = [
      { userId: arif.id, guests: 2, mealType: "DINNER", note: "Guests coming from hometown tonight" },
      { userId: shakil.id, guests: 1, mealType: "LUNCH", note: "Cousin joining for lunch tomorrow" },
      { userId: mehedi.id, guests: 1, mealType: "DINNER", note: "Special guest meal" },
    ];
    for (const gm of pendingGuestMeals) {
      await prisma.guestMealRequest.create({
        data: { ...gm, date: todayDate, status: "Pending" },
      });
    }

    // 7. BAZAAR SCHEDULE DATES
    await prisma.bazaarSchedule.create({
      data: { userId: manager.id, date: todayDate, status: "approved" },
    });
    await prisma.bazaarSchedule.create({
      data: { userId: tanvir.id, date: new Date(Date.UTC(currentYear, currentMonth, Math.min(28, now.getDate() + 2))), status: "approved" },
    });

    const pendingSchedules = [
      { userId: arif.id, dayOffset: 3 },
      { userId: shakil.id, dayOffset: 5 },
      { userId: mehedi.id, dayOffset: 7 },
    ];
    for (const sch of pendingSchedules) {
      await prisma.bazaarSchedule.create({
        data: {
          userId: sch.userId,
          date: new Date(Date.UTC(currentYear, currentMonth, Math.min(28, now.getDate() + sch.dayOffset))),
          status: "pending",
        },
      });
    }

    // 8. MEAL LOGS
    const daysToLog = Math.min(now.getDate(), 7);
    for (let day = 1; day <= daysToLog; day++) {
      const logDate = new Date(Date.UTC(currentYear, currentMonth, day, 0, 0, 0, 0));
      const isToday = day === daysToLog;
      for (const member of activeMembers) {
        await prisma.mealLog.upsert({
          where: { userId_date: { userId: member.id, date: logDate } },
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

    // 9. NOTICES
    await prisma.notice.create({
      data: {
        title: "📢 Monthly Deposit & Rent Collection",
        description: "Please submit your monthly meal deposit and seat rent before the 10th of the month.",
        type: "payment",
        isActive: true,
      },
    });
    await prisma.notice.create({
      data: {
        title: "🛒 Today's Bazaar Duty: Rakib Chowdhury",
        description: "Manager Rakib is going to bazaar today. Please notify any specific dining items.",
        type: "bazaar",
        isActive: true,
      },
    });
    await prisma.notice.create({
      data: {
        title: "🍛 Guest Meals Update",
        description: "Guest meal requests are active. Please confirm meals at least 3 hours in advance.",
        type: "guest_meal",
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully with 6 active members, 2 pending approval members, and all activities!",
      details: {
        activeMembers: 6,
        pendingApprovalMembers: 2,
        pendingPayments: 3,
        approvedPayments: 12,
        pendingExpenses: 2,
        approvedExpenses: 4,
        pendingGuestMeals: 3,
        approvedGuestMeals: 1,
        pendingBazaarSchedules: 3,
        approvedBazaarSchedules: 2,
        notices: 3,
      },
    });
  } catch (error) {
    return safeErrorResponse(error, "Failed to seed database");
  }
}
