const languageNames = new Intl.DisplayNames(["en"], { type: "language" });
const countryNames = new Intl.DisplayNames(["en"], { type: "region" });

export function displayCountry(code: string): string {
  return countryNames.of(code.toUpperCase()) ?? code.toUpperCase();
}

export function displayLanguage(code: string): string {
  return languageNames.of(code.toLowerCase()) ?? code;
}
