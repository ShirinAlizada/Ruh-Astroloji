// Bürc adları (AstroBackend-in AstrologyEngine-i Azərbaycan dilində qaytarır)
// üçün paylaşılan emoji etiketləri. Profil, Natal Xəritə və gələcək
// modullarda (Sinastriya, Günün Bələdçisi) eyni görünüş üçün istifadə olunur.
// AstroBackend.Application.Astrology.AstrologyEngine.SignsAz ilə HƏRFİ eyni
// açarlar olmalıdır (məs. Leo backend-də "Aslan"dır, "Şir" deyil) — əks halda
// uyğunluq tapılmır və emoji görünmür.
//
// DÜZƏLİŞ (2026-10-27): əvvəllər bürc adı UI dilindən ASILI OLMAYARAQ həmişə
// Azərbaycan dilində göstərilirdi (backend həmişə AZ qaytarır). İndi `signLabel`
// ikinci (opsional) `lang` arqumenti qəbul edir və EN/RU adlara tərcümə edir —
// digər canlı-sözlük naxışlarımızla (Home.tsx-dəki DAY_RULER_I18N_KEY və s.)
// eyni üsul: backend-dən gələn AZ kanonik mətni açar kimi istifadə edib frontend
// tərəfdə tərcümə edirik, backend-ə toxunmadan.
const SIGN_NAMES_AZ: Record<string, string> = {
  Qoç: "Qoç",
  Buğa: "Buğa",
  Əkizlər: "Əkizlər",
  Xərçəng: "Xərçəng",
  Aslan: "Aslan",
  Qız: "Qız",
  Tərəzi: "Tərəzi",
  Əqrəb: "Əqrəb",
  Oxatan: "Oxatan",
  Oğlaq: "Oğlaq",
  Dolça: "Dolça",
  Balıqlar: "Balıqlar",
};

const SIGN_NAMES_EN: Record<string, string> = {
  Qoç: "Aries",
  Buğa: "Taurus",
  Əkizlər: "Gemini",
  Xərçəng: "Cancer",
  Aslan: "Leo",
  Qız: "Virgo",
  Tərəzi: "Libra",
  Əqrəb: "Scorpio",
  Oxatan: "Sagittarius",
  Oğlaq: "Capricorn",
  Dolça: "Aquarius",
  Balıqlar: "Pisces",
};

const SIGN_NAMES_RU: Record<string, string> = {
  Qoç: "Овен",
  Buğa: "Телец",
  Əkizlər: "Близнецы",
  Xərçəng: "Рак",
  Aslan: "Лев",
  Qız: "Дева",
  Tərəzi: "Весы",
  Əqrəb: "Скорпион",
  Oxatan: "Стрелец",
  Oğlaq: "Козерог",
  Dolça: "Водолей",
  Balıqlar: "Рыбы",
};

const SIGN_EMOJI: Record<string, string> = {
  Qoç: "♈",
  Buğa: "♉",
  Əkizlər: "♊",
  Xərçəng: "♋",
  Aslan: "♌",
  Qız: "♍",
  Tərəzi: "♎",
  Əqrəb: "♏",
  Oxatan: "♐",
  Oğlaq: "♑",
  Dolça: "♒",
  Balıqlar: "♓",
};

// Köhnə ixrac — geriyə uyğunluq üçün saxlanılıb (indi SIGN_EMOJI + SIGN_NAMES_AZ-dan qurulur).
export const SIGN_LABELS: Record<string, string> = Object.fromEntries(
  Object.keys(SIGN_NAMES_AZ).map((key) => [key, `${SIGN_EMOJI[key]} ${SIGN_NAMES_AZ[key]}`]),
);

const NAMES_BY_LANG: Record<string, Record<string, string>> = {
  az: SIGN_NAMES_AZ,
  en: SIGN_NAMES_EN,
  ru: SIGN_NAMES_RU,
};

/**
 * Backend-dən gələn AZ kanonik bürc adını (məs. "Aslan") UI dilinə uyğun
 * "emoji + ad" etiketinə çevirir (məs. lang="en" → "♌ Leo"). `lang`
 * verilməzsə (və ya tanınmayan dəyərdirsə) AZ-a geri qayıdır — mövcud
 * çağırış yerlərini pozmamaq üçün.
 */
export function signLabel(sign: string | null | undefined, lang?: string): string {
  if (!sign) return "—";
  const names = (lang && NAMES_BY_LANG[lang]) || SIGN_NAMES_AZ;
  const name = names[sign] ?? sign;
  const emoji = SIGN_EMOJI[sign];
  return emoji ? `${emoji} ${name}` : name;
}

// Yalnız emoji simvolu (destiny-reads-app-ın SIGN_SYMBOLS-i ilə eyni istifadə
// yeri — bürc seçici grid-lərində böyük simvol, ad ayrıca sətirdə).
export const SIGN_SYMBOLS: Record<string, string> = SIGN_EMOJI;
