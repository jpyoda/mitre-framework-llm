import { LANGUAGES } from "@/constants/languages";

export function getLanguageLabel(locale: string) {
  const cleanedLocale = locale.startsWith("/") ? locale.split("/")[1] : locale;
  const language = LANGUAGES.find((lang) => lang.value === cleanedLocale);
  return language ? language : LANGUAGES[0];
}
