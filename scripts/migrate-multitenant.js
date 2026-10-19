const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const DEFAULT_LAB_ID = "lab-ctpp";

async function runPreMigration() {
  console.log("[MultiTenant Migration - PRE] Preparando banco de dados antes do prisma db push...");
  try {
    // 1. Garante que a tabela Laboratory exista antes de adicionar FKs nas tabelas existentes
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Laboratory" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL DEFAULT 'Lab CTPP',
        "slug" TEXT NOT NULL DEFAULT 'lab-ctpp',
        "description" TEXT,
        "institutionName" TEXT NOT NULL DEFAULT 'UNIFESP',
        "departmentName" TEXT NOT NULL DEFAULT 'Living Lab Universitário',
        "primaryColor" TEXT NOT NULL DEFAULT '#0E4330',
        "secondaryColor" TEXT NOT NULL DEFAULT '#24576C',
        "accentColor" TEXT NOT NULL DEFAULT '#1F8A64',
        "fontColorLight" TEXT DEFAULT '#111827',
        "fontColorDark" TEXT DEFAULT '#F8FAFC',
        "logoUrl" TEXT,
        "faviconUrl" TEXT,
        "supportEmail" TEXT DEFAULT 'contato@labctpp.unifesp.br',
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "responsibleId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Laboratory_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "Laboratory_slug_key" ON "Laboratory"("slug");
    `);

    // 2. Insere o laboratório inaugural 'lab-ctpp' herdando PlatformSettings existente (se houver)
    const hasPlatformSettingsTable = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'PlatformSettings'
      ) as "exists";
    `);

    if (hasPlatformSettingsTable?.[0]?.exists) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "Laboratory" (
          "id", "name", "slug", "description", "institutionName", "departmentName",
          "primaryColor", "secondaryColor", "accentColor", "fontColorLight", "fontColorDark",
          "logoUrl", "faviconUrl", "supportEmail", "isActive", "createdAt", "updatedAt"
        )
        SELECT
          'lab-ctpp',
          COALESCE("labName", 'Lab CTPP'),
          'lab-ctpp',
          'Centro de Tecnologia e Políticas Públicas — Living Lab Universitário UNIFESP',
          COALESCE("institutionName", 'UNIFESP'),
          COALESCE("departmentName", 'Living Lab Universitário'),
          COALESCE("primaryColor", '#0E4330'),
          COALESCE("secondaryColor", '#24576C'),
          COALESCE("accentColor", '#1F8A64'),
          COALESCE("fontColorLight", '#111827'),
          COALESCE("fontColorDark", '#F8FAFC'),
          "logoUrl",
          "faviconUrl",
          COALESCE("supportEmail", 'contato@labctpp.unifesp.br'),
          true,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        FROM "PlatformSettings"
        LIMIT 1
        ON CONFLICT ("id") DO NOTHING;
      `);
    }

    // Fallback caso PlatformSettings estivesse vazia ou não existisse
    await prisma.$executeRawUnsafe(`
      INSERT INTO "Laboratory" (
        "id", "name", "slug", "description", "institutionName", "departmentName",
        "primaryColor", "secondaryColor", "accentColor", "fontColorLight", "fontColorDark",
        "supportEmail", "isActive", "createdAt", "updatedAt"
      ) VALUES (
        'lab-ctpp',
        'Lab CTPP',
        'lab-ctpp',
        'Centro de Tecnologia e Políticas Públicas — Living Lab Universitário UNIFESP',
        'UNIFESP',
        'Living Lab Universitário',
        '#0E4330',
        '#24576C',
        '#1F8A64',
        '#111827',
        '#F8FAFC',
        'contato@labctpp.unifesp.br',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      ) ON CONFLICT ("id") DO NOTHING;
    `);

    // 3. Se PlatformSettings tiver mais de 1 registro legado sem labId, mantém apenas o mais recente para não conflitar na constraint UNIQUE(labId)
    if (hasPlatformSettingsTable?.[0]?.exists) {
      await prisma.$executeRawUnsafe(`
        DELETE FROM "PlatformSettings"
        WHERE "id" NOT IN (
          SELECT "id" FROM "PlatformSettings" ORDER BY "updatedAt" DESC LIMIT 1
        );
      `);
    }

    // 4. Remove índices únicos globais legados de Attribution (name, slug) para permitir os novos compostos (labId, name) e (labId, slug)
    await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "Attribution_name_key";`);
    await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "Attribution_slug_key";`);

    console.log("[MultiTenant Migration - PRE] Banco preparado com sucesso para o schema Multi-Tenant.");
  } catch (err) {
    console.error("[MultiTenant Migration - PRE Warning]:", err.message || err);
  }
}

async function runPostMigration() {
  console.log("[MultiTenant Migration - POST] Sincronizando vínculos e preservando registros existentes...");
  try {
    // 1. Garante que o Lab CTPP existe via Prisma Client
    const existingSettings = await prisma.platformSettings.findFirst({
      where: { labId: DEFAULT_LAB_ID },
    });

    const coordinator = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { in: ["evandro.coggo@unifesp.br", "vitor.silva@unifesp.br", "vitor.antonio@unifesp.br"] } },
          { role: "PROFESSOR" },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    const defaultLab = await prisma.laboratory.upsert({
      where: { id: DEFAULT_LAB_ID },
      update: {
        responsibleId: coordinator?.id || undefined,
      },
      create: {
        id: DEFAULT_LAB_ID,
        name: existingSettings?.labName || "Lab CTPP",
        slug: "lab-ctpp",
        description: "Centro de Tecnologia e Políticas Públicas — Living Lab Universitário UNIFESP",
        institutionName: existingSettings?.institutionName || "UNIFESP",
        departmentName: existingSettings?.departmentName || "Living Lab Universitário",
        primaryColor: existingSettings?.primaryColor || "#0E4330",
        secondaryColor: existingSettings?.secondaryColor || "#24576C",
        accentColor: existingSettings?.accentColor || "#1F8A64",
        fontColorLight: existingSettings?.fontColorLight || "#111827",
        fontColorDark: existingSettings?.fontColorDark || "#F8FAFC",
        logoUrl: existingSettings?.logoUrl || null,
        faviconUrl: existingSettings?.faviconUrl || null,
        supportEmail: existingSettings?.supportEmail || "contato@labctpp.unifesp.br",
        responsibleId: coordinator?.id || null,
        isActive: true,
      },
    });

    // 2. Garante que PlatformSettings exista para o Lab CTPP
    await prisma.platformSettings.upsert({
      where: { labId: DEFAULT_LAB_ID },
      update: {},
      create: {
        id: "default",
        labId: DEFAULT_LAB_ID,
        labName: defaultLab.name,
        institutionName: defaultLab.institutionName,
        departmentName: defaultLab.departmentName,
        primaryColor: defaultLab.primaryColor,
        secondaryColor: defaultLab.secondaryColor,
        accentColor: defaultLab.accentColor,
        fontColorLight: defaultLab.fontColorLight,
        fontColorDark: defaultLab.fontColorDark,
        logoUrl: defaultLab.logoUrl,
        faviconUrl: defaultLab.faviconUrl,
        supportEmail: defaultLab.supportEmail,
      },
    });

    // 3. Vincula todos os usuários já existentes (que já passaram pelo onboarding ou são professores/ativos) ao Lab CTPP
    const allUsers = await prisma.user.findMany({
      include: {
        labMemberships: true,
      },
    });

    let migratedMemberships = 0;
    for (const user of allUsers) {
      // Se o usuário já existia e não tem nenhum vínculo de laboratório ainda,
      // vincula ao Lab CTPP preservando seu role e status (exceto se for PENDING sem RA ainda)
      if (user.labMemberships.length === 0 && (user.status !== "PENDING" || user.role === "PROFESSOR")) {
        await prisma.labMembership.create({
          data: {
            labId: DEFAULT_LAB_ID,
            userId: user.id,
            role: user.role,
            status: user.role === "PROFESSOR" ? "ACTIVE" : user.status,
            approvedById: user.approvedById,
            approvedAt: user.approvedAt || (user.status === "ACTIVE" ? user.createdAt : null),
          },
        });
        migratedMemberships++;
      }
    }

    console.log(
      `[MultiTenant Migration - POST] Sucesso! Laboratório '${defaultLab.name}' ativo e ${migratedMemberships} vínculos de membros sincronizados.`
    );
  } catch (err) {
    console.error("[MultiTenant Migration - POST Error]:", err);
  }
}

async function main() {
  const isPre = process.argv.includes("--pre");
  try {
    if (isPre) {
      await runPreMigration();
    } else {
      await runPostMigration();
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();

