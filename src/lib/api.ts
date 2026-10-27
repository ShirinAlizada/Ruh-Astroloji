// DÜZƏLİŞ (2026-10-27): aşağıdaki iki xəta mesajı (sessiya bitməsi, generic
// server xətası) əvvəllər sabit Azərbaycanca idi — UI dili EN/RU olsa belə
// dəyişmirdi. Bu fayl plain funksiyalardır (React komponenti deyil), ona görə
// `useI18n().t()` çağırıla bilməz — `tStatic` (bax lib/i18n/index.tsx) eyni
// lüğətlərdən birbaşa localStorage-dakı cari dilə görə oxuyur.
import { tStatic } from "./i18n";

// AstroBackend-in öz REST API-sinə birbaşa bağlanır — Supabase istifadə olunmur.
// Baza URL development üçün AstroBackend-in https Kestrel portudur (əvvəlki
// sessiyalarda https://localhost:7168/swagger kimi işlədilib). Fərqli portda
// işə düşsə, bunu dəyişmək kifayətdir.
const API_BASE = "https://localhost:7168/api";

export interface AuthResponse {
  id: string;
  email: string;
  fullName: string;
  role: string;
  accessToken: string;
  refreshToken: string;
}

// DÜZƏLİŞ (2026-10-27): AstroBackend.Application.DTOs.AuthDtos.RegisterResponse — birbaşa uyğun.
// Qeydiyyat indi birbaşa token qaytarmır, e-poçta göndərilən kodla təsdiqləmə lazımdır.
export interface RegisterResponse {
  requiresEmailConfirmation: boolean;
  email: string;
  message: string;
}

export interface CurrentUser {
  userId: string;
  email: string;
  role: string;
}

// AstroBackend.Application.DTOs.ProfileDtos — birbaşa uyğun (bax ProfileDtos.cs)
export interface ProfileDto {
  userId: string;
  fullName: string | null;
  avatarUrl: string | null;
  birthDate: string | null; // "YYYY-MM-DD"
  birthTime: string | null; // "HH:mm"
  birthPlace: string | null;
  birthLat: number | null;
  birthLon: number | null;
  tzOffset: number | null;
  sunSign: string | null;
  moonSign: string | null;
  ascendant: string | null;
  bio: string | null;
  createdAt: string;
}

export interface UpdateProfileRequest {
  fullName?: string | null;
  avatarUrl?: string | null;
  birthDate?: string | null;
  birthTime?: string | null;
  birthPlace?: string | null;
  birthLat?: number | null;
  birthLon?: number | null;
  bio?: string | null;
}

// AstroBackend.Application.DTOs.NatalChartDtos — birbaşa uyğun
export interface PlanetPositionDto {
  name: string;
  sign: string;
  degree: number;
  minute: number;
  house: number | null;
  retrograde: boolean;
}

export interface HousePositionDto {
  index: number;
  sign: string;
  degree: number;
  minute: number;
}

export interface AnglePointDto {
  sign: string;
  degree: number;
  minute: number;
}

export interface NatalChartResponse {
  planets: PlanetPositionDto[];
  houses: HousePositionDto[];
  sun: string;
  moon: string;
  ascendant: AnglePointDto;
  midheaven: AnglePointDto;
}

export interface CalculateChartRequest {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  latitude?: number;
  longitude?: number;
}

// AstroBackend.Application.DTOs.NumerologyDtos — birbaşa uyğun
export interface NumerologyRequest {
  fullName: string;
  birthDate: string; // YYYY-MM-DD
  lang?: string | null;
  forYear?: number | null;
}

export interface NumerologyItemDto {
  number: number;
  name: string;
  title: string;
  meaning: string;
  keywords: string[];
  compatible: number[];
}

export interface NumerologyResponse {
  lifePath: number;
  destiny: number;
  soulUrge: number;
  personality: number;
  birthday: number;
  maturity: number;
  personalYear: number;
  personalYearTheme: string;
  details: NumerologyItemDto[];
}

// AstroBackend.Application.DTOs.PanchangDtos — birbaşa uyğun
export interface GuidanceItemDto {
  category: string;
  verdict: string; // əlverişli, neytral, ehtiyatlı ol
  reason: string;
}

export interface AspectHitDto {
  planetA: string;
  planetB: string;
  signA: string;
  signB: string;
  aspect: string;
}

export interface PanchangResponse {
  dateISO: string;
  moonSign: string;
  moonElement: string;
  dayRuler: string;
  weekday: number;
  dayColor: string;
  aspects: AspectHitDto[];
  guidance: GuidanceItemDto[];
}

// AstroBackend.Application.DTOs.HoroscopeDtos — birbaşa uyğun
export interface HoroscopeDto {
  id: string;
  sign: string;
  period: string;
  periodStart: string;
  content: string;
  love: number;
  career: number;
  finance: number;
}

// AstroBackend.Application.DTOs.AstrologerDtos — birbaşa uyğun
export interface AstrologerDto {
  id: string;
  userId: string | null;
  displayName: string;
  title: string | null;
  bio: string | null;
  specialties: string[];
  languages: string[];
  priceAzn: number;
  rating: number;
  avatarUrl: string | null;
  verified: boolean;
  // DÜZƏLİŞ (2026-10-27): En/Ru tərcümə sahələri.
  titleEn?: string | null;
  titleRu?: string | null;
  bioEn?: string | null;
  bioRu?: string | null;
}

// AstroBackend.Application.DTOs.SynastryDtos — birbaşa uyğun
export interface SynastryRequest {
  signA: string;
  signB: string;
  dateA?: string | null;
  dateB?: string | null;
  lang?: string | null;
}

export interface SynastryChartRequest {
  personA?: CalculateChartRequest | null;
  personB: CalculateChartRequest;
  lang?: string | null;
}

