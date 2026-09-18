import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/schemas/auth";
import { hasLocale } from "next-intl";
import { routing, type AppLocale } from "@/i18n/routing";

/** DB `String` sütununu uygulama dil birliğine indirger; tanınmayan değer varsayılana düşer. */
function toLocale(value: string): AppLocale {
  return hasLocale(routing.locales, value) ? value : routing.defaultLocale;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
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
        const locale = requested ?? toLocale(user.locale);
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
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.barberId = user.barberId;
        token.locale = user.locale;
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
