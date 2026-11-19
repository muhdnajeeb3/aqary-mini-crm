import { LeadStatus, PrismaClient, Role } from "@prisma/client";
import { DEFAULT_FORM_SCHEMA } from "../modules/form-schema/defaults";
import { LOSS_REASON_FIELD_ID } from "../modules/form-schema/types";

const prisma = new PrismaClient();

/**
 * Deterministic demo credentials.
 * Plaintext is never written to the database; only DEMO_PASSWORD_HASH is stored.
 * Hash generated with bcryptjs for password "AqaryDemo!2026" (cost 10).
 */
const DEMO_PASSWORD = "AqaryDemo!2026";
const DEMO_PASSWORD_HASH =
  "$2b$10$DqU1oJZs2rFeyuuEeseyqOw08R428.nJoevob9yUoRN0D4sgkMnyO";

const DEMO_USERS = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Demo Admin",
    email: "admin@aqary.demo",
    role: Role.ADMIN,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Demo Agent",
    email: "agent@aqary.demo",
    role: Role.AGENT,
  },
] as const;

const FORM_DEFINITION_ID = "33333333-3333-4333-8333-333333333333";

type SeedLead = {
  id: string;
  name: string;
  email: string;
  status: LeadStatus;
  budget: number;
  customValues: Record<string, string>;
  createdAt: Date;
};

function leadId(n: number): string {
  const suffix = n.toString(16).padStart(12, "0");
  return `44444444-4444-4444-8444-${suffix}`;
}

function daysAgo(days: number): Date {
  return new Date(Date.UTC(2026, 10, 12, 10, 0, 0) - days * 24 * 60 * 60 * 1000);
}

const SEED_LEADS: SeedLead[] = [
  {
    id: leadId(1),
    name: "Sara Ahmed",
    email: "sara@example.com",
    status: LeadStatus.New,
    budget: 850_000,
    customValues: {},
    createdAt: daysAgo(0),
  },
  {
    id: leadId(2),
    name: "Omar Hassan",
    email: "omar@example.com",
    status: LeadStatus.Contacted,
    budget: 1_200_000,
    customValues: {},
    createdAt: daysAgo(0),
  },
  {
    id: leadId(3),
    name: "Maya Ali",
    email: "maya@example.com",
    status: LeadStatus.Qualified,
    budget: 975_000,
    customValues: {},
    createdAt: daysAgo(0),
  },
  {
    id: leadId(4),
    name: "Adam Noor",
    email: "adam@example.com",
    status: LeadStatus.Lost,
    budget: 650_000,
    customValues: { [LOSS_REASON_FIELD_ID]: "Budget no longer available" },
    createdAt: daysAgo(0),
  },
  {
    id: leadId(5),
    name: "Lina Khalid",
    email: "lina@example.com",
    status: LeadStatus.New,
    budget: 1_500_000,
    customValues: {},
    createdAt: daysAgo(0),
  },
  {
    id: leadId(6),
    name: "Yousef Rahman",
    email: "yousef@example.com",
    status: LeadStatus.Contacted,
    budget: 720_000,
    customValues: {},
    createdAt: daysAgo(1),
  },
  {
    id: leadId(7),
    name: "Nour Fadel",
    email: "nour@example.com",
    status: LeadStatus.Qualified,
    budget: 1_050_000,
    customValues: {},
    createdAt: daysAgo(1),
  },
  {
    id: leadId(8),
    name: "Hana Saeed",
    email: "hana@example.com",
    status: LeadStatus.Lost,
    budget: 540_000,
    customValues: { [LOSS_REASON_FIELD_ID]: "Chose another agency" },
    createdAt: daysAgo(2),
  },
  {
    id: leadId(9),
    name: "Karim Mansour",
    email: "karim@example.com",
    status: LeadStatus.New,
    budget: 2_100_000,
    customValues: {},
    createdAt: daysAgo(2),
  },
  {
    id: leadId(10),
    name: "Rania Qureshi",
    email: "rania@example.com",
    status: LeadStatus.Contacted,
    budget: 890_000,
    customValues: {},
    createdAt: daysAgo(3),
  },
  {
    id: leadId(11),
    name: "Tariq Abbas",
    email: "tariq@example.com",
    status: LeadStatus.Qualified,
    budget: 1_350_000,
    customValues: {},
    createdAt: daysAgo(3),
  },
  {
    id: leadId(12),
    name: "Dina Farouk",
    email: "dina@example.com",
    status: LeadStatus.Lost,
    budget: 480_000,
    customValues: { [LOSS_REASON_FIELD_ID]: "Timeline slipped" },
    createdAt: daysAgo(4),
  },
  {
    id: leadId(13),
    name: "Samir Haddad",
    email: "samir@example.com",
    status: LeadStatus.New,
    budget: 990_000,
    customValues: {},
    createdAt: daysAgo(4),
  },
  {
    id: leadId(14),
    name: "Layla Osman",
    email: "layla@example.com",
    status: LeadStatus.Contacted,
    budget: 1_750_000,
    customValues: {},
    createdAt: daysAgo(5),
  },
  {
    id: leadId(15),
    name: "Bilal Nasser",
    email: "bilal@example.com",
    status: LeadStatus.Qualified,
    budget: 1_100_000,
    customValues: {},
    createdAt: daysAgo(5),
  },
  {
    id: leadId(16),
    name: "Amira Saleh",
    email: "amira@example.com",
    status: LeadStatus.Lost,
    budget: 610_000,
    customValues: { [LOSS_REASON_FIELD_ID]: "Financing declined" },
    createdAt: daysAgo(6),
  },
  {
    id: leadId(17),
    name: "Faisal Khoury",
    email: "faisal@example.com",
    status: LeadStatus.New,
    budget: 1_420_000,
    customValues: {},
    createdAt: daysAgo(6),
  },
  {
    id: leadId(18),
    name: "Zara Malik",
    email: "zara@example.com",
    status: LeadStatus.Contacted,
    budget: 830_000,
    customValues: {},
    createdAt: daysAgo(7),
  },
  {
    id: leadId(19),
    name: "Hassan Jaber",
    email: "hassan@example.com",
    status: LeadStatus.Qualified,
    budget: 2_400_000,
    customValues: {},
    createdAt: daysAgo(7),
  },
  {
    id: leadId(20),
    name: "Mona Ibrahim",
    email: "mona@example.com",
    status: LeadStatus.Lost,
    budget: 700_000,
    customValues: { [LOSS_REASON_FIELD_ID]: "Location mismatch" },
    createdAt: daysAgo(8),
  },
  {
    id: leadId(21),
    name: "Ibrahim Darwish",
    email: "ibrahim@example.com",
    status: LeadStatus.New,
    budget: 1_280_000,
    customValues: {},
    createdAt: daysAgo(8),
  },
  {
    id: leadId(22),
    name: "Reem Alavi",
    email: "reem@example.com",
    status: LeadStatus.Contacted,
    budget: 945_000,
    customValues: {},
    createdAt: daysAgo(9),
  },
  {
    id: leadId(23),
    name: "Nadia Soliman",
    email: "nadia@example.com",
    status: LeadStatus.Qualified,
    budget: 1_600_000,
    customValues: {},
    createdAt: daysAgo(9),
  },
  {
    id: leadId(24),
    name: "Walid Kassem",
    email: "walid@example.com",
    status: LeadStatus.Lost,
    budget: 560_000,
    customValues: { [LOSS_REASON_FIELD_ID]: "Purchased off-plan elsewhere" },
    createdAt: daysAgo(10),
  },
];

