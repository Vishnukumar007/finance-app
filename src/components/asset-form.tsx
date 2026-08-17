"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  buildDebtDetails,
  DebtFields,
  debtValuesFromDetails,
  defaultDebtValues,
  type DebtValues,
} from "@/components/debt-fields";
import { Field, Select, TextArea, TextInput } from "@/components/form";
import { Button, Card } from "@/components/ui";
import { debtKindForType, valueDebtAsset, type DebtKind } from "@/lib/debt";
import { useStore } from "@/lib/store";
import { ASSET_CATEGORIES, type Asset, type AssetCategory } from "@/lib/types";

interface AssetFormValues {
  name: string;
  categoryId: Asset["categoryId"];
  type: string;
  institution: string;
  investedAmount: string;
  currentValue: string;
  startDate: string;
  notes: string;
}

function toValues(asset: Asset): AssetFormValues {
  return {
    name: asset.name,
    categoryId: asset.categoryId,
    type: asset.type,
    institution: asset.institution,
    investedAmount: String(asset.investedAmount),
    currentValue: String(asset.currentValue),
    startDate: asset.startDate,
    notes: asset.notes,
  };
}

function toNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** "FD / RD" covers two instruments, so the deposit style is picked separately. */
function isDepositType(type: string): boolean {
  return type === "FD / RD";
}

export function AssetForm({
  category,
  type,
  asset,
}: {
  category: AssetCategory;
  type: string;
  asset?: Asset;
}) {
  const router = useRouter();
  const { addAsset, updateAsset } = useStore();
  const [values, setValues] = useState<AssetFormValues>(
    asset
      ? toValues(asset)
      : {
          name: "",
          categoryId: category.id,
          type,
          institution: "",
          investedAmount: "",
          currentValue: "",
          startDate: "",
          notes: "",
        },
  );
  const [depositKind, setDepositKind] = useState<DebtKind>(
    asset?.debtDetails?.kind === "rd" ? "rd" : "fd",
  );
  const [debtValues, setDebtValues] = useState<DebtValues>(() => {
    const initialKind = debtKindForType(
      asset?.categoryId ?? category.id,
      asset?.type ?? type,
    );
    if (!initialKind) return {};
    if (asset?.debtDetails) return debtValuesFromDetails(asset.debtDetails);
    return defaultDebtValues(initialKind);
  });
  const [error, setError] = useState("");

  const selectedCategory =
    ASSET_CATEGORIES.find((c) => c.id === values.categoryId) ?? category;

  const baseKind = debtKindForType(values.categoryId, values.type);
  const debtKind =
    baseKind === "fd" && isDepositType(values.type) ? depositKind : baseKind;

  function set<K extends keyof AssetFormValues>(
    key: K,
    value: AssetFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function switchDebtKind(nextKind: DebtKind | undefined) {
    setDebtValues(nextKind ? defaultDebtValues(nextKind) : {});
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!values.name.trim()) {
      setError("Please give this asset a name.");
      return;
    }

    const debtDetails = debtKind
      ? buildDebtDetails(debtKind, debtValues)
      : undefined;
    const valuation = debtDetails ? valueDebtAsset(debtDetails) : undefined;

    const payload = {
      name: values.name.trim(),
      categoryId: values.categoryId,
      type: values.type,
      institution: values.institution.trim(),
      investedAmount: valuation
        ? valuation.invested
        : toNumber(values.investedAmount),
      currentValue: valuation
        ? valuation.currentValue
        : toNumber(values.currentValue || values.investedAmount),
      startDate: debtDetails ? debtDetails.startDate : values.startDate,
      notes: values.notes.trim(),
      debtDetails,
    };
    try {
      if (asset) {
        await updateAsset(asset.id, payload);
        router.push(`/assets/${asset.id}`);
      } else {
        const created = await addAsset(payload);
        router.push(`/assets/${created.id}`);
      }
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save this asset.",
      );
    }
  }

  return (
    <Card>
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <Field label="Asset name" hint="Example: HDFC Flexi Cap Fund">
          <TextInput
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="What do you call this investment?"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            <Select
              value={values.categoryId}
              onChange={(e) => {
                const nextCategory = ASSET_CATEGORIES.find(
                  (c) => c.id === e.target.value,
                );
                if (!nextCategory) return;
                const nextType = nextCategory.types[0];
                setValues((prev) => ({
                  ...prev,
                  categoryId: nextCategory.id,
                  type: nextType,
                }));
                setDepositKind("fd");
                switchDebtKind(debtKindForType(nextCategory.id, nextType));
              }}
            >
              {ASSET_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Type">
            <Select
              value={values.type}
              onChange={(e) => {
                set("type", e.target.value);
                setDepositKind("fd");
                switchDebtKind(
                  debtKindForType(values.categoryId, e.target.value),
                );
              }}
            >
              {selectedCategory.types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Where is it kept?" hint="Bank, app or company name">
          <TextInput
            value={values.institution}
            onChange={(e) => set("institution", e.target.value)}
            placeholder="Example: Zerodha, SBI"
          />
        </Field>

        {debtKind ? (
          <div className="space-y-4">
            {isDepositType(values.type) ? (
              <Field label="Deposit type">
                <Select
                  value={depositKind}
                  onChange={(e) => {
                    const nextKind = e.target.value as DebtKind;
                    setDepositKind(nextKind);
                    switchDebtKind(nextKind);
                  }}
                >
                  <option value="fd">Fixed deposit (one time)</option>
                  <option value="rd">Recurring deposit (every month)</option>
                </Select>
              </Field>
            ) : null}

            <DebtFields
              kind={debtKind}
              values={debtValues}
              onChange={(key, value) =>
                setDebtValues((prev) => ({ ...prev, [key]: value }))
              }
            />
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Money you put in (₹)">
                <TextInput
                  type="number"
                  min="0"
                  step="any"
                  value={values.investedAmount}
                  onChange={(e) => set("investedAmount", e.target.value)}
                  placeholder="0"
                />
              </Field>
              <Field label="Value today (₹)" hint="Update this anytime">
                <TextInput
                  type="number"
                  min="0"
                  step="any"
                  value={values.currentValue}
                  onChange={(e) => set("currentValue", e.target.value)}
                  placeholder="0"
                />
              </Field>
            </div>

            <Field label="Started on">
              <TextInput
                type="date"
                value={values.startDate}
                onChange={(e) => set("startDate", e.target.value)}
              />
            </Field>
          </>
        )}

        <Field label="Notes">
          <TextArea
            rows={3}
            value={values.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Anything you want to remember about this asset"
          />
        </Field>

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        <div className="flex gap-3">
          <Button type="submit">{asset ? "Save changes" : "Add asset"}</Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
