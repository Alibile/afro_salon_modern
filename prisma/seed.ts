import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { asI18nText, pick, sameI18nText, type I18nText } from "../src/lib/i18n-content";

const DEFAULT_HOURS = [0, 1, 2, 3, 4, 5, 6].map((d) => ({
  dayOfWeek: d,
  startTime: "09:00",
  endTime: "19:00",
  isOff: d === 0,
}));

const DEFAULT_SEED_PASSWORD = "Sifre123!";

/**
 * Site metinleri üç dilde birden gelir (Tur 5, Task 4). Türkçe kaynak metindir;
 * İngilizce ve Fransızca aynı tonu taşır, kelimesi kelimesine çeviri değildir.
 */
export const DEFAULT_LANDING_CONTENT = {
  email: "info@afrosalonmodern.com",
  instagram: "https://instagram.com/afrosalonmodern",
  facebook: "https://facebook.com/afrosalonmodern",
  whatsapp: "905550000000",
  mapsUrl: "https://maps.google.com/?q=Afro+Salon+Modern+Istanbul",
  aboutTitleI18n: {
    tr: "Benzersiz bir deneyim",
    en: "An experience of its own",
    fr: "Une expérience à part",
  },
  aboutTextI18n: {
    tr: "Afro Salon Modern, erkeklere özel afro saç sanatını İstanbul'un kalbine taşıyor. Fade, örgü, twist ve bakımda ustalaşmış ekibimizle her kesim kişiye özel planlanır. Randevu yalnızca bugün için alınır; beklemeden, sırasız.",
    en: "Afro Salon Modern brings the art of afro hair for men to the heart of Istanbul. Our team knows fades, braids, twists and grooming inside out, and every cut is planned around the man in the chair. Booking is for today only — no queue, no waiting.",
    fr: "Afro Salon Modern amène l'art du cheveu afro pour homme au cœur d'Istanbul. Notre équipe maîtrise le dégradé, les tresses, les twists et le soin, et chaque coupe est pensée pour celui qui s'assoit dans le fauteuil. La réservation se fait pour le jour même : sans file, sans attente.",
  },
  whyUs1TitleI18n: { tr: "Usta berberler", en: "Master barbers", fr: "Des barbiers d'expérience" },
  whyUs1TextI18n: {
    tr: "Afro saç dokusunda yılların deneyimi; her kesim yüz hatlarına göre planlanır.",
    en: "Years of hands-on work with afro hair texture; every cut follows the shape of your face.",
    fr: "Des années de pratique sur le cheveu afro ; chaque coupe suit les traits du visage.",
  },
  whyUs2TitleI18n: { tr: "Premium ürünler", en: "Premium products", fr: "Des produits haut de gamme" },
  whyUs2TextI18n: {
    tr: "Saç ve cilde uygun, test edilmiş profesyonel ürünler.",
    en: "Professional products we have tested ourselves, kind to hair and skin alike.",
    fr: "Des produits professionnels éprouvés, respectueux du cheveu comme de la peau.",
  },
  whyUs3TitleI18n: { tr: "Hijyen ve temizlik", en: "Clean and hygienic", fr: "Hygiène et propreté" },
  whyUs3TextI18n: {
    tr: "Her müşteriden sonra sterilize edilen ekipman, temiz ve ferah salon.",
    en: "Tools sterilised after every client, in a salon that stays bright and clean.",
    fr: "Des outils stérilisés après chaque client, dans un salon clair et net.",
  },
  satisfactionPercent: 99,
  yearsExperience: 10,
};

/** Üç dilli site metni alanlarının adları; seed hepsini aynı kurala göre işler. */
const CONTENT_FIELDS = [
  "aboutTitleI18n",
  "aboutTextI18n",
  "whyUs1TitleI18n",
  "whyUs1TextI18n",
  "whyUs2TitleI18n",
  "whyUs2TextI18n",
  "whyUs3TitleI18n",
  "whyUs3TextI18n",
] as const;

/** Boş bırakılabilen düz metin alanları; bunlar da alan alan doldurulur. */
const LINK_FIELDS = ["email", "instagram", "facebook", "whatsapp", "mapsUrl"] as const;

/**
 * Galerinin başlangıç içeriği: `public/landing/` altındaki stok fotoğraflar.
 * Genişlik/yükseklik dosyaların gerçek pikselleridir (masonry oranı buna dayanır).
 * `storageKey` benzersiz kabul edilir: seed tekrar çalışsa da satır çoğalmaz,
 * panelden düzenlenmiş başlık/etiketlerin üzerine yazılmaz.
 */
export const DEFAULT_GALLERY: { file: string; width: number; height: number; caption: I18nText; tags: string[] }[] = [
  { file: "gallery-9.jpg", width: 1066, height: 1600, caption: { tr: "Yüksek üst, keskin taper", en: "High on top, sharp taper", fr: "Volume sur le dessus, taper net" }, tags: ["taper-fade", "line-up", "beard"] },
  { file: "gallery-22.jpg", width: 1066, height: 1600, caption: { tr: "Skin fade ve sakal birleşimi", en: "Skin fade blended into the beard", fr: "Skin fade fondu dans la barbe" }, tags: ["skin-fade", "straight", "beard"] },
  { file: "gallery-10.jpg", width: 1600, height: 1067, caption: { tr: "Low taper ve sakal hattı", en: "Low taper with a clean beard line", fr: "Low taper et ligne de barbe nette" }, tags: ["low-taper-fade", "beard"] },
  { file: "gallery-24.jpg", width: 1066, height: 1600, caption: { tr: "Jiletle çekilmiş hat", en: "Razor-sharp line", fr: "Ligne tracée au rasoir" }, tags: ["skin-fade", "line-up", "beard"] },
  { file: "gallery-19.jpg", width: 1600, height: 1600, caption: { tr: "Sıfıra inen skin fade", en: "Skin fade down to zero", fr: "Skin fade descendu à zéro" }, tags: ["skin-fade", "short"] },
  { file: "gallery-1.jpg", width: 1367, height: 1367, caption: { tr: "Keskin geçişli taper fade", en: "Taper fade with a sharp blend", fr: "Taper fade au fondu net" }, tags: ["taper-fade", "line-up", "straight"] },
  { file: "gallery-12.jpg", width: 1600, height: 1067, caption: { tr: "Kıvırcık üst, alçak geçiş", en: "Curly on top, low blend", fr: "Boucles sur le dessus, fondu bas" }, tags: ["low-taper-fade", "curly"] },
  { file: "gallery-17.jpg", width: 1143, height: 1600, caption: { tr: "Ensede taper ve temiz hat", en: "Taper at the nape, clean line", fr: "Taper sur la nuque, ligne nette" }, tags: ["taper-fade", "line-up"] },
  { file: "gallery-23.jpg", width: 1280, height: 1600, caption: { tr: "Kısa kesim ve alın hattı", en: "Short cut with a fresh hairline", fr: "Coupe courte et ligne frontale nette" }, tags: ["line-up", "short"] },
  { file: "gallery-27.jpg", width: 1280, height: 1600, caption: { tr: "Örgü ve şakakta geçiş", en: "Braids with a taper at the temple", fr: "Tresses et fondu sur les tempes" }, tags: ["braids", "taper-fade"] },
  { file: "gallery-13.jpg", width: 1600, height: 1067, caption: { tr: "Makineyle taper geçişi", en: "Taper blended with the clipper", fr: "Fondu taper à la tondeuse" }, tags: ["taper-fade", "curly"] },
  { file: "gallery-20.jpg", width: 1600, height: 1067, caption: { tr: "Dokulu perçem, net hat", en: "Textured fringe, crisp line", fr: "Frange texturée, ligne nette" }, tags: ["textured-fringe", "line-up"] },
  { file: "gallery-11.jpg", width: 1066, height: 1600, caption: { tr: "Taze low taper, temiz ense", en: "Fresh low taper, clean nape", fr: "Low taper frais, nuque nette" }, tags: ["low-taper-fade", "short"] },
  { file: "gallery-21.jpg", width: 1600, height: 1600, caption: { tr: "Tarakla fade kontrolü", en: "Checking the fade with a comb", fr: "Contrôle du fondu au peigne" }, tags: ["skin-fade", "textured-fringe"] },
  { file: "gallery-15.jpg", width: 1066, height: 1600, caption: { tr: "Alın hattında line-up", en: "Line-up along the hairline", fr: "Line-up sur la ligne frontale" }, tags: ["line-up", "beard"] },
  { file: "gallery-26.jpg", width: 1600, height: 1067, caption: { tr: "Afro tarağıyla şekillendirme", en: "Shaping with the afro pick", fr: "Mise en forme au peigne afro" }, tags: ["afro", "curly"] },
  { file: "gallery-14.jpg", width: 1600, height: 1067, caption: { tr: "Kıvırcık üstte makas işi", en: "Scissor work on a curly top", fr: "Travail aux ciseaux sur le dessus bouclé" }, tags: ["curly", "taper-fade"] },
  { file: "gallery-18.jpg", width: 1066, height: 1600, caption: { tr: "Kulak çevresinde geçiş", en: "Blending around the ear", fr: "Fondu autour de l'oreille" }, tags: ["taper-fade", "curly"] },
  { file: "gallery-25.jpg", width: 1600, height: 1067, caption: { tr: "Sakalda son rötuş", en: "Finishing touch on the beard", fr: "Dernière retouche de la barbe" }, tags: ["beard"] },
  { file: "gallery-16.jpg", width: 1600, height: 1067, caption: { tr: "Afroda makas düzeltmesi", en: "Evening out an afro with scissors", fr: "Égalisation de l'afro aux ciseaux" }, tags: ["afro"] },
  { file: "gallery-2.jpg", width: 1280, height: 1600, caption: { tr: "Twist ve dolgun sakal", en: "Twists and a full beard", fr: "Twists et barbe fournie" }, tags: ["twist", "beard"] },
  { file: "gallery-28.jpg", width: 1066, height: 1600, caption: { tr: "Yüksek skin fade, düz üst", en: "High skin fade, flat top", fr: "Skin fade haut, dessus plat" }, tags: ["skin-fade", "buzz-cut"] },
];

/**
 * Tur 4'te galeriden çıkarılan (dosyası `public/landing/` altından silinen)
 * seed fotoğraflarının anahtarları. Seed bu satırları **silmez** — admin
 * başlığı/etiketi düzenlemiş ya da sırayı değiştirmiş olabilir — yalnızca
 * pasife alır, böylece landing'de var olmayan bir dosyaya bakan kırık kart
 * kalmaz. Zaten pasifse ya da hiç yoksa hiçbir şey yapılmaz.
 */
export const LEGACY_GALLERY_KEYS = [
  "landing/gallery-3.jpg",
  "landing/gallery-4.jpg",
  "landing/gallery-5.jpg",
  "landing/gallery-6.jpg",
  "landing/gallery-7.jpg",
  "landing/gallery-8.jpg",
];

/**
 * Tur 3 seed'inin galeriye yazdığı tam varsayılan başlık/etiketler — yalnızca
 * sette **kalan** fotoğraflar için. Bir kurulumda bu satırlar hâlâ birebir bu
 * değerleri taşıyorsa admin onlara hiç dokunmamış demektir; seed o zaman yeni
 * `DEFAULT_GALLERY` değerlerine taşır (`LEGACY_ABOUT_TEXT` ile aynı kural).
 * Başlık ya da etiketlerden biri farklıysa (panelden düzenlenmiş) hiç dokunulmaz.
 */
export const LEGACY_GALLERY_DEFAULTS: Record<string, { caption: string; tags: string[] }> = {
  // Etiketler Task 4 göçünde anahtara çevrildi ("Line-up" → "line-up"); sabit
  // listede olmayan "Fade" serbest etiket olduğu için olduğu gibi kaldı.
  "landing/gallery-1.jpg": { caption: "Keskin geçişli fade", tags: ["Fade", "line-up"] },
  "landing/gallery-2.jpg": { caption: "Twist ve dolgun sakal", tags: ["twist", "beard"] },
};

/** Etiket dizilerinin sıra dahil birebir eşitliği. */
function sameTags(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((tag, i) => tag === b[i]);
}

/**
 * Bir içerik alanı hâlâ seed'in yazdığı Türkçe varsayılanla mı duruyor?
 * Tur 5'ten önce alanlar tek dilliydi; göç onları `{tr: <eski>}` yaptı. Satır
 * **birebir** o hâldeyse (çeviri de eklenmemişse) admin hiç dokunmamış
 * demektir ve seed çevirileri doldurabilir. Tek bir harf farklıysa dokunulmaz.
 */
function untranslatedDefault(current: unknown, target: I18nText): boolean {
  return sameI18nText(current, { tr: target.tr });
}

/** Üç dilde de hiçbir şey yazılmamış bir içerik alanı. */
function isBlank(current: unknown): boolean {
  const text = asI18nText(current);
  return text.tr.trim() === "" && (text.en ?? "").trim() === "" && (text.fr ?? "").trim() === "";
}

/**
 * Seed berberleri. Tanıtım üç dilde gelir (Tur 5, Task 6): Türkçe kaynak
 * metindir, İngilizce ve Fransızcası aynı kısa salon tonunu taşır.
 */
export const SEED_BARBERS: { name: string; email: string; bioI18n: I18nText; photoKey: string }[] = [
  {
    name: "Kwame Mensah",
    email: "kwame@afrosalon.local",
    bioI18n: {
      tr: "Fade ve tasarım kesim uzmanı",
      en: "Fades and design cuts are his signature",
      fr: "Spécialiste du dégradé et de la coupe dessinée",
    },
    photoKey: "landing/team-2.jpg",
  },
  {
    name: "Yusuf Adeyemi",
    email: "yusuf@afrosalon.local",
    bioI18n: {
      tr: "Örgü, twist ve line-up",
      en: "Braids, twists and line-ups",
      fr: "Tresses, twists et line-up",
    },
    photoKey: "landing/team-1.jpg",
  },
];

const DEFAULT_TESTIMONIALS = [
  { name: "Emre K.", text: "Fade kesim tam istediğim gibi oldu, ekip çok ilgili. Kesinlikle tekrar geleceğim.", rating: 5, sortOrder: 1 },
  { name: "Derrick B.", text: "Örgü konusunda gerçekten usta bir ekip. Randevu almak da çok kolaydı.", rating: 5, sortOrder: 2 },
  { name: "Malik J.", text: "Salon çok temiz, hizmet hızlı. Sakal tıraşı biraz daha özenli olabilirdi.", rating: 4, sortOrder: 3 },
];

// Tur 3 öncesi (kadın odaklı) seed'in ürettiği tam varsayılan metinler. Bir kurulumda hâlâ bu
// metinler duruyorsa (admin hiç değiştirmemiş demektir) yeni erkek odaklı varsayılana taşınır;
// farklı (admin tarafından girilmiş) bir değere asla dokunulmaz.
export const LEGACY_ABOUT_TEXT =
  "Afro Salon Modern, afro saç sanatını İstanbul'un kalbine taşıyor. Fade, örgü, twist ve bakımda ustalaşmış ekibimizle her kesim kişiye özel planlanır. Randevu yalnızca bugün için alınır; beklemeden, sırasız.";
export const LEGACY_NADIA_TEXT = "Örgü konusunda gerçekten usta bir ekip. Randevu almak da çok kolaydı.";

/** Üretimde şifre her zaman SEED_PASSWORD'dan gelir; geliştirmede varsayılan kullanılır. */
function seedPassword(): string {
  const fromEnv = process.env.SEED_PASSWORD?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SEED_PASSWORD tanımlı değil; üretimde seed çalıştırılamaz");
  }
  return DEFAULT_SEED_PASSWORD;
}

/**
 * Seed mantığının tamamı: idempotent (var olan verileri bozmadan tekrar çalıştırılabilir).
 * `client` parametre olarak alınır ki hem CLI girişi hem de entegrasyon testleri aynı
 * mantığı (test DB'sine bağlı) farklı bir PrismaClient örneğiyle çalıştırabilsin.
 */
export async function runSeed(client: PrismaClient) {
  const password = seedPassword();
  const passwordHash = await bcrypt.hash(password, 10);

  const settings = await client.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, shopName: "Afro Salon Modern", address: "İstanbul", phone: "+90 555 000 00 00", ...DEFAULT_LANDING_CONTENT },
  });
  // Var olan kurulumlarda içerik **alan alan** değerlendirilir. Tek bir alanın
  // boş olması öbürlerini ezmemeli: admin "hakkımızda" metnini bilerek silmiş
  // olabilir ve bu, onun elle girdiği İngilizce "neden biz" başlığını
  // götürmemeli (seed bir zamanlar bütün bloğu birden yazıyordu).
  const fill: Record<string, I18nText | string> = {};
  for (const field of CONTENT_FIELDS) {
    const target = DEFAULT_LANDING_CONTENT[field];
    // Hiç yazılmamış alan varsayılanla dolar; hâlâ çevirisiz seed varsayılanı
    // olan alana yalnızca çeviriler eklenir. Arası (admin yazmış) dokunulmaz.
    if (isBlank(settings[field]) || untranslatedDefault(settings[field], target)) fill[field] = target;
  }
  // Metin hâlâ Tur 3 öncesi varsayılansa (admin Türkçesini hiç değiştirmemiş)
  // yeni erkek odaklı metne taşınır. Adminin o alana yazdığı çeviri varsa
  // korunur; yazmadığı diller seed'in çevirisiyle dolar.
  if (pick(settings.aboutTextI18n, "tr").trim() === LEGACY_ABOUT_TEXT.trim()) {
    const current = asI18nText(settings.aboutTextI18n);
    fill.aboutTextI18n = {
      ...DEFAULT_LANDING_CONTENT.aboutTextI18n,
      ...(current.en?.trim() ? { en: current.en } : {}),
      ...(current.fr?.trim() ? { fr: current.fr } : {}),
      tr: DEFAULT_LANDING_CONTENT.aboutTextI18n.tr,
    };
  }
  for (const field of LINK_FIELDS) {
    if (settings[field].trim() === "") fill[field] = DEFAULT_LANDING_CONTENT[field];
  }
  if (Object.keys(fill).length > 0) await client.settings.update({ where: { id: 1 }, data: fill });

  await client.user.upsert({
    where: { email: "admin@afrosalon.local" },
    update: {},
    create: { name: "Salon Yöneticisi", email: "admin@afrosalon.local", passwordHash, role: "ADMIN" },
  });

  for (const b of SEED_BARBERS) {
    const user = await client.user.upsert({
      where: { email: b.email },
      update: {},
      create: { name: b.name, email: b.email, passwordHash, role: "BARBER" },
    });
    // Eski "seed/" yer tutucu anahtarını yeni "landing/" fotoğrafıyla güncelle; ancak panelden
    // gerçekten yüklenmiş (ör. "barbers/...") bir fotoğraf varsa asla üzerine yazma.
    const existingBarber = await client.barber.findUnique({ where: { userId: user.id } });
    const update: { photoKey?: string; bioI18n?: I18nText } = {};
    if (existingBarber?.photoKey.startsWith("seed/")) update.photoKey = b.photoKey;
    // Tanıtım da üç dilli (Tur 5, Task 6). Satır hâlâ çevirisiz seed
    // varsayılanıysa (`{tr: <eski>}`) çeviriler eklenir; berber ya da admin
    // kendi metnini yazmışsa dokunulmaz.
    if (existingBarber && untranslatedDefault(existingBarber.bioI18n, b.bioI18n)) update.bioI18n = b.bioI18n;
    const barber = await client.barber.upsert({
      where: { userId: user.id },
      update,
      create: { userId: user.id, bioI18n: b.bioI18n, photoKey: b.photoKey },
    });
    const count = await client.workingHours.count({ where: { barberId: barber.id } });
    if (count === 0) {
      await client.workingHours.createMany({ data: DEFAULT_HOURS.map((h) => ({ ...h, barberId: barber.id })) });
    }
  }

  // Salon artık erkek odaklı: eski "Amara Diallo" kaydı (varsa) silinmiyor/yeniden adlandırılmıyor
  // (gerçek veri barındırabilir), ama randevusu yoksa pasife alınıyor ki yeni rezervasyonlarda
  // görünmesin. Randevusu varsa hiç dokunulmuyor.
  const legacyAmaraUser = await client.user.findUnique({ where: { email: "amara@afrosalon.local" } });
  if (legacyAmaraUser) {
    const legacyAmaraBarber = await client.barber.findUnique({ where: { userId: legacyAmaraUser.id } });
    if (legacyAmaraBarber?.isActive) {
      const appointmentCount = await client.appointment.count({ where: { barberId: legacyAmaraBarber.id } });
      if (appointmentCount === 0) {
        await client.barber.update({ where: { id: legacyAmaraBarber.id }, data: { isActive: false } });
      }
    }
  }

  const services: { nameI18n: I18nText; durationMinutes: number; priceKurus: number; sortOrder: number }[] = [
    { nameI18n: { tr: "Saç Kesimi", en: "Haircut", fr: "Coupe de cheveux" }, durationMinutes: 30, priceKurus: 40000, sortOrder: 1 },
    { nameI18n: { tr: "Sakal", en: "Beard trim", fr: "Taille de barbe" }, durationMinutes: 15, priceKurus: 20000, sortOrder: 2 },
    { nameI18n: { tr: "Saç + Sakal", en: "Haircut + beard", fr: "Coupe + barbe" }, durationMinutes: 45, priceKurus: 55000, sortOrder: 3 },
    { nameI18n: { tr: "Örgü / Twist", en: "Braids / Twists", fr: "Tresses / Twists" }, durationMinutes: 90, priceKurus: 120000, sortOrder: 4 },
  ];
  // Hizmet adı artık `Json`: kimlik hâlâ Türkçe addır (eşleştirme onun üzerinden
  // yapılır), ama satır hâlâ çevirisiz varsayılansa çeviriler doldurulur.
  const existingServices = await client.service.findMany();
  for (const s of services) {
    const exists = existingServices.find((row) => pick(row.nameI18n, "tr") === s.nameI18n.tr);
    if (!exists) {
      await client.service.create({ data: s });
    } else if (untranslatedDefault(exists.nameI18n, s.nameI18n)) {
      await client.service.update({ where: { id: exists.id }, data: { nameI18n: s.nameI18n } });
    }
  }
  for (const t of DEFAULT_TESTIMONIALS) {
    if (t.name === "Derrick B.") {
      // Eski (kadın odaklı) seed'in "Nadia T." yorumu, aynı metinle hâlâ duruyorsa (admin
      // değiştirmemiş demektir) yeniden ad değiştirilerek taşınır; id/sortOrder/isActive korunur.
      // Metni farklıysa (admin tarafından düzenlenmiş) hiç dokunulmaz.
      const legacyNadia = await client.testimonial.findFirst({ where: { name: "Nadia T.", text: LEGACY_NADIA_TEXT } });
      if (legacyNadia) {
        const derrickExists = await client.testimonial.findFirst({ where: { name: "Derrick B." } });
        if (!derrickExists) {
          await client.testimonial.update({ where: { id: legacyNadia.id }, data: { name: "Derrick B." } });
        } else {
          // "Derrick B." zaten var (ör. seed birden çok kez farklı sürümlerle çalıştırılmış);
          // yinelenen eski "Nadia T." satırını temizle.
          await client.testimonial.delete({ where: { id: legacyNadia.id } });
        }
      }
    }
    const exists = await client.testimonial.findFirst({ where: { name: t.name } });
    if (!exists) await client.testimonial.create({ data: t });
  }

  // Galeri: her fotoğraf storageKey'ine göre bir kez eklenir (idempotent). Kayıt zaten
  // varsa yalnızca boyutları tazelenir — dosya yeniden kırpıldığında (ör. kare fotoğraf
  // dikey/yatay yapıldığında) masonry oranı DB'deki eski boyutta kalmasın; başlık ve
  // etiketler panelden düzenlenmiş olabileceği için asla ezilmez.
  //
  // `sortOrder` yalnızca ilk eklemede yazılır: önceden kurulmuş bir veritabanında
  // bu listenin sırası yeniden temellenmez. Bilinçli — sıra panelden değiştirilmiş
  // olabilir ve seed'in onu her çalıştığında geri alması, admin'in düzenini silerdi.
  // Yeni (boş) bir kurulumda sıra buradaki dizilimdir.
  for (const [i, g] of DEFAULT_GALLERY.entries()) {
    const storageKey = `landing/${g.file}`;
    const exists = await client.galleryPhoto.findFirst({ where: { storageKey } });
    if (!exists) {
      await client.galleryPhoto.create({
        data: { storageKey, captionI18n: g.caption, tags: g.tags, width: g.width, height: g.height, sortOrder: i },
      });
    } else {
      if (exists.width !== g.width || exists.height !== g.height) {
        await client.galleryPhoto.update({ where: { id: exists.id }, data: { width: g.width, height: g.height } });
      }
      // Başlık/etiket hâlâ Tur 3 varsayılansa (admin hiç düzenlememiş) yeni metne taşı.
      const legacy = LEGACY_GALLERY_DEFAULTS[storageKey];
      const untouched =
        legacy !== undefined && sameI18nText(exists.captionI18n, { tr: legacy.caption }) && sameTags(exists.tags, legacy.tags);
      const differs = !sameI18nText(exists.captionI18n, g.caption) || !sameTags(exists.tags, g.tags);
      if (untouched && differs) {
        await client.galleryPhoto.update({ where: { id: exists.id }, data: { captionI18n: g.caption, tags: g.tags } });
      } else if (untranslatedDefault(exists.captionI18n, g.caption)) {
        // Başlık hâlâ birebir güncel Türkçe varsayılan: çevirileri ekle.
        await client.galleryPhoto.update({ where: { id: exists.id }, data: { captionI18n: g.caption } });
      }
    }
  }

  // Dosyası artık olmayan eski seed fotoğrafları: satır korunur, yalnızca yayından kaldırılır.
  await client.galleryPhoto.updateMany({
    where: { storageKey: { in: LEGACY_GALLERY_KEYS }, isActive: true },
    data: { isActive: false },
  });

  const shown = process.env.SEED_PASSWORD?.trim() ? "SEED_PASSWORD değeri" : DEFAULT_SEED_PASSWORD;
  console.log(`Seed tamam. Admin: admin@afrosalon.local / ${shown}`);
}

async function main() {
  // CLI girişinde kendi PrismaClient'ımızı burada kuruyoruz (modül import edildiğinde değil),
  // böylece bu dosya bir test tarafından import edildiğinde fazladan bir DB bağlantısı açılmaz.
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  try {
    await runSeed(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

// Yalnızca `tsx prisma/seed.ts` ile doğrudan çalıştırıldığında main()'i tetikle;
// dosya bir test tarafından import edildiğinde (runSeed'i almak için) otomatik çalışmasın.
const isCliEntry = process.argv[1] !== undefined && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isCliEntry) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
