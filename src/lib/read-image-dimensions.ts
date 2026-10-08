/**
 * Fotoğrafın gerçek pikselleri (tarayıcıda). Galeri masonry'si ve görsel
 * yuvaları oran denetimi için bunu kullanır; sunucu şemaları değeri yeniden
 * doğrular.
 */
export function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  const url = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("readImageDimensions failed"));
    };
    img.src = url;
  });
}
