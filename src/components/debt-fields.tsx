"use client";

import { Field, Select, TextInput } from "@/components/form";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  COMPOUNDING_OPTIONS,
  valueDebtAsset,
  type BondPayout,
  type CompoundingFrequency,
  type DebtDetails,
  type DebtKind,
} from "@/lib/debt";

export type DebtValues = Record<string, string>;

interface FieldSpec {
  key: string;
  label: string;
  hint?: string;
  input: "number" | "date" | "select";
  options?: { value: string; label: string }[];
  placeholder?: string;
}

const compoundingField: FieldSpec = {
  key: "compounding",
  label: "Interest is added",
  hint: "How often the bank compounds",
  input: "select",
  options: COMPOUNDING_OPTIONS,
};

/** Inputs that describe how each debt instrument actually works. */
export const DEBT_FIELDS: Record<DebtKind, FieldSpec[]> = {
  fd: [
    { key: "principal", label: "Amount deposited (₹)", input: "number" },
    {
      key: "annualRate",
      label: "Interest rate (% a year)",
      input: "number",
      placeholder: "7.1",
    },
    compoundingField,
    { key: "startDate", label: "Deposit date", input: "date" },
    {
      key: "tenureMonths",
      label: "Tenure (months)",
      hint: "Example: 24 for 2 years",
      input: "number",
    },
  ],
  rd: [
    { key: "monthlyDeposit", label: "Monthly deposit (₹)", input: "number" },
    {
      key: "annualRate",
      label: "Interest rate (% a year)",
      input: "number",
      placeholder: "6.5",
    },
    compoundingField,
    { key: "startDate", label: "First deposit date", input: "date" },
    { key: "tenureMonths", label: "Tenure (months)", input: "number" },
  ],
  bond: [
    {
      key: "faceValue",
      label: "Face value per bond (₹)",
      hint: "Amount repaid at maturity",
      input: "number",
    },
    { key: "quantity", label: "Number of bonds", input: "number" },
    { key: "buyPrice", label: "Price you paid per bond (₹)", input: "number" },
    {
      key: "couponRate",
      label: "Coupon rate (% a year)",
      input: "number",
      placeholder: "8",
    },
    {
      key: "payout",
      label: "Interest is",
      input: "select",
      options: [
        { value: "yearly", label: "Paid out yearly" },
        { value: "half-yearly", label: "Paid out half yearly" },
        { value: "quarterly", label: "Paid out quarterly" },
        { value: "cumulative", label: "Kept in the bond (cumulative)" },
      ],
    },
    { key: "startDate", label: "Bought on", input: "date" },
    { key: "maturityDate", label: "Matures on", input: "date" },
  ],
  "govt-scheme": [
    {
      key: "contributionType",
      label: "How you deposit",
      input: "select",
      options: [
        { value: "lumpsum", label: "One time (NSC, KVP)" },
        { value: "yearly", label: "Every year (PPF, SSY)" },
      ],
    },
    { key: "amount", label: "Deposit amount (₹)", input: "number" },
    {
      key: "annualRate",
      label: "Interest rate (% a year)",
      input: "number",
      placeholder: "7.1",
    },
    { key: "startDate", label: "Started on", input: "date" },
    { key: "tenureYears", label: "Tenure (years)", input: "number" },
  ],
  insurance: [
    { key: "annualPremium", label: "Premium a year (₹)", input: "number" },
    {
      key: "premiumTermYears",
      label: "Years you pay premium",
      input: "number",
    },
    { key: "policyTermYears", label: "Policy term (years)", input: "number" },
    {
      key: "maturityAmount",
      label: "Amount you get at maturity (₹)",
      hint: "Guaranteed maturity benefit",
      input: "number",
    },
    { key: "startDate", label: "Policy start date", input: "date" },
  ],
  "debt-mf": [
    { key: "units", label: "Units held", input: "number" },
    { key: "buyNav", label: "Average buy NAV (₹)", input: "number" },
    { key: "currentNav", label: "Today's NAV (₹)", input: "number" },
    { key: "startDate", label: "Bought on", input: "date" },
  ],
  "other-debt": [
    { key: "principal", label: "Amount lent / invested (₹)", input: "number" },
    { key: "annualRate", label: "Interest rate (% a year)", input: "number" },
    {
      key: "interestType",
      label: "Interest type",
      input: "select",
      options: [
        { value: "compound", label: "Compound" },
        { value: "simple", label: "Simple" },
      ],
    },
    { key: "startDate", label: "Started on", input: "date" },
    { key: "tenureMonths", label: "Tenure (months)", input: "number" },
  ],
};

