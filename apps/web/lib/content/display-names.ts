const languageNames = new Intl.DisplayNames(["en"], { type: "language" });
const countryNames = new Intl.DisplayNames(["en"], { type: "region" });

export function displayCountry(code: string): string {
  return countryNames.of(code.toUpperCase()) ?? code.toUpperCase();
}

export function displayLanguage(code: string): string {
  return languageNames.of(code.toLowerCase()) ?? code;
}

export function displayCategory(value: string): string {
  return value.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function countryFlag(code: string): string {
  const canonical = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(canonical)) return "\u25ce";
  return [...canonical].map((letter) => String.fromCodePoint(127397 + letter.charCodeAt(0))).join("");
}
