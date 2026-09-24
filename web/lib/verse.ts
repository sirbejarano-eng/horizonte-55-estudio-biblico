import type { Edition } from "./i18n";

export type Verse = { number: number; text: string };

// La RV1909 de eBible escribe en mayúsculas el comienzo de cada capítulo ("EN el principio",
// "Y FUERON acabados"): se muestra como texto normal ("En el principio", "Y fueron acabados").
// La versión actual solo baja la primera palabra a minúsculas ("en el principio", "y FUERON");
// aquí se corrige.
export function displayVerseText(edition: Edition, verse: Verse) {
  if (edition !== "rv1909" || verse.number !== 1) return verse.text;
  const isUpperWord = (token: string) => {
    const letters = token.replace(/[^\p{L}]/gu, "");
    return letters.length > 0 && !token.includes(".") && letters === letters.toUpperCase() && letters !== letters.toLowerCase();
  };
  const tokens = verse.text.split(" ");
  let count = 0;
  while (count < tokens.length && isUpperWord(tokens[count])) count++;
  if (count === 0 || tokens.slice(0, count).join("").replace(/[^\p{L}]/gu, "").length < 2) return verse.text;
  const lowered = tokens.slice(0, count).join(" ").toLocaleLowerCase("es-ES");
  const first = lowered.search(/\p{L}/u);
  const opening = lowered.slice(0, first) + lowered.charAt(first).toLocaleUpperCase("es-ES") + lowered.slice(first + 1);
  return [opening, ...tokens.slice(count)].join(" ");
}
