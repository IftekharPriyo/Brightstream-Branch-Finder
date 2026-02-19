export default function Navbar() {
  return (
    <>
      <style>{`@keyframes slideDown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
      <header className="fixed top-0 z-[1000] box-border flex w-full items-center justify-between bg-gradient-to-b from-[rgba(10,22,40,0.95)] to-[rgba(10,22,40,0)] px-4 py-4 backdrop-blur-[10px] animate-[slideDown_0.8s_ease-out] sm:px-6 sm:py-5">
        <div className="mx-auto flex w-full max-w-[1700px] flex-wrap items-center justify-between gap-3 sm:gap-4">
          <div className="shrink-0 font-['Playfair_Display',serif] text-[1.4rem] font-bold tracking-[-0.5px] text-[var(--warm-white,#ffffff)] no-underline sm:text-[1.8rem] md:text-[2rem]">
            Brightstream
          </div>

          <nav className="flex w-full flex-wrap items-center justify-start gap-x-5 gap-y-2 sm:w-auto sm:justify-end sm:gap-8 md:gap-10">
            <a
              className="whitespace-nowrap font-['Jost',sans-serif] text-[0.90rem] font-[400] tracking-[0.5px] text-[#f8f6f1] no-underline"
              href="#"
            >
              Personal
            </a>
            <a
              className="whitespace-nowrap font-['Jost',sans-serif] text-[0.90rem] font-[400] tracking-[0.5px] text-[#f8f6f1] no-underline"
              href="#"
            >
              Business
            </a>
            <a
              className="whitespace-nowrap font-['Jost',sans-serif] text-[0.90rem] font-[400] tracking-[0.5px] text-[#f8f6f1] no-underline"
              href="#"
            >
              Wealth
            </a>
            <a
              className="whitespace-nowrap font-['Jost',sans-serif] text-[0.90rem] font-[400] tracking-[0.5px] text-[#f8f6f1] no-underline"
              href="#"
            >
              About
            </a>
            <a
              className="whitespace-nowrap font-['Jost',sans-serif] text-[0.95rem] font-[400] tracking-[0.5px] text-[#f8f6f1] no-underline"
              href="#"
            >
              Articles
            </a>

            <button className="ml-0 cursor-pointer whitespace-nowrap rounded-lg border-none bg-[#D4AF37] px-3 py-2 text-sm font-semibold text-[#111827] sm:px-4 sm:py-2.5 sm:text-base">
              Get Started
            </button>
          </nav>
        </div>
      </header>
    </>
  );
}
