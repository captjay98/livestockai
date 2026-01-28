# डिप्लॉयमेंट गाइड

OpenLivestock Manager को प्रोडक्शन में डिप्लॉय करने के लिए पूरी गाइड।

---

## पूर्वापेक्षाएँ

- **Cloudflare खाता** (निःशुल्क टीयर काम करता है)
- **Neon खाता** (निःशुल्क टीयर काम करता है)
- **GitHub खाता** (CI/CD के लिए)
- **Node.js 22+** या **Bun 1.0+**

---

## त्वरित शुरुआत (5 मिनट)

```bash
# 1. क्लोन और इंस्टॉल करें
git clone https://github.com/yourusername/openlivestock.git
cd openlivestock
bun install

# 2. डेटाबेस सेटअप करें
bun run db:migrate
bun run db:seed

# 3. डिप्लॉय करें
bun run deploy
```

---

## चरण 1: डेटाबेस सेटअप (Neon)

### Neon प्रोजेक्ट बनाएँ

1. [console.neon.tech](https://console.neon.tech) पर जाएँ
2. **New Project** पर क्लिक करें
3. अपने उपयोगकर्ताओं के सबसे करीब का क्षेत्र चुनें
4. कनेक्शन स्ट्रिंग कॉपी करें

### डेटाबेस कॉन्फ़िगर करें

```bash
# .env
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
```

### माइग्रेशन चलाएँ

```bash
# टेबल बनाएँ
bun run db:migrate

# प्रारंभिक डेटा सीड करें (व्यवस्थापक उपयोगकर्ता + संदर्भ डेटा)
bun run db:seed

# वैकल्पिक: परीक्षण के लिए डेमो डेटा सीड करें
bun run db:seed:dev
```

### डेटाबेस सत्यापित करें

```bash
# जांचें कि टेबल मौजूद हैं
bun run db:status

# या Neon SQL एडिटर का उपयोग करें
# चलाएं: SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

---

## चरण 2: Cloudflare Workers सेटअप

### Wrangler CLI इंस्टॉल करें

```bash
npm install -g wrangler
# या
bun add -g wrangler
```

### Cloudflare में लॉग इन करें

```bash
wrangler login
```

### Worker कॉन्फ़िगर करें

`wrangler.jsonc` संपादित करें:

```jsonc
{
    "name": "openlivestock-production",
    "main": "./.output/server/index.mjs",
    "compatibility_date": "2024-01-01",
    "compatibility_flags": ["nodejs_compat"],
    "vars": {
        "NODE_ENV": "production",
    },
}
```

### सीक्रेट सेट करें

```bash
# डेटाबेस कनेक्शन
wrangler secret put DATABASE_URL
# अपनी Neon कनेक्शन स्ट्रिंग पेस्ट करें

# Better Auth सीक्रेट (इसके साथ उत्पन्न करें: openssl rand -base64 32)
wrangler secret put BETTER_AUTH_SECRET

# वैकल्पिक: SMS प्रदाता (Termii)
wrangler secret put TERMII_API_KEY

# वैकल्पिक: ईमेल प्रदाता (Resend)
wrangler secret put RESEND_API_KEY
```

---

## चरण 3: बिल्ड और डिप्लॉय

### प्रोडक्शन के लिए बिल्ड करें

```bash
bun run build
```

यह `.output/` में अनुकूलित बंडल बनाता है।

### Cloudflare पर डिप्लॉय करें

```bash
bun run deploy
# या
wrangler deploy
```

### डिप्लॉयमेंट सत्यापित करें

```bash
# डिप्लॉयमेंट स्थिति जांचें
wrangler deployments list

# लॉग देखें
wrangler tail
```

आपका ऐप अब लाइव है: `https://openlivestock-production.your-subdomain.workers.dev`

---

## चरण 4: कस्टम डोमेन (वैकल्पिक)

### Cloudflare में डोमेन जोड़ें

1. Cloudflare डैशबोर्ड → Workers & Pages पर जाएँ
2. अपना वर्कर चुनें
3. **Triggers** → **Custom Domains** पर क्लिक करें
4. अपना डोमेन जोड़ें (उदाहरण: `app.yourfarm.com`)

### DNS अपडेट करें

Cloudflare स्वचालित रूप से DNS रिकॉर्ड कॉन्फ़िगर करता है।

---

## पर्यावरण चर

### आवश्यक

| चर                   | विवरण                   | उदाहरण                    |
| -------------------- | ----------------------- | ------------------------- |
| `DATABASE_URL`       | Neon PostgreSQL कनेक्शन | `postgresql://...`        |
| `BETTER_AUTH_SECRET` | Auth सत्र सीक्रेट       | `openssl rand -base64 32` |

### वैकल्पिक

| चर                    | विवरण               | डिफ़ॉल्ट  |
| --------------------- | ------------------- | --------- |
| `SMS_PROVIDER`        | SMS सेवा            | `console` |
| `EMAIL_PROVIDER`      | ईमेल सेवा           | `console` |
| `TERMII_API_KEY`      | Termii API कुंजी    | -         |
| `TERMII_SENDER_ID`    | Termii प्रेषक ID    | -         |
| `TWILIO_ACCOUNT_SID`  | Twilio खाता SID     | -         |
| `TWILIO_AUTH_TOKEN`   | Twilio auth टोकन    | -         |
| `TWILIO_PHONE_NUMBER` | Twilio फोन          | -         |
| `RESEND_API_KEY`      | Resend API कुंजी    | -         |
| `SMTP_HOST`           | SMTP सर्वर          | -         |
| `SMTP_PORT`           | SMTP पोर्ट          | `587`     |
| `SMTP_USER`           | SMTP उपयोगकर्ता नाम | -         |
| `SMTP_PASSWORD`       | SMTP पासवर्ड        | -         |
| `SMTP_FROM`           | प्रेषक ईमेल         | -         |

---

## GitHub Actions के साथ CI/CD

### वर्कफ़्लो बनाएँ

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

### GitHub में सीक्रेट जोड़ें

1. GitHub रेपो → Settings → Secrets पर जाएँ
2. `CLOUDFLARE_API_TOKEN` जोड़ें
3. `DATABASE_URL` जोड़ें
4. `BETTER_AUTH_SECRET` जोड़ें

---

## निगरानी और डीबगिंग

### लॉग देखें

```bash
# रीयल-टाइम लॉग
wrangler tail

# स्थिति के अनुसार फ़िल्टर करें
wrangler tail --status error

# विधि के अनुसार फ़िल्टर करें
wrangler tail --method POST
```

### प्रदर्शन निगरानी

Cloudflare डैशबोर्ड → Workers & Pages → Analytics:

- अनुरोध गणना
- त्रुटि दर
- CPU समय
- प्रतिक्रिया समय

### डेटाबेस निगरानी

Neon डैशबोर्ड → Monitoring:

- कनेक्शन गणना
- क्वेरी प्रदर्शन
- स्टोरेज उपयोग

---

## स्केलिंग

### Cloudflare Workers

- **निःशुल्क टीयर**: 100,000 अनुरोध/दिन
- **सशुल्क टीयर**: असीमित अनुरोध ($5/माह + $0.50/मिलियन अनुरोध)
- **ऑटो-स्केलिंग**: ट्रैफ़िक स्पाइक्स को स्वचालित रूप से संभालता है

### Neon डेटाबेस

- **निःशुल्क टीयर**: 0.5 GB स्टोरेज, 1 कंप्यूट यूनिट
- **सशुल्क टीयर**: कंप्यूट और स्टोरेज को स्वतंत्र रूप से स्केल करें
- **कनेक्शन पूलिंग**: इन-बिल्ट, कोई कॉन्फ़िगरेशन की आवश्यकता नहीं

---

## बैकअप और रिकवरी

### डेटाबेस बैकअप

Neon स्वचालित बैकअप प्रदान करता है:

- **पॉइंट-इन-टाइम रिकवरी**: पिछले 7 दिनों में किसी भी बिंदु पर पुनर्स्थापित करें (निःशुल्क टीयर)
- **मैनुअल बैकअप**: लंबी अवधि के बैकअप के लिए शाखा बनाएँ

```bash
# बैकअप शाखा बनाएँ
neon branches create --name backup-2026-01-15
```

### डेटा निर्यात करें

```bash
# सारा डेटा निर्यात करें
pg_dump $DATABASE_URL > backup.sql

# पुनर्स्थापित करें
psql $DATABASE_URL < backup.sql
```

---

## सुरक्षा चेकलिस्ट

- [ ] मजबूत `BETTER_AUTH_SECRET` (32+ वर्ण) का उपयोग करें
- [ ] Cloudflare WAF (वेब एप्लिकेशन फ़ायरवॉल) सक्षम करें
- [ ] Cloudflare में रेट लिमिटिंग सेट करें
- [ ] सभी सीक्रेट्स के लिए पर्यावरण चर का उपयोग करें
- [ ] केवल HTTPS सक्षम करें (Cloudflare डिफ़ॉल्ट)
- [ ] Neon IP अनुमति सूची की समीक्षा करें (यदि आवश्यक हो)
- [ ] ऑडिट लॉगिंग सक्षम करें
- [ ] निगरानी अलर्ट सेट करें

---

## समस्या निवारण

### बिल्ड त्रुटियाँ

**त्रुटि**: `Cannot find module '../db'`

**समाधान**: सर्वर फ़ंक्शंस में डायनामिक आयात सुनिश्चित करें:

```typescript
const { getDb } = await import('~/lib/db')
const db = await getDb() // ✅
```

### डेटाबेस कनेक्शन त्रुटियाँ

**त्रुटि**: `Connection timeout`

**समाधान**: जांचें कि Neon प्रोजेक्ट सक्रिय है (निलंबित नहीं):

```bash
# डेटाबेस को जगाएं
curl $DATABASE_URL
```

### Worker त्रुटियाँ

**त्रुटि**: `Script startup exceeded CPU limit`

**समाधान**: बंडल आकार कम करें:

```bash
# बंडल का विश्लेषण करें
bun run build --analyze

# बड़ी निर्भरताओ की जाँच करें
du -sh node_modules/*
```

### माइग्रेशन त्रुटियाँ

**त्रुटि**: `relation "table" already exists`

**समाधान**: माइग्रेशन स्थिति जांचें:

```bash
bun run db:status

# यदि आवश्यक हो, तो रोलबैक करें और फिर से चलाएं
bun run db:rollback
bun run db:migrate
```

---

## प्रदर्शन अनुकूलन

### Cloudflare

- स्थिर संपत्ति के लिए कैशिंग सक्षम करें
- छवियों के लिए Cloudflare CDN का उपयोग करें
- Brotli संपीड़न सक्षम करें
- कस्टम कैश नियम सेट करें

### डेटाबेस

- सामान्य प्रश्नों के लिए इंडेक्स जोड़ें (पहले से शामिल)
- कनेक्शन पूलिंग का उपयोग करें (Neon डिफ़ॉल्ट)
- Neon डैशबोर्ड में धीमे प्रश्नों की निगरानी करें
- उच्च ट्रैफ़िक के लिए रीड रिप्लिकस पर विचार करें

### एप्लिकेशन

- PWA कैशिंग सक्षम करें
- छवियों को अनुकूलित करें (WebP प्रारूप)
- घटकों को लेजी लोड करें
- महंगे घटकों के लिए React.memo का उपयोग करें

---

## लागत अनुमान

### निःशुल्क टीयर (छोटे फार्मों के लिए उपयुक्त)

- **Cloudflare Workers**: 100,000 अनुरोध/दिन
- **Neon डेटाबेस**: 0.5 GB स्टोरेज, 1 कंप्यूट यूनिट
- **कुल**: $0/माह

### सशुल्क टीयर (मध्यम फार्मों के लिए उपयुक्त)

- **Cloudflare Workers**: $5/माह + उपयोग
- **Neon डेटाबेस**: $19/माह (2 कंप्यूट यूनिट, 10 GB)
- **कुल**: ~$25/माह

### उद्यम (बड़े फार्म, कई स्थान)

- **Cloudflare Workers**: कस्टम मूल्य निर्धारण
- **Neon डेटाबेस**: कस्टम मूल्य निर्धारण
- **कुल**: बिक्री टीम से संपर्क करें

---

## अगले कदम

1. **निगरानी सेट करें**: त्रुटियों के लिए अलर्ट कॉन्फ़िगर करें
2. **बैकअप सक्षम करें**: नियमित डेटाबेस बैकअप शेड्यूल करें
3. **कस्टम डोमेन**: अपने फार्म का डोमेन जोड़ें
4. **SMS/ईमेल**: प्रोडक्शन प्रदाताओं को कॉन्फ़िगर करें
5. **ऑनबोर्डिंग**: पहला फार्म बनाएँ और उपयोगकर्ताओं को आमंत्रित करें

---

## समर्थन

- **दस्तावेज़ीकरण**: [docs/INDEX.md](./INDEX.md)
- **GitHub मुद्दे**: [github.com/yourusername/openlivestock/issues](https://github.com/yourusername/openlivestock/issues)
- **समुदाय**: [Discord/Slack लिंक]

---

**अंतिम अपडेट**: 15 जनवरी, 2026
