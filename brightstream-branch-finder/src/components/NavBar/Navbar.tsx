import { useState } from "react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="site-nav">
        <div className="mx-auto flex w-full max-w-[1700px] flex-wrap items-center justify-between gap-3 sm:gap-4">
          <div className="ease-up shrink-0 font-['Playfair_Display',serif] text-[1.4rem] font-bold tracking-[-0.5px] text-[var(--warm-white,#ffffff)] no-underline sm:text-[1.8rem] md:text-[2rem]">
            Brightstream
          </div>

          <button
            aria-controls="mobile-menu"
            aria-expanded={isOpen}
            aria-label="Toggle navigation menu"
            className="ease-up flex h-10 w-10 items-center justify-center rounded-md border border-[#f8f6f1]/40 text-[#f8f6f1] md:hidden"
            onClick={() => setIsOpen((prev) => !prev)}
            type="button"
          >
            <span className="relative block h-4 w-5">
              <span
                className={`absolute left-0 top-0 h-[2px] w-5 bg-current transition-transform duration-300 ${
                  isOpen ? "translate-y-[7px] rotate-45" : ""
                }`}
              />
              <span
                className={`absolute left-0 top-[7px] h-[2px] w-5 bg-current transition-opacity duration-300 ${
                  isOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute left-0 top-[14px] h-[2px] w-5 bg-current transition-transform duration-300 ${
                  isOpen ? "-translate-y-[7px] -rotate-45" : ""
                }`}
              />
            </span>
          </button>

          <div className="hidden flex-wrap items-center justify-end gap-10 md:flex md:gap-12">
            <a
              className="ease-up whitespace-nowrap font-['Jost',sans-serif] text-[0.95rem] font-[300] tracking-[0.5px] text-[#f8f6f1] no-underline"
              href="#"
            >
              Personal
            </a>
            <a
              className="ease-up whitespace-nowrap font-['Jost',sans-serif] text-[0.95rem] font-[300] tracking-[0.5px] text-[#f8f6f1] no-underline"
              href="#"
            >
              Business
            </a>
            <a
              className="ease-up whitespace-nowrap font-['Jost',sans-serif] text-[0.95rem] font-[300] tracking-[0.5px] text-[#f8f6f1] no-underline"
              href="#"
            >
              Wealth
            </a>
            <a
              className="ease-up whitespace-nowrap font-['Jost',sans-serif] text-[0.95rem] font-[300] tracking-[0.5px] text-[#f8f6f1] no-underline"
              href="#"
            >
              About
            </a>
            <a
              className="ease-up whitespace-nowrap font-['Jost',sans-serif] text-[0.95rem] font-[300] tracking-[0.5px] text-[#f8f6f1] no-underline"
              href="#"
            >
              Articles
            </a>

            <button className="ease-up ml-0 inline-flex h-11 min-w-[136px] cursor-pointer items-center justify-center whitespace-nowrap rounded-full border-none bg-[var(--gold)] px-8 text-[1.05rem] font-normal leading-none text-[var(--warm-white)] transition-[background-color,color,box-shadow] duration-300 ease-out hover:bg-[var(--warm-white)] hover:text-[var(--slate)] hover:shadow-[0_10px_18px_-8px_rgba(212,175,55,0.35)]">
              Get Started
            </button>
          </div>

          <div
            className={`${
              isOpen ? "flex" : "hidden"
            } flex-col items-start gap-2 rounded-md bg-[rgba(10,22,40,0.92)] md:hidden`}
            id="mobile-menu"
            style={{
              width: "calc(100% - 12px)",
              marginTop: "0.5rem",
              marginInline: "auto",
              paddingTop: "1rem",
              paddingRight: "1.25rem",
              paddingBottom: "1.5rem",
              paddingLeft: "1.5rem",
            }}
          >
            <a
              className="ease-up block w-full rounded-md px-2 py-1.5 whitespace-nowrap font-['Jost',sans-serif] text-[0.95rem] font-[300] tracking-[0.5px] text-[#f8f6f1] no-underline"
              href="#"
              onClick={() => setIsOpen(false)}
            >
              Personal
            </a>
            <a
              className="ease-up block w-full rounded-md px-2 py-1.5 whitespace-nowrap font-['Jost',sans-serif] text-[0.95rem] font-[300] tracking-[0.5px] text-[#f8f6f1] no-underline"
              href="#"
              onClick={() => setIsOpen(false)}
            >
              Business
            </a>
            <a
              className="ease-up block w-full rounded-md px-2 py-1.5 whitespace-nowrap font-['Jost',sans-serif] text-[0.95rem] font-[300] tracking-[0.5px] text-[#f8f6f1] no-underline"
              href="#"
              onClick={() => setIsOpen(false)}
            >
              Wealth
            </a>
            <a
              className="ease-up block w-full rounded-md px-2 py-1.5 whitespace-nowrap font-['Jost',sans-serif] text-[0.95rem] font-[300] tracking-[0.5px] text-[#f8f6f1] no-underline"
              href="#"
              onClick={() => setIsOpen(false)}
            >
              About
            </a>
            <a
              className="ease-up block w-full rounded-md px-2 py-1.5 whitespace-nowrap font-['Jost',sans-serif] text-[0.95rem] font-[300] tracking-[0.5px] text-[#f8f6f1] no-underline"
              href="#"
              onClick={() => setIsOpen(false)}
            >
              Articles
            </a>
            <button className="ease-up mt-3 inline-flex h-11 min-w-[136px] cursor-pointer items-center justify-center whitespace-nowrap rounded-full border-none bg-[var(--gold)] px-8 text-[1.05rem] font-normal leading-none text-[var(--warm-white)] transition-[background-color,color,box-shadow] duration-300 ease-out hover:bg-[var(--warm-white)] hover:text-[var(--slate)] hover:shadow-[0_10px_18px_-8px_rgba(212,175,55,0.35)]">
              Get Started
            </button>
          </div>
        </div>
      </nav>
  );
}
