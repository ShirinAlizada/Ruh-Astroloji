import { useEffect, useState, type FormEvent } from "react";
import AdminLayout from "../../components/AdminLayout";
import {
  adminApi,
  ApiError,
  type ShopProductDto,
  type ShopOrderDto,
  type CreateShopProductRequest,
  type ShopSalesStatsDto,
} from "../../lib/api";

const STATUS_LABELS: Record<string, string> = {
  Pending: "Gözləyir",
  Confirmed: "Təsdiqləndi",
  Shipped: "Göndərildi",
  Completed: "Tamamlandı",
  Cancelled: "Ləğv edildi",
};
const STATUSES = Object.keys(STATUS_LABELS);
const CATEGORIES = ["kitab", "kristal", "şam", "tarot", "digər"];

const inputCls =
  "w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-[#F3EFE6] placeholder:text-[#6b6485] focus:outline-none focus:border-gold/50";
const labelCls = "block text-xs text-[#8b84a8] mb-1";
const cardCls = "rounded-3xl border border-white/10 bg-white/[0.03] p-7";

const EMPTY_FORM: CreateShopProductRequest = {
  category: CATEGORIES[0],
  slug: "",
  name: "",
  nameEn: "",
  nameRu: "",
  description: "",
  descriptionEn: "",
  descriptionRu: "",
  priceAzn: 0,
  unitLabel: "",
  unitLabelEn: "",
  unitLabelRu: "",
  imageUrl: "",
  sortOrder: 0,
  isActive: true,
  stock: 20,
};

