import 'dotenv/config';
import process from 'node:process';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../node_modules/.prisma/apexbridge-client-v2/index.js';

if (process.env.NODE_ENV === 'production') {
  throw new Error('Refusing to seed the initial administrator in production');
}
if (!process.env.SEED_ADMIN_EMAIL || !process.env.SEED_ADMIN_PASSWORD) {
  throw new Error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set');
}

const prisma = new PrismaClient();
try {
  const email = process.env.SEED_ADMIN_EMAIL.toLowerCase();
  const passwordHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD, 12);
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash, fullName: 'Apexbridge Super Administrator', role: 'SUPER_ADMIN', status: 'ACTIVE' },
  });
  console.log(`Seeded SUPER_ADMIN ${email}`);
} finally {
  await prisma.$disconnect();
}
