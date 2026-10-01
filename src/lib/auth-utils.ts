/**
 * Utilitários de validação de autenticação e domínios institucionais
 */

export function getAllowedEmailDomains(): string[] {
  const envDomains = process.env.ALLOWED_EMAIL_DOMAINS;
  if (!envDomains) {
    return ["unifesp.br", "aluno.unifesp.br"];
  }

  return envDomains
    .split(",")
    .map((d) => d.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
}

export function isEmailAllowed(email?: string | null): boolean {
  if (!email) return false;

  const normalizedEmail = email.trim().toLowerCase();
  const allowedDomains = getAllowedEmailDomains();

  return allowedDomains.some((domain) => normalizedEmail.endsWith(`@${domain}`));
}
