"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field, Select, TextArea, TextInput } from "@/components/form";
import { Button, Card } from "@/components/ui";
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
  const [error, setError] = useState("");

  const selectedCategory =
    ASSET_CATEGORIES.find((c) => c.id === values.categoryId) ?? category;

  function set<K extends keyof AssetFormValues>(
    key: K,
    value: AssetFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!values.name.trim()) {
      setError("Please give this asset a name.");
      return;
    }
    const payload = {
      name: values.name.trim(),
      categoryId: values.categoryId,
      type: values.type,
      institution: values.institution.trim(),
      investedAmount: toNumber(values.investedAmount),
      currentValue: toNumber(values.currentValue || values.investedAmount),
      startDate: values.startDate,
      notes: values.notes.trim(),
    };
    if (asset) {
      updateAsset(asset.id, payload);
      router.push(`/assets/${asset.id}`);
    } else {
      const created = addAsset(payload);
      router.push(`/assets/${created.id}`);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
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
                setValues((prev) => ({
                  ...prev,
                  categoryId: nextCategory.id,
                  type: nextCategory.types[0],
                }));
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
              onChange={(e) => set("type", e.target.value)}
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
