import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ScrollReveal from "@/components/ScrollReveal";

// Body/UI: Inter — crisp and highly legible at every weight.
// Headings: Plus Jakarta Sans — modern and warm, full weight range so bold and
// extrabold render sharp (no synthesized "faux bold" blur).
const inter = Inter({
  variable: "--font-sans-src",
  subsets: ["latin"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-display-src",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata = {
  title: {
    default: "ADUplans — Place any ADU floor plan on your lot",
    template: "%s · ADUplans",
  },
  description:
    "Browse thousands of build-ready ADU floor plans and place any of them on your property to scale — free, no survey or architect required.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jakarta.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        {/* Set the theme before first paint to avoid a flash of the wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('aduplans-theme')||'light';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-cream text-ink">
        <ScrollReveal />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
