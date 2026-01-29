# Mwongozo wa Usambazaji

Mwongozo kamili wa kusambaza LivestockAI kwa uzalishaji.

---

## Mahitaji

- **Akaunti ya Cloudflare** (kiwango cha bure kinafanya kazi)
- **Akaunti ya Neon** (kiwango cha bure kinafanya kazi)
- **Akaunti ya GitHub** (kwa CI/CD)
- **Node.js 22+** au **Bun 1.0+**

---

## Anza Haraka (Dakika 5)

```bash
# 1. Nakili na uweke
git clone https://github.com/yourusername/livestockai.git
cd livestockai
bun install

# 2. Sanidi hifadhidata
bun run db:migrate
bun run db:seed

# 3. Sambaza
bun run deploy
```

---

## Hatua ya 1: Usanidi wa Hifadhidata (Neon)

### Unda Mradi wa Neon

1. Nenda kwa [console.neon.tech](https://console.neon.tech)
2. Bonyeza **New Project**
3. Chagua eneo lililo karibu na watumiaji wako
4. Nakili kamba ya uunganisho (connection string)

### Sanidi Hifadhidata

```bash
# .env
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
```

### Endesha Uhamiaji (Migrations)

```bash
# Unda majedwali
bun run db:migrate

# Weka data ya awali (mtumiaji msimamizi + data ya rejea)
bun run db:seed

# Hiari: Weka data ya majaribio kwa ajili ya kupima
bun run db:seed:dev
```

### Thibitisha Hifadhidata

```bash
# Angalia kama majedwali yapo
bun run db:status

# Au tumia Mhariri wa SQL wa Neon
# Endesha: SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

---

## Hatua ya 2: Usanidi wa Cloudflare Workers

### Weka Wrangler CLI

```bash
npm install -g wrangler
# au
bun add -g wrangler
```

### Ingia kwenye Cloudflare

```bash
wrangler login
```

### Sanidi Worker

Hariri `wrangler.jsonc`:

```jsonc
{
  "name": "livestockai-production",
  "main": "./.output/server/index.mjs",
  "compatibility_date": "2024-01-01",
  "compatibility_flags": ["nodejs_compat"],
  "vars": {
    "NODE_ENV": "production",
  },
}
```

### Weka Siri (Secrets)

```bash
# Uunganisho wa hifadhidata
wrangler secret put DATABASE_URL
# Bandika kamba yako ya uunganisho ya Neon

# Siri ya Better Auth (tengeneza na: openssl rand -base64 32)
wrangler secret put BETTER_AUTH_SECRET

# Hiari: Mtoa huduma wa SMS (Termii)
wrangler secret put TERMII_API_KEY

# Hiari: Mtoa huduma wa Barua pepe (Resend)
wrangler secret put RESEND_API_KEY
```

---

## Hatua ya 3: Jenga & Sambaza

### Jenga kwa Uzalishaji

```bash
bun run build
```

Hii inaunda kifurushi kilichoboreshwa katika `.output/`.

### Sambaza kwa Cloudflare

```bash
bun run deploy
# au
wrangler deploy
```

### Thibitisha Usambazaji

```bash
# Angalia hali ya usambazaji
wrangler deployments list

# Tazama kumbukumbu (logs)
wrangler tail
```

Programu yako sasa iko hewani kwa: `https://livestockai-production.your-subdomain.workers.dev`

---

## Hatua ya 4: Kikoa Maalum (Hiari)

### Ongeza Kikoa kwa Cloudflare

1. Nenda kwenye Dashibodi ya Cloudflare → Workers & Pages
2. Chagua worker yako
3. Bonyeza **Triggers** → **Custom Domains**
4. Ongeza kikoa chako (mfano: `app.shambalako.com`)

### Sasisha DNS

Cloudflare husanidi rekodi za DNS kiotomatiki.

---

## Vigezo vya Mazingira

### Inahitajika

| Kigezo               | Maelezo                       | Mfano                     |
| -------------------- | ----------------------------- | ------------------------- |
| `DATABASE_URL`       | Uunganisho wa PostgreSQL Neon | `postgresql://...`        |
| `BETTER_AUTH_SECRET` | Siri ya kikao cha Auth        | `openssl rand -base64 32` |

### Hiari

| Kigezo                | Maelezo                            | Chaguo-msingi |
| --------------------- | ---------------------------------- | ------------- |
| `SMS_PROVIDER`        | Huduma ya SMS                      | `console`     |
| `EMAIL_PROVIDER`      | Huduma ya Barua pepe               | `console`     |
| `TERMII_API_KEY`      | Ufunguo wa API wa Termii           | -             |
| `TERMII_SENDER_ID`    | Kitambulisho cha mtumaji wa Termii | -             |
| `TWILIO_ACCOUNT_SID`  | SID ya akaunti ya Twilio           | -             |
| `TWILIO_AUTH_TOKEN`   | Tokeni ya auth ya Twilio           | -             |
| `TWILIO_PHONE_NUMBER` | Nambari ya simu ya Twilio          | -             |
| `RESEND_API_KEY`      | Ufunguo wa API wa Resend           | -             |
| `SMTP_HOST`           | Seva ya SMTP                       | -             |
| `SMTP_PORT`           | Bandari ya SMTP                    | `587`         |
| `SMTP_USER`           | Jina la mtumiaji la SMTP           | -             |
| `SMTP_PASSWORD`       | Nenosiri la SMTP                   | -             |
| `SMTP_FROM`           | Barua pepe ya mtumaji              | -             |

---

## CI/CD na GitHub Actions

### Unda Mtiririko wa Kazi

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install

      - name: Run tests
        run: bun run test

      - name: Build
        run: bun run build

      - name: Deploy to Cloudflare
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

### Ongeza Siri kwa GitHub

1. Nenda kwenye repo ya GitHub → Settings → Secrets
2. Ongeza `CLOUDFLARE_API_TOKEN`
3. Ongeza `DATABASE_URL`
4. Ongeza `BETTER_AUTH_SECRET`

---

## Ufuatiliaji & Utatuzi

### Tazama Kumbukumbu (Logs)

```bash
# Kumbukumbu za wakati halisi
wrangler tail

# Chuja kwa hali
wrangler tail --status error

# Chuja kwa njia
wrangler tail --method POST
```

### Ufuatiliaji wa Utendaji

Dashibodi ya Cloudflare → Workers & Pages → Analytics:

- Idadi ya maombi
- Kiwango cha makosa
- Muda wa CPU
- Muda wa majibu

### Ufuatiliaji wa Hifadhidata

Dashibodi ya Neon → Monitoring:

- Idadi ya viunganisho
- Utendaji wa maswali
- Matumizi ya uhifadhi

---

## Kuongeza Ukubwa

### Cloudflare Workers

- **Kiwango cha bure**: Maombi 100,000/siku
- **Kiwango cha kulipwa**: Maombi yasiyo na kikomo ($5/mwezi + $0.50/maombi milioni)
- **Kuongeza kiotomatiki**: Hushughulikia spikes za trafiki kiotomatiki

### Hifadhidata ya Neon

- **Kiwango cha bure**: Hifadhi ya 0.5 GB, kitengo 1 cha kompyuta
- **Kiwango cha kulipwa**: Ongeza kompyuta na uhifadhi kwa kujitegemea
- **Kukusanya viunganisho**: Imejengwa ndani, hakuna usanidi unaohitajika

---

## Hifadhi Nakala & Urejesho

### Hifadhi Nakala za Hifadhidata

Neon hutoa hifadhi nakala za kiotomatiki:

- **Urejesho wa wakati fulani**: Rejesha kwa wakati wowote katika siku 7 zilizopita (kiwango cha bure)
- **Hifadhi nakala za mwongozo**: Unda tawi kwa hifadhi nakala ya muda mrefu

```bash
# Unda tawi la hifadhi nakala
neon branches create --name backup-2026-01-15
```

### Hamisha Data

```bash
# Hamisha data yote
pg_dump $DATABASE_URL > backup.sql

# Rejesha
psql $DATABASE_URL < backup.sql
```

---

## Orodha ya Ukaguzi wa Usalama

- [ ] Tumia `BETTER_AUTH_SECRET` kali (herufi 32+)
- [ ] Wezesha Cloudflare WAF (Web Application Firewall)
- [ ] Sanidi ukomo wa kiwango katika Cloudflare
- [ ] Tumia vigezo vya mazingira kwa siri zote
- [ ] Wezesha HTTPS pekee (chaguo-msingi la Cloudflare)
- [ ] Pitia orodha ya idhini ya IP ya Neon (ikiwa inahitajika)
- [ ] Wezesha ukaguzi wa kumbukumbu
- [ ] Sanidi arifa za ufuatiliaji

---

## Utatuzi wa Matatizo

### Makosa ya Kujenga

**Kosa**: `Cannot find module '../db'`

**Suluhisho**: Hakikisha uingizaji wa nguvu katika vitendaji vya seva:

```typescript
const { getDb } = await import('~/lib/db')
const db = await getDb() // ✅
```

### Makosa ya Uunganisho wa Hifadhidata

**Kosa**: `Connection timeout`

**Suluhisho**: Angalia ikiwa mradi wa Neon unafanya kazi (haujasimamishwa):

```bash
# Amsha hifadhidata
curl $DATABASE_URL
```

### Makosa ya Worker

**Kosa**: `Script startup exceeded CPU limit`

**Suluhisho**: Punguza ukubwa wa kifurushi:

```bash
# Chambua kifurushi
bun run build --analyze

# Angalia utegemezi mkubwa
du -sh node_modules/*
```

### Makosa ya Uhamiaji

**Kosa**: `relation "table" already exists`

**Suluhisho**: Angalia hali ya uhamiaji:

```bash
bun run db:status

# Ikiwa inahitajika, rejesha nyuma na endesha tena
bun run db:rollback
bun run db:migrate
```

---

## Uboreshaji wa Utendaji

### Cloudflare

- Wezesha uhifadhi wa akiba kwa rasilimali tuli
- Tumia Cloudflare CDN kwa picha
- Wezesha ukandamizaji wa Brotli
- Sanidi sheria maalum za akiba

### Hifadhidata

- Ongeza fahirisi kwa maswali ya kawaida (tayari imejumuishwa)
- Tumia kukusanya viunganisho (chaguo-msingi la Neon)
- Fuatilia maswali ya polepole katika dashibodi ya Neon
- Fikiria nakala za kusoma kwa trafiki kubwa

### Programu

- Wezesha uhifadhi wa akiba wa PWA
- Boresha picha (muundo wa WebP)
- Pakia vipengele kwa uvivu (lazy load)
- Tumia React.memo kwa vipengele vya gharama kubwa

---

## Makadirio ya Gharama

### Kiwango cha Bure (Kinafaa kwa mashamba madogo)

- **Cloudflare Workers**: Maombi 100,000/siku
- **Hifadhidata ya Neon**: Hifadhi ya 0.5 GB, kitengo 1 cha kompyuta
- **Jumla**: $0/mwezi

### Kiwango cha Kulipwa (Kinafaa kwa mashamba ya kati)

- **Cloudflare Workers**: $5/mwezi + matumizi
- **Hifadhidata ya Neon**: $19/mwezi (vitengo 2 vya kompyuta, 10 GB)
- **Jumla**: ~$25/mwezi

### Enterprise (Mashamba makubwa, maeneo mengi)

- **Cloudflare Workers**: Bei maalum
- **Hifadhidata ya Neon**: Bei maalum
- **Jumla**: Wasiliana na mauzo

---

## Hatua Zinazofuata

1. **Sanidi ufuatiliaji**: Sanidi arifa kwa makosa
2. **Wezesha hifadhi nakala**: Panga hifadhi nakala za hifadhidata za mara kwa mara
3. **Kikoa maalum**: Ongeza kikoa cha shamba lako
4. **SMS/Barua pepe**: Sanidi watoa huduma wa uzalishaji
5. **Kuingia**: Unda shamba la kwanza na ualike watumiaji

---

## Msaada

- **Nyaraka**: [docs/INDEX.md](./INDEX.md)
- **Masuala ya GitHub**: [github.com/yourusername/livestockai/issues](https://github.com/yourusername/livestockai/issues)
- **Jamii**: [Kiungo cha Discord/Slack]

---

**Imesasishwa Mwisho**: 15 Januari 2026
