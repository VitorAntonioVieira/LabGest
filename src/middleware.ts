import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Ignorar arquivos estáticos, rotas de autenticação e assets com extensão
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuth = !!token;
  const isLoginPage = pathname === "/login";
  const isOnboardingPage = pathname === "/onboarding";
  const isWaitingRoomPage = pathname === "/waiting-room";
  const isLabsPage = pathname === "/labs";

  // Se o usuário não está autenticado
  if (!isAuth) {
    if (isLoginPage) {
      return NextResponse.next();
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname === "/" ? "/labs" : pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Usuário autenticado
  const userStatus = token.status || "ACTIVE";
  const userRole = token.role || "STUDENT";

  // Se o usuário já autenticado tenta acessar o login
  if (isLoginPage) {
    if (userStatus === "PENDING") {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
    if (userStatus === "WAITING_APPROVAL") {
      return NextResponse.redirect(new URL("/waiting-room", req.url));
    }
    // Caso já aprovado, após fazer login exibe quais laboratórios estão disponíveis para acesso (/labs)
    return NextResponse.redirect(new URL("/labs", req.url));
  }

  // Se o usuário foi rejeitado ou suspenso em todos os laboratórios
  if (userStatus === "REJECTED" || userStatus === "SUSPENDED") {
    if (isOnboardingPage || isLabsPage) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/labs", req.url));
  }

  // 1. Status PENDING: força redirecionamento para o formulário de Onboarding + Escolha do Laboratório
  if (userStatus === "PENDING") {
    if (!isOnboardingPage) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
    return NextResponse.next();
  }

  // 2. Status WAITING_APPROVAL (sem nenhum laboratório ACTIVE ainda): permite /waiting-room e /labs (para solicitar outro lab)
  if (userStatus === "WAITING_APPROVAL") {
    if (!isWaitingRoomPage && !isLabsPage) {
      return NextResponse.redirect(new URL("/waiting-room", req.url));
    }
    return NextResponse.next();
  }

  // 3. Status ACTIVE: não precisa ficar preso em onboarding ou waiting-room
  if (userStatus === "ACTIVE" && (isOnboardingPage || isWaitingRoomPage)) {
    return NextResponse.redirect(new URL("/labs", req.url));
  }

  // 4. Proteção de rotas administrativas do Laboratório:
  // - /admin/approvals: acessível pelo Responsável do Lab (PROFESSOR) E pelos Líderes (LEADER)
  if (
    pathname.startsWith("/admin/approvals") &&
    userRole !== "PROFESSOR" &&
    userRole !== "LEADER"
  ) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // - /admin/settings: restrito ao Responsável do Lab (PROFESSOR)
  if (pathname.startsWith("/admin/settings") && userRole !== "PROFESSOR") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
