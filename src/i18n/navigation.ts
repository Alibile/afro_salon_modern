import { createNavigation } from "next-intl/navigation";
import { routing, type AppLocale } from "./routing";

/**
 * Uygulama içi gezinme bu sarmalayıcılardan geçer: `Link`, `redirect`,
 * `usePathname` ve `useRouter` yolu geçerli dile göre önekler
 * (`/randevu` → `/en/randevu`), `usePathname` ise öneki soyup uygulamanın
 * bildiği yolu döner. `next/link` ve `next/navigation` karşılıkları doğrudan
 * kullanılırsa bağlantılar dili düşürür.
 *
 * `useSearchParams` ve `notFound` dilden bağımsızdır, onlar `next/navigation`
 * içinde kalır.
 */
const navigation = createNavigation(routing);

type RedirectArgs = { href: string; locale: AppLocale; forcePrefix?: boolean };
/** `next/navigation` bu adı yalnızca değer olarak dışa verir; tipi burada yazılı. */
type RedirectType = "push" | "replace";
/**
 * Açık tip ek açıklaması yalnızca biçim değil: TypeScript bir çağrının
 * ardındaki kodu ancak çağrılan şey `never` döndürdüğü *bildirilmişse*
 * ulaşılmaz sayar. Nesneden yapılan çıkarımda bu bilgi kayboluyor ve
 * `redirect()` sonrası `user` hâlâ `null` olabilir görünüyordu.
 */
export const redirect: (args: RedirectArgs, type?: RedirectType) => never = navigation.redirect;
export const permanentRedirect: (args: RedirectArgs, type?: RedirectType) => never = navigation.permanentRedirect;

export const { Link, usePathname, useRouter, getPathname } = navigation;
