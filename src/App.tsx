import type { ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth-context";
import { CartProvider } from "./lib/cart-context";
import { WishlistProvider } from "./lib/wishlist-context";
import { I18nProvider, useI18n } from "./lib/i18n";
import { StarField } from "./components/StarField";
import { ScrollToTop } from "./components/ScrollToTop";
import LandingPage from "./pages/Landing";
import HomePage from "./pages/Home";
import AuthPage from "./pages/Auth";
import ResetPasswordPage from "./pages/ResetPassword";
import ProfilPage from "./pages/Profil";
import NatalChartPage from "./pages/NatalChart";
import NumerologyPage from "./pages/Numerology";
import DailyGuidePage from "./pages/DailyGuide";
import HoroscopesPage from "./pages/Horoscopes";
import AstrologersPage from "./pages/Astrologers";
import SynastryPage from "./pages/Synastry";
import JournalPage from "./pages/Journal";
import NotificationsPage from "./pages/Notifications";
import BookingsPage from "./pages/Bookings";
import ChatPage from "./pages/Chat";
import SearchPage from "./pages/Search";
import ForumPage from "./pages/Forum";
import ForumTopicPage from "./pages/ForumTopic";
import ShopPage from "./pages/Shop";
import CartPage from "./pages/Cart";
import ArticlesPage from "./pages/Articles";
import ArticleDetailPage from "./pages/ArticleDetail";
import SubscriptionsPage from "./pages/Subscriptions";
import ContactPage from "./pages/Contact";
import TermsPage from "./pages/Terms";
import PrivacyPage from "./pages/Privacy";
import AdminRoute from "./components/AdminRoute";
import AstrologerRoute, { isAstrologerRole } from "./components/AstrologerRoute";
import AstrologerDashboardPage from "./pages/AstrologerDashboard";
import AdminDashboardPage from "./pages/admin/AdminDashboard";
import AdminUsersPage from "./pages/admin/AdminUsers";
import AdminContactPage from "./pages/admin/AdminContact";
import AdminArticlesPage from "./pages/admin/AdminArticles";
import AdminAstrologersPage from "./pages/admin/AdminAstrologers";
import AdminBookingsPage from "./pages/admin/AdminBookings";
import AdminHoroscopesPage from "./pages/admin/AdminHoroscopes";
import AdminForumPage from "./pages/admin/AdminForum";
import AdminShopPage from "./pages/admin/AdminShop";
import AdminSubscriptionsPage from "./pages/admin/AdminSubscriptions";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  if (loading) {
    return (
      <div className="min-h-screen bg-ink grid place-items-center text-mist text-sm">
        {t("common.loading")}
      </div>
    );
  }
  if (!user) return <Navigate to="/giris" replace />;
  return <>{children}</>;
}

// Astroloq rolu olan istifadəçi "/profil" açanda öz panelinə ("/astroloq-panelim")
// yönləndirilir — admin və adi istifadəçilər üçün adi Profil səhifəsi qalır.
function ProfilOrDashboard() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (isAstrologerRole(user?.role)) return <Navigate to="/astroloq-panelim" replace />;
  return <ProfilPage />;
}

function Home() {
  const { user, loading } = useAuth();
  if (loading) return null;
  // Əvvəllər daxil olmuş istifadəçi "/" açanda birbaşa /profil-ə yönləndirilirdi
  // (istifadəçinin şikayəti: "esas sehifeye basanda profil bolmesi cixmasin").
  // İndi "/" öz məzmunu olan əsas səhifə (HomePage) göstərir, Profil artıq
  // ayrıca marşrutdur (/profil) — yalnız naviqasiyadan keçilir.
  if (user) return <HomePage />;
  return <LandingPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <I18nProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <StarField />
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/giris" element={<AuthPage />} />
              <Route path="/sifre-sifirla" element={<ResetPasswordPage />} />
              <Route path="/sertler" element={<TermsPage />} />
              <Route path="/mexfilik" element={<PrivacyPage />} />
              <Route
                path="/profil"
                element={
                  <ProtectedRoute>
                    <ProfilOrDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/astroloq-panelim"
                element={
                  <AstrologerRoute>
                    <AstrologerDashboardPage />
                  </AstrologerRoute>
                }
              />
              <Route
                path="/natal-xerite"
                element={
                  <ProtectedRoute>
                    <NatalChartPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/numerologiya"
                element={
                  <ProtectedRoute>
                    <NumerologyPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/gunun-beledcisi"
                element={
                  <ProtectedRoute>
                    <DailyGuidePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/burc-proqnozu"
                element={
                  <ProtectedRoute>
                    <HoroscopesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/astroloqlar"
                element={
                  <ProtectedRoute>
                    <AstrologersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/uygunluq"
                element={
                  <ProtectedRoute>
                    <SynastryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/jurnal"
                element={
                  <ProtectedRoute>
                    <JournalPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bildirisler"
                element={
                  <ProtectedRoute>
                    <NotificationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/goruslerim"
                element={
                  <ProtectedRoute>
                    <BookingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ai-sohbet"
                element={
                  <ProtectedRoute>
                    <ChatPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/axtaris"
                element={
                  <ProtectedRoute>
                    <SearchPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/forum"
                element={
                  <ProtectedRoute>
                    <ForumPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/forum/:id"
                element={
                  <ProtectedRoute>
                    <ForumTopicPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/magaza"
                element={
                  <ProtectedRoute>
                    <ShopPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sebet"
                element={
                  <ProtectedRoute>
                    <CartPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/qezet"
                element={
                  <ProtectedRoute>
                    <ArticlesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/qezet/:slug"
                element={
                  <ProtectedRoute>
                    <ArticleDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/abuneler"
                element={
                  <ProtectedRoute>
                    <SubscriptionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/elaqe"
                element={
                  <ProtectedRoute>
                    <ContactPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboardPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <AdminRoute>
                    <AdminUsersPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/contact"
                element={
                  <AdminRoute>
                    <AdminContactPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/articles"
                element={
                  <AdminRoute>
                    <AdminArticlesPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/astrologers"
                element={
                  <AdminRoute>
                    <AdminAstrologersPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/bookings"
                element={
                  <AdminRoute>
                    <AdminBookingsPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/horoscopes"
                element={
                  <AdminRoute>
                    <AdminHoroscopesPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/forum"
                element={
                  <AdminRoute>
                    <AdminForumPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/shop"
                element={
                  <AdminRoute>
                    <AdminShopPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/subscriptions"
                element={
                  <AdminRoute>
                    <AdminSubscriptionsPage />
                  </AdminRoute>
                }
              />
            </Routes>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
      </I18nProvider>
    </BrowserRouter>
  );
}
