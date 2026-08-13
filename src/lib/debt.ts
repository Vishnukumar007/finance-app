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

export type TenureUnit = "days" | "months" | "years";

export const TENURE_UNIT_OPTIONS: { value: TenureUnit; label: string }[] = [
  { value: "days", label: "Days" },
  { value: "months", label: "Months" },
  { value: "years", label: "Years" },
];

export type BondPayout = "quarterly" | "half-yearly" | "yearly" | "cumulative";

/** Tenure entered in days, months or years. */
export interface Tenure {
  tenureValue: number;
  tenureUnit: TenureUnit;
  /** Older assets stored the tenure in months or years. */
  tenureMonths?: number;
  tenureYears?: number;
}

export type DebtDetails =
  | ({
      kind: "fd";
      principal: number;
      annualRate: number;
      compounding: CompoundingFrequency;
      startDate: string;
    } & Tenure)
  | ({
      kind: "rd";
      monthlyDeposit: number;
      annualRate: number;
      compounding: CompoundingFrequency;
      startDate: string;
    } & Tenure)
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
  | ({
      kind: "govt-scheme";
      contributionType: "lumpsum" | "yearly";
      amount: number;
      annualRate: number;
      startDate: string;
    } & Tenure)
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
  | ({
      kind: "other-debt";
      principal: number;
      annualRate: number;
      interestType: "simple" | "compound";
      startDate: string;
    } & Tenure);

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

const YEARS_PER_UNIT: Record<TenureUnit, number> = {
  days: 1 / DAYS_PER_YEAR,
  months: 1 / MONTHS_PER_YEAR,
  years: 1,
};

/** Tenure in years, falling back to the months / years fields of older assets. */
export function tenureYears(tenure: Tenure): number {
  if (Number.isFinite(tenure.tenureValue) && tenure.tenureValue > 0) {
    return tenure.tenureValue * YEARS_PER_UNIT[tenure.tenureUnit ?? "months"];
  }
  if (tenure.tenureMonths) return tenure.tenureMonths / MONTHS_PER_YEAR;
  if (tenure.tenureYears) return tenure.tenureYears;
  return 0;
}

export function formatTenure(tenure: Tenure): string {
  const years = tenureYears(tenure);
  if (years <= 0) return "no tenure set";
  if (Number.isFinite(tenure.tenureValue) && tenure.tenureValue > 0) {
    return `${tenure.tenureValue} ${tenure.tenureUnit ?? "months"}`;
  }
  if (tenure.tenureMonths) return `${tenure.tenureMonths} months`;
  return `${tenure.tenureYears} years`;
}

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

function addDays(date: string, days: number): string {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  parsed.setDate(parsed.getDate() + Math.round(days));
  return parsed.toISOString().slice(0, 10);
}

/** Maturity date for a tenure entered in days, months or years. */
function maturityDateFor(startDate: string, tenure: Tenure): string {
  return addDays(startDate, tenureYears(tenure) * DAYS_PER_YEAR);
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
      const totalYears = tenureYears(details);
      const elapsed = Math.min(yearsBetween(details.startDate, asOf), totalYears);
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
        totalYears,
      );
      return {
        invested: details.principal,
        currentValue,
        maturityValue,
        maturityDate: maturityDateFor(details.startDate, details),
        explanation: [
          `${details.annualRate}% a year, compounded ${details.compounding}.`,
          `${(elapsed * DAYS_PER_YEAR).toFixed(0)} of ${(totalYears * DAYS_PER_YEAR).toFixed(0)} days completed (tenure ${formatTenure(details)}).`,
        ],
      };
    }
    case "rd": {
      const totalYears = tenureYears(details);
      const totalInstallments = Math.max(
        Math.round(totalYears * MONTHS_PER_YEAR),
        0,
      );
      const held = yearsBetween(details.startDate, asOf);
      const elapsedMonths = Math.floor(held * MONTHS_PER_YEAR);
      const installmentsPaid = details.startDate
        ? Math.min(Math.max(elapsedMonths + 1, 0), totalInstallments)
        : 0;
      const periods = PERIODS_PER_YEAR[details.compounding];
      const rate = details.annualRate / 100 / periods;
      let currentValue = 0;
      for (let i = 0; i < installmentsPaid; i += 1) {
        const heldYears = Math.max(held - i / MONTHS_PER_YEAR, 0);
        currentValue += details.monthlyDeposit * (1 + rate) ** (periods * heldYears);
      }
      let maturityValue = 0;
      for (let i = 0; i < totalInstallments; i += 1) {
        const heldYears = (totalInstallments - i) / MONTHS_PER_YEAR;
        maturityValue +=
          details.monthlyDeposit * (1 + rate) ** (periods * heldYears);
      }
      return {
        invested: details.monthlyDeposit * installmentsPaid,
        currentValue,
        maturityValue,
        maturityDate: maturityDateFor(details.startDate, details),
        explanation: [
          `${installmentsPaid} of ${totalInstallments} monthly deposits paid (tenure ${formatTenure(details)}).`,
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
            `${(elapsed * DAYS_PER_YEAR).toFixed(0)} of ${(totalYears * DAYS_PER_YEAR).toFixed(0)} days completed.`,
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
          `Value = face value plus interest accrued in the last ${(accruedYears * DAYS_PER_YEAR).toFixed(0)} days.`,
        ],
      };
    }
    case "govt-scheme": {
      const totalYears = tenureYears(details);
      const elapsed = Math.min(yearsBetween(details.startDate, asOf), totalYears);
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
            totalYears,
          ),
          maturityDate: maturityDateFor(details.startDate, details),
          explanation: [
            `One time deposit growing at ${details.annualRate}% a year, compounded yearly.`,
            `${(elapsed * DAYS_PER_YEAR).toFixed(0)} of ${(totalYears * DAYS_PER_YEAR).toFixed(0)} days completed (tenure ${formatTenure(details)}).`,
          ],
        };
      }
      const totalContributions = Math.max(Math.ceil(totalYears), 0);
      const contributionsMade = details.startDate
        ? Math.min(Math.floor(elapsed) + 1, totalContributions)
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
      for (let year = 0; year < totalContributions; year += 1) {
        maturityValue += compoundedValue(
          details.amount,
          details.annualRate,
          "yearly",
          Math.max(totalYears - year, 0),
        );
      }
      return {
        invested: details.amount * contributionsMade,
        currentValue,
        maturityValue,
        maturityDate: maturityDateFor(details.startDate, details),
        explanation: [
          `${contributionsMade} of ${totalContributions} yearly deposits made (tenure ${formatTenure(details)}).`,
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
        maturityDate: addDays(
          details.startDate,
          details.policyTermYears * DAYS_PER_YEAR,
        ),
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
      const totalYears = tenureYears(details);
      const elapsed = Math.min(yearsBetween(details.startDate, asOf), totalYears);
      const value = (years: number) =>
        details.interestType === "simple"
          ? details.principal * (1 + (details.annualRate / 100) * years)
          : compoundedValue(details.principal, details.annualRate, "yearly", years);
      return {
        invested: details.principal,
        currentValue: value(elapsed),
        maturityValue: value(totalYears),
        maturityDate: maturityDateFor(details.startDate, details),
        explanation: [
          `${details.annualRate}% a year, ${details.interestType} interest.`,
          `${(elapsed * DAYS_PER_YEAR).toFixed(0)} of ${(totalYears * DAYS_PER_YEAR).toFixed(0)} days completed (tenure ${formatTenure(details)}).`,
        ],
      };
    }
  }
}

