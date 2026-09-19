-- Berberin kısa tanıtımı da üç dilli JSON'a taşınır (Tur 5, Task 6). Task 4'te
-- (`20260919101500_i18n_content`) atlanmıştı: `/en` ekip kartlarında Türkçe
-- biyografi duruyordu.
--
-- Desen öbür içerik alanlarıyla aynı: yeni sütun varsayılanıyla eklenir,
-- mevcut değer `{"tr": <eski>}` olarak kopyalanır, eski sütun düşürülür.
-- `bio` boş bırakılabiliyordu (`NULL`); `coalesce` onu boş metne çevirir,
-- böylece yeni sütun her satırda geçerli bir üç dilli nesne taşır.
ALTER TABLE "Barber" ADD COLUMN "bioI18n" JSONB NOT NULL DEFAULT '{"tr":""}';
UPDATE "Barber" SET "bioI18n" = jsonb_build_object('tr', coalesce("bio", ''));
ALTER TABLE "Barber" DROP COLUMN "bio";
