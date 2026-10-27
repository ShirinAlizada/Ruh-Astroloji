import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// SPA naviqasiyasında brauzer köhnə səhifənin scroll mövqeyini saxlayır —
// bu da yeni səhifə açılanda "page-enter" animasiyası yarıda görünən halda
// başlayır. Hər marşrut dəyişikliyində yuxarı qaytarır (hash lövbərləri
// istisna olmaqla, onlar üçün brauzerin öz davranışı saxlanılır).
export function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, hash]);

  return null;
}
