// Gives the rows that were created before login existed to one Google account.
//
//   node scripts/claim-data.mjs you@gmail.com
//
// Sign in with that Google account once first, so the user row exists.

import { Client } from "pg";

const email = process.argv[2];

if (!email) {
  console.error("Usage: node scripts/claim-data.mjs <email>");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  const { rows } = await client.query(
    'SELECT id FROM users WHERE lower(email) = lower($1)',
    [email],
  );

  if (rows.length === 0) {
    console.error(
      `No user with email ${email}. Sign in with that Google account first.`,
    );
    process.exit(1);
  }

  const userId = rows[0].id;

  for (const table of ["assets", "liabilities", "goals", "app_state"]) {
    const result = await client.query(
      `UPDATE ${table} SET "userId" = $1 WHERE "userId" = ''`,
      [userId],
    );
    console.log(`${table}: ${result.rowCount} row(s) claimed`);
  }
} finally {
  await client.end();
}
