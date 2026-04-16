import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";

const FALLBACK_NUMBER = "8801347195345";
const FALLBACK_MESSAGE = "হ্যালো! আমি একটি প্রোডাক্ট সম্পর্কে জানতে চাই।";

interface WASettings {
  number: string;
  message: string;
}

async function fetchSetting(key: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/db/site_settings?setting_key=${encodeURIComponent(key)}&_limit=1`);
    if (!res.ok) return null;
    const json = await res.json();
    const rows = Array.isArray(json) ? json : json?.data ?? [];
    if (!rows.length || !rows[0]?.setting_value) return null;
    const raw = rows[0].setting_value;
    return typeof raw === "string" ? raw.replace(/^"|"$/g, "") : String(raw);
  } catch {
    return null;
  }
}

export const FloatingWhatsApp = () => {
  const { data: waSettings } = useQuery<WASettings>({
    queryKey: ["whatsapp-settings-public"],
    queryFn: async () => {
      const [rawNumber, rawMessage] = await Promise.all([
        fetchSetting("whatsapp_number"),
        fetchSetting("whatsapp_message"),
      ]);

      const number = rawNumber
        ? rawNumber.replace(/[^0-9]/g, "") || FALLBACK_NUMBER
        : FALLBACK_NUMBER;

      const message = rawMessage || FALLBACK_MESSAGE;

      return { number, message };
    },
    staleTime: 10 * 60 * 1000,
  });

  const number = waSettings?.number || FALLBACK_NUMBER;
  const message = waSettings?.message || FALLBACK_MESSAGE;
  const whatsappUrl = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2 animate-bounce hover:animate-none"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
};