export interface DebtFormula {
  title: string;
  /** The formula itself, one line per case. */
  lines: string[];
  /** What each symbol means. */
  where: string[];
}

/** Shown above the inputs so the maths behind each debt type is visible. */
export const DEBT_FORMULAS: Record<DebtKind, DebtFormula> = {
  fd: {
    title: "Fixed deposit",
    lines: [
      "Value today = P × (1 + r/n)^(n × t)",
      "Maturity value = P × (1 + r/n)^(n × T)",
    ],
    where: [
      "P = amount deposited",
      "r = interest rate a year (7% → 0.07)",
      "n = times interest is added a year (quarterly → 4)",
      "t = years completed so far (days ÷ 365.25)",
      "T = full tenure in years",
    ],
  },
  rd: {
    title: "Recurring deposit",
    lines: [
      "Value today = Σ D × (1 + r/n)^(n × tᵢ) for every deposit made",
      "Maturity value = Σ D × (1 + r/n)^(n × (T − i/12)) for all deposits",
    ],
    where: [
      "D = monthly deposit",
      "tᵢ = years the i-th deposit has been held",
      "r, n = rate a year and times interest is added a year",
      "T = full tenure in years",
    ],
  },
  bond: {
    title: "Bond",
    lines: [
      "Interest paid out → Value today = F × Q + C × d/365.25",
      "Cumulative → Value today = (B × Q) × (1 + c)^t",
      "Maturity value = F × Q (or the compounded amount if cumulative)",
    ],
    where: [
      "F = face value per bond, Q = number of bonds, B = price you paid",
      "c = coupon rate a year, C = F × Q × c (interest a year)",
      "d = days since the last interest payout",
      "t = years since you bought it",
    ],
  },
  "govt-scheme": {
    title: "Government scheme (PPF, NSC, KVP, SSY)",
    lines: [
      "One time deposit → Value today = A × (1 + r)^t",
      "Yearly deposit → Value today = Σ A × (1 + r)^(t − k) for each year k already deposited",
    ],
    where: [
      "A = deposit amount",
      "r = interest rate a year, added yearly",
      "t = years completed so far",
    ],
  },
  insurance: {
    title: "Endowment / traditional policy",
    lines: [
      "Premiums paid = Pr × years of premium paid",
      "Value today = Premiums paid + (M − Pr × N) × t/T",
    ],
    where: [
      "Pr = premium a year, N = years you pay premium",
      "M = guaranteed maturity amount, T = policy term in years",
      "t = years completed so far",
      "This is an estimate — a real surrender value depends on the insurer",
    ],
  },
  "debt-mf": {
    title: "Debt mutual fund / ETF",
    lines: [
      "Value today = Units × NAV today",
      "Money put in = Units × average buy NAV",
    ],
    where: [
      "NAV = net asset value of one unit",
      "Nothing is compounded — the NAV already includes the interest earned",
    ],
  },
  "other-debt": {
    title: "Other debt",
    lines: [
      "Simple → Value today = P × (1 + r × t)",
      "Compound → Value today = P × (1 + r)^t",
    ],
    where: [
      "P = amount lent or invested",
      "r = interest rate a year",
      "t = years completed so far (days ÷ 365.25)",
    ],
  },
};

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
