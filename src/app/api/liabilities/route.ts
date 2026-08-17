import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { normalizeLiability } from "@/lib/server/records";
import type { Liability } from "@/lib/types";

export const dynamic = "force-dynamic";

function sanitizeLiabilityInput(payload: unknown): Partial<Liability> {
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Liability payload must be an object.");
  }

  const value = payload as Record<string, unknown>;

  return {
    name: typeof value.name === "string" ? value.name : "",
    type: typeof value.type === "string"
        ? (value.type as Liability["type"])
        : "Other",
    lender: typeof value.lender === "string" ? value.lender : "",
    originalAmount: Number(value.originalAmount ?? 0),
    outstandingAmount: Number(value.outstandingAmount ?? 0),
    interestRate: Number(value.interestRate ?? 0),
    startDate: typeof value.startDate === "string" ? value.startDate : "",
    endDate: typeof value.endDate === "string" ? value.endDate : "",
    emiAmount: Number(value.emiAmount ?? 0),
    notes: typeof value.notes === "string" ? value.notes : "",
  };
}

export async function GET() {
  const records = await db.liability.findMany({
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(records.map(normalizeLiability));
}

export async function POST(request: Request) {
  try {
    const payload = sanitizeLiabilityInput(await request.json());

    const record = await db.liability.create({
      data: {
        name: payload.name ?? "",
        type: payload.type ?? "Other",
        lender: payload.lender ?? "",
        originalAmount: Number(payload.originalAmount ?? 0),
        outstandingAmount: Number(payload.outstandingAmount ?? 0),
        interestRate: Number(payload.interestRate ?? 0),
        startDate: payload.startDate ?? "",
        endDate: payload.endDate ?? "",
        emiAmount: Number(payload.emiAmount ?? 0),
        notes: payload.notes ?? "",
      },
    });

    return NextResponse.json(normalizeLiability(record), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
