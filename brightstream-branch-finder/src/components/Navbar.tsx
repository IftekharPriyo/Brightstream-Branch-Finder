export default function Navbar() {
  return (
    <>
      <style>{`@keyframes slideDown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
      <header className="fixed top-0 z-[1000] box-border flex w-full items-center justify-between bg-gradient-to-b from-[rgba(10,22,40,0.95)] to-[rgba(10,22,40,0)] px-[1%] py-6 backdrop-blur-[10px] animate-[slideDown_0.8s_ease-out]">
        <div className="mx-auto flex w-full max-w-[1700px] items-center justify-between gap-4">
          <div className="shrink-0 font-['Playfair_Display',serif] font-[600] text-[2rem] font-bold tracking-[-0.5px] text-[var(--warm-white,#ffffff)] no-underline">
            Brightstream
          </div>

          <nav className="flex flex-wrap items-center justify-end gap-12">
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

            <button className="ml-0 cursor-pointer whitespace-nowrap rounded-lg border-none bg-[#D4AF37] px-4 py-2.5 font-semibold text-[#111827]">
              Get Started
            </button>
          </nav>
        </div>
      </header>
    </>
  );
}
