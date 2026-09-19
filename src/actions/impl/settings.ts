import { prisma } from "@/lib/db";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { firstIssueKey } from "@/lib/errors";
import type { SessionUser } from "@/lib/auth-helpers";
import { asAdminActor } from "@/lib/staff-scope";
import { settingsSchema, type SettingsInput } from "@/schemas/settings";

export async function updateSettingsAs(actor: SessionUser | null, input: SettingsInput): Promise<ActionResult<void>> {
  if (!asAdminActor(actor)) return fail("errors.notAllowed");
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssueKey(parsed.error));
  // Üç dilli metinler `Json` sütunlarda `*I18n` adıyla durur; şemadaki adları
  // (form alanlarının adları) burada sütun adlarına çevrilir.
  const { aboutTitle, aboutText, whyUs1Title, whyUs1Text, whyUs2Title, whyUs2Text, whyUs3Title, whyUs3Text, ...rest } = parsed.data;
  const data = {
    ...rest,
    aboutTitleI18n: aboutTitle,
    aboutTextI18n: aboutText,
    whyUs1TitleI18n: whyUs1Title,
    whyUs1TextI18n: whyUs1Text,
    whyUs2TitleI18n: whyUs2Title,
    whyUs2TextI18n: whyUs2Text,
    whyUs3TitleI18n: whyUs3Title,
    whyUs3TextI18n: whyUs3Text,
  };
  await prisma.settings.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });
  return ok(undefined);
}
