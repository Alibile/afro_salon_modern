# Afro Salon Modern — Tur 4 Implementation Plan (fade odaklı galeri, kategori çipleri)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Galeriyi fade odaklı, daha kaliteli ve daha kalabalık bir seed setiyle doldurmak; Pinterest benzeri, küçük örnek fotoğraflı kategori çipleri eklemek; panelde etiketleri sabit bir listeden seçtirmek.

**Architecture:** Mevcut `GalleryPhoto` modeli ve action'lar korunur. Kategori listesi kod sabiti (`src/lib/gallery-tags.ts`) olur; panel etiket girişi bu listeden çoklu seçim + serbest yazı; landing çipleri etiket sayımı ve ilk fotoğraftan türetilir. Tur 1–3 Global Constraints aynen (impl/wrapper, yetki testleri, lisanslı fotoğraf + CREDITS, opaklık ≤ 0.12, Türkçe, commit'lerde AI ibaresi yok).

### Task 1: Fade odaklı seed galeri, sabit kategori listesi, örnek fotoğraflı çipler

**Kararlar:**
- `src/lib/gallery-tags.ts`: `GALLERY_TAGS = ["Low Taper Fade","Taper Fade","Skin Fade","Buzz Cut","Line-up","Kıvırcık","Düz Saç","Kısa Saç","Textured Fringe","Afro","Örgü","Twist","Sakal"]` (sıra = çip sırası). `normalizeTags` mevcut kuralları korur; serbest etiketler yine kabul edilir ama panel formunda listeden seçim (checkbox/çip grubu) + "Diğer" metin alanı.
- **Fotoğraflar:** Pexels/Unsplash lisanslı 16–20 yeni fotoğraf (`public/landing/gallery-N.jpg`, N devam eder, mevcut zayıflar silinir: en az 4'ü çıkar — bahçe portresi (6), pembe fon (7), mavi fon (8), ve uygunsuz olan diğerleri). Öncelik: low/taper/skin fade, buzz cut, line-up, kıvırcık üst + fade, düz kısa, textured fringe, sakal + fade; erkek; yüzler net; karışık oranlar (kare/4:5/3:2); ≤ 400 KB; `CREDITS.md` tam. Aranan görsel bulunamazsa o kategori seed'de boş kalabilir (çip gizlenir), raporda belirtilir.
- Seed: `DEFAULT_GALLERY` yeni set; mevcut `landing/gallery-N.jpg` satırlarından dosyası silinenler seed'de `isActive:false` yapılır (satır silinmez — admin verisi korunur), yenileri eklenir; boyutlar gerçek; her fotoğraf 1–3 etiket (listeden).
- **Çipler (`GalleryFilters`):** her çip = 40px yuvarlak küçük görsel (etiketin ilk aktif fotoğrafı, `next/image` 40px) + etiket adı + sayı; "Tümü" çipinde görsel yok; yatay kaydırılabilir şerit (`overflow-x-auto`, scroll snap, `scrollbar-none`), seçili çip terracotta dolgu; `aria-pressed`; klavye erişimi. Çip sırası `GALLERY_TAGS` sırası, listede olmayan serbest etiketler sona.
- `getGalleryData()` çip için `tagPreviews: Record<tag, storageKey>` döner.
- Testler: unit (`orderTags` sıralama; `tagPreviews` türetme saf yardımcı), integration (seed yeni set + pasifleştirme idempotent), e2e (çip görselleri var; "Low Taper Fade" çipine tıkla → sayı eşleşir). Ekran görüntüleri 1440/390.
- Commit: "Fade odaklı galeri ve kategori çipleri".

### Task 2: Son kontrol
- README (kategori listesi, panel etiket seçimi); tam doğrulama zinciri; commit "Tur 4 son kontrol".
