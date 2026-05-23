import {PrismaClient, UserRole} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL ?? 'admin@realreels.app';
  const password = process.env.ADMIN_PASSWORD ?? 'admin12345';

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await prisma.user.upsert({
    where: {email},
    update: {role: UserRole.admin},
    create: {
      email,
      passwordHash,
      fullName: 'Admin',
      role: UserRole.admin,
      isVerified: true,
    },
  });

  // eslint-disable-next-line no-console
  console.log(`Admin ready: ${admin.email} / ${password}`);
}

main()
  .catch(e => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