export default function AdminShopPage() {
  const [tab, setTab] = useState<"products" | "orders">("products");

  const [stats, setStats] = useState<ShopSalesStatsDto | null>(null);

  const [products, setProducts] = useState<ShopProductDto[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [orders, setOrders] = useState<ShopOrderDto[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateShopProductRequest>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [productQuery, setProductQuery] = useState("");
  const [orderQuery, setOrderQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");

  async function loadAll() {
    setProductsLoading(true);
    setOrdersLoading(true);
    setError(null);
    try {
      const [p, o, s] = await Promise.all([
        adminApi.shop.products(),
        adminApi.shop.orders(),
        adminApi.shop.stats(),
      ]);
      setProducts(p);
      setOrders(o.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setStats(s);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Mağaza məlumatları yüklənərkən xəta baş verdi.");
    } finally {
      setProductsLoading(false);
      setOrdersLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(p: ShopProductDto) {
    setEditingId(p.id);
    setForm({
      category: p.category,
      slug: p.slug,
      name: p.name,
      nameEn: p.nameEn ?? "",
      nameRu: p.nameRu ?? "",
      description: p.description,
      descriptionEn: p.descriptionEn ?? "",
      descriptionRu: p.descriptionRu ?? "",
      priceAzn: p.priceAzn,
      unitLabel: p.unitLabel ?? "",
      unitLabelEn: p.unitLabelEn ?? "",
      unitLabelRu: p.unitLabelRu ?? "",
      imageUrl: p.imageUrl ?? "",
      sortOrder: p.sortOrder,
      isActive: p.isActive,
      stock: p.stock,
    });
    setFormError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    const payload: CreateShopProductRequest = {
      ...form,
      slug: form.slug || null,
      nameEn: form.nameEn || null,
      nameRu: form.nameRu || null,
      descriptionEn: form.descriptionEn || null,
      descriptionRu: form.descriptionRu || null,
      unitLabel: form.unitLabel || null,
      unitLabelEn: form.unitLabelEn || null,
      unitLabelRu: form.unitLabelRu || null,
      imageUrl: form.imageUrl || null,
      priceAzn: Number(form.priceAzn) || 0,
      sortOrder: Number(form.sortOrder) || 0,
      stock: Number(form.stock) || 0,
    };
    try {
      if (editingId) {
        await adminApi.shop.updateProduct(editingId, payload);
      } else {
        await adminApi.shop.createProduct(payload);
      }
      setShowForm(false);
      await loadAll();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Məhsul saxlanarkən xəta baş verdi.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProduct(id: string) {
    if (!confirm("Məhsulu silmək istədiyinizə əminsiniz?")) return;
    setBusyId(id);
    try {
      await adminApi.shop.removeProduct(id);
      await loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Məhsul silinərkən xəta baş verdi.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleStatusChange(order: ShopOrderDto, status: string) {
    setBusyId(order.id);
    try {
      const updated = await adminApi.shop.updateOrderStatus(order.id, status);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sifariş statusu dəyişdirilərkən xəta baş verdi.");
    } finally {
      setBusyId(null);
    }
  }

  const pq = productQuery.trim().toLowerCase();
  const filteredProducts = products.filter(
    (p) => !pq || p.name.toLowerCase().includes(pq) || p.category.toLowerCase().includes(pq)
  );
  const oq = orderQuery.trim().toLowerCase();
  const filteredOrders = orders.filter(
    (o) =>
      (orderStatusFilter === "all" || o.status === orderStatusFilter) &&
      (!oq || o.fullName.toLowerCase().includes(oq) || o.phone.toLowerCase().includes(oq))
  );

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="font-display text-3xl">Mağaza</h1>
        <p className="text-sm text-mist mt-1">Məhsul kataloqu, sifariş statusları və satış statistikası.</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className={cardCls}>
            <div className="text-xs text-[#8b84a8] mb-1">Ümumi gəlir</div>
            <div className="text-2xl font-display text-gold">{stats.totalRevenueAzn} AZN</div>
          </div>
          <div className={cardCls}>
            <div className="text-xs text-[#8b84a8] mb-1">Sifarişlər</div>
            <div className="text-2xl font-display text-gold">{stats.totalOrders}</div>
          </div>
          <div className={cardCls}>
            <div className="text-xs text-[#8b84a8] mb-1">Gözləyən</div>
            <div className="text-2xl font-display text-gold">{stats.pendingOrders}</div>
          </div>
          {stats.topProducts.length > 0 && (
            <div className={cardCls + " sm:col-span-3"}>
              <div className="text-xs text-[#8b84a8] mb-2">Ən çox satılan məhsullar</div>
              <div className="flex flex-wrap gap-2">
                {stats.topProducts.map((tp) => (
                  <span
                    key={tp.productId}
                    className="px-3 py-1.5 rounded-full border border-white/10 text-xs text-mist"
                  >
                    {tp.productName} — {tp.unitsSold} ədəd / {tp.revenueAzn} AZN
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="flex items-center gap-1.5 mb-5">
        <button
          onClick={() => setTab("products")}
          className={
            "px-4 py-1.5 rounded-full text-sm border transition " +
            (tab === "products"
              ? "border-gold/50 text-gold bg-gold/10"
              : "border-white/15 text-mist hover:border-gold/40")
          }
        >
          Məhsullar
        </button>
        <button
          onClick={() => setTab("orders")}
          className={
            "px-4 py-1.5 rounded-full text-sm border transition " +
            (tab === "orders"
              ? "border-gold/50 text-gold bg-gold/10"
              : "border-white/15 text-mist hover:border-gold/40")
          }
        >
          Sifarişlər
        </button>
      </div>

      {tab === "products" && (
        <>
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            {!showForm ? (
              <input
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                placeholder="Ad və ya kateqoriyada axtar…"
                className="px-3.5 py-1.5 rounded-full text-sm bg-white/5 border border-white/10 text-[#F3EFE6] placeholder:text-[#6b6485] focus:outline-none focus:border-gold/40 w-full sm:w-64"
              />
            ) : (
              <span />
            )}
            <button
              onClick={() => (showForm ? setShowForm(false) : openCreate())}
              className="px-4 py-2 rounded-xl bg-gold text-ink text-sm font-medium hover:bg-goldsoft transition"
            >
              {showForm ? "Bağla" : "+ Yeni məhsul"}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className={cardCls + " mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4"}>
              <div className="sm:col-span-2 text-sm font-medium text-[#F3EFE6]">
                {editingId ? "Məhsulu redaktə et" : "Yeni məhsul"}
              </div>
              <div>
                <label className={labelCls}>Ad (AZ)</label>
                <input
                  className={inputCls}
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className={labelCls}>Kateqoriya</label>
                <select
                  className={inputCls}
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-ink text-[#F3EFE6]">
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Slug (opsional)</label>
                <input
                  className={inputCls}
                  value={form.slug ?? ""}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                />
              </div>
              <div>
                <label className={labelCls}>Şəkil URL</label>
                <input
                  className={inputCls}
                  value={form.imageUrl ?? ""}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Təsvir (AZ)</label>
                <textarea
                  className={inputCls}
                  rows={3}
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div>
                <label className={labelCls}>Qiymət (AZN)</label>
                <input
                  type="number"
                  min={0}
                  className={inputCls}
                  value={form.priceAzn}
                  onChange={(e) => setForm({ ...form, priceAzn: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className={labelCls}>Stok</label>
                <input
                  type="number"
                  min={0}
                  className={inputCls}
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className={labelCls}>Vahid etiketi (məs. "ədəd", "qutu")</label>
                <input
                  className={inputCls}
                  value={form.unitLabel ?? ""}
                  onChange={(e) => setForm({ ...form, unitLabel: e.target.value })}
                />
              </div>
              <div>
                <label className={labelCls}>Sıralama</label>
                <input
                  type="number"
                  className={inputCls}
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                />
              </div>

              <div className="sm:col-span-2 border-t border-white/10 pt-4 text-xs text-[#8b84a8]">
                Tərcümələr (opsional)
              </div>
              <div>
                <label className={labelCls}>Ad (EN)</label>
                <input
                  className={inputCls}
                  value={form.nameEn ?? ""}
                  onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                />
              </div>
              <div>
                <label className={labelCls}>Ad (RU)</label>
                <input
                  className={inputCls}
                  value={form.nameRu ?? ""}
                  onChange={(e) => setForm({ ...form, nameRu: e.target.value })}
                />
              </div>
              <div>
                <label className={labelCls}>Təsvir (EN)</label>
                <textarea
                  className={inputCls}
                  rows={2}
                  value={form.descriptionEn ?? ""}
                  onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })}
                />
              </div>
              <div>
                <label className={labelCls}>Təsvir (RU)</label>
                <textarea
                  className={inputCls}
                  rows={2}
                  value={form.descriptionRu ?? ""}
                  onChange={(e) => setForm({ ...form, descriptionRu: e.target.value })}
                />
              </div>

              <label className="sm:col-span-2 flex items-center gap-2 text-sm text-mist">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                Aktiv (mağazada göstərilsin)
              </label>

              {formError && <div className="sm:col-span-2 text-sm text-red-300">{formError}</div>}
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-gold text-ink text-sm font-medium hover:bg-goldsoft transition disabled:opacity-50"
                >
                  {saving ? "Saxlanılır…" : editingId ? "Yenilə" : "Yarat"}
                </button>
              </div>
            </form>
          )}

          <div className={cardCls + " overflow-x-auto"}>
            {productsLoading ? (
              <div className="text-sm text-mist">Yüklənir…</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-sm text-mist">{pq ? "Bu axtarışa uyğun məhsul tapılmadı." : "Məhsul tapılmadı."}</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[#8b84a8] border-b border-white/10">
                    <th className="py-2 pr-4">Ad</th>
                    <th className="py-2 pr-4">Kateqoriya</th>
                    <th className="py-2 pr-4">Qiymət</th>
                    <th className="py-2 pr-4">Stok</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredProducts.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2.5 pr-4">{p.name}</td>
                      <td className="py-2.5 pr-4 text-[#8b84a8]">{p.category}</td>
                      <td className="py-2.5 pr-4 text-[#8b84a8]">{p.priceAzn} AZN</td>
                      <td className="py-2.5 pr-4 text-[#8b84a8]">{p.stock}</td>
                      <td className="py-2.5 pr-4">
                        <span
                          className={
                            "px-2 py-0.5 rounded-full border text-xs " +
                            (p.isActive
                              ? "border-emerald-400/40 text-emerald-300"
                              : "border-white/15 text-mist")
                          }
                        >
                          {p.isActive ? "Aktiv" : "Deaktiv"}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => openEdit(p)}
                          className="text-xs text-gold/80 hover:text-gold mr-3"
                        >
                          Redaktə
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          disabled={busyId === p.id}
                          className="text-xs text-red-300/80 hover:text-red-300 disabled:opacity-50"
                        >
                          Sil
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {tab === "orders" && (
        <>
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <div className="flex items-center gap-1.5 flex-wrap">
              {["all", ...STATUSES].map((s) => (
                <button
                  key={s}
                  onClick={() => setOrderStatusFilter(s)}
                  className={
                    "px-3 py-1.5 rounded-full text-sm border transition " +
                    (orderStatusFilter === s
                      ? "border-gold/50 text-gold bg-gold/10"
                      : "border-white/15 text-mist hover:border-gold/40")
                  }
                >
                  {s === "all" ? "Hamısı" : STATUS_LABELS[s]}
                </button>
              ))}
            </div>
            <input
              value={orderQuery}
              onChange={(e) => setOrderQuery(e.target.value)}
              placeholder="Müştəri adı və ya telefon…"
              className="px-3.5 py-1.5 rounded-full text-sm bg-white/5 border border-white/10 text-[#F3EFE6] placeholder:text-[#6b6485] focus:outline-none focus:border-gold/40 w-full sm:w-64"
            />
          </div>
          <div className="grid gap-3">
          {ordersLoading ? (
            <div className="text-sm text-mist">Yüklənir…</div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-sm text-mist">
              {oq || orderStatusFilter !== "all" ? "Bu axtarışa/filtrə uyğun sifariş tapılmadı." : "Sifariş tapılmadı."}
            </div>
          ) : (
            filteredOrders.map((o) => (
              <div key={o.id} className={cardCls}>
                <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                  <div>
                    <div className="font-medium text-[#F3EFE6]">{o.fullName}</div>
                    <div className="text-xs text-[#8b84a8]">
                      {o.phone} · {o.address} · {new Date(o.createdAt).toLocaleString("az-AZ")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gold">{o.totalAzn} AZN</span>
                    <select
                      className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-xs"
                      value={o.status}
                      disabled={busyId === o.id}
                      onChange={(e) => handleStatusChange(o, e.target.value)}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s} className="bg-ink text-[#F3EFE6]">
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => setOpenOrderId(openOrderId === o.id ? null : o.id)}
                      className="text-xs text-mist hover:text-[#F3EFE6]"
                    >
                      {openOrderId === o.id ? "Bağla" : "Məhsullar"}
                    </button>
                  </div>
                </div>
                {o.note && <p className="text-sm text-mist mb-2">Qeyd: {o.note}</p>}
                {openOrderId === o.id && (
                  <div className="mt-2 pt-3 border-t border-white/10 space-y-1">
                    {o.items.map((it) => (
                      <div key={it.id} className="text-sm text-mist flex justify-between">
                        <span>
                          {it.productName} × {it.quantity}
                        </span>
                        <span>{it.unitPriceAzn * it.quantity} AZN</span>
                      </div>
                    ))}
                    {o.discountPct > 0 && (
                      <div className="text-xs text-[#8b84a8]">
                        Endirim: {o.discountPct}% (alt cəm {o.subtotalAzn} AZN)
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
          </div>
        </>
      )}
    </AdminLayout>
  );
}
