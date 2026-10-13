// seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    // Password encrypted (so it stays hashed in db)
    const adminPassword = await bcrypt.hash("Tanvir@#", 10);
    const memberPassword = await bcrypt.hash("123456", 10);

    // 1. Create/Update super admin user
    const admin = await prisma.user.upsert({
        where: { email: "ourmess001@gmail.com" },
        update: {
            password: adminPassword,
            role: "admin",
            name: "Super Admin",
            phone: "01700000000",
        },
        create: {
            name: "Super Admin",
            email: "ourmess001@gmail.com",
            password: adminPassword,
            phone: "01700000000",
            role: "admin",
            defaultBreakfast: 0.5,
            defaultLunch: 1.0,
            defaultDinner: 1.0,
        },
    });

    console.log("✅ Super admin configured successfully in database:", admin.email);

    // 2. Create default test manager (if not exists)
    const manager = await prisma.user.upsert({
        where: { email: "manager@gmail.com" },
        update: {
            password: memberPassword,
            role: "manager",
        },
        create: {
            name: "Mess Manager",
            email: "manager@gmail.com",
            password: memberPassword,
            phone: "01800000000",
            role: "manager",
            defaultBreakfast: 0.5,
            defaultLunch: 1.0,
            defaultDinner: 1.0,
        },
    });

    console.log("✅ Manager user created in database:", manager.email);

    // 3. Create default test member (if not exists)
    const member = await prisma.user.upsert({
        where: { email: "member@gmail.com" },
        update: {
            password: memberPassword,
            role: "member",
        },
        create: {
            name: "Mess Member",
            email: "member@gmail.com",
            password: memberPassword,
            phone: "01900000000",
            role: "member",
            defaultBreakfast: 0.5,
            defaultLunch: 1.0,
            defaultDinner: 1.0,
        },
    });

    console.log("✅ Member user created in database:", member.email);
}

main()
    .catch((e) => {
        console.error("❌ Error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });