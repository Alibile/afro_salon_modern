-- Panelden girilen içerik alanları üç dilli JSON'a taşınır (Tur 5, Task 4).
-- Mevcut değerler kaybolmaz: her sütun `{"tr": <eski değer>}` olarak yeni
-- jsonb sütuna kopyalanır, ancak ondan sonra eskisi düşürülür.

-- Settings: hakkımızda ve "neden biz" metinleri
ALTER TABLE "Settings"
  ADD COLUMN "aboutTitleI18n"  JSONB NOT NULL DEFAULT '{"tr":"Benzersiz bir deneyim"}',
  ADD COLUMN "aboutTextI18n"   JSONB NOT NULL DEFAULT '{"tr":""}',
  ADD COLUMN "whyUs1TitleI18n" JSONB NOT NULL DEFAULT '{"tr":""}',
  ADD COLUMN "whyUs1TextI18n"  JSONB NOT NULL DEFAULT '{"tr":""}',
  ADD COLUMN "whyUs2TitleI18n" JSONB NOT NULL DEFAULT '{"tr":""}',
  ADD COLUMN "whyUs2TextI18n"  JSONB NOT NULL DEFAULT '{"tr":""}',
  ADD COLUMN "whyUs3TitleI18n" JSONB NOT NULL DEFAULT '{"tr":""}',
  ADD COLUMN "whyUs3TextI18n"  JSONB NOT NULL DEFAULT '{"tr":""}';

UPDATE "Settings" SET
  "aboutTitleI18n"  = jsonb_build_object('tr', "aboutTitle"),
  "aboutTextI18n"   = jsonb_build_object('tr', "aboutText"),
  "whyUs1TitleI18n" = jsonb_build_object('tr', "whyUs1Title"),
  "whyUs1TextI18n"  = jsonb_build_object('tr', "whyUs1Text"),
  "whyUs2TitleI18n" = jsonb_build_object('tr', "whyUs2Title"),
  "whyUs2TextI18n"  = jsonb_build_object('tr', "whyUs2Text"),
  "whyUs3TitleI18n" = jsonb_build_object('tr', "whyUs3Title"),
  "whyUs3TextI18n"  = jsonb_build_object('tr', "whyUs3Text");

ALTER TABLE "Settings"
  DROP COLUMN "aboutTitle",
  DROP COLUMN "aboutText",
  DROP COLUMN "whyUs1Title",
  DROP COLUMN "whyUs1Text",
  DROP COLUMN "whyUs2Title",
  DROP COLUMN "whyUs2Text",
  DROP COLUMN "whyUs3Title",
  DROP COLUMN "whyUs3Text";

-- Service: hizmet adı
ALTER TABLE "Service" ADD COLUMN "nameI18n" JSONB NOT NULL DEFAULT '{"tr":""}';
UPDATE "Service" SET "nameI18n" = jsonb_build_object('tr', "name");
ALTER TABLE "Service" DROP COLUMN "name";

-- GalleryPhoto: başlık
ALTER TABLE "GalleryPhoto" ADD COLUMN "captionI18n" JSONB NOT NULL DEFAULT '{"tr":""}';
UPDATE "GalleryPhoto" SET "captionI18n" = jsonb_build_object('tr', "caption");
ALTER TABLE "GalleryPhoto" DROP COLUMN "caption";

-- GalleryPhoto.tags: Türkçe görünen adlar sabit anahtarlara çevrilir. Sabit
-- listede olmayan (panelden serbest yazılmış) etiketler olduğu gibi kalır —
-- onların çevirisi yok, her dilde yazıldığı gibi görünürler.
--
-- `WITH ORDINALITY` + `ORDER BY`: dizi sırası panelde verilen sıradır ve
-- korunmalı. `unnest` sırayı pratikte koruyor olsa da garanti etmiyor.
UPDATE "GalleryPhoto" SET "tags" = ARRAY(
  SELECT CASE u.tag
    WHEN 'Low Taper Fade'  THEN 'low-taper-fade'
    WHEN 'Taper Fade'      THEN 'taper-fade'
    WHEN 'Skin Fade'       THEN 'skin-fade'
    WHEN 'Buzz Cut'        THEN 'buzz-cut'
    WHEN 'Line-up'         THEN 'line-up'
    WHEN 'Kıvırcık'        THEN 'curly'
    WHEN 'Düz Saç'         THEN 'straight'
    WHEN 'Kısa Saç'        THEN 'short'
    WHEN 'Textured Fringe' THEN 'textured-fringe'
    WHEN 'Afro'            THEN 'afro'
    WHEN 'Örgü'            THEN 'braids'
    WHEN 'Twist'           THEN 'twist'
    WHEN 'Sakal'           THEN 'beard'
    ELSE u.tag
  END
  FROM unnest("tags") WITH ORDINALITY AS u(tag, ord)
  ORDER BY u.ord
);
