import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@bhpconnect.com";
  const password = "Admin123!"; // Change this in production
  const name = "System Admin";

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email },
  });

  if (existingAdmin) {
    console.log("Admin user already exists:", email);
    return;
  }

  // Hash the password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role: "ADMIN",
      approvalStatus: "APPROVED",
      approvedAt: new Date(),
    },
  });

  console.log("Admin user created successfully!");
  console.log("Email:", email);
  console.log("Password:", password);
  console.log("User ID:", admin.id);
}

main()
  .catch((e) => {
    console.error("Error creating admin user:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
