import type { Asset } from "./types";

export type CompoundingFrequency =
  | "monthly"
  | "quarterly"
  | "half-yearly"
  | "yearly";

export const COMPOUNDING_OPTIONS: {
  value: CompoundingFrequency;
  label: string;
}[] = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "half-yearly", label: "Half yearly" },
  { value: "yearly", label: "Yearly" },
];

export const PERIODS_PER_YEAR: Record<CompoundingFrequency, number> = {
  monthly: 12,
  quarterly: 4,
  "half-yearly": 2,
  yearly: 1,
};

export type BondPayout = "quarterly" | "half-yearly" | "yearly" | "cumulative";

export type DebtDetails =
  | {
      kind: "fd";
      principal: number;
      annualRate: number;
      compounding: CompoundingFrequency;
      startDate: string;
      tenureMonths: number;
    }
  | {
      kind: "rd";
      monthlyDeposit: number;
      annualRate: number;
      compounding: CompoundingFrequency;
      startDate: string;
      tenureMonths: number;
    }
  | {
      kind: "bond";
      faceValue: number;
      quantity: number;
      buyPrice: number;
      couponRate: number;
      payout: BondPayout;
      startDate: string;
      maturityDate: string;
    }
  | {
      kind: "govt-scheme";
      contributionType: "lumpsum" | "yearly";
      amount: number;
      annualRate: number;
      startDate: string;
      tenureYears: number;
    }
  | {
      kind: "insurance";
      annualPremium: number;
      premiumTermYears: number;
      policyTermYears: number;
      maturityAmount: number;
      startDate: string;
    }
  | {
      kind: "debt-mf";
      units: number;
      buyNav: number;
      currentNav: number;
      startDate: string;
    }
  | {
      kind: "other-debt";
      principal: number;
      annualRate: number;
      interestType: "simple" | "compound";
      startDate: string;
      tenureMonths: number;
    };

export type DebtKind = DebtDetails["kind"];

/** Debt asset types that are calculated from how the instrument actually works. */
export const DEBT_KIND_BY_TYPE: Record<string, DebtKind> = {
  "FD / RD": "fd",
  Bonds: "bond",
  "Government Schemes": "govt-scheme",
  Insurance: "insurance",
  "MF / ETF": "debt-mf",
  "Other Debt": "other-debt",
};

export function debtKindForType(
  categoryId: string,
  type: string,
): DebtKind | undefined {
  if (categoryId !== "debt") return undefined;
  return DEBT_KIND_BY_TYPE[type];
}

const MS_PER_DAY = 86_400_000;
const DAYS_PER_YEAR = 365.25;
const MONTHS_PER_YEAR = 12;

function yearsBetween(from: string, to: Date): number {
  if (!from) return 0;
  const start = new Date(from);
  if (Number.isNaN(start.getTime())) return 0;
  return Math.max((to.getTime() - start.getTime()) / MS_PER_DAY / DAYS_PER_YEAR, 0);
}

function compoundedValue(
  principal: number,
  annualRate: number,
  frequency: CompoundingFrequency,
  years: number,
): number {
  const periods = PERIODS_PER_YEAR[frequency];
  const rate = annualRate / 100 / periods;
  return principal * (1 + rate) ** (periods * years);
}

function addYears(date: string, years: number): string {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  parsed.setFullYear(parsed.getFullYear() + years);
  return parsed.toISOString().slice(0, 10);
}

function addMonths(date: string, months: number): string {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  parsed.setMonth(parsed.getMonth() + months);
  return parsed.toISOString().slice(0, 10);
}

export interface DebtValuation {
  /** Money actually put in so far. */
  invested: number;
  /** Value as of today, derived from the instrument's own rules. */
  currentValue: number;
  /** Value at the end of the tenure, when the instrument has one. */
  maturityValue?: number;
  maturityDate?: string;
  /** Human readable notes shown next to the calculated value. */
  explanation: string[];
}

