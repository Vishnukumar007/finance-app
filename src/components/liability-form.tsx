"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field, Select, TextArea, TextInput } from "@/components/form";
import { Button, Card } from "@/components/ui";
import { useStore } from "@/lib/store";
import { LIABILITY_TYPES, type Liability, type LiabilityType } from "@/lib/types";

interface LiabilityFormValues {
  name: string;
  type: LiabilityType;
  lender: string;
  originalAmount: string;
  outstandingAmount: string;
  interestRate: string;
  startDate: string;
  endDate: string;
  emiAmount: string;
  notes: string;
}

function toNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toValues(liability: Liability): LiabilityFormValues {
  return {
    name: liability.name,
    type: liability.type,
    lender: liability.lender,
    originalAmount: String(liability.originalAmount),
    outstandingAmount: String(liability.outstandingAmount),
    interestRate: String(liability.interestRate),
    startDate: liability.startDate,
    endDate: liability.endDate,
    emiAmount: String(liability.emiAmount),
    notes: liability.notes,
  };
}

export function LiabilityForm({ liability }: { liability?: Liability }) {
  const router = useRouter();
  const { addLiability, updateLiability } = useStore();
  const [values, setValues] = useState<LiabilityFormValues>(
    liability
      ? toValues(liability)
      : {
          name: "",
          type: "Home Loan",
          lender: "",
          originalAmount: "",
          outstandingAmount: "",
          interestRate: "",
          startDate: "",
          endDate: "",
          emiAmount: "",
          notes: "",
        },
  );
  const [error, setError] = useState("");

  function set<K extends keyof LiabilityFormValues>(
    key: K,
    value: LiabilityFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!values.name.trim()) {
      setError("Please give this liability a name.");
      return;
    }
    const payload = {
      name: values.name.trim(),
      type: values.type,
      lender: values.lender.trim(),
      originalAmount: toNumber(values.originalAmount),
      outstandingAmount: toNumber(
        values.outstandingAmount || values.originalAmount,
      ),
      interestRate: toNumber(values.interestRate),
      startDate: values.startDate,
      endDate: values.endDate,
      emiAmount: toNumber(values.emiAmount),
      notes: values.notes.trim(),
    };
    if (liability) {
      updateLiability(liability.id, payload);
      router.push(`/liabilities/${liability.id}`);
    } else {
      const created = addLiability(payload);
      router.push(`/liabilities/${created.id}`);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Liability name" hint="Example: Flat home loan">
          <TextInput
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="What is this money owed for?"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type">
            <Select
              value={values.type}
              onChange={(e) => set("type", e.target.value as LiabilityType)}
            >
              {LIABILITY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Who gave the loan?">
            <TextInput
              value={values.lender}
              onChange={(e) => set("lender", e.target.value)}
              placeholder="Example: SBI, HDFC, a friend"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Original amount (₹)">
            <TextInput
              type="number"
              min="0"
              step="any"
              value={values.originalAmount}
              onChange={(e) => set("originalAmount", e.target.value)}
              placeholder="0"
            />
          </Field>
          <Field label="Still to be paid (₹)">
            <TextInput
              type="number"
              min="0"
              step="any"
              value={values.outstandingAmount}
              onChange={(e) => set("outstandingAmount", e.target.value)}
              placeholder="0"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Interest rate (% per year)">
            <TextInput
              type="number"
              min="0"
              step="any"
              value={values.interestRate}
              onChange={(e) => set("interestRate", e.target.value)}
              placeholder="0"
            />
          </Field>
          <Field label="Monthly payment / EMI (₹)">
            <TextInput
              type="number"
              min="0"
              step="any"
              value={values.emiAmount}
              onChange={(e) => set("emiAmount", e.target.value)}
              placeholder="0"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Start date">
            <TextInput
              type="date"
              value={values.startDate}
              onChange={(e) => set("startDate", e.target.value)}
            />
          </Field>
          <Field label="End date">
            <TextInput
              type="date"
              value={values.endDate}
              onChange={(e) => set("endDate", e.target.value)}
            />
          </Field>
        </div>

        <Field label="Notes">
          <TextArea
            rows={3}
            value={values.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Anything you want to remember"
          />
        </Field>

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        <div className="flex gap-3">
          <Button type="submit">
            {liability ? "Save changes" : "Add liability"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