async function main(): Promise<void> {
  for (const user of DEMO_USERS) {
    await prisma.user.upsert({
      where: { email: user.email },
      create: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        passwordHash: DEMO_PASSWORD_HASH,
      },
      update: {
        name: user.name,
        role: user.role,
        passwordHash: DEMO_PASSWORD_HASH,
      },
    });
  }

  await prisma.formDefinition.upsert({
    where: { id: FORM_DEFINITION_ID },
    create: {
      id: FORM_DEFINITION_ID,
      schemaJson: DEFAULT_FORM_SCHEMA,
      version: 1,
    },
    update: {
      schemaJson: DEFAULT_FORM_SCHEMA,
      version: 1,
    },
  });

  for (const lead of SEED_LEADS) {
    await prisma.lead.upsert({
      where: { id: lead.id },
      create: {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        status: lead.status,
        budget: lead.budget,
        customValues: lead.customValues,
        createdAt: lead.createdAt,
      },
      update: {
        name: lead.name,
        email: lead.email,
        status: lead.status,
        budget: lead.budget,
        customValues: lead.customValues,
        createdAt: lead.createdAt,
      },
    });
  }

  const [userCount, leadCount, formCount, statusGroups] = await Promise.all([
    prisma.user.count(),
    prisma.lead.count(),
    prisma.formDefinition.count(),
    prisma.lead.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  console.log("Seed complete.");
  console.log(`  Users: ${userCount}`);
  console.log(`  Form definitions: ${formCount}`);
  console.log(`  Leads: ${leadCount}`);
  for (const group of statusGroups) {
    console.log(`    ${group.status}: ${group._count._all}`);
  }
  console.log("Demo logins (for later auth stage):");
  console.log(`  admin@aqary.demo / ${DEMO_PASSWORD}`);
  console.log(`  agent@aqary.demo / ${DEMO_PASSWORD}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
