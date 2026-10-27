import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { natalChartApi, ApiError, type NatalChartResponse } from "../lib/api";
import { signLabel } from "../lib/signs";
import { formatDegree, computeAspects, BODY_SYMBOLS, SIGN_SYMBOLS, type WheelChart } from "../lib/natal-wheel";
import { Page, PageHeader } from "../components/Page";
import { NatalWheel } from "../components/NatalWheel";
import { useI18n } from "../lib/i18n";

// destiny-reads-app-ın routes/_authenticated/xerite.tsx-indəki dizayn: SVG
// natal təkəri + lg:grid-cols-12 iki sütunlu tərtibat (təkər+xülasə solda,
// planetlər/evlər/aspektlər siyahıları sağda), şəkil/PDF ixrac düymələri.

async function downloadSvgAsPng(svgEl: SVGSVGElement, fileName: string) {
  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  const size = 880;
  clone.setAttribute("width", String(size));
  clone.setAttribute("height", String(size));
  if (!clone.getAttribute("xmlns")) clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  const svgString = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  await new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("canvas context");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        URL.revokeObjectURL(url);
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error("toBlob"));
            return;
          }
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          link.remove();
          URL.revokeObjectURL(link.href);
          resolve();
        }, "image/png");
      } catch (err) {
        reject(err instanceof Error ? err : new Error("render"));
      }
    };
    img.onerror = () => reject(new Error("image load"));
    img.src = url;
  });
}

