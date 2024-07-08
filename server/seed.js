// import { PrismaClient } from "@prisma/client";
// import bcrypt from 'bcrypt';

// const prisma = new PrismaClient();

// async function AdminAccount() {
//     const username = "admin"; // here username to be created
//     const password = "password123"; // here password to be hashed and stored.

//     try {
//         // Check if an admin with the same username already exists
//         const existingAdmin = await prisma.admin.findUnique({
//             where: { username },
//         });

//         if (existingAdmin) {
//             console.log("Username already exists. Please choose a different username.");
//             return;
//         }

//         // If no existing admin found, create new admin
//         const hashPassword = bcrypt.hashSync(password, 10);
//         const newAdmin = await prisma.admin.create({
//             data: {
//                 username,
//                 password: hashPassword,
//             },
//         });
//         console.log("Admin account created:", newAdmin);
//     } catch (error) {
//         console.error("Error creating admin:", error);
//     } finally {
//         await prisma.$disconnect();
//     }
// }

// AdminAccount();
