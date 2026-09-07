import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { Header } from '../components/Header';
import { MARKET_TIERS } from '../data/mockData';

const MIN = 2000;
const MAX = 8000;
const MARKET_DEFAULT = 4900;
const DEFAULT_MANDAYS = 7;

const nis = (n: number) => '₪' + n.toLocaleString('en-US');
const pctOf = (n: number) => ((n - MIN) / (MAX - MIN)) * 100;

interface MarketViewProps {
  onOpenMobileMenu?: () => void;
}

export const MarketView: React.FC<MarketViewProps> = ({ onOpenMobileMenu }) => {
  const [rate, setRate] = useState<number>(4500);
  const [saved, setSaved] = useState<boolean>(false);

  const currentTier =
    MARKET_TIERS.find((t) => rate >= t.lo && rate <= t.hi) ||
    (rate > MARKET_TIERS[3].hi
      ? MARKET_TIERS[3]
      : rate < MARKET_TIERS[0].lo
      ? MARKET_TIERS[0]
      : null);

  const delta = rate - MARKET_DEFAULT;

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const handleReset = () => {
    setRate(MARKET_DEFAULT);
    setSaved(false);
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
      {/* Pinned Top Header */}
      <div className="flex-none px-4 sm:px-6 md:px-8 py-3.5 sm:py-4 bg-[#080d1c]/90 backdrop-blur-xl border-b border-[#7dd3fc]/15 z-20">
        <Header
          title="ניהול מדדי שוק ותעריפים"
          subtitle="Manday · עודכן לאחרונה ב-12/05/2024"
          onOpenMobileMenu={onOpenMobileMenu}
        />
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 min-w-0 flex flex-col p-4 sm:p-6 md:p-8 overflow-y-auto">
        <div className="flex flex-1 flex-col lg:flex-row items-stretch gap-4 mt-2 sm:mt-3">
        {/* Left Card: Market Benchmarks */}
        <section className="flex-1 lg:flex-[1.1] min-w-0 w-full flex flex-col p-4 sm:p-6 rounded-3xl border border-[#7dd3fc]/15 bg-gradient-to-br from-[#101a30]/80 to-[#090f1e]/90 shadow-[0_28px_60px_-34px_rgba(2,8,23,0.95)]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold tracking-tight text-[#f2f8ff]">
              מדדי שוק מקובלים בישראל
            </h2>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#38bdf8]/15 text-[#7dd3fc] border border-[#38bdf8]/30">
              Manday
            </span>
          </div>
          <p className="mt-2 mb-5 text-sm text-[#cbe1ff]/55">
            נתונים מבוססים על סקר תעריפי ייעוץ סייבר עצמאי, מאי 2024.
          </p>

          <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto">
            {MARKET_TIERS.map((tier) => {
              const isCurrent = currentTier?.name === tier.name;
              return (
                <div
                  key={tier.name}
                  className={`p-4 rounded-2xl border transition-all duration-200 ${
                    isCurrent
                      ? 'border-[#22d3ee]/40 bg-[#22d3ee]/[0.09] shadow-[0_0_24px_-10px_rgba(34,211,238,0.35)]'
                      : 'border-[#7dd3fc]/12 bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base font-bold text-[#eaf4ff]">
                        {tier.name}
                      </span>
                      <span className="text-xs text-[#cbe1ff]/50">
                        {tier.years}
                      </span>
                      {isCurrent && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#22d3ee]/20 text-[#67e8f9]">
                          התעריף שלך
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-2.5">
                      <span className="text-lg font-extrabold text-[#f6fbff] font-mono">
                        {nis(tier.avg)}
                      </span>
                      <span className="text-xs text-[#cbe1ff]/55 font-mono">
                        {tier.rangeText}
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Range Bar */}
                  <div
                    dir="ltr"
                    className="relative h-2 mt-3 rounded-full bg-[#7dd3fc]/10 overflow-hidden"
                  >
                    <span
                      className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-[#2563eb] to-[#22d3ee]"
                      style={{
                        left: `${pctOf(tier.lo)}%`,
                        width: `${pctOf(tier.hi) - pctOf(tier.lo)}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2.5 mt-5 pt-4 border-t border-[#7dd3fc]/12">
            <button
              type="button"
              onClick={handleReset}
              className="h-10 px-4.5 rounded-full text-sm font-semibold text-[#d6e6f7] border border-slate-400/35 bg-slate-400/15 hover:bg-slate-400/25 transition-all"
            >
              איפוס להמלצת שוק
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="h-10 px-5.5 rounded-full text-sm font-bold text-[#04121f] bg-gradient-to-r from-[#2563eb] via-[#0ea5e9] to-[#22d3ee] shadow-[0_12px_30px_-14px_rgba(34,211,238,0.75)] hover:brightness-105 transition-all"
            >
              {saved ? '✓ נשמר' : 'שמור שינויים'}
            </button>
          </div>
        </section>

        {/* Right Column: Custom Rate & Impact */}
        <section className="flex-1 min-w-0 w-full flex flex-col gap-4">
          {/* Daily Rate Slider Box */}
          <div className="p-4 sm:p-6 rounded-3xl border border-[#22d3ee]/30 bg-gradient-to-br from-[#172a48]/90 to-[#0a1224]/90 shadow-[0_28px_60px_-34px_rgba(2,8,23,0.95),0_0_46px_-24px_rgba(34,211,238,0.5)]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold tracking-tight text-[#f2f8ff]">
                התעריף היומי שלך
              </h2>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#22d3ee]/15 text-[#67e8f9] border border-[#22d3ee]/35">
                {currentTier ? currentTier.name : 'מותאם אישית'}
              </span>
            </div>

            <div className="mt-4 p-5 rounded-2xl border border-[#7dd3fc]/20 bg-[#060c1a]/60 text-center">
              <div className="text-4xl font-black text-[#f6fbff] font-mono tracking-tight drop-shadow-[0_0_26px_rgba(34,211,238,0.45)]">
                {nis(rate)}
              </div>
              <div className="mt-1.5 text-xs text-[#cbe1ff]/60">
                ליום עבודה (Manday)
              </div>
            </div>

            {/* Slider */}
            <div
              dir="ltr"
              className="relative mt-5 h-9 flex items-center select-none"
            >
              <span className="absolute inset-x-0 h-2 rounded-full bg-[#7dd3fc]/15" />
              <span
                className="absolute left-0 h-2 rounded-full bg-gradient-to-r from-[#2563eb] to-[#22d3ee] shadow-[0_0_16px_-4px_rgba(34,211,238,0.8)]"
                style={{ width: `${pctOf(rate)}%` }}
              />
              <span
                className="absolute w-5.5 h-5.5 -ml-2.5 rounded-full bg-[#eaf9ff] border-[3px] border-[#22d3ee] shadow-[0_0_16px_#22d3ee] pointer-events-none"
                style={{ left: `${pctOf(rate)}%` }}
              />
              <input
                type="range"
                min={MIN}
                max={MAX}
                step={100}
                value={rate}
                onChange={(e) => {
                  setRate(Number(e.target.value));
                  setSaved(false);
                }}
                className="absolute inset-x-0 w-full h-9 m-0 opacity-0 cursor-pointer"
              />
            </div>

            <div
              dir="ltr"
              className="flex justify-between mt-1 text-xs font-semibold text-[#cbe1ff]/55"
            >
              <span>Junior</span>
              <span>Expert</span>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-[#cbe1ff]/65">
              זהו התעריף המשמש בסיס לחישוב כל הצעות המחיר שלך. ניתן לעדכן אותו בכל עת — השינוי לא ישפיע על הצעות שנשלחו.
            </p>
          </div>

          {/* Impact Card */}
          <div className="p-5 md:p-6 rounded-3xl border border-[#7dd3fc]/15 bg-gradient-to-br from-[#101a30]/80 to-[#090f1e]/90 shadow-[0_24px_54px_-34px_rgba(2,8,23,0.95)]">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-emerald-400/15 flex items-center justify-center text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </span>
              <span className="text-base font-bold text-[#eaf4ff]">
                השפעה על הצעת מחיר ממוצעת
              </span>
            </div>
            <div className="mt-3.5 flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl font-black text-[#f6fbff] font-mono">
                {nis(rate * DEFAULT_MANDAYS)}
              </span>
              <span className="text-xs text-[#cbe1ff]/60">
                7 ימי עבודה · הערכה
              </span>
            </div>
            <div
              className={`mt-2.5 text-xs font-semibold ${
                delta > 0
                  ? 'text-emerald-400'
                  : delta < 0
                  ? 'text-amber-400'
                  : 'text-[#cbe1ff]/60'
              }`}
            >
              {delta === 0
                ? 'זהה לממוצע השוק לדרג Senior'
                : delta > 0
                ? `${nis(delta)} מעל ממוצע השוק (Senior)`
                : `${nis(Math.abs(delta))} מתחת לממוצע השוק (Senior)`}
            </div>
          </div>
        </section>
      </div>
      </div>
    </div>
  );
};