export default function NatalChartPage() {
  const { t, lang } = useI18n();
  const [chart, setChart] = useState<NatalChartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [missingBirthData, setMissingBirthData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState(false);
  const chartWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    natalChartApi
      .getMe()
      .then(setChart)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setMissingBirthData(true);
        } else {
          setError(err instanceof ApiError ? err.message : t("natalChart.errLoad"));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const aspects = chart ? computeAspects(chart as unknown as WheelChart) : [];

  function handleDownloadImage() {
    const svgEl = chartWrapperRef.current?.querySelector("svg");
    if (!svgEl) return;
    setDownloadError(false);
    downloadSvgAsPng(svgEl, `natal-xerite-${chart?.sun ?? "chart"}.png`).catch(() => setDownloadError(true));
  }

  return (
    <Page>
      <PageHeader
        kicker={t("natalChart.kicker")}
        title={t("natalChart.title")}
        subtitle={t("natalChart.subtitle")}
      />

      {loading && <p className="text-mist">{t("common.loading")}</p>}

      {!loading && missingBirthData && (
        <div className="rounded-2xl border border-white/10 bg-celestial-card/60 p-8 text-center">
          <p className="text-mist">
            {t("natalChart.missingBirthData")}
          </p>
          <Link
            to="/profil"
            className="inline-block mt-4 px-5 py-2.5 rounded-full bg-gold text-ink font-semibold text-sm hover:bg-goldsoft transition"
          >
            {t("natalChart.goToProfile")}
          </Link>
        </div>
      )}

      {!loading && error && (
        <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</p>
      )}

      {chart && (
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-2xl bg-celestial-card/60 border border-white/5 p-6">
            <div ref={chartWrapperRef} className="aspect-square max-w-sm mx-auto">
              <NatalWheel chart={chart as unknown as WheelChart} />
            </div>
            <div className="text-center mt-4">
              <div className="font-display text-2xl">{signLabel(chart.sun, lang).split(" ").slice(1).join(" ")}</div>
              <div className="text-gold text-xs tracking-widest uppercase mt-1">{t("natalChart.sunSign")}</div>
              <div className="text-mist text-xs mt-2">
                {t("natalChart.ascendant")} · {signLabel(chart.ascendant.sign, lang).split(" ").slice(1).join(" ")}{" "}
                {formatDegree(chart.ascendant.degree, chart.ascendant.minute)}
                &nbsp;·&nbsp; {t("natalChart.midheaven")} · {signLabel(chart.midheaven.sign, lang).split(" ").slice(1).join(" ")}{" "}
                {formatDegree(chart.midheaven.degree, chart.midheaven.minute)}
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDownloadImage}
                className="flex items-center justify-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-full border border-gold/40 text-goldsoft hover:bg-gold/10 transition"
              >
                {t("natalChart.downloadImage")}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center justify-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-full border border-white/10 text-mist hover:text-white transition"
              >
                {t("natalChart.downloadPdf")}
              </button>
            </div>
            {downloadError && <p className="text-xs text-red-300 text-center mt-2">{t("natalChart.downloadError")}</p>}
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-2xl bg-celestial-card/60 border border-white/5 p-6">
              <h2 className="font-display text-2xl mb-4">{t("natalChart.planets")}</h2>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                {chart.planets.map((p) => (
                  <div key={p.name} className="flex items-center justify-between border-b border-white/5 py-1.5">
                    <span className="text-mist">
                      {BODY_SYMBOLS[p.name] ?? "•"} {p.name}
                    </span>
                    <span>
                      {SIGN_SYMBOLS[p.sign] ?? ""} {signLabel(p.sign, lang).split(" ").slice(1).join(" ")} {formatDegree(p.degree, p.minute)}
                      {p.house ? <span className="text-mist"> · {t("natalChart.housePrefix")} {p.house}</span> : null}
                      {p.retrograde ? <span className="text-violet"> ℞</span> : null}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-celestial-card/60 border border-white/5 p-6">
              <h2 className="font-display text-2xl mb-4">{t("natalChart.houses")}</h2>
              <div className="grid sm:grid-cols-3 gap-3 text-sm">
                {chart.houses.map((h) => (
                  <div key={h.index} className="rounded-xl bg-white/5 px-3 py-2">
                    <div className="text-mist text-xs">{t("natalChart.housePrefix")} {h.index}</div>
                    <div>
                      {SIGN_SYMBOLS[h.sign] ?? ""} {signLabel(h.sign, lang).split(" ").slice(1).join(" ")} {formatDegree(h.degree, h.minute)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-celestial-card/60 border border-white/5 p-6">
              <h2 className="font-display text-2xl mb-4">{t("natalChart.aspects")}</h2>
              {aspects.length === 0 && <p className="text-mist text-sm">{t("natalChart.noAspects")}</p>}
              <div className="grid gap-1.5">
                {aspects.map((hit, i) => (
                  <div key={`${hit.a}-${hit.b}-${i}`} className="flex items-center justify-between text-sm rounded-lg px-3 py-2 bg-white/5">
                    <span className="flex items-center gap-2">
                      <span className="text-goldsoft">{BODY_SYMBOLS[hit.a] ?? hit.a}</span>
                      <span style={{ color: hit.aspect.color }}>{hit.aspect.symbol}</span>
                      <span className="text-violet">{BODY_SYMBOLS[hit.b] ?? hit.b}</span>
                      <span className="text-mist text-xs ml-1">
                        {hit.a} {hit.aspect.nameAz.toLowerCase()} {hit.b}
                      </span>
                    </span>
                    <span className="text-mist text-xs">{t("natalChart.orbLabel")} {hit.orb}°</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {chart && (
        <div id="chart-print-area" className="hidden print:block p-8 text-black bg-white">
          <h1 className="text-2xl font-bold mb-1">{t("natalChart.title")}</h1>
          <p className="text-sm text-gray-600 mb-6">{t("natalChart.printSubtitle")}</p>
          <div className="flex gap-6 items-start mb-6">
            <div className="w-64 shrink-0">
              <NatalWheel chart={chart as unknown as WheelChart} />
            </div>
            <div className="text-sm">
              <div className="text-lg font-semibold">{chart.sun}</div>
              <div className="text-xs uppercase tracking-widest text-gray-500">{t("natalChart.sunSign")}</div>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}
