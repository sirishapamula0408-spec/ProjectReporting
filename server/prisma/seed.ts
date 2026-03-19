import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;
const DEFAULT_PASSWORD = 'Welcome@123';

interface SeedUser {
  username: string;
  displayName: string;
  email: string;
  role: Role;
  businessUnit: string | null;
}

const seedUsers: SeedUser[] = [
  {
    username: 'priya.sharma',
    displayName: 'Priya Sharma',
    email: 'priya.sharma@company.com',
    role: Role.PM,
    businessUnit: 'Engineering',
  },
  {
    username: 'amit.joshi',
    displayName: 'Amit Joshi',
    email: 'amit.joshi@company.com',
    role: Role.PM,
    businessUnit: 'Digital',
  },
  {
    username: 'rajesh.kumar',
    displayName: 'Rajesh Kumar',
    email: 'rajesh.kumar@company.com',
    role: Role.BU_HEAD,
    businessUnit: 'Engineering',
  },
  {
    username: 'neha.gupta',
    displayName: 'Neha Gupta',
    email: 'neha.gupta@company.com',
    role: Role.BU_HEAD,
    businessUnit: 'Digital',
  },
  {
    username: 'meera.patel',
    displayName: 'Meera Patel',
    email: 'meera.patel@company.com',
    role: Role.CFO,
    businessUnit: null,
  },
];

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

  for (const user of seedUsers) {
    const created = await prisma.user.upsert({
      where: { username: user.username },
      update: {},
      create: {
        username: user.username,
        passwordHash,
        displayName: user.displayName,
        email: user.email,
        role: user.role,
        businessUnit: user.businessUnit,
      },
    });
    console.log(`  ✓ ${created.role} user: ${created.displayName} (${created.username})`);
  }

  console.log(`\nSeeded ${seedUsers.length} users (password: ${DEFAULT_PASSWORD})`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Seed error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
