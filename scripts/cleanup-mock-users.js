const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("[Cleanup] Verificando e removendo usuários mockados do banco de dados...");

  try {
    // 1. Identifica usuários mockados ou criados como dados fictícios para testes
    const mockUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { in: ["mariana.costa@aluno.unifesp.br", "mariana.souza@aluno.unifesp.br"] } },
          { email: { contains: "mock", mode: "insensitive" } },
          { email: { contains: "fake", mode: "insensitive" } },
          { email: { startsWith: "teste@", mode: "insensitive" } },
          { email: { startsWith: "test@", mode: "insensitive" } },
        ],
        // NUNCA deletar coordenadores e pesquisadores reais do laboratório
        NOT: {
          email: {
            in: [
              "evandro.coggo@unifesp.br",
              "vitor.silva@unifesp.br",
              "vitor.antonio@unifesp.br",
            ],
          },
        },
      },
      select: { id: true, email: true, name: true },
    });

    if (mockUsers.length === 0) {
      console.log("[Cleanup] Nenhum usuário mockado encontrado no banco de dados.");
      return;
    }

    console.log(
      `[Cleanup] Encontrados ${mockUsers.length} usuários mockados para remoção:`,
      mockUsers.map((u) => `${u.name} <${u.email}> (ID: ${u.id})`)
    );

    const mockIds = mockUsers.map((u) => u.id);

    // 2. Busca o professor coordenador geral para reatribuição de entidades essenciais
    const coordinator = await prisma.user.findFirst({
      where: {
        email: {
          in: ["evandro.coggo@unifesp.br", "vitor.silva@unifesp.br", "vitor.antonio@unifesp.br"],
        },
      },
    });

    if (coordinator) {
      // Reatribui Workspaces solicitados ou aprovados por mockados
      await prisma.workspace.updateMany({
        where: { requestedById: { in: mockIds } },
        data: { requestedById: coordinator.id },
      });

      await prisma.workspace.updateMany({
        where: { approvedById: { in: mockIds } },
        data: { approvedById: coordinator.id },
      });

      // Reatribui Tarefas criadas por mockados
      await prisma.task.updateMany({
        where: { createdById: { in: mockIds } },
        data: { createdById: coordinator.id },
      });

      // Reatribui Documentos cujo proprietário era mockado
      await prisma.document.updateMany({
        where: { ownerId: { in: mockIds } },
        data: { ownerId: coordinator.id },
      });
    }

    // 3. Remove vínculos em tabelas associativas e dependentes
    const deletedAssignees = await prisma.taskAssignee.deleteMany({
      where: { userId: { in: mockIds } },
    });
    console.log(`[Cleanup] Removidas ${deletedAssignees.count} atribuições de tarefas mockadas.`);

    const deletedMembers = await prisma.workspaceMember.deleteMany({
      where: { userId: { in: mockIds } },
    });
    console.log(`[Cleanup] Removidos ${deletedMembers.count} membros de workspaces mockados.`);

    const deletedTimeEntries = await prisma.timeEntry.deleteMany({
      where: { userId: { in: mockIds } },
    });
    console.log(`[Cleanup] Removidos ${deletedTimeEntries.count} apontamentos de horas mockados.`);

    const deletedComments = await prisma.taskComment.deleteMany({
      where: { userId: { in: mockIds } },
    });
    console.log(`[Cleanup] Removidos ${deletedComments.count} comentários de tarefas.`);

    await prisma.session.deleteMany({
      where: { userId: { in: mockIds } },
    });

    await prisma.account.deleteMany({
      where: { userId: { in: mockIds } },
    });

    // 4. Exclui definitivamente os usuários mockados da tabela User
    const deletedUsers = await prisma.user.deleteMany({
      where: { id: { in: mockIds } },
    });

    console.log(`[Cleanup] Sucesso: ${deletedUsers.count} usuários mockados excluídos com sucesso do banco de dados.`);
  } catch (err) {
    console.error("[Cleanup Error] Falha ao limpar usuários mockados:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
