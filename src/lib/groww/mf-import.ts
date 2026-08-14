import type { Asset } from "@/lib/types";

/** A mutual fund holding read out of an exported holdings file. */
export interface MfHolding {
  key: string;
  scheme: string;
  folio?: string;
  units?: number;
  invested: number;
  currentValue: number;
}

export interface MfImportResult {
  holdings: MfHolding[];
  /** Rows the file had but the app could not use, shown instead of being dropped silently. */
  problems: string[];
}

/** Splits one CSV line, honouring quoted fields that contain commas. */
function splitLine(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      cells.push(cell);
      cell = "";
    } else {
      cell += char;
    }
  }
  cells.push(cell);
  return cells.map((value) => value.trim());
}

function normalise(header: string): string {
  return header.toLowerCase().replace(/[^a-z]/g, "");
}

/** Exports differ between Groww, CAMS and KFintech, so columns are matched loosely. */
const COLUMNS: { field: keyof MfColumns; matches: string[] }[] = [
  { field: "scheme", matches: ["schemename", "scheme", "fundname", "name"] },
  { field: "isin", matches: ["isin"] },
  { field: "folio", matches: ["folio", "folionumber", "folionb"] },
  { field: "units", matches: ["units", "unitbalance", "balanceunits", "quantity"] },
  {
    field: "invested",
    matches: [
      "investedamount",
      "investedvalue",
      "amountinvested",
      "totalinvestment",
      "investmentcost",
      "costvalue",
      "invested",
    ],
  },
  {
    field: "currentValue",
    matches: [
      "currentvalue",
      "marketvalue",
      "valuation",
      "presentvalue",
      "value",
    ],
  },
  { field: "nav", matches: ["currentnav", "nav", "latestnav"] },
  { field: "avgNav", matches: ["averagenav", "avgnav", "purchasenav", "avgprice"] },
];

interface MfColumns {
  scheme?: number;
  isin?: number;
  folio?: number;
  units?: number;
  invested?: number;
  currentValue?: number;
  nav?: number;
  avgNav?: number;
}

function mapColumns(header: string[]): MfColumns {
  const columns: MfColumns = {};
  header.forEach((raw, index) => {
    const name = normalise(raw);
    for (const column of COLUMNS) {
      if (columns[column.field] !== undefined) continue;
      if (column.matches.includes(name)) columns[column.field] = index;
    }
  });
  return columns;
}

function numberAt(cells: string[], index?: number): number | undefined {
  if (index === undefined) return undefined;
  const raw = (cells[index] ?? "").replace(/[₹,\s]/g, "");
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

/** Reads a mutual fund holdings CSV exported from Groww (or a CAS statement saved as CSV). */
export function parseMfCsv(text: string): MfImportResult {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  // Some exports start with a title or account details before the real header row.
  const headerIndex = lines.findIndex((line) => {
    const columns = mapColumns(splitLine(line));
    return columns.scheme !== undefined;
  });
  if (headerIndex === -1) {
    return {
      holdings: [],
      problems: [
        "Could not find a scheme name column. Export the holdings from Groww as CSV and upload that file.",
      ],
    };
  }

  const columns = mapColumns(splitLine(lines[headerIndex]));
  const holdings: MfHolding[] = [];
  const problems: string[] = [];

  for (const line of lines.slice(headerIndex + 1)) {
    const cells = splitLine(line);
    const scheme = (cells[columns.scheme!] ?? "").trim();
    if (!scheme) continue;

    const units = numberAt(cells, columns.units);
    const nav = numberAt(cells, columns.nav);
    const avgNav = numberAt(cells, columns.avgNav);
    const isin = columns.isin !== undefined ? cells[columns.isin]?.trim() : "";
    const folio = columns.folio !== undefined ? cells[columns.folio]?.trim() : "";

    const currentValue =
      numberAt(cells, columns.currentValue) ??
      (units !== undefined && nav !== undefined ? units * nav : undefined);
    const invested =
      numberAt(cells, columns.invested) ??
      (units !== undefined && avgNav !== undefined ? units * avgNav : undefined);

    if (currentValue === undefined) {
      problems.push(
        `${scheme}: no current value, and no units and NAV to work it out from.`,
      );
      continue;
    }

    holdings.push({
      key: (isin || folio || scheme).toUpperCase(),
      scheme,
      folio: folio || undefined,
      units,
      invested: invested ?? currentValue,
      currentValue,
    });
    if (invested === undefined) {
      problems.push(
        `${scheme}: the file has no invested amount, so profit and loss shows as zero.`,
      );
    }
  }

  if (holdings.length === 0 && problems.length === 0) {
    problems.push("The file has a header but no holdings.");
  }

  return { holdings, problems };
}

/** Upserts imported funds by ISIN / folio so re-uploading a newer file updates them. */
export function mergeMfHoldings(
  assets: Asset[],
  holdings: MfHolding[],
  importedAt: string,
  newId: () => string,
): { assets: Asset[]; added: number; updated: number } {
  let added = 0;
  let updated = 0;
  const applied = new Set<string>();

  const fieldsFor = (holding: MfHolding) => ({
    name: holding.scheme,
    categoryId: "equity" as const,
    type: "Equity Mutual Fund",
    institution: "Groww",
    investedAmount: holding.invested,
    currentValue: holding.currentValue,
    notes: [
      holding.units !== undefined ? `${holding.units} units` : "",
      holding.folio ? `folio ${holding.folio}` : "",
    ]
      .filter(Boolean)
      .join(" · "),
    source: {
      provider: "groww-file" as const,
      externalId: holding.key,
      syncedAt: importedAt,
    },
  });

  const merged = assets.map((asset) => {
    if (asset.source?.provider !== "groww-file") return asset;
    const holding = holdings.find((h) => h.key === asset.source?.externalId);
    if (!holding) return asset;
    applied.add(holding.key);
    updated += 1;
    return { ...asset, ...fieldsFor(holding) };
  });

  for (const holding of holdings) {
    if (applied.has(holding.key)) continue;
    added += 1;
    merged.push({
      id: newId(),
      startDate: "",
      createdAt: importedAt,
      ...fieldsFor(holding),
    });
  }

  return { assets: merged, added, updated };
}
