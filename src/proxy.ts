import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const proxy = auth((req) => {
  const { pathname, search } = req.nextUrl;
  const user = req.auth?.user;

  if (pathname.startsWith("/panel")) {
    if (!user) {
      const url = new URL("/giris", req.nextUrl);
      url.searchParams.set("next", pathname + search);
      return NextResponse.redirect(url);
    }
    if (user.role !== "BARBER" && user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/403", req.nextUrl));
    }
  }

  if (pathname.startsWith("/randevularim") && !user) {
    const url = new URL("/giris", req.nextUrl);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/panel/:path*", "/randevularim/:path*"],
};
