// DÜZƏLİŞ (2026-10-27): native <input type="time"> bəzi brauzer/OS
// kombinasiyalarında (xüsusən en-US lokalı) saatı AM/PM formatında göstərir —
// bu, HTML/CSS ilə etibarlı şəkildə idarə oluna bilmir (brauzerin öz OS lokalına
// əsaslanır, səhifənin `lang` atributuna həmişə tabe olmur). Ona görə Sinastriya
// və Profil səhifələrindəki doğum vaxtı sahələri bu komponentlə əvəz olunub —
// iki sadə <select> (saat/dəqiqə), HƏMİŞƏ 24 saatlıq format, `value`/`onChange`
// müqaviləsi əvvəlki "HH:MM" sətri ilə eynidir ki, çağıran kod dəyişməsin.
import { useId } from "react";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

interface TimeSelect24Props {
  value: string; // "HH:MM" və ya ""
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function TimeSelect24({ value, onChange, className, disabled }: TimeSelect24Props) {
  const uid = useId();
  const [h, m] = value ? value.split(":") : ["", ""];

  function update(nextH: string, nextM: string) {
    if (!nextH && !nextM) {
      onChange("");
      return;
    }
    onChange(`${nextH || "00"}:${nextM || "00"}`);
  }

  const selectCls =
    "bg-transparent text-sm focus:outline-none appearance-none cursor-pointer disabled:cursor-not-allowed [&>option]:bg-ink";

  return (
    <div
      className={
        "flex items-center gap-1 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus-within:border-gold/50 transition " +
        (className ?? "")
      }
    >
      <select
        aria-label="Saat"
        id={`${uid}-h`}
        className={selectCls}
        value={h}
        disabled={disabled}
        onChange={(e) => update(e.target.value, m)}
      >
        <option value="" className="bg-ink text-[#F3EFE6]">
          --
        </option>
        {HOURS.map((hh) => (
          <option key={hh} value={hh} className="bg-ink text-[#F3EFE6]">
            {hh}
          </option>
        ))}
      </select>
      <span className="text-mist">:</span>
      <select
        aria-label="Dəqiqə"
        id={`${uid}-m`}
        className={selectCls}
        value={m}
        disabled={disabled}
        onChange={(e) => update(h, e.target.value)}
      >
        <option value="" className="bg-ink text-[#F3EFE6]">
          --
        </option>
        {MINUTES.map((mm) => (
          <option key={mm} value={mm} className="bg-ink text-[#F3EFE6]">
            {mm}
          </option>
        ))}
      </select>
    </div>
  );
}
