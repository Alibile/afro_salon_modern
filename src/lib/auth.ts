import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/schemas/auth";
import { hasLocale } from "next-intl";
import { routing, toAppLocale } from "@/i18n/routing";

export const { handlers, auth, signIn, signOut, unstable_update: updateSession } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/giris" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {}, locale: {} },
      async authorize(rawInput) {
        const parsed = loginSchema.safeParse(rawInput);
        if (!parsed.success) return null;
        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          include: { barber: { select: { id: true } } },
        });
        if (!user) return null;
        const okPw = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!okPw) return null;

        // Giriş yapılan dil kullanıcının tercihi sayılır ve kaydedilir — ama
        // ancak şifre doğrulandıktan sonra, yoksa e-postayı bilen herkes bir
        // hesabın dilini değiştirebilirdi. İstek dili yoksa (doğrudan API
        // çağrısı) kayıtlı tercih olduğu gibi kalır.
        // Tanınmayan bir dil kodu (elle yapılmış bir istek, bozuk çerez)
        // kullanıcının kayıtlı tercihini "tr"ye çevirmemeli: yok sayılır.
        const raw = rawInput?.locale;
        const requested = hasLocale(routing.locales, raw) ? raw : undefined;
        const locale = requested ?? toAppLocale(user.locale);
        if (requested && locale !== user.locale) {
          await prisma.user.update({ where: { id: user.id }, data: { locale } });
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          barberId: user.barber?.id ?? null,
          locale,
        };
      },
    }),
  ],
  callbacks: {
    /**
     * Jeton oturum açarken doldurulur ve normalde bir daha okunmaz. Tek
     * istisna `trigger === "update"`: kullanıcı panelden dilini (ya da adını)
     * değiştirdiğinde `updateSession()` bu dalı çalıştırır ve jeton
     * veritabanından tazelenir — böylece tercih için yeniden giriş gerekmez.
     * İstemciden gelen `session` verisine güvenilmez, kaynak hep DB'dir.
     */
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.barberId = user.barberId;
        token.locale = user.locale;
      } else if (trigger === "update" && token.id) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id },
          select: { name: true, locale: true },
        });
        if (fresh) {
          token.name = fresh.name;
          token.locale = toAppLocale(fresh.locale);
        }
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.barberId = token.barberId;
      session.user.locale = token.locale;
      return session;
    },
  },
});
