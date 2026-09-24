import OfflineReader from "@/components/OfflineReader";
import { t } from "@/lib/i18n";

// Página que el service worker muestra sin conexión (no se indexa).
export const metadata = { title: t("es").offlineTitle, robots: { index: false } };

export default function Page() {
  return <OfflineReader lang="es" />;
}