export function defaultDebtValues(kind: DebtKind): DebtValues {
  const values: DebtValues = {};
  for (const field of DEBT_FIELDS[kind]) {
    values[field.key] =
      field.input === "select" ? (field.options?.[0]?.value ?? "") : "";
  }
  if (kind === "fd" || kind === "rd") values.compounding = "quarterly";
  return values;
}

export function debtValuesFromDetails(details: DebtDetails): DebtValues {
  const values: DebtValues = {};
  for (const [key, value] of Object.entries(details)) {
    if (key === "kind") continue;
    values[key] = String(value);
  }
  return values;
}

function num(values: DebtValues, key: string): number {
  const parsed = Number(values[key]);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function buildDebtDetails(
  kind: DebtKind,
  values: DebtValues,
): DebtDetails {
  switch (kind) {
    case "fd":
      return {
        kind,
        principal: num(values, "principal"),
        annualRate: num(values, "annualRate"),
        compounding: (values.compounding ?? "quarterly") as CompoundingFrequency,
        startDate: values.startDate ?? "",
        tenureMonths: num(values, "tenureMonths"),
      };
    case "rd":
      return {
        kind,
        monthlyDeposit: num(values, "monthlyDeposit"),
        annualRate: num(values, "annualRate"),
        compounding: (values.compounding ?? "quarterly") as CompoundingFrequency,
        startDate: values.startDate ?? "",
        tenureMonths: num(values, "tenureMonths"),
      };
    case "bond":
      return {
        kind,
        faceValue: num(values, "faceValue"),
        quantity: num(values, "quantity"),
        buyPrice: num(values, "buyPrice"),
        couponRate: num(values, "couponRate"),
        payout: (values.payout ?? "yearly") as BondPayout,
        startDate: values.startDate ?? "",
        maturityDate: values.maturityDate ?? "",
      };
    case "govt-scheme":
      return {
        kind,
        contributionType: (values.contributionType ?? "lumpsum") as
          | "lumpsum"
          | "yearly",
        amount: num(values, "amount"),
        annualRate: num(values, "annualRate"),
        startDate: values.startDate ?? "",
        tenureYears: num(values, "tenureYears"),
      };
    case "insurance":
      return {
        kind,
        annualPremium: num(values, "annualPremium"),
        premiumTermYears: num(values, "premiumTermYears"),
        policyTermYears: num(values, "policyTermYears"),
        maturityAmount: num(values, "maturityAmount"),
        startDate: values.startDate ?? "",
      };
    case "debt-mf":
      return {
        kind,
        units: num(values, "units"),
        buyNav: num(values, "buyNav"),
        currentNav: num(values, "currentNav"),
        startDate: values.startDate ?? "",
      };
    case "other-debt":
      return {
        kind,
        principal: num(values, "principal"),
        annualRate: num(values, "annualRate"),
        interestType: (values.interestType ?? "compound") as
          | "simple"
          | "compound",
        startDate: values.startDate ?? "",
        tenureMonths: num(values, "tenureMonths"),
      };
  }
}

export function DebtFields({
  kind,
  values,
  onChange,
}: {
  kind: DebtKind;
  values: DebtValues;
  onChange: (key: string, value: string) => void;
}) {
  const details = buildDebtDetails(kind, values);
  const valuation = valueDebtAsset(details);
  const profit = valuation.currentValue - valuation.invested;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {DEBT_FIELDS[kind].map((field) => (
          <Field key={field.key} label={field.label} hint={field.hint}>
            {field.input === "select" ? (
              <Select
                value={values[field.key] ?? ""}
                onChange={(e) => onChange(field.key, e.target.value)}
              >
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            ) : (
              <TextInput
                type={field.input}
                min={field.input === "number" ? "0" : undefined}
                step={field.input === "number" ? "any" : undefined}
                value={values[field.key] ?? ""}
                placeholder={field.placeholder}
                onChange={(e) => onChange(field.key, e.target.value)}
              />
            )}
          </Field>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-700">
          Calculated for you — you do not enter the value today
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs text-slate-500">Money put in so far</p>
            <p className="text-lg font-semibold text-slate-900">
              {formatCurrency(valuation.invested)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Value today</p>
            <p className="text-lg font-semibold text-slate-900">
              {formatCurrency(valuation.currentValue)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Interest earned so far</p>
            <p
              className={`text-lg font-semibold ${
                profit >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {formatCurrency(profit)}
            </p>
          </div>
        </div>
        {valuation.maturityValue !== undefined ? (
          <p className="mt-3 text-sm text-slate-600">
            At maturity{valuation.maturityDate ? ` on ${formatDate(valuation.maturityDate)}` : ""}:{" "}
            <span className="font-medium text-slate-900">
              {formatCurrency(valuation.maturityValue)}
            </span>
          </p>
        ) : null}
        <ul className="mt-2 space-y-1 text-xs text-slate-500">
          {valuation.explanation.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
