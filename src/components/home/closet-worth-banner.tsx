import Image from "next/image";
import Link from "next/link";

interface StepItem {
  number: number;
  title: string;
  description: string;
}

const STEPS: StepItem[] = [
  {
    number: 1,
    title: "Snap a photo",
    description: "Three photos and a few details is all a listing needs.",
  },
  {
    number: 2,
    title: "We price & authenticate",
    description: "Our specialists verify the item and suggest a market price.",
  },
  {
    number: 3,
    title: "Ship free, get paid",
    description: "Free pickup in Dubai, payout to your account in three days.",
  },
];

const IPHONE_FRAME = "/images/mockup_apple_iphone_17_pro_max_2025_7fb15b841f (2) 1.png";
const PERSON_IMAGE = "/images/ChatGPT Image Sep 2, 2026, 03_02_47 AM 1.png";

export function ClosetWorthBanner() {
  return (
    <section className="relative w-full overflow-hidden rounded-[20px] sm:rounded-[24px] md:rounded-[32px] bg-[#dfd7c9] text-[#1c1c1c]">
      <div className="relative flex flex-col lg:flex-row items-stretch lg:items-end justify-between min-h-[460px] lg:min-h-[540px]">
        {/* Left column: Text & steps */}
        <div className="flex flex-col justify-center px-6 pt-8 pb-6 sm:px-10 sm:pt-12 sm:pb-8 md:px-14 md:pt-14 md:pb-10 lg:py-14 lg:pl-14 lg:pr-4 lg:max-w-[560px] xl:max-w-[600px] z-20 shrink-0">
          {/* Badge */}
          <div>
            <span className="inline-block rounded-[5px] bg-[#786e58] px-3 py-1.5 text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.14em] text-[#faf7f2]">
              Payout in 3 days
            </span>
          </div>

          {/* Headline */}
          <h2 className="mt-4 sm:mt-5 text-[26px] leading-[1.14] sm:text-[34px] md:text-[40px] lg:text-[46px] font-medium tracking-tight text-[#234329]">
            Your closet is worth more
            <br />
            than you think.
          </h2>

          {/* 3 Steps */}
          <div className="mt-6 sm:mt-8 flex flex-col gap-4 sm:gap-6">
            {STEPS.map((step) => (
              <div key={step.number} className="flex items-start gap-3.5 sm:gap-4">
                <div className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full border border-[#9c917d] text-[11px] sm:text-xs font-normal text-[#59503f]">
                  {step.number}
                </div>
                <div className="flex flex-col">
                  <h3 className="text-sm sm:text-[15px] font-semibold text-[#234329] leading-snug">
                    {step.title}
                  </h3>
                  <p className="mt-0.5 text-xs sm:text-[13px] text-[#6d6554] leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div className="mt-7 sm:mt-9">
            <Link
              href="/sell"
              className="inline-flex items-center justify-center rounded-[8px] bg-[#234329] px-6 py-3 sm:px-7 sm:py-3.5 text-sm sm:text-[15px] font-semibold text-white shadow-[0_4px_14px_rgba(35,67,41,0.22)] transition-all duration-200 hover:bg-[#1a3420] active:scale-[0.98]"
            >
              Start a listing
            </Link>
          </div>
        </div>

        {/* Right column: The phone frame & person composition */}
        <div className="relative flex-1 flex items-end justify-center lg:justify-end self-stretch lg:self-end h-[380px] sm:h-[460px] md:h-[500px] lg:h-[570px] pr-0 lg:pr-6 xl:pr-10 pointer-events-none select-none overflow-hidden">
          {/* Phone + Person wrapper anchored flush to bottom edge */}
          <div className="relative w-[320px] sm:w-[390px] md:w-[440px] lg:w-[490px] xl:w-[520px] h-[380px] sm:h-[460px] md:h-[500px] lg:h-[570px] translate-y-[14px]">
            {/* Person image sitting behind/across phone */}
            <div className="absolute -left-[27%] sm:-left-[28%] -right-[3%] -bottom-[1%] top-[3%] z-10">
              <Image
                src={PERSON_IMAGE}
                alt="Listing preview"
                fill
                priority
                sizes="(max-width: 768px) 420px, 700px"
                className="object-contain object-bottom"
              />
            </div>

            {/* iPhone 17 Pro Max Frame on top of person */}
            <div className="relative z-20 h-full w-full">
              <Image
                src={IPHONE_FRAME}
                alt="iPhone frame"
                fill
                priority
                sizes="(max-width: 768px) 420px, 700px"
                className="object-contain object-top drop-shadow-[-16px_18px_36px_rgba(0,0,0,0.16)]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
