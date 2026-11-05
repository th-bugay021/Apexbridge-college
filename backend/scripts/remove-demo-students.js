import { env } from '../src/config/env.js';
import { prisma } from '../src/config/db.js';

const confirmed = process.argv.includes('--confirm');
const demoEmailSuffix = '@demo.example.invalid';

async function main() {
  try {
    const candidates = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        email: { endsWith: demoEmailSuffix },
        student: { is: { admissionNumber: { startsWith: 'DEMO-' } } },
      },
      select: {
        id: true,
        email: true,
        student: {
          select: {
            id: true,
            admissionNumber: true,
            results: { select: { id: true }, take: 1 },
            attendance: { select: { id: true }, take: 1 },
            invoices: { select: { id: true }, take: 1 },
            payments: { select: { id: true }, take: 1 },
          },
        },
      },
      orderBy: { email: 'asc' },
    });

    const skipped = candidates.filter(({ student }) => student.results.length || student.attendance.length || student.invoices.length || student.payments.length);
    const eligible = candidates.filter((candidate) => !skipped.includes(candidate));
    console.log(`Demo students matching the exact role, email, and admission number filters: ${candidates.length}.`);
    console.log(`Would delete: ${eligible.length}. Skipped due to linked records: ${skipped.length}.`);
    if (skipped.length) {
      console.table(skipped.map(({ email, student }) => ({
        email,
        admissionNumber: student.admissionNumber,
        linked: [student.results.length && 'results', student.attendance.length && 'attendance', student.invoices.length && 'invoices', student.payments.length && 'payments'].filter(Boolean).join(', '),
      })));
    }
    if (!confirmed) {
      console.log('Dry run only. Pass --confirm to delete eligible demo students.');
      return;
    }
    const eligibleIds = eligible.map(({ id }) => id);
    let deletedCount = 0;
    if (eligible.length) {
      const deleted = await prisma.user.deleteMany({
        where: { id: { in: eligibleIds }, role: 'STUDENT', email: { endsWith: demoEmailSuffix } },
      });
      deletedCount = deleted.count;
    }
    const remaining = await prisma.user.count({
      where: { role: 'STUDENT', email: { endsWith: demoEmailSuffix }, student: { is: { admissionNumber: { startsWith: 'DEMO-' } } } },
    });
    console.log(`Deleted: ${deletedCount}. Skipped: ${skipped.length}. Matching demo students remaining: ${remaining}.`);
  } finally {
    await prisma.$disconnect();
  }
}

void env;
await main();
