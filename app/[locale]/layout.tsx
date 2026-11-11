import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import DefaultLayout from "@/components/layouts/DefaultLayout";
import { LOCALES } from "@/constants/languages";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MitreMesh",
  description:
    "Generate incident response testing scenarios from MITRE ATT&CK threat actor data.",
};

export default async function RootLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: any;
}) {
  if (!LOCALES.includes(locale)) notFound();

  let messages;
  try {
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch (error) {
    notFound();
  }

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <DefaultLayout>{children}</DefaultLayout>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
