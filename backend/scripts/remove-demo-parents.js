import { env } from '../src/config/env.js';
import { prisma } from '../src/config/db.js';

const EMAIL_SUFFIX = '@demo.example.invalid';
const confirmed = process.argv.includes('--confirm');
const demoParentWhere = { role: 'PARENT', email: { endsWith: EMAIL_SUFFIX } };

async function main() {
  try {
    const before = await prisma.user.count({ where: demoParentWhere });
    const ids = (await prisma.user.findMany({ where: demoParentWhere, select: { id: true } })).map(({ id }) => id);
    console.log(`Demo parent accounts before: ${before}.`);
    console.log(`Student surname changes are not reverted by removing demo parents.`);
    if (!confirmed) {
      console.log(`Dry run only. Would delete ${ids.length} demo parent accounts; linked students remain.`);
      console.log(`Demo parent accounts after dry run: ${before}.`);
      return;
    }
    const deleted = ids.length ? await prisma.user.deleteMany({ where: { id: { in: ids }, role: 'PARENT', email: { endsWith: EMAIL_SUFFIX } } }) : { count: 0 };
    const after = await prisma.user.count({ where: demoParentWhere });
    console.log(`Deleted demo parent accounts: ${deleted.count}. Linked students remain; only parent links are removed.`);
    console.log(`Demo parent accounts after: ${after}.`);
    console.log('Student surname changes are not reverted.');
  } finally {
    await prisma.$disconnect();
  }
}

void env;
await main();