export function valueDebtAsset(
  details: DebtDetails,
  asOf: Date = new Date(),
): DebtValuation {
  switch (details.kind) {
    case "fd": {
      const tenureYears = details.tenureMonths / MONTHS_PER_YEAR;
      const elapsed = Math.min(yearsBetween(details.startDate, asOf), tenureYears);
      const currentValue = compoundedValue(
        details.principal,
        details.annualRate,
        details.compounding,
        elapsed,
      );
      const maturityValue = compoundedValue(
        details.principal,
        details.annualRate,
        details.compounding,
        tenureYears,
      );
      return {
        invested: details.principal,
        currentValue,
        maturityValue,
        maturityDate: addMonths(details.startDate, details.tenureMonths),
        explanation: [
          `${details.annualRate}% a year, compounded ${details.compounding}.`,
          `${elapsed.toFixed(2)} of ${tenureYears.toFixed(2)} years completed.`,
        ],
      };
    }
    case "rd": {
      const elapsedMonths = Math.floor(
        yearsBetween(details.startDate, asOf) * MONTHS_PER_YEAR,
      );
      const installmentsPaid = details.startDate
        ? Math.min(Math.max(elapsedMonths + 1, 0), details.tenureMonths)
        : 0;
      const periods = PERIODS_PER_YEAR[details.compounding];
      const rate = details.annualRate / 100 / periods;
      let currentValue = 0;
      for (let i = 0; i < installmentsPaid; i += 1) {
        const heldYears = Math.max(
          yearsBetween(details.startDate, asOf) - i / MONTHS_PER_YEAR,
          0,
        );
        currentValue += details.monthlyDeposit * (1 + rate) ** (periods * heldYears);
      }
      let maturityValue = 0;
      for (let i = 0; i < details.tenureMonths; i += 1) {
        const heldYears = (details.tenureMonths - i) / MONTHS_PER_YEAR;
        maturityValue +=
          details.monthlyDeposit * (1 + rate) ** (periods * heldYears);
      }
      return {
        invested: details.monthlyDeposit * installmentsPaid,
        currentValue,
        maturityValue,
        maturityDate: addMonths(details.startDate, details.tenureMonths),
        explanation: [
          `${installmentsPaid} of ${details.tenureMonths} monthly deposits paid.`,
          `Each deposit earns ${details.annualRate}% a year, compounded ${details.compounding}.`,
        ],
      };
    }
    case "bond": {
      const invested = details.buyPrice * details.quantity;
      const faceTotal = details.faceValue * details.quantity;
      const annualCoupon = (faceTotal * details.couponRate) / 100;
      const totalYears = details.maturityDate
        ? Math.max(
            (new Date(details.maturityDate).getTime() -
              new Date(details.startDate || details.maturityDate).getTime()) /
              MS_PER_DAY /
              DAYS_PER_YEAR,
            0,
          )
        : 0;
      const elapsed = details.maturityDate
        ? Math.min(yearsBetween(details.startDate, asOf), totalYears)
        : yearsBetween(details.startDate, asOf);

      if (details.payout === "cumulative") {
        const currentValue = compoundedValue(
          invested,
          details.couponRate,
          "yearly",
          elapsed,
        );
        return {
          invested,
          currentValue,
          maturityValue: compoundedValue(
            invested,
            details.couponRate,
            "yearly",
            totalYears,
          ),
          maturityDate: details.maturityDate,
          explanation: [
            `Interest is kept in the bond and compounds at ${details.couponRate}% a year.`,
            `${elapsed.toFixed(2)} of ${totalYears.toFixed(2)} years completed.`,
          ],
        };
      }

      const periods = PERIODS_PER_YEAR[
        details.payout === "yearly"
          ? "yearly"
          : details.payout === "half-yearly"
            ? "half-yearly"
            : "quarterly"
      ];
      const periodYears = 1 / periods;
      const accruedYears = elapsed % periodYears;
      const accruedInterest = annualCoupon * accruedYears;
      return {
        invested,
        currentValue: faceTotal + accruedInterest,
        maturityValue: faceTotal,
        maturityDate: details.maturityDate,
        explanation: [
          `Interest of ${annualCoupon.toFixed(0)} a year is paid out ${details.payout}, so it is not added to the value.`,
          `Value = face value plus interest accrued since the last payout.`,
        ],
      };
    }
    case "govt-scheme": {
      const elapsed = Math.min(
        yearsBetween(details.startDate, asOf),
        details.tenureYears,
      );
      if (details.contributionType === "lumpsum") {
        return {
          invested: details.amount,
          currentValue: compoundedValue(
            details.amount,
            details.annualRate,
            "yearly",
            elapsed,
          ),
          maturityValue: compoundedValue(
            details.amount,
            details.annualRate,
            "yearly",
            details.tenureYears,
          ),
          maturityDate: addYears(details.startDate, details.tenureYears),
          explanation: [
            `One time deposit growing at ${details.annualRate}% a year, compounded yearly.`,
            `${elapsed.toFixed(2)} of ${details.tenureYears} years completed.`,
          ],
        };
      }
      const contributionsMade = details.startDate
        ? Math.min(Math.floor(elapsed) + 1, details.tenureYears)
        : 0;
      let currentValue = 0;
      for (let year = 0; year < contributionsMade; year += 1) {
        currentValue += compoundedValue(
          details.amount,
          details.annualRate,
          "yearly",
          Math.max(elapsed - year, 0),
        );
      }
      let maturityValue = 0;
      for (let year = 0; year < details.tenureYears; year += 1) {
        maturityValue += compoundedValue(
          details.amount,
          details.annualRate,
          "yearly",
          details.tenureYears - year,
        );
      }
      return {
        invested: details.amount * contributionsMade,
        currentValue,
        maturityValue,
        maturityDate: addYears(details.startDate, details.tenureYears),
        explanation: [
          `${contributionsMade} of ${details.tenureYears} yearly deposits made.`,
          `Balance grows at ${details.annualRate}% a year, compounded yearly.`,
        ],
      };
    }
    case "insurance": {
      const elapsed = Math.min(
        yearsBetween(details.startDate, asOf),
        details.policyTermYears,
      );
      const premiumsPaid = details.startDate
        ? Math.min(Math.floor(elapsed) + 1, details.premiumTermYears)
        : 0;
      const invested = details.annualPremium * premiumsPaid;
      const totalPremiums = details.annualPremium * details.premiumTermYears;
      const growth = details.maturityAmount - totalPremiums;
      const share =
        details.policyTermYears > 0 ? elapsed / details.policyTermYears : 0;
      const currentValue = Math.max(invested + growth * share, 0);
      return {
        invested,
        currentValue,
        maturityValue: details.maturityAmount,
        maturityDate: addYears(details.startDate, details.policyTermYears),
        explanation: [
          `${premiumsPaid} of ${details.premiumTermYears} yearly premiums paid.`,
          `Estimated value moves from premiums paid towards the maturity amount over ${details.policyTermYears} years.`,
        ],
      };
    }
    case "debt-mf": {
      return {
        invested: details.units * details.buyNav,
        currentValue: details.units * details.currentNav,
        explanation: [
          `${details.units} units at a NAV of ${details.currentNav}.`,
          `Bought at an average NAV of ${details.buyNav}.`,
        ],
      };
    }
    case "other-debt": {
      const tenureYears = details.tenureMonths / MONTHS_PER_YEAR;
      const elapsed = Math.min(yearsBetween(details.startDate, asOf), tenureYears);
      const value = (years: number) =>
        details.interestType === "simple"
          ? details.principal * (1 + (details.annualRate / 100) * years)
          : compoundedValue(details.principal, details.annualRate, "yearly", years);
      return {
        invested: details.principal,
        currentValue: value(elapsed),
        maturityValue: value(tenureYears),
        maturityDate: addMonths(details.startDate, details.tenureMonths),
        explanation: [
          `${details.annualRate}% a year, ${details.interestType} interest.`,
          `${elapsed.toFixed(2)} of ${tenureYears.toFixed(2)} years completed.`,
        ],
      };
    }
  }
}

function round(value: number): number {
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : 0;
}

/** Recomputes invested and current value for assets whose value is calculated. */
export function deriveAsset(asset: Asset, asOf: Date = new Date()): Asset {
  if (!asset.debtDetails) return asset;
  const valuation = valueDebtAsset(asset.debtDetails, asOf);
  return {
    ...asset,
    investedAmount: round(valuation.invested),
    currentValue: round(valuation.currentValue),
  };
}
