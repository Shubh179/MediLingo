import Papa from "papaparse";
import Fuse from "fuse.js";

export interface MedicineRecord {
  id: string;
  name: string;
  price: number;
  is_discontinued: boolean;
  manufacturer_name: string;
  type: string;
  pack_size_label: string;
  short_composition1: string;
  short_composition2: string;
}

export interface GenericRecord {
  srNo: string;
  drugCode: string;
  genericName: string;
  unitSize: string;
  mrp: number;
  groupName: string;
}

const BRANDED_CSV_PATH = "/data/indian_medicine_data.csv";
const GENERIC_PREFERRED_PATH = "/data/generic_products.csv";
const GENERIC_FALLBACK_PATH = "/data/Product%20List_25_12_2025%20@%2015_27_55%20(4).csv";

function normalize(str: string): string {
  return (str || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\(\s*/g, "(")
    .replace(/\s*\)/g, ")")
    .trim();
}

export async function loadMedicines(): Promise<MedicineRecord[]> {
  const res = await fetch(BRANDED_CSV_PATH);
  if (!res.ok) throw new Error(`Failed to fetch CSV from ${BRANDED_CSV_PATH}`);
  const text = await res.text();
  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      delimiter: ",",
      skipEmptyLines: true,
      transform: (value, field) => {
        if (field === "price(₹)") return value;
        return value;
      },
      complete: (results) => {
        try {
          const rows = (results.data as any[]).map((r) => ({
            id: r.id,
            name: r.name,
            price: parseFloat(String(r["price(₹)"]).replace(/,/g, "")) || 0,
            is_discontinued: String(r.Is_discontinued).toLowerCase() === "true",
            manufacturer_name: r.manufacturer_name,
            type: r.type,
            pack_size_label: r.pack_size_label,
            short_composition1: r.short_composition1,
            short_composition2: r.short_composition2,
          })) as MedicineRecord[];
          resolve(rows);
        } catch (e) {
          reject(e);
        }
      },
      error: (err) => reject(err),
    });
  });
}

export function findByName(records: MedicineRecord[], query: string): MedicineRecord[] {
  const q = query.toLowerCase().trim();
  return records.filter((r) => r.name?.toLowerCase().includes(q));
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeName(s: string) {
  return (s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function findByNameRanked(records: MedicineRecord[], query: string): MedicineRecord[] {
  const qn = normalizeName(query);
  if (!qn) return [];

  // Assume first letter is always correct - filter to only same first letter
  const firstLetter = qn[0];
  const sameFirstLetter = records.filter((r) => {
    const rn = normalizeName(r.name);
    return rn[0] === firstLetter;
  });

  // Use Fuse.js for both exact and fuzzy matching, but only on filtered set
  const fuse = new Fuse(sameFirstLetter, {
    keys: ['name'],
    threshold: 0.35, // allows minor typos but strong preference for close matches
    distance: 100,
    ignoreLocation: true,
    includeScore: true,
  });

  const fuzzyResults = fuse.search(query);
  
  // Also do exact substring matching for quick wins
  const exactMatches = sameFirstLetter.filter((r) => {
    const rn = normalizeName(r.name);
    return rn === qn || rn.startsWith(qn);
  });

  // Combine: exact matches first, then fuzzy results
  const resultMap = new Map<string, MedicineRecord>();
  
  // Add exact matches
  exactMatches.forEach((r) => resultMap.set(r.id, r));
  
  // Add fuzzy matches that aren't already in exact
  fuzzyResults.forEach((fr) => {
    if (!resultMap.has(fr.item.id)) {
      resultMap.set(fr.item.id, fr.item);
    }
  });

  return Array.from(resultMap.values()).slice(0, 50);
}

function tokenizeIngredients(text: string): string[] {
  const raw = normalize(text)
    .replace(/\([^)]*\)/g, " ") // remove parentheses content like strengths
    .replace(/[\d%]+/g, " ") // remove digits and %
    .replace(/\b(ip|tablets?|capsules?|syrup|oral|suspension|solution|injection|gel|cream|drops?|lozenges?)\b/gi, " ")
    .replace(/[,/]/g, " ")
    .replace(/\band\b/gi, " ")
    .trim();
  const parts = raw.split(/\s+/).filter(Boolean);
  // Reconstruct ingredient tokens by capitalized boundaries or keep simple using join of contiguous letters
  // Here we return unique tokens joined by space sequences representing names like "potassium clavulanate"
  // For simplicity, we split by double spaces after normalization of comma/and: we already have single tokens;
  return Array.from(new Set(parts));
}

function ingredientSetFromBranded(r: MedicineRecord): Set<string> {
  const combined = [r.short_composition1 || "", r.short_composition2 || ""].join(" , ");
  return new Set(tokenizeIngredients(combined));
}

function ingredientSetFromGeneric(g: GenericRecord): Set<string> {
  return new Set(tokenizeIngredients(g.genericName));
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size === 0 || b.size === 0) return false;
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

export function findAlternatives(records: MedicineRecord[], base: MedicineRecord): MedicineRecord[] {
  const baseSet = ingredientSetFromBranded(base);
  return records.filter((r) => {
    if (r.id === base.id) return false;
    return setsEqual(baseSet, ingredientSetFromBranded(r));
  });
}

export async function loadGenerics(): Promise<GenericRecord[]> {
  // Try preferred, then fallback path
  const tryPaths = [GENERIC_PREFERRED_PATH, GENERIC_FALLBACK_PATH];
  let text: string | null = null;
  for (const p of tryPaths) {
    try {
      const res = await fetch(p);
      if (res.ok) {
        text = await res.text();
        break;
      }
    } catch {}
  }
  if (!text) throw new Error("Failed to fetch generic CSV. Place it under frontend/public/data as generic_products.csv");

  return new Promise((resolve, reject) => {
    Papa.parse(text!, {
      header: true,
      delimiter: ",",
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rows = (results.data as any[]).map((r) => ({
            srNo: r["Sr No"],
            drugCode: r["Drug Code"],
            genericName: r["Generic Name"],
            unitSize: r["Unit Size"],
            mrp: parseFloat(String(r["MRP"]).replace(/,/g, "")) || 0,
            groupName: r["Group Name"],
          })) as GenericRecord[];
          resolve(rows);
        } catch (e) {
          reject(e);
        }
      },
      error: (err) => reject(err),
    });
  });
}

export function findGenericAlternatives(generics: GenericRecord[], base: MedicineRecord): GenericRecord[] {
  const baseSet = ingredientSetFromBranded(base);
  return generics.filter((g) => setsEqual(baseSet, ingredientSetFromGeneric(g)));
}

export function computeSavings(base: MedicineRecord, alt: MedicineRecord) {
  const diff = base.price - alt.price;
  const pct = base.price > 0 ? (diff / base.price) * 100 : 0;
  return { diff, pct };
}

export function computeGenericSavings(base: MedicineRecord, g: GenericRecord) {
  const diff = base.price - g.mrp;
  const pct = base.price > 0 ? (diff / base.price) * 100 : 0;
  return { diff, pct };
}
