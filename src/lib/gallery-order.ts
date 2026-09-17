/**
 * Galeri fotoğraflarının tek sıralama tanımı: elle verilen sıra, eşitlikte en
 * yeni önce. Panel listesi, landing sorgusu ve "yukarı/aşağı taşı" eylemi aynı
 * diziyi kullanır — üçü ayrı yerlerde tanımlansaydı biri değişince sıra
 * sessizce ikiye ayrılırdı.
 */
export const GALLERY_ORDER = [{ sortOrder: "asc" as const }, { createdAt: "desc" as const }];
