import { cn } from "@/lib/utils";

export function FloatingWhatsAppButton() {
  return (
    <a
      href="https://wa.me/923332170624"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contact Admin on WhatsApp"
      className={cn(
        "fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-full px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_-10px_rgba(37,211,102,0.5)]",
        "transition-all duration-200 ease-out hover:scale-105 hover:shadow-[0_14px_32px_-10px_rgba(37,211,102,0.6)]",
        "active:scale-95 active:shadow-[0_8px_20px_-10px_rgba(37,211,102,0.5)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#25D366]",
      )}
      style={{ backgroundColor: "#25D366" }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="size-5"
        aria-hidden="true"
      >
        <path d="M17.6 6.32A7.85 7.85 0 0 0 12 4a7.94 7.94 0 0 0-7.94 7.94c0 1.4.37 2.77 1.06 3.98L4 20l4.2-1.1a7.93 7.93 0 0 0 3.8.97h.01A7.94 7.94 0 0 0 20 11.94a7.85 7.85 0 0 0-2.4-5.62ZM12 18.12h-.01a6.6 6.6 0 0 1-3.37-.92l-.24-.14-2.47.65.66-2.4-.16-.25a6.6 6.6 0 0 1 6.5-10.01c3.5 0 6.35 2.85 6.4 6.35a6.47 6.47 0 0 1-6.31 6.84Zm3.58-4.92c-.2-.1-1.17-.58-1.35-.64-.18-.06-.32-.1-.45.1-.13.2-.5.64-.62.77-.1.14-.22.16-.4.06a5.08 5.08 0 0 1-1.49-.92 5.61 5.61 0 0 1-1.04-1.29c-.1-.18 0-.27.08-.36.08-.08.18-.22.27-.33.1-.1.13-.18.2-.3.06-.13.03-.24-.02-.33-.05-.1-.45-1.08-.62-1.48-.16-.38-.32-.33-.45-.34l-.38-.01a.74.74 0 0 0-.53.25c-.18.2-.7.68-.7 1.66 0 .97.71 1.91.81 2.04.1.13 1.4 2.13 3.39 2.99.47.2.84.32 1.13.41.47.15.9.13 1.24.08.38-.06 1.17-.48 1.33-.94.17-.46.17-.85.12-.93-.05-.08-.18-.13-.38-.22Z" />
      </svg>
      Contact Admin
    </a>
  );
}