export interface PlanetPairDetailDto {
  planet: string;
  symbol: string;
  signA: string;
  signB: string;
  elementA: string;
  elementB: string;
  aspect: string;
  score: number;
}

export interface ElementBalanceDto {
  od: number;
  torpaq: number;
  hava: number;
  su: number;
}

export interface SynastryResponse {
  overall: number;
  love: number;
  friendship: number;
  communication: number;
  tier: string;
  notes: string[];
  details: PlanetPairDetailDto[];
  elementBalanceA: ElementBalanceDto;
  elementBalanceB: ElementBalanceDto;
  dominantElementA: string | null;
  dominantElementB: string | null;
}

// AstroBackend.Application.DTOs.JournalDtos — birbaşa uyğun
export interface JournalEntryDto {
  id: string;
  entryDate: string;
  mood: number;
  title: string | null;
  content: string;
  transitNote: string | null;
  createdAt: string;
}

export interface CreateJournalEntryRequest {
  entryDate: string;
  mood: number;
  title?: string | null;
  content: string;
  transitNote?: string | null;
}

export type UpdateJournalEntryRequest = CreateJournalEntryRequest;

// AstroBackend.Application.DTOs.NotificationDtos — birbaşa uyğun
export interface NotificationDto {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

// AstroBackend.Application.DTOs.BookingDtos — birbaşa uyğun.
// DÜZƏLİŞ (2026-10-28): bu şərh əvvəllər səhv idi — Status/SessionType CAVABLARI
// KİÇİK hərflə gəlir (backend `BookingDto`-nu `.ToString().ToLower()` ilə qurur,
// bax BookingService.cs: "pending"/"confirmed"/"completed"/"cancelled",
// "live"/"written"). Yalnız SORĞU GÖNDƏRƏNDƏ (CreateBookingRequest.sessionType,
// updateStatus-un {status} body-si) PascalCase ("Live"/"Cancelled" və s.) işləyir,
// çünki backend-in JSON enum parseri hərflərə həssas deyil. Frontend-də status/
// sessionType-a görə MÜQAYİSƏ edən bütün yerlər (Bookings.tsx, AdminBookings.tsx,
// AstrologerDashboard.tsx) kiçik hərfli dəyərlərlə müqayisə etməlidir.
export interface BookingDto {
  id: string;
  userId: string;
  astrologerId: string;
  astrologerName: string;
  astrologerTitle: string | null;
  sessionType: string;
  scheduledAt: string;
  status: string;
  note: string | null;
  createdAt: string;
  // DÜZƏLİŞ (2026-10-28): yalnız /Bookings/astrologer-bookings cavabında dolu gəlir
  // (astroloq paneli üçün) — müştərinin öz siyahısında (myBookings) null-dur.
  userFullName?: string | null;
  userEmail?: string | null;
}

export interface CreateBookingRequest {
  astrologerId: string;
  sessionType: string;
  scheduledAt: string;
  note?: string | null;
}

// AstroBackend.Application.DTOs.ChatDtos — birbaşa uyğun
export interface ChatThreadDto {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateThreadRequest {
  title?: string | null;
}

export interface ChatMessageDto {
  id: string;
  threadId: string;
  userId: string;
  role: string;
  content: string;
  createdAt: string;
}

// AstroBackend.Application.DTOs.PushDtos — birbaşa uyğun (brauzerin
// PushSubscription.toJSON() çıxışı ilə eyni şəkil).
export interface PushKeysDto {
  p256dh: string;
  auth: string;
}

export interface PushSubscribeRequest {
  endpoint: string;
  keys: PushKeysDto;
}

// AstroBackend.Application.DTOs.PagingDtos — səhifələnmiş siyahı "zərfi".
export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// AstroBackend.Application.DTOs.SearchDtos — birbaşa uyğun.
// NOT: Url sahəsi köhnə (Supabase) frontend-in marşrutları ilə uyğundur, bu
// tətbiqin marşrutları ilə eyni DEYİL — ona görə nəticələr klikləmə üçün link
// kimi deyil, sadə kart kimi göstərilir.
export interface SearchHitDto {
  kind: string; // "article" | "astrologer" | "product" | "forum"
  title: string;
  url: string;
}

// AstroBackend.Application.DTOs.ForumDtos — birbaşa uyğun
export interface ForumTopicDto {
  id: string;
  userId: string;
  authorName: string;
  category: string;
  title: string;
  titleEn: string | null;
  titleRu: string | null;
  body: string;
  bodyEn: string | null;
  bodyRu: string | null;
  isHidden: boolean;
  createdAt: string;
  replyCount: number;
}

export interface CreateTopicRequest {
  category: string;
  title: string;
  body: string;
  titleEn?: string | null;
  titleRu?: string | null;
  bodyEn?: string | null;
  bodyRu?: string | null;
}

export interface ForumReplyDto {
  id: string;
  topicId: string;
  userId: string;
  authorName: string;
  body: string;
  bodyEn: string | null;
  bodyRu: string | null;
  isHidden: boolean;
  createdAt: string;
}

export interface CreateReplyRequest {
  body: string;
  bodyEn?: string | null;
  bodyRu?: string | null;
}

// AstroBackend.Application.DTOs.ShopDtos — birbaşa uyğun
export interface ShopProductDto {
  id: string;
  category: string;
  slug: string;
  name: string;
  nameEn: string | null;
  nameRu: string | null;
  description: string;
  descriptionEn: string | null;
  descriptionRu: string | null;
  priceAzn: number;
  unitLabel: string | null;
  unitLabelEn: string | null;
  unitLabelRu: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  stock: number;
  averageRating: number | null;
  reviewCount: number;
}

export interface ShopOrderItemDto {
  id: string;
  productId: string | null;
  productName: string;
  quantity: number;
  unitPriceAzn: number;
}

export interface ShopOrderDto {
  id: string;
  userId: string;
  subtotalAzn: number;
  discountPct: number;
  totalAzn: number;
  fullName: string;
  phone: string;
  address: string;
  note: string | null;
  status: string;
  createdAt: string;
  items: ShopOrderItemDto[];
}

export interface ShopCartItemRequest {
  productId: string;
  productName: string;
  quantity: number;
  unitPriceAzn: number;
}

export interface PlaceShopOrderRequest {
  items: ShopCartItemRequest[];
  fullName: string;
  phone: string;
  address: string;
  note?: string | null;
  discountPct?: number;
}

export interface ShopProductReviewDto {
  id: string;
  productId: string;
  userId: string;
  userName: string | null;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface UpsertReviewRequest {
  rating: number;
  comment?: string | null;
}

// AstroBackend.Application.DTOs.WishlistDtos — birbaşa uyğun
export interface WishlistItemDto {
  productId: string;
  createdAt: string;
}

const ACCESS_TOKEN_KEY = "ruh_access_token";
const REFRESH_TOKEN_KEY = "ruh_refresh_token";

export function getStoredTokens() {
  return {
    accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
  };
}

export function storeTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body?.message ?? body?.title ?? tStatic("common.serverError", { status: res.status });
  } catch {
    return tStatic("common.serverError", { status: res.status });
  }
}

// Daxili köməkçi: bir dəfə token yeniləməyi (refresh) sınayır, uğurlu olarsa
// yeni access-token-i qaytarır, olmazsa null (bu zaman çağıran tərəf çıxış
// etməlidir).
async function tryRefresh(): Promise<string | null> {
  const { accessToken, refreshToken } = getStoredTokens();
  if (!accessToken || !refreshToken) return null;
  try {
    const res = await fetch(`${API_BASE}/Auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, refreshToken }),
    });
    if (!res.ok) return null;
    const data: AuthResponse = await res.json();
    storeTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

/**
 * Bütün AstroBackend çağırışları üçün ortaq fetch köməkçisi.
 * `auth: true` olanda Authorization header-i avtomatik əlavə olunur;
 * 401 gələrsə BİR DƏFƏ refresh cəhd olunur, uğurlu olarsa sorğu təkrarlanır.
 */
async function apiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {},
): Promise<T> {
  const { method = "GET", body, auth = false } = options;

  const doFetch = async (): Promise<Response> => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (auth) {
      const { accessToken } = getStoredTokens();
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  let res = await doFetch();

  if (res.status === 401 && auth) {
    const newToken = await tryRefresh();
    if (!newToken) {
      clearTokens();
      throw new ApiError(401, tStatic("common.sessionExpired"));
    }
    res = await doFetch();
  }

  if (!res.ok) {
    throw new ApiError(res.status, await parseErrorMessage(res));
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/**
 * Fayl yükləmə (multipart/form-data) üçün ayrıca köməkçi — Content-Type
 * header-i qəsdən qoyulmur, brauzer öz boundary-sini özü əlavə etsin.
 * Eyni 401→refresh→təkrar məntiqi tətbiq olunur.
 */
async function apiFetchForm<T>(path: string, formData: FormData): Promise<T> {
  const doFetch = async (): Promise<Response> => {
    const headers: Record<string, string> = {};
    const { accessToken } = getStoredTokens();
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
    return fetch(`${API_BASE}${path}`, { method: "POST", headers, body: formData });
  };

  let res = await doFetch();

  if (res.status === 401) {
    const newToken = await tryRefresh();
    if (!newToken) {
      clearTokens();
      throw new ApiError(401, tStatic("common.sessionExpired"));
    }
    res = await doFetch();
  }

  if (!res.ok) {
    throw new ApiError(res.status, await parseErrorMessage(res));
  }
  return (await res.json()) as T;
}

export const authApi = {
  register(email: string, password: string, fullName: string) {
    return apiFetch<RegisterResponse>("/Auth/register", {
      method: "POST",
      body: { email, password, fullName },
    });
  },
  // DÜZƏLİŞ (2026-10-27): qeydiyyatdan sonra e-poçta göndərilən 6 rəqəmli kodu doğrulayır
  // və (uğurlu olsa) giriş tokenlərini qaytarır — bax AuthController.ConfirmEmail.
  confirmEmail(email: string, code: string) {
    return apiFetch<AuthResponse>("/Auth/confirm-email", {
      method: "POST",
      body: { email, code },
    });
  },
  resendConfirmationCode(email: string) {
    return apiFetch<{ message: string }>("/Auth/resend-confirmation", {
      method: "POST",
      body: { email },
    });
  },
  login(email: string, password: string) {
    return apiFetch<AuthResponse>("/Auth/login", {
      method: "POST",
      body: { email, password },
    });
  },
  me() {
    return apiFetch<CurrentUser>("/Auth/me", { auth: true });
  },
  changePassword(oldPassword: string, newPassword: string) {
    return apiFetch<{ message: string }>("/Auth/change-password", {
      method: "POST",
      auth: true,
      body: { oldPassword, newPassword },
    });
  },
  logout() {
    return apiFetch<{ message: string }>("/Auth/logout", { method: "POST", auth: true });
  },
  forgotPassword(email: string) {
    return apiFetch<{ message: string }>("/Auth/forgot-password", {
      method: "POST",
      body: { email },
    });
  },
  resetPassword(email: string, token: string, newPassword: string) {
    return apiFetch<{ message: string }>("/Auth/reset-password", {
      method: "POST",
      body: { email, token, newPassword },
    });
  },
};

export const profileApi = {
  getMe() {
    return apiFetch<ProfileDto>("/Profiles/me", { auth: true });
  },
  updateMe(data: UpdateProfileRequest) {
    return apiFetch<ProfileDto>("/Profiles/me", { method: "PUT", auth: true, body: data });
  },
  uploadAvatar(file: File) {
    const form = new FormData();
    form.append("file", file);
    return apiFetchForm<ProfileDto>("/Profiles/me/avatar", form);
  },
};

export const natalChartApi = {
  // Profildəki doğum tarixindən canlı hesablanır (yoxdursa backend 404 qaytarır).
  getMe() {
    return apiFetch<NatalChartResponse>("/NatalCharts/me", { auth: true });
  },
  calculate(data: CalculateChartRequest) {
    return apiFetch<NatalChartResponse>("/NatalCharts/calculate", { method: "POST", body: data });
  },
};

export const numerologyApi = {
  calculate(data: NumerologyRequest) {
    return apiFetch<NumerologyResponse>("/Numerology/calculate", { method: "POST", body: data });
  },
};

export const panchangApi = {
  // lat/lon verilməsə backend defolt olaraq Bakı koordinatlarını istifadə edir.
  // DÜZƏLİŞ (2026-10-27): `lang` əlavə olundu — əvvəllər göndərilmirdi, ona görə
  // Günün Bələdçisi-nin Category/Verdict/Reason/DayRuler/DayColor/MoonElement
  // mətnləri UI dili EN/RU olsa belə HƏMİŞƏ AZ qalırdı (bax: PanchangEngine.Compute).
  today(lat?: number, lon?: number, lang?: string) {
    const params = new URLSearchParams();
    if (lat != null) params.set("lat", String(lat));
    if (lon != null) params.set("lon", String(lon));
    if (lang) params.set("lang", lang);
    const qs = params.toString();
    return apiFetch<PanchangResponse>(`/Panchang/today${qs ? `?${qs}` : ""}`);
  },
};

export const horoscopeApi = {
  // DÜZƏLİŞ (2026-10-27): `lang` əvvəllər heç göndərilmirdi — backend
  // (HoroscopeService.MapToDto) `ContentEn`/`ContentRu`-nu artıq dəstəkləyir
  // (DbInitializer-də real tərcümələrlə seed edilib), sadəcə frontend heç vaxt
  // sorğu etmirdi, ona görə proqnoz mətni UI dili EN/RU olsa belə HƏMİŞƏ AZ
  // qalırdı.
  current(sign: string, period: string = "daily", lang?: string) {
    const qs = new URLSearchParams({ sign, period });
    if (lang) qs.set("lang", lang);
    return apiFetch<HoroscopeDto>(`/Horoscopes/current?${qs.toString()}`);
  },
};

export const astrologersApi = {
  list() {
    return apiFetch<AstrologerDto[]>("/Astrologers");
  },
  // DÜZƏLİŞ (2026-10-28): "astroloq öz panelini idarə etsin" — rol=Astrologer olan
  // istifadəçi admin panelinə getmədən ÖZ profilini görüb redaktə edə bilsin.
  me() {
    return apiFetch<AstrologerDto>("/Astrologers/me", { auth: true });
  },
  updateMe(data: UpdateAstrologerRequest) {
    return apiFetch<AstrologerDto>("/Astrologers/me", { method: "PUT", auth: true, body: data });
  },
};

export const synastryApi = {
  // auth: true — PersonA göndərilməsə, daxil olmuş istifadəçinin öz saxlanılmış
  // natal xəritəsi backend tərəfindən istifadə olunur.
  calculateChart(data: SynastryChartRequest) {
    return apiFetch<SynastryResponse>("/Synastry/calculate-chart", { method: "POST", auth: true, body: data });
  },
  // Sürətli, yalnız bürc adı əsaslı hesablama (auth tələb olunmur) — əsas
  // səhifədəki "daxili uyğunluq" (öz Günəş/Ay bürcü) vidcetində istifadə olunur.
  calculate(data: SynastryRequest) {
    return apiFetch<SynastryResponse>("/Synastry/calculate", { method: "POST", body: data });
  },
};

export const journalApi = {
  list() {
    return apiFetch<JournalEntryDto[]>("/Journal", { auth: true });
  },
  create(data: CreateJournalEntryRequest) {
    return apiFetch<JournalEntryDto>("/Journal", { method: "POST", auth: true, body: data });
  },
  update(id: string, data: UpdateJournalEntryRequest) {
    return apiFetch<JournalEntryDto>(`/Journal/${id}`, { method: "PUT", auth: true, body: data });
  },
  remove(id: string) {
    return apiFetch<{ message: string }>(`/Journal/${id}`, { method: "DELETE", auth: true });
  },
};

// Controller sinfi "NotificationsController" adlanır (BaseApiController-in
// [Route("api/[controller]")] konvensiyasına görə marşrut "api/Notifications"-dur
// — fayl adı tək, sinif/marşrut cəmdir).
export const notificationsApi = {
  list() {
    return apiFetch<NotificationDto[]>("/Notifications", { auth: true });
  },
  markRead(id: string) {
    return apiFetch<{ message: string }>(`/Notifications/${id}/read`, { method: "PATCH", auth: true });
  },
  markAllRead() {
    return apiFetch<{ message: string }>("/Notifications/read-all", { method: "PATCH", auth: true });
  },
};

export const bookingsApi = {
  create(data: CreateBookingRequest) {
    return apiFetch<BookingDto>("/Bookings", { method: "POST", auth: true, body: data });
  },
  myBookings() {
    return apiFetch<BookingDto[]>("/Bookings/my-bookings", { auth: true });
  },
  // DÜZƏLİŞ (2026-10-28): rol=Astrologer olan istifadəçinin ÖZÜNƏ edilən rezervasiyalar
  // (bax BookingService.GetAstrologerBookingsAsync — Astrologer.UserId ilə uyğunlaşdırılır).
  astrologerBookings() {
    return apiFetch<BookingDto[]>("/Bookings/astrologer-bookings", { auth: true });
  },
  // Sahib (müştəri) YALNIZ "Cancelled" statusuna keçirə bilər; təyin olunmuş astroloq isə
  // İSTƏNİLƏN statusa keçirə bilər (backend-də sərtləşdirilib, bax BookingService.UpdateStatusAsync).
  updateStatus(id: string, status: string) {
    return apiFetch<BookingDto>(`/Bookings/${id}/status`, { method: "PATCH", auth: true, body: { status } });
  },
};

export const pushApi = {
  // AllowAnonymous — brauzer PushManager.subscribe() çağırmazdan əvvəl ictimai
  // VAPID açarını alır.
  publicKey() {
    return apiFetch<{ publicKey: string }>("/Push/public-key");
  },
  subscribe(data: PushSubscribeRequest) {
    return apiFetch<{ message: string }>("/Push/subscribe", { method: "POST", auth: true, body: data });
  },
  unsubscribe(endpoint: string) {
    return apiFetch<{ message: string }>("/Push/unsubscribe", { method: "POST", auth: true, body: { endpoint } });
  },
};

export const searchApi = {
  search(q: string, lang?: string) {
    const params = new URLSearchParams({ q });
    if (lang) params.set("lang", lang);
    return apiFetch<SearchHitDto[]>(`/Search?${params.toString()}`);
  },
};

export const forumApi = {
  topics(category?: string, page = 1, pageSize = 20) {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (category) params.set("category", category);
    return apiFetch<PagedResult<ForumTopicDto>>(`/Forum/topics?${params.toString()}`);
  },
  topic(id: string) {
    return apiFetch<ForumTopicDto>(`/Forum/topics/${id}`);
  },
  createTopic(data: CreateTopicRequest) {
    return apiFetch<ForumTopicDto>("/Forum/topics", { method: "POST", auth: true, body: data });
  },
  replies(topicId: string) {
    return apiFetch<ForumReplyDto[]>(`/Forum/topics/${topicId}/replies`);
  },
  createReply(topicId: string, data: CreateReplyRequest) {
    return apiFetch<ForumReplyDto>(`/Forum/topics/${topicId}/replies`, { method: "POST", auth: true, body: data });
  },
  deleteTopic(id: string) {
    return apiFetch<{ message: string }>(`/Forum/topics/${id}`, { method: "DELETE", auth: true });
  },
  deleteReply(id: string) {
    return apiFetch<{ message: string }>(`/Forum/replies/${id}`, { method: "DELETE", auth: true });
  },
};

export const shopApi = {
  products(search?: string, sort?: string, page = 1, pageSize = 50) {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search) params.set("search", search);
    if (sort) params.set("sort", sort);
    return apiFetch<PagedResult<ShopProductDto>>(`/Shop/products?${params.toString()}`);
  },
  reviews(productId: string) {
    return apiFetch<ShopProductReviewDto[]>(`/Shop/products/${productId}/reviews`);
  },
  upsertReview(productId: string, data: UpsertReviewRequest) {
    return apiFetch<ShopProductReviewDto>(`/Shop/products/${productId}/reviews`, {
      method: "POST",
      auth: true,
      body: data,
    });
  },
  placeOrder(data: PlaceShopOrderRequest) {
    return apiFetch<ShopOrderDto>("/Shop/orders", { method: "POST", auth: true, body: data });
  },
  myOrders() {
    return apiFetch<ShopOrderDto[]>("/Shop/my-orders", { auth: true });
  },
};

export const wishlistApi = {
  list() {
    return apiFetch<WishlistItemDto[]>("/Wishlist", { auth: true });
  },
  add(productId: string) {
    return apiFetch<{ message: string }>(`/Wishlist/${productId}`, { method: "POST", auth: true });
  },
  remove(productId: string) {
    return apiFetch<{ message: string }>(`/Wishlist/${productId}`, { method: "DELETE", auth: true });
  },
};

export const chatApi = {
  threads() {
    return apiFetch<ChatThreadDto[]>("/Chat/threads", { auth: true });
  },
  createThread(title?: string) {
    return apiFetch<ChatThreadDto>("/Chat/threads", { method: "POST", auth: true, body: { title: title ?? null } });
  },
  deleteThread(id: string) {
    return apiFetch<{ message: string }>(`/Chat/threads/${id}`, { method: "DELETE", auth: true });
  },
  messages(threadId: string) {
    return apiFetch<ChatMessageDto[]>(`/Chat/threads/${threadId}/messages`, { auth: true });
  },
  // DÜZƏLİŞ (2026-10-27): `lang` əlavə olundu — AI astroloq köməkçisi əvvəllər
  // HƏMİŞƏ AZ cavab verməyə göstəriş alırdı (bax ChatService.AstrologerSystemPrompt),
  // UI dili EN/RU olsa belə. Backend indi bunu qəbul edir (SendMessageRequest.Lang).
  sendMessage(threadId: string, message: string, lang?: string) {
    return apiFetch<ChatMessageDto>(`/Chat/threads/${threadId}/messages`, {
      method: "POST",
      auth: true,
      body: { message, lang },
    });
  },
};

// ===================== Qəzet (Articles — ictimai) =====================
// ArticleDto artıq aşağıdaki ADMIN bölməsində tərif olunub (admin/ictimai uc nöqtələr
// eyni DTO formasını paylaşır) — TypeScript interfeys bəyanatları fayl daxilində sıraya
// baxmadan hoisted olunur, ona görə burada əvvəlcədən istifadə etmək təhlükəsizdir.
// DÜZƏLİŞ (2026-10-27): `lang` əvvəllər heç bir çağırışda göndərilmirdi —
// backend (ArticleService.MapToDto) `TitleEn/Ru`, `ExcerptEn/Ru`, `BodyEn/Ru`
// sütunlarını artıq dəstəkləyir, sadəcə frontend heç vaxt sorğu etmirdi, ona
// görə məqalə başlığı/mətni UI dili EN/RU olsa belə HƏMİŞƏ AZ qalırdı.
export const articlesApi = {
  list(params: { tag?: string; search?: string; sort?: string; page?: number; pageSize?: number; lang?: string } = {}) {
    const qs = new URLSearchParams();
    if (params.tag) qs.set("tag", params.tag);
    if (params.search) qs.set("search", params.search);
    if (params.sort) qs.set("sort", params.sort);
    if (params.lang) qs.set("lang", params.lang);
    qs.set("page", String(params.page ?? 1));
    qs.set("pageSize", String(params.pageSize ?? 12));
    return apiFetch<PagedResult<ArticleDto>>(`/Articles?${qs.toString()}`);
  },
  bySlug(slug: string, lang?: string) {
    const qs = lang ? `?lang=${encodeURIComponent(lang)}` : "";
    return apiFetch<ArticleDto>(`/Articles/${encodeURIComponent(slug)}${qs}`);
  },
  incrementView(slug: string) {
    return apiFetch<{ message: string }>(`/Articles/${encodeURIComponent(slug)}/view`, { method: "POST" });
  },
};

// ===================== Abunəliklər (Subscriptions — ictimai/daxil olmuş) =====================
// AstroBackend.Application.DTOs.SubscriptionDtos — müştəri tərəfinə göndərilən (lang-a
// həll olunmuş, tək-dilli) şəkil. Admin-in "xam, bütün dillər" AdminSubscriptionPlanDto-su
// ilə QARIŞDIRILMASIN — aşağıdaki ADMIN bölməsində ayrıca tərif olunub.
export interface SubscriptionPlanDto {
  key: string;
  name: string;
  tagline: string | null;
  priceAzn: number;
  billingPeriod: string;
  features: string[];
  aiMessagesPerDay: number | null;
  synastryFullDetail: boolean;
  bookingDiscountPct: number;
}

export interface UserSubscriptionDto {
  planKey: string;
  status: string;
  startedAt: string;
  currentPeriodEnd: string;
  billingPeriod: string;
}

export interface PurchasePlanRequest {
  planKey: string;
  billingPeriod?: string; // "monthly" | "yearly", defolt "monthly"
}

export interface PaymentTransactionDto {
  id: string;
  planKey: string;
  amountAzn: number;
  provider: string;
  status: string;
  note: string | null;
  billingPeriod: string;
  createdAt: string;
}

export const subscriptionApi = {
  // DÜZƏLİŞ (2026-10-27): `lang` əvvəllər göndərilmirdi — backend
  // (SubscriptionService.MapPlan) tərcümə sütunlarını artıq dəstəkləyir,
  // sadəcə frontend heç vaxt sorğu etmirdi.
  plans(lang?: string) {
    const qs = lang ? `?lang=${encodeURIComponent(lang)}` : "";
    return apiFetch<SubscriptionPlanDto[]>(`/Subscriptions/plans${qs}`);
  },
  me() {
    return apiFetch<UserSubscriptionDto | null>("/Subscriptions/me", { auth: true });
  },
  purchase(data: PurchasePlanRequest) {
    return apiFetch<UserSubscriptionDto>("/Subscriptions/purchase", { method: "POST", auth: true, body: data });
  },
  cancel() {
    return apiFetch<{ message: string }>("/Subscriptions/cancel", { method: "POST", auth: true });
  },
  payments() {
    return apiFetch<PaymentTransactionDto[]>("/Subscriptions/payments", { auth: true });
  },
};

// ===================== Əlaqə (Contact — ictimai, rate-limitli) =====================
// ContactMessageDto artıq aşağıdaki ADMIN bölməsində tərif olunub (admin/ictimai eyni DTO).
export interface CreateContactMessageRequest {
  name: string;
  email: string;
  message: string;
}

export const contactApi = {
  submit(data: CreateContactMessageRequest) {
    return apiFetch<ContactMessageDto>("/Contact", { method: "POST", body: data });
  },
};

// ===================== ADMIN (AstroBackend.Controllers.AdminController) =====================
// Bütün endpoint-lər [Authorize(Roles = "Admin,SuperAdmin")] altındadır. Bəzi istifadəçi
// əməliyyatları (yaratma/silmə/rol dəyişmə) server tərəfdə əlavə olaraq yalnız SuperAdmin
// üçün icazəlidir (bax AdminService) — Admin rolu cəhd etsə, backend 403 qaytarır.

// AstroBackend.Application.DTOs.ForumDtos.AdminUserDto — birbaşa uyğun
export interface AdminUserDto {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  sunSign: string | null;
  birthPlace: string | null;
}

// AstroBackend.Application.DTOs.HoroscopeDtos — admin create/update
export interface CreateHoroscopeRequest {
  sign: string;
  period: string;
  periodStart: string; // "YYYY-MM-DD"
  content: string;
  love: number;
  career: number;
  finance: number;
  contentEn?: string | null;
  contentRu?: string | null;
}

export interface UpdateHoroscopeRequest {
  content: string;
  love: number;
  career: number;
  finance: number;
  contentEn?: string | null;
  contentRu?: string | null;
}

// AstroBackend.Application.DTOs.AstrologerDtos — admin create/update
export interface CreateAstrologerRequest {
  displayName: string;
  title?: string | null;
  bio?: string | null;
  specialties: string[];
  languages: string[];
  priceAzn: number;
  avatarUrl?: string | null;
  titleEn?: string | null;
  titleRu?: string | null;
  bioEn?: string | null;
  bioRu?: string | null;
  // DÜZƏLİŞ (2026-10-27): astroloq profilini real istifadəçi hesabına bağlamaq üçün
  // (rezervasiya bildirişləri yalnız bağlı hesab olanda astroloqa çatır).
  userId?: string | null;
}

export interface UpdateAstrologerRequest {
  displayName: string;
  title?: string | null;
  bio?: string | null;
  specialties: string[];
  languages: string[];
  priceAzn: number;
  avatarUrl?: string | null;
  verified?: boolean | null;
  titleEn?: string | null;
  titleRu?: string | null;
  bioEn?: string | null;
  bioRu?: string | null;
  userId?: string | null;
}

// AstroBackend.Application.DTOs.ArticleDtos — birbaşa uyğun
export interface ArticleDto {
  id: string;
  authorId: string | null;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  tag: string;
  coverUrl: string | null;
  published: boolean;
  publishedAt: string | null;
  views: number;
  createdAt: string;
}

export interface CreateArticleRequest {
  title: string;
  slug?: string | null;
  excerpt?: string | null;
  body: string;
  tag: string;
  coverUrl?: string | null;
  published: boolean;
  titleEn?: string | null;
  titleRu?: string | null;
  excerptEn?: string | null;
  excerptRu?: string | null;
  bodyEn?: string | null;
  bodyRu?: string | null;
}

export type UpdateArticleRequest = CreateArticleRequest;

export interface GenerateArticleAiRequest {
  topic: string;
  tag?: string | null;
}

export interface AiArticleResultDto {
  title: string;
  excerpt: string;
  body: string;
  tag: string;
}

// AstroBackend.Application.DTOs.ForumDtos — admin-only mövzu/rəy yaratma (müəllif adı sərbəst mətn)
export interface AdminCreateTopicRequest {
  authorName: string;
  category: string;
  title: string;
  body: string;
  titleEn?: string | null;
  titleRu?: string | null;
  bodyEn?: string | null;
  bodyRu?: string | null;
}

export interface AdminCreateReplyRequest {
  authorName: string;
  body: string;
  bodyEn?: string | null;
  bodyRu?: string | null;
}

// AstroBackend.Application.DTOs.ShopDtos — admin məhsul/sifariş idarəetməsi
export interface CreateShopProductRequest {
  category: string;
  slug?: string | null;
  name: string;
  nameEn?: string | null;
  nameRu?: string | null;
  description: string;
  descriptionEn?: string | null;
  descriptionRu?: string | null;
  priceAzn: number;
  unitLabel?: string | null;
  unitLabelEn?: string | null;
  unitLabelRu?: string | null;
  imageUrl?: string | null;
  sortOrder: number;
  isActive: boolean;
  stock: number;
}

export type UpdateShopProductRequest = CreateShopProductRequest;

export interface ShopTopProductDto {
  productId: string;
  productName: string;
  unitsSold: number;
  revenueAzn: number;
}

export interface DailyRevenuePointDto {
  date: string;
  azn: number;
}

export interface ShopSalesStatsDto {
  totalRevenueAzn: number;
  totalOrders: number;
  pendingOrders: number;
  topProducts: ShopTopProductDto[];
  dailyRevenue: DailyRevenuePointDto[];
}

// AstroBackend.Application.DTOs.AdminDtos — DÜZƏLİŞ (2026-10-27): admin "Ümumi baxış"
// panelinin Satış paneli + 14 günlük gəlir trendi + ən çox satılan məhsullar üçün —
// mağaza və abunəlik statistikasını birləşdirir.
export interface AdminOverviewStatsDto {
  totalRevenueAzn: number;
  shopRevenueAzn: number;
  subscriptionRevenueAzn: number;
  totalOrders: number;
  pendingOrders: number;
  activeSubscribers: number;
  topProducts: ShopTopProductDto[];
  dailyRevenue: DailyRevenuePointDto[];
}

// AstroBackend.Application.DTOs.SubscriptionDtos — admin abunəlik paketi idarəetməsi
export interface AdminSubscriptionPlanDto {
  id: string;
  key: string;
  name: string;
  tagline: string | null;
  taglineEn: string | null;
  taglineRu: string | null;
  priceAzn: number;
  billingPeriod: string;
  features: string[];
  featuresEn: string[] | null;
  featuresRu: string[] | null;
  aiMessagesPerDay: number | null;
  synastryFullDetail: boolean;
  bookingDiscountPct: number;
  sortOrder: number;
  isActive: boolean;
}

export interface CreateSubscriptionPlanRequest {
  key: string;
  name: string;
  tagline?: string | null;
  taglineEn?: string | null;
  taglineRu?: string | null;
  priceAzn: number;
  billingPeriod: string;
  features: string[];
  featuresEn?: string[] | null;
  featuresRu?: string[] | null;
  aiMessagesPerDay?: number | null;
  synastryFullDetail: boolean;
  bookingDiscountPct: number;
  sortOrder: number;
  isActive: boolean;
}

export type UpdateSubscriptionPlanRequest = CreateSubscriptionPlanRequest;

// AstroBackend.Application.DTOs.ContactDtos — birbaşa uyğun
export interface ContactMessageDto {
  id: string;
  name: string;
  email: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export const adminApi = {
  users: {
    list() {
      return apiFetch<AdminUserDto[]>("/Admin/users", { auth: true });
    },
    create(email: string, password: string, fullName: string, role: string) {
      return apiFetch<AdminUserDto>(`/Admin/users?role=${encodeURIComponent(role)}`, {
        method: "POST",
        auth: true,
        body: { email, password, fullName },
      });
    },
    remove(id: string) {
      return apiFetch<{ message: string }>(`/Admin/users/${id}`, { method: "DELETE", auth: true });
    },
    updateRole(id: string, role: string) {
      return apiFetch<{ message: string }>(`/Admin/users/${id}/role?role=${encodeURIComponent(role)}`, {
        method: "PATCH",
        auth: true,
      });
    },
    toggleStatus(id: string) {
      return apiFetch<{ message: string }>(`/Admin/users/${id}/status`, { method: "PATCH", auth: true });
    },
  },
  articles: {
    list() {
      return apiFetch<ArticleDto[]>("/Admin/articles", { auth: true });
    },
    create(data: CreateArticleRequest) {
      return apiFetch<ArticleDto>("/Admin/articles", { method: "POST", auth: true, body: data });
    },
    generateAi(data: GenerateArticleAiRequest) {
      return apiFetch<AiArticleResultDto>("/Admin/articles/generate-ai", { method: "POST", auth: true, body: data });
    },
    update(id: string, data: UpdateArticleRequest) {
      return apiFetch<ArticleDto>(`/Admin/articles/${id}`, { method: "PUT", auth: true, body: data });
    },
    remove(id: string) {
      return apiFetch<{ message: string }>(`/Admin/articles/${id}`, { method: "DELETE", auth: true });
    },
    publish(id: string, publish: boolean) {
      return apiFetch<{ message: string }>(`/Admin/articles/${id}/publish?publish=${publish}`, {
        method: "PATCH",
        auth: true,
      });
    },
  },
  astrologers: {
    list() {
      return apiFetch<AstrologerDto[]>("/Admin/astrologers", { auth: true });
    },
    create(data: CreateAstrologerRequest) {
      return apiFetch<AstrologerDto>("/Admin/astrologers", { method: "POST", auth: true, body: data });
    },
    update(id: string, data: UpdateAstrologerRequest) {
      return apiFetch<AstrologerDto>(`/Admin/astrologers/${id}`, { method: "PUT", auth: true, body: data });
    },
    verify(id: string, verified: boolean) {
      return apiFetch<{ message: string }>(`/Admin/astrologers/${id}/verify?verified=${verified}`, {
        method: "PATCH",
        auth: true,
      });
    },
    remove(id: string) {
      return apiFetch<{ message: string }>(`/Admin/astrologers/${id}`, { method: "DELETE", auth: true });
    },
  },
  bookings: {
    list() {
      return apiFetch<BookingDto[]>("/Admin/bookings", { auth: true });
    },
  },
  horoscopes: {
    create(data: CreateHoroscopeRequest) {
      return apiFetch<HoroscopeDto>("/Admin/horoscopes", { method: "POST", auth: true, body: data });
    },
    update(id: string, data: UpdateHoroscopeRequest) {
      return apiFetch<HoroscopeDto>(`/Admin/horoscopes/${id}`, { method: "PUT", auth: true, body: data });
    },
    remove(id: string) {
      return apiFetch<{ message: string }>(`/Admin/horoscopes/${id}`, { method: "DELETE", auth: true });
    },
  },
  forum: {
    createTopic(data: AdminCreateTopicRequest) {
      return apiFetch<ForumTopicDto>("/Admin/forum/topics", { method: "POST", auth: true, body: data });
    },
    createReply(topicId: string, data: AdminCreateReplyRequest) {
      return apiFetch<ForumReplyDto>(`/Admin/forum/topics/${topicId}/replies`, {
        method: "POST",
        auth: true,
        body: data,
      });
    },
    hideTopic(id: string, isHidden: boolean) {
      return apiFetch<{ message: string }>(`/Admin/forum/topics/${id}/hide?isHidden=${isHidden}`, {
        method: "PATCH",
        auth: true,
      });
    },
    hideReply(id: string, isHidden: boolean) {
      return apiFetch<{ message: string }>(`/Admin/forum/replies/${id}/hide?isHidden=${isHidden}`, {
        method: "PATCH",
        auth: true,
      });
    },
  },
  shop: {
    products() {
      return apiFetch<ShopProductDto[]>("/Admin/shop/products", { auth: true });
    },
    createProduct(data: CreateShopProductRequest) {
      return apiFetch<ShopProductDto>("/Admin/shop/products", { method: "POST", auth: true, body: data });
    },
    updateProduct(id: string, data: UpdateShopProductRequest) {
      return apiFetch<ShopProductDto>(`/Admin/shop/products/${id}`, { method: "PUT", auth: true, body: data });
    },
    removeProduct(id: string) {
      return apiFetch<{ message: string }>(`/Admin/shop/products/${id}`, { method: "DELETE", auth: true });
    },
    orders() {
      return apiFetch<ShopOrderDto[]>("/Admin/shop/orders", { auth: true });
    },
    updateOrderStatus(id: string, status: string) {
      return apiFetch<ShopOrderDto>(`/Admin/shop/orders/${id}/status`, {
        method: "PATCH",
        auth: true,
        body: { status },
      });
    },
    stats() {
      return apiFetch<ShopSalesStatsDto>("/Admin/shop/stats", { auth: true });
    },
  },
  // DÜZƏLİŞ (2026-10-27): "/admin" paneli üçün birləşdirilmiş (mağaza + abunəlik) icmal statistikası.
  overviewStats() {
    return apiFetch<AdminOverviewStatsDto>("/Admin/overview-stats", { auth: true });
  },
  subscriptions: {
    list() {
      return apiFetch<AdminSubscriptionPlanDto[]>("/Admin/subscriptions/plans", { auth: true });
    },
    create(data: CreateSubscriptionPlanRequest) {
      return apiFetch<AdminSubscriptionPlanDto>("/Admin/subscriptions/plans", {
        method: "POST",
        auth: true,
        body: data,
      });
    },
    update(id: string, data: UpdateSubscriptionPlanRequest) {
      return apiFetch<AdminSubscriptionPlanDto>(`/Admin/subscriptions/plans/${id}`, {
        method: "PUT",
        auth: true,
        body: data,
      });
    },
    remove(id: string) {
      return apiFetch<{ message: string }>(`/Admin/subscriptions/plans/${id}`, { method: "DELETE", auth: true });
    },
  },
  contactMessages: {
    list() {
      return apiFetch<ContactMessageDto[]>("/Admin/contact-messages", { auth: true });
    },
    markRead(id: string, isRead: boolean) {
      return apiFetch<{ message: string }>(`/Admin/contact-messages/${id}/read?isRead=${isRead}`, {
        method: "PATCH",
        auth: true,
      });
    },
  },
};
