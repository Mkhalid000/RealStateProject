import {PrismaClient, UserRole} from '@prisma/client';
import {BHOPAL_PROPERTIES} from './properties.bhopal';

/**
 * Seeds only the Bhopal listings (idempotent, keyed on slug).
 *
 * Separate from `seed.ts` so it can be run against a live database without
 * resetting the other demo listings — anything an admin has edited there stays
 * as it is.
 */
const prisma = new PrismaClient();

async function main() {
  const owner =
    (await prisma.user.findUnique({where: {email: 'agent@realreels.app'}})) ??
    (await prisma.user.findFirst({where: {role: UserRole.agent}})) ??
    (await prisma.user.findFirst({where: {role: UserRole.admin}}));

  if (!owner) {
    throw new Error('No agent or admin user found — run `npm run db:seed` first.');
  }

  for (const property of BHOPAL_PROPERTIES) {
    const data = {...property, agentId: owner.id};
    await prisma.property.upsert({
      where: {slug: property.slug},
      update: data,
      create: data,
    });
    console.log(`  ↳  ${property.title}`);
  }

  console.log(
    `\n✅  ${BHOPAL_PROPERTIES.length} Bhopal properties seeded (owner: ${owner.email}).\n`,
  );
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
