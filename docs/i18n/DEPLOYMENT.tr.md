# Dağıtım Kılavuzu

OpenLivestock Manager'ı üretime dağıtmak için tam kılavuz.

---

## Önkoşullar

- **Cloudflare Hesabı** (ücretsiz seviye çalışır)
- **Neon Hesabı** (ücretsiz seviye çalışır)
- **GitHub Hesabı** (CI/CD için)
- **Node.js 22+** veya **Bun 1.0+**

---

## Hızlı Başlangıç (5 dakika)

```bash
# 1. Klonla ve yükle
git clone https://github.com/yourusername/openlivestock.git
cd openlivestock
bun install

# 2. Veritabanını kur
bun run db:migrate
bun run db:seed

# 3. Dağıt
bun run deploy
```

---

## Adım 1: Veritabanı Kurulumu (Neon)

### Neon Projesi Oluştur

1. [console.neon.tech](https://console.neon.tech) adresine gidin
2. **New Project**'e tıklayın
3. Kullanıcılarınıza en yakın bölgeyi seçin
4. Bağlantı dizesini kopyalayın

### Veritabanını Yapılandır

```bash
# .env
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
```

### Göçleri Çalıştır

```bash
# Tabloları oluştur
bun run db:migrate

# Başlangıç verilerini ekle (yönetici kullanıcı + referans verileri)
bun run db:seed

# İsteğe bağlı: Test için demo verilerini ekle
bun run db:seed:dev
```

### Veritabanını Doğrula

```bash
# Tabloların var olduğunu kontrol et
bun run db:status

# Veya Neon SQL Düzenleyicisini kullan
# Çalıştır: SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

---

## Adım 2: Cloudflare Workers Kurulumu

### Wrangler CLI'yı Yükle

```bash
npm install -g wrangler
# veya
bun add -g wrangler
```

### Cloudflare'e Giriş Yap

```bash
wrangler login
```

### Worker'ı Yapılandır

`wrangler.jsonc` dosyasını düzenleyin:

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

### Sırları Ayarla

```bash
# Veritabanı bağlantısı
wrangler secret put DATABASE_URL
# Neon bağlantı dizenizi yapıştırın

# Better Auth sırrı (üretmek için: openssl rand -base64 32)
wrangler secret put BETTER_AUTH_SECRET

# İsteğe bağlı: SMS sağlayıcı (Termii)
wrangler secret put TERMII_API_KEY

# İsteğe bağlı: E-posta sağlayıcı (Resend)
wrangler secret put RESEND_API_KEY
```

---

## Adım 3: Derle & Dağıt

### Üretim için Derle

```bash
bun run build
```

Bu, `.output/` içinde optimize edilmiş bir paket oluşturur.

### Cloudflare'e Dağıt

```bash
bun run deploy
# veya
wrangler deploy
```

### Dağıtımı Doğrula

```bash
# Dağıtım durumunu kontrol et
wrangler deployments list

# Günlükleri görüntüle
wrangler tail
```

Uygulamanız şimdi şu adreste yayında: `https://openlivestock-production.your-subdomain.workers.dev`

---

## Adım 4: Özel Etki Alanı (İsteğe Bağlı)

### Cloudflare'e Etki Alanı Ekle

1. Cloudflare Kontrol Paneli → Workers & Pages'e gidin
2. Worker'ınızı seçin
3. **Triggers** → **Custom Domains**'e tıklayın
4. Etki alanınızı ekleyin (örneğin: `app.ciftliginiz.com`)

### DNS'i Güncelle

Cloudflare, DNS kayıtlarını otomatik olarak yapılandırır.

---

## Ortam Değişkenleri

### Gerekli

| Değişken             | Açıklama                   | Örnek                     |
| -------------------- | -------------------------- | ------------------------- |
| `DATABASE_URL`       | Neon PostgreSQL bağlantısı | `postgresql://...`        |
| `BETTER_AUTH_SECRET` | Auth oturum sırrı          | `openssl rand -base64 32` |

### İsteğe Bağlı

| Değişken              | Açıklama                | Varsayılan |
| --------------------- | ----------------------- | ---------- |
| `SMS_PROVIDER`        | SMS hizmeti             | `console`  |
| `EMAIL_PROVIDER`      | E-posta hizmeti         | `console`  |
| `TERMII_API_KEY`      | Termii API anahtarı     | -          |
| `TERMII_SENDER_ID`    | Termii gönderen kimliği | -          |
| `TWILIO_ACCOUNT_SID`  | Twilio hesap SID        | -          |
| `TWILIO_AUTH_TOKEN`   | Twilio auth token       | -          |
| `TWILIO_PHONE_NUMBER` | Twilio telefonu         | -          |
| `RESEND_API_KEY`      | Resend API anahtarı     | -          |
| `SMTP_HOST`           | SMTP sunucusu           | -          |
| `SMTP_PORT`           | SMTP portu              | `587`      |
| `SMTP_USER`           | SMTP kullanıcısı        | -          |
| `SMTP_PASSWORD`       | SMTP şifresi            | -          |
| `SMTP_FROM`           | Gönderen e-posta        | -          |

---

## GitHub Actions ile CI/CD

### İş Akışı Oluştur

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

### GitHub'a Sırları Ekle

1. GitHub deposuna gidin → Settings → Secrets
2. `CLOUDFLARE_API_TOKEN` ekleyin
3. `DATABASE_URL` ekleyin
4. `BETTER_AUTH_SECRET` ekleyin

---

## İzleme & Hata Ayıklama

### Günlükleri Görüntüle

```bash
# Gerçek zamanlı günlükler
wrangler tail

# Duruma göre filtrele
wrangler tail --status error

# Yönteme göre filtrele
wrangler tail --method POST
```

### Performans İzleme

Cloudflare Kontrol Paneli → Workers & Pages → Analytics:

- İstek sayısı
- Hata oranı
- CPU süresi
- Yanıt süresi

### Veritabanı İzleme

Neon Kontrol Paneli → Monitoring:

- Bağlantı sayısı
- Sorgu performansı
- Depolama kullanımı

---

## Ölçeklendirme

### Cloudflare Workers

- **Ücretsiz seviye**: 100.000 istek/gün
- **Ücretli seviye**: Sınırsız istek (5$/ay + 0.50$/milyon istek)
- **Otomatik ölçeklendirme**: Trafik ani artışlarını otomatik olarak yönetir

### Neon Veritabanı

- **Ücretsiz seviye**: 0.5 GB depolama, 1 işlem birimi
- **Ücretli seviye**: İşlem ve depolamayı bağımsız olarak ölçeklendirin
- **Bağlantı havuzu**: Yerleşik, yapılandırma gerekmez

---

## Yedekleme & Kurtarma

### Veritabanı Yedekleri

Neon otomatik yedeklemeler sağlar:

- **Zaman içinde kurtarma**: Son 7 gün içindeki herhangi bir noktaya geri yükleyin (ücretsiz seviye)
- **Manuel yedeklemeler**: Uzun vadeli yedekleme için dal oluşturun

```bash
# Yedekleme dalı oluştur
neon branches create --name backup-2026-01-15
```

### Verileri Dışa Aktar

```bash
# Tüm verileri dışa aktar
pg_dump $DATABASE_URL > backup.sql

# Geri yükle
psql $DATABASE_URL < backup.sql
```

---

## Güvenlik Kontrol Listesi

- [ ] Güçlü bir `BETTER_AUTH_SECRET` kullanın (32+ karakter)
- [ ] Cloudflare WAF'ı (Web Uygulama Güvenlik Duvarı) etkinleştirin
- [ ] Cloudflare'de hız sınırlamayı yapılandırın
- [ ] Tüm sırlar için ortam değişkenlerini kullanın
- [ ] Yalnızca HTTPS'i etkinleştirin (Cloudflare varsayılanı)
- [ ] Neon IP izin verilenler listesini inceleyin (gerekirse)
- [ ] Denetim günlüğünü etkinleştirin
- [ ] İzleme uyarılarını ayarlayın

---

## Sorun Giderme

### Derleme Hataları

**Hata**: `Cannot find module '../db'`

**Çözüm**: Sunucu fonksiyonlarında dinamik içe aktarmaların olduğundan emin olun:

```typescript
const { getDb } = await import('~/lib/db')
const db = await getDb() // ✅
```

### Veritabanı Bağlantı Hataları

**Hata**: `Connection timeout`

**Çözüm**: Neon projesinin aktif olduğunu (askıya alınmadığını) kontrol edin:

```bash
# Veritabanını uyandır
curl $DATABASE_URL
```

### Worker Hataları

**Hata**: `Script startup exceeded CPU limit`

**Çözüm**: Paket boyutunu azaltın:

```bash
# Paketi analiz et
bun run build --analyze

# Büyük bağımlılıkları kontrol et
du -sh node_modules/*
```

### Göç Hataları

**Hata**: `relation "table" already exists`

**Çözüm**: Göç durumunu kontrol edin:

```bash
bun run db:status

# Gerekirse, geri al ve yeniden çalıştır
bun run db:rollback
bun run db:migrate
```

---

## Performans Optimizasyonu

### Cloudflare

- Statik varlıklar için önbelleğe almayı etkinleştirin
- Görüntüler için Cloudflare CDN kullanın
- Brotli sıkıştırmasını etkinleştirin
- Özel önbellek kuralları ayarlayın

### Veritabanı

- Yaygın sorgular için dizinler ekleyin (zaten dahil edilmiş)
- Bağlantı havuzu kullanın (Neon varsayılanı)
- Neon panelinde yavaş sorguları izleyin
- Yüksek trafik için okuma kopyalarını düşünün

### Uygulama

- PWA önbelleğe almayı etkinleştirin
- Görüntüleri optimize edin (WebP formatı)
- Bileşenleri tembel yükleyin (lazy load)
- Pahalı bileşenler için React.memo kullanın

---

## Maliyet Tahmini

### Ücretsiz Seviye (Küçük çiftlikler için uygundur)

- **Cloudflare Workers**: 100.000 istek/gün
- **Neon Veritabanı**: 0.5 GB depolama, 1 işlem birimi
- **Toplam**: 0$/ay

### Ücretli Seviye (Orta ölçekli çiftlikler için uygundur)

- **Cloudflare Workers**: 5$/ay + kullanım
- **Neon Veritabanı**: 19$/ay (2 işlem birimi, 10 GB)
- **Toplam**: ~25$/ay

### Kurumsal (Büyük çiftlikler, birden fazla konum)

- **Cloudflare Workers**: Özel fiyatlandırma
- **Neon Veritabanı**: Özel fiyatlandırma
- **Toplam**: Satış ekibiyle iletişime geçin

---

## Sonraki Adımlar

1. **İzlemeyi ayarlayın**: Hatalar için uyarıları yapılandırın
2. **Yedeklemeleri etkinleştirin**: Düzenli veritabanı yedeklemeleri planlayın
3. **Özel etki alanı**: Çiftliğinizin etki alanını ekleyin
4. **SMS/E-posta**: Üretim sağlayıcılarını yapılandırın
5. **Kullanıcı alımı**: İlk çiftliği oluşturun ve kullanıcıları davet edin

---

## Destek

- **Belgeleme**: [docs/INDEX.md](./INDEX.md)
- **GitHub Sorunları**: [github.com/yourusername/openlivestock/issues](https://github.com/yourusername/openlivestock/issues)
- **Topluluk**: [Discord/Slack bağlantısı]

---

**Son Güncelleme**: 15 Ocak 2026
