# African Party Atlas

An interactive explorer for the African parties in the Europe Elects party database, in Africa Elects colours.
Same design as the European Party Atlas, adapted for Africa:

- **Map** of Africa (entities per country; click to filter).
- **International party federations** (the database column "International Party Federation"; an end date in
  "International Affiliation End" means the membership is past). Known federations have fixed colours, others get
  colours automatically.
- **Ideology by region**: every party as a dot, left–right by ideology, one row per region of Africa (UN regions).
- **Table** with every party; click a row for all fields. **Ideology legend** with the definitions.

The page offers no download and shows no Europe Elects IDs.

## Set up

1. Settings → Secrets and variables → Actions → New repository secret: `PARTY_DB_SHEET_ID` = the party database's Sheet ID.
2. Settings → Pages → Build and deployment → Source: **GitHub Actions**.
3. Actions → Refresh data & deploy → Run workflow. The site is then at https://europe-elects.github.io/<repo>/ and
   rebuilds daily at 04:29 UTC and on every change.

The Action reads the Sheet with the keyless Google login (robot account `ee-sheets-reader`, which already has access),
keeps only African rows (ISO-2 codes listed in `.github/workflows/deploy.yml`) and only the columns the page uses.
The step "Keep African parties" prints which countries it found. A country missing from that list needs its
ISO-2 code added to `AFRICA` in the workflow (and to `REGION` in `app.js` for its region row).
