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

  // Se o usuário não está autenticado
  if (!isAuth) {
    if (isLoginPage) {
      return NextResponse.next();
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
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
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Se o usuário foi rejeitado ou suspenso
  if (userStatus === "REJECTED" || userStatus === "SUSPENDED") {
    const errorUrl = new URL("/login", req.url);
    errorUrl.searchParams.set("error", "AccessDenied");
    return NextResponse.redirect(errorUrl);
  }

  // 1. Status PENDING: força redirecionamento para o formulário de Onboarding
  if (userStatus === "PENDING") {
    if (!isOnboardingPage) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
    return NextResponse.next();
  }

  // 2. Status WAITING_APPROVAL: força redirecionamento para a Sala de Espera
  if (userStatus === "WAITING_APPROVAL") {
    if (!isWaitingRoomPage) {
      return NextResponse.redirect(new URL("/waiting-room", req.url));
    }
    return NextResponse.next();
  }

  // 3. Status ACTIVE: não deve acessar telas transitórias de onboarding ou espera
  if (userStatus === "ACTIVE" && (isOnboardingPage || isWaitingRoomPage)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 4. Proteção de rotas da Coordenação Geral (/admin)
  if (pathname.startsWith("/admin") && userRole !== "PROFESSOR") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
