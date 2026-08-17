import { db } from "@/lib/db";

/** A deleted asset must stop counting towards the goals it was linked to. */
export async function unlinkAssetFromGoals(assetId: string): Promise<void> {
  const goals = await db.goal.findMany();

  const affected = goals.filter(
    (goal) =>
      Array.isArray(goal.linkedAssetIds) &&
      (goal.linkedAssetIds as string[]).includes(assetId),
  );

  await db.$transaction(
    affected.map((goal) =>
      db.goal.update({
        where: { id: goal.id },
        data: {
          linkedAssetIds: (goal.linkedAssetIds as string[]).filter(
            (id) => id !== assetId,
          ),
        },
      }),
    ),
  );
}
