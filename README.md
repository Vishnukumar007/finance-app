# My Money — simple finance app

A beginner-friendly Next.js app to track three things only:

1. **Assets** — what you own
2. **Liabilities** — what you owe
3. **Goals** — what you are saving for

Data is stored in the browser (localStorage), so there is no backend or login.

## Modules

### Assets
- Add, edit, view and delete assets.
- Guided flow: **Category → Asset type → Asset details**.
- Categories: Equity, Debt, Real Estate, Commodities, Cash & Savings, Crypto, Alternatives, Other.
- Each asset stores name, category, type, institution, invested amount, current value, start date and notes.
- Update the current value at any time from the asset page; every linked goal recalculates instantly.
- Shows invested amount, current value, profit / loss, profit / loss % and total asset value.
- The asset list is grouped by category, with a per-category total row.

### Debt assets are calculated, not typed in
Debt assets ask for how the instrument works instead of asking you for the value today:
- **FD / RD** — amount (or monthly deposit), interest rate, compounding frequency, start date, tenure.
- **Bonds** — face value, quantity, buy price, coupon rate, payout frequency (or cumulative), buy and maturity dates.
- **Government schemes** — one time or yearly deposit, rate, start date, tenure.
- **Insurance** — yearly premium, premium term, policy term, guaranteed maturity amount, start date.
- **Debt MF / ETF** — units, average buy NAV, today's NAV.
- **Other debt** — amount, rate, simple or compound, start date, tenure.

Tenure can be entered in **days, months or years**. The value today, the money put in so far and the maturity value are derived from those inputs and are recalculated as time passes. Each debt form (and the asset page) shows a "How is this calculated?" panel at the top with the exact formula used for that instrument.

### Liabilities
- Add, edit, view and delete liabilities (home, vehicle, personal, education, credit card, gold, business, friends/family, other).
- Stores lender, original amount, outstanding amount, interest rate, start/end date, EMI and notes.
- Shows total outstanding plus per-liability outstanding, type and EMI.

### Goals
- Create goals with name, description, target amount and target date.
- Link **specific individual assets** — e.g. 2 of your 3 mutual funds for a house goal and the third for a marriage goal. The picker groups assets by category and type, with "select all" per type, and warns when an asset is already used by another goal.
- Progress is derived from the current value of the linked assets: target, current, remaining, progress %.

### Dashboard
Total asset value, invested amount, profit / loss, total outstanding liabilities, goal progress, and **Net worth = assets − liabilities**.

## Running locally

```bash
npm install
npm run dev      # http://localhost:3000
```

Other scripts: `npm run build`, `npm run start`, `npm run lint`.
