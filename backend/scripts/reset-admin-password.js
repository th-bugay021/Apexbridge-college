import bcrypt from 'bcryptjs';
import '../src/config/env.js';
import { prisma } from '../src/config/db.js';

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.NEW_ADMIN_PASSWORD;

  if (!email) throw new Error('SEED_ADMIN_EMAIL is required.');
  if (password === undefined) throw new Error('NEW_ADMIN_PASSWORD is required.');
  if ([...password].length < 12) throw new Error('NEW_ADMIN_PASSWORD must be at least 12 characters.');

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true } });
  if (!user) throw new Error('No user matches SEED_ADMIN_EMAIL.');
  if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) throw new Error('The matching user is not an admin.');

  const passwordHash = await bcrypt.hash(password, 12);
  const revokedAt = new Date();
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash, tokenVersion: { increment: 1 } } }),
    prisma.refreshToken.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt } }),
  ]);

  console.log('Password updated');
}

main()
  .catch((error) => {
    console.error(error.message || 'Password update failed.');
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
