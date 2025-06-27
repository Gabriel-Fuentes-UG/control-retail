// scripts/clear-receptions.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Borrando todas las recepciones y movimientos…');
  await prisma.receptionLog.deleteMany({});
  await prisma.movement.deleteMany({});
  console.log('✅ Movements y ReceptionLog reseteados.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
