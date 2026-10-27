// destiny-reads-app-dan köçürülüb (menu-store.ts) — sayt naviqasiyasının
// (hamburger menyusu) qlobal açıq/bağlı vəziyyəti. SiteNav-dakı düymə menyunu
// açıb-bağlayır, Page.tsx isə eyni vəziyyətə abunə olub əsas məzmunu menyu
// açılanda sola sürüşdürüb gizlədir, bağlananda isə geri qaytarır — heç bir
// prop ötürməyə (prop-drilling) ehtiyac olmadan.
type MenuSnapshot = { open: boolean; visible: boolean };

let snapshot: MenuSnapshot = { open: false, visible: false };
const listeners = new Set<() => void>();
let closeTimer: ReturnType<typeof setTimeout> | null = null;

function setSnapshot(next: Partial<MenuSnapshot>) {
  snapshot = { ...snapshot, ...next };
  listeners.forEach((listener) => listener());
}

export function subscribeMenu(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getMenuSnapshot(): MenuSnapshot {
  return snapshot;
}

export function getServerMenuSnapshot(): MenuSnapshot {
  return { open: false, visible: false };
}

/** Menyunu açır: dərhal mount olunur, sonrakı kadrda "visible" true olur ki, keçid (transition) işə düşsün. */
export function openMenu() {
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
  setSnapshot({ open: true });
  requestAnimationFrame(() => setSnapshot({ visible: true }));
}

/** Menyunu bağlayır: əvvəlcə geri-qayıtma keçidi üçün "visible" false olur, keçid bitəndən (220ms) sonra unmount olunur. */
export function closeMenu() {
  setSnapshot({ visible: false });
  closeTimer = setTimeout(() => setSnapshot({ open: false }), 220);
}

export function toggleMenu() {
  if (snapshot.open) closeMenu();
  else openMenu();
}
