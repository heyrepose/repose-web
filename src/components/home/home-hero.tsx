import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** Full-viewport hero — two stacked banners. */
export function HomeHero() {
  return (
    <div className="relative left-1/2 -ml-[50vw] w-screen -mt-4 flex h-[calc(100dvh-var(--app-header-height,112px)-5.5rem)] md:h-[calc(100dvh-var(--app-header-height,112px))] flex-col overflow-hidden">
      {/* ── Banner 1: Buy ─────────────────────────────────────────── */}
      <section className="relative min-h-0 flex-[350] overflow-hidden">
        <Image
          src="/images/Hero-green-banner.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_30%]"
        />

        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto flex w-full max-w-[1440px] px-6 md:px-12 lg:px-16">
            <div className="max-w-[18rem] sm:max-w-[22rem] md:max-w-[26rem] animate-fade-in">
              <h1 className="text-[1.5rem] leading-[1.12] sm:text-[1.85rem] md:text-[2.35rem] lg:text-[2.65rem] font-bold text-white tracking-tight">
                Buy &amp; sell curated pre-loved fashion.
              </h1>

              <Link
                href="/search"
                className="mt-4 md:mt-5 inline-flex items-center justify-center rounded-[6px] bg-white px-5 py-2.5 text-[13px] md:text-sm font-semibold text-text transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Enter the vault
              </Link>

              <div className="mt-4 md:mt-5 flex items-center gap-1.5" aria-hidden>
                <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
                <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
                <span className="h-1.5 w-5 rounded-full bg-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Banner 2: Sell ────────────────────────────────────────── */}
      <section className="relative min-h-0 flex-[381] overflow-hidden bg-[#efe4d7]">
        <Image
          src="/images/hero-banner-2-brown.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_40%]"
        />

        <div className="absolute inset-0">
          <div className="relative mx-auto h-full w-full max-w-[1440px] px-4 sm:px-6 md:px-12 lg:px-16">
            <div className="absolute left-[30%] sm:left-[31%] md:left-[31.5%] right-0 bottom-0 top-[46%] sm:top-[48%] md:top-[50%] z-10 rounded-tl-[8px] bg-[#354d31] px-5 py-5 sm:px-7 sm:py-6 md:px-8 md:py-6 flex items-center shadow-[0_-4px_20px_rgba(0,0,0,0.12)] animate-fade-in">
              <div className="max-w-[17rem] sm:max-w-[20rem] md:max-w-[23rem]">
                <p className="text-[15px] sm:text-base md:text-[1.2rem] font-medium leading-snug text-white tracking-tight">
                  Turn your pre-loved pieces into cash with Repose.
                </p>
                <Link
                  href="/sell"
                  className="mt-3 sm:mt-4 inline-flex items-center gap-2 rounded-[5px] border border-white/80 px-4 py-1.5 text-[13px] sm:text-sm font-medium text-white transition-colors hover:bg-white/10"
                >
                  Start selling
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} />
                </Link>
              </div>
            </div>

            <div className="pointer-events-none absolute right-[14%] sm:right-[18%] md:right-[21%] lg:right-[23%] -bottom-[8%] sm:-bottom-[6%] md:-bottom-[4%] z-20 h-[76%] sm:h-[82%] md:h-[88%] aspect-[987/1479] animate-scale-in drop-shadow-[0_16px_40px_rgba(0,0,0,0.4)]">
              <div className="absolute inset-[9.9%_10%_10.1%_10%] overflow-hidden rounded-[18px] sm:rounded-[24px] md:rounded-[30px] bg-[#1a1a1a]">
                <Image
                  src="/images/hero-phone-screen.png"
                  alt="Sell on Repose"
                  fill
                  priority
                  sizes="(max-width: 768px) 36vw, 240px"
                  className="object-cover object-[center_32%]"
                />
              </div>

              <Image
                src="/images/phone-mockup.png"
                alt="Phone Frame"
                fill
                priority
                sizes="(max-width: 768px) 40vw, 260px"
                className="relative z-10 object-contain"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
