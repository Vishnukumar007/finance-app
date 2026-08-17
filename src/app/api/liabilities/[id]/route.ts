import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Liability } from "@/lib/types";

export const dynamic = "force-dynamic";

function normalizeLiabilityRecord(record: any): Liability {
  return {
    id: record.id,
    name: record.name,
    type: record.type,
    lender: record.lender,
    originalAmount: Number(record.originalAmount ?? 0),
    outstandingAmount: Number(record.outstandingAmount ?? 0),
    interestRate: Number(record.interestRate ?? 0),
    startDate: record.startDate,
    endDate: record.endDate,
    emiAmount: Number(record.emiAmount ?? 0),
    notes: record.notes ?? "",
    createdAt: record.createdAt.toISOString(),
  };
}

function sanitizeLiabilityInput(payload: unknown): Partial<Liability> {
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Liability payload must be an object.");
  }

  const value = payload as Record<string, unknown>;

  return {
    name: typeof value.name === "string" ? value.name : undefined,
    type: typeof value.type === "string" ? value.type : undefined,
    lender: typeof value.lender === "string" ? value.lender : undefined,
    originalAmount:
      value.originalAmount !== undefined ? Number(value.originalAmount) : undefined,
    outstandingAmount:
      value.outstandingAmount !== undefined ? Number(value.outstandingAmount) : undefined,
    interestRate:
      value.interestRate !== undefined ? Number(value.interestRate) : undefined,
    startDate: typeof value.startDate === "string" ? value.startDate : undefined,
    endDate: typeof value.endDate === "string" ? value.endDate : undefined,
    emiAmount: value.emiAmount !== undefined ? Number(value.emiAmount) : undefined,
    notes: typeof value.notes === "string" ? value.notes : undefined,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const record = await db.liability.findUnique({ where: { id } });

  if (!record) {
    return NextResponse.json({ error: "Liability not found" }, { status: 404 });
  }

  return NextResponse.json(normalizeLiabilityRecord(record));
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const payload = sanitizeLiabilityInput(await request.json());

    const record = await db.liability.update({
      where: { id },
      data: {
        ...(payload.name !== undefined && { name: payload.name }),
        ...(payload.type !== undefined && { type: payload.type }),
        ...(payload.lender !== undefined && { lender: payload.lender }),
        ...(payload.originalAmount !== undefined && {
          originalAmount: Number(payload.originalAmount),
        }),
        ...(payload.outstandingAmount !== undefined && {
          outstandingAmount: Number(payload.outstandingAmount),
        }),
        ...(payload.interestRate !== undefined && {
          interestRate: Number(payload.interestRate),
        }),
        ...(payload.startDate !== undefined && { startDate: payload.startDate }),
        ...(payload.endDate !== undefined && { endDate: payload.endDate }),
        ...(payload.emiAmount !== undefined && { emiAmount: Number(payload.emiAmount) }),
        ...(payload.notes !== undefined && { notes: payload.notes }),
      },
    });

    return NextResponse.json(normalizeLiabilityRecord(record));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await db.liability.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ success: true });
}
