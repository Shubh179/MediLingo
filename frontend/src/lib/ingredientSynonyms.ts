export type SynonymPair = [string, string]; // [synonym, canonical]

// Phrase-level synonyms (apply before tokenization)
export const PHRASE_SYNONYMS: SynonymPair[] = [
  ["potassium clavulanate", "clavulanic acid"],
  ["amoxycillin", "amoxicillin"],
  ["vit d3", "vitamin d3"],
  ["vitamin d-3", "vitamin d3"],
  ["acetylsalicylic acid", "aspirin"],
];

// Token-level synonyms (single words after splitting)
export const TOKEN_SYNONYMS: Record<string, string> = {
  acetaminophen: "paracetamol",
  amoxycillin: "amoxicillin",
  cholecalciferol: "vitamin d3",
  ibuprofenum: "ibuprofen",
};

function norm(s: string) {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

export function applyPhraseSynonyms(text: string): string {
  let t = norm(text);
  for (const [syn, canon] of PHRASE_SYNONYMS) {
    const re = new RegExp(`\\b${syn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    t = t.replace(re, canon);
  }
  return t;
}

export function canonicalToken(token: string): string {
  const t = norm(token);
  return TOKEN_SYNONYMS[t] || t;
}
