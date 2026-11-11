import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import DefaultLayout from "@/components/layouts/DefaultLayout";
import { routing } from "@/i18n/routing";
import { hasServerApiKey } from "@/lib/scenario/config";

// Render per request so the sidebar reflects whether OPENAI_API_KEY is set
// at runtime (e.g. in a container), not whether it was set at build time.
export const dynamic = "force-dynamic";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MitreMesh",
  description:
    "Generate incident response testing scenarios from MITRE ATT&CK threat actor data.",
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale}>
      <body className={inter.className}>
        {/* Messages and locale come from i18n/request.ts. */}
        <NextIntlClientProvider>
          <DefaultLayout serverKeyConfigured={hasServerApiKey()}>
            {children}
          </DefaultLayout>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
