// DÜZƏLİŞ (2026-10-27): Astroloqlar səhifəsindəki "ixtisas" (specialties) və
// "dil" (languages) çipləri admin panelində sərbəst mətn kimi daxil edilir
// (bax AdminAstrologers.tsx — vergüllə ayrılmış sadə input, sabit siyahı
// deyil) və backend-də tərcümə sütunu yoxdur (Title/Bio-dan fərqli olaraq).
// UI dili dəyişəndə bu çiplərin də tərcümə olunması üçün — backend sxemini
// və admin formunu genişləndirmək (yeni sütun + miqrasiya) əvəzinə, digər
// "kanonik AZ mətni → lüğət" naxışlarımızla (signs.ts, Home.tsx-dəki
// DAY_RULER_AZ_NAME) eyni üsulla — ən çox rast gəlinən ixtisas/dil
// terminlərini əhatə edən sabit lüğət. Lüğətdə olmayan (admin-in yeni daxil
// etdiyi) dəyərlər sadəcə olduğu kimi (AZ) göstərilir — heç nə sınmır.
const SPECIALTY_DICT: Record<string, { en: string; ru: string }> = {
  "natal xəritə": { en: "Natal Chart", ru: "Натальная карта" },
  karyera: { en: "Career", ru: "Карьера" },
  sinastriya: { en: "Synastry", ru: "Синастрия" },
  sevgi: { en: "Love", ru: "Любовь" },
  tranzit: { en: "Transits", ru: "Транзиты" },
  proqnoz: { en: "Forecast", ru: "Прогноз" },
  reiki: { en: "Reiki", ru: "Рейки" },
  tədbirlər: { en: "Events", ru: "Мероприятия" },
  numerologiya: { en: "Numerology", ru: "Нумерология" },
  taro: { en: "Tarot", ru: "Таро" },
  tarot: { en: "Tarot", ru: "Таро" },
  uyğunluq: { en: "Compatibility", ru: "Совместимость" },
  "münasibət uyğunluğu": { en: "Relationship Compatibility", ru: "Совместимость в отношениях" },
  münasibətlər: { en: "Relationships", ru: "Отношения" },
  "həyat yolu": { en: "Life Path", ru: "Жизненный путь" },
  ailə: { en: "Family", ru: "Семья" },
  maliyyə: { en: "Finance", ru: "Финансы" },
  sağlamlıq: { en: "Health", ru: "Здоровье" },
  astrologiya: { en: "Astrology", ru: "Астрология" },
  horoskop: { en: "Horoscope", ru: "Гороскоп" },
  "gündəlik proqnoz": { en: "Daily Forecast", ru: "Ежедневный прогноз" },
  "həftəlik proqnoz": { en: "Weekly Forecast", ru: "Еженедельный прогноз" },
  "aylıq proqnoz": { en: "Monthly Forecast", ru: "Месячный прогноз" },
};

const LANGUAGE_DICT: Record<string, { en: string; ru: string }> = {
  azərbaycan: { en: "Azerbaijani", ru: "Азербайджанский" },
  ingilis: { en: "English", ru: "Английский" },
  rus: { en: "Russian", ru: "Русский" },
  türk: { en: "Turkish", ru: "Турецкий" },
  alman: { en: "German", ru: "Немецкий" },
  fransız: { en: "French", ru: "Французский" },
  ərəb: { en: "Arabic", ru: "Арабский" },
  fars: { en: "Persian", ru: "Персидский" },
  ispan: { en: "Spanish", ru: "Испанский" },
  italyan: { en: "Italian", ru: "Итальянский" },
};

function lookup(dict: Record<string, { en: string; ru: string }>, raw: string, lang: string): string {
  const entry = dict[raw.trim().toLowerCase()];
  if (!entry) return raw;
  if (lang === "en") return entry.en;
  if (lang === "ru") return entry.ru;
  return raw;
}

export function translateSpecialty(raw: string, lang: string): string {
  return lookup(SPECIALTY_DICT, raw, lang);
}

export function translateLanguageTag(raw: string, lang: string): string {
  return lookup(LANGUAGE_DICT, raw, lang);
}
