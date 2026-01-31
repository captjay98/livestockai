# LivestockAI

<p align="center">
  <img src="../../public/logo-icon.png" alt="LivestockAI Logosu" width="120" />
</p>

<p align="center">
  <strong>6 hayvancılık türünü destekleyen, açık kaynaklı, çevrimdışı öncelikli hayvancılık yönetimi.</strong>
</p>

<p align="center">
  <a href="#özellikler">Özellikler</a> •
  <a href="#hızlı-başlangıç">Hızlı Başlangıç</a> •
  <a href="#dağıtım">Dağıtım</a> •
  <a href="#yapay-zeka-ajanları-için">YZ Ajanları İçin</a> •
  <a href="#katkıda-bulunma">Katkıda Bulunma</a>
</p>

<p align="center">
  🌍 <strong>Diller:</strong>
  <a href="../../README.md">English</a> •
  <a href="README.fr.md">Français</a> •
  <a href="README.pt.md">Português</a> •
  <a href="README.sw.md">Kiswahili</a> •
  <a href="README.es.md">Español</a> •
  <a href="README.hi.md">हिन्दी</a>
</p>

---

## Özellikler

### 🐔 Çok Türlü Hayvancılık Yönetimi

- **Modüler tür desteği** — Kümes Hayvanları (etlik piliç, yumurtacı, hindi, ördek), Su Ürünleri (yayın balığı, tilapia), Sığır, Keçi, Koyun ve Arılar için genişletilebilir mimari ile.
- **Parti yaşam döngüsü takibi** — Edinmeden satışa kadar durum yönetimi (aktif, tükenmiş, satılmış) ile.
- **Türe özgü metrikler** — Yem türleri, büyüme standartları ve türe göre yapı türleri.
- **Çoklu çiftlik desteği** — Tek bir hesaptan birden fazla çiftliği yönetin ve çiftlik bazında filtreleyin.

### 📊 Tahmine Dayalı Analitik & Sağlık İzleme

- **Büyüme tahmini** — Türe özgü büyüme eğrilerini kullanarak hasat tarihlerini ve hedef ağırlıkları tahmin edin.
- **Gelir projeksiyonları** — Mevcut ağırlık örneklerine ve piyasa fiyatlarına dayalı kârı tahmin edin.
- **Ağırlık örneklemesi** — Örneklem büyüklükleri ile ortalama, minimum ve maksimum ağırlıkları takip edin.
- **Ölüm uyarıları** — Partiler normal ölüm eşiklerini aştığında otomatik uyarılar.
- **Ölüm takibi** — Ölümleri nedene göre (hastalık, yırtıcı, hava durumu, bilinmeyen) ve oran analizi ile kaydedin.
- **Aşılama programları** — Aşıları son tarih hatırlatıcıları ile takip edin.
- **Su kalitesi** (Su Ürünleri) — pH, sıcaklık, çözünmüş oksijen, amonyak seviyelerini izleyin.

### 💰 Finansal Yönetim

- **Satış takibi** — Satışları miktar, ağırlık veya birim olarak müşteri bağlantısı ile kaydedin.
- **Gider yönetimi** — Kategorize edilmiş giderler (yem, ilaç, ekipman, işçilik, kamu hizmetleri vb.).
- **Faturalama** — Kalemler ve ödeme durumu takibi ile müşteri faturaları oluşturun.
- **Kâr/Zarar raporları** — Gelir ve gider dökümleri ile dönemsel K/Z analizi.
- **20+ para birimi ön ayarı** — Uluslararası destek (USD, EUR, GBP, NGN, KES, ZAR, INR, TRY vb.).

### 📦 Envanter & Yem

- **Yem envanteri** — Stok seviyelerini düşük eşik uyarıları ile takip edin.
- **İlaç envanteri** — Miktarları son kullanma tarihi takibi ile izleyin.
- **Yem tüketimi** — Maliyet takibi ile parti başına günlük yemlemeyi kaydedin.
- **Yem dönüşüm analizi** — Verimlilik oranlarını (FCR) hesaplayın.

### 👥 CRM & Kişiler

- **Müşteri yönetimi** — Alıcıları iletişim bilgileri ve satın alma geçmişi ile takip edin.
- **Tedarikçi yönetimi** — Kuluçkahaneleri, yem değirmenlerini, eczaneleri, ekipman tedarikçilerini yönetin.
- **Müşteri türleri** — Sınıflandırma: Bireysel, restoran, perakendeci, toptancı.

### 📱 Progresif Web Uygulaması (PWA)

- **Çevrimdışı öncelikli** — İnternet olmadan tam işlevsellik; yeniden bağlandığında senkronize olur.
- **Yüklenebilir** — Mobil ve masaüstünde ana ekrana ekleyin.
- **Otomatik güncellemeler** — Service worker uygulama güncellemelerini sorunsuz bir şekilde halleder.

### 🌍 Uluslararasılaştırma

- **Yapılandırılabilir para birimi** — Sembol, ondalıklar, konum, ayırıcılar.
- **Tarih formatları** — AA/GG/YYYY, GG/AA/YYYY, YYYY-AA-GG.
- **Birimler** — Ağırlık (kg/lbs), alan (m²/sqft), sıcaklık (°C/°F).
- **Zaman formatları** — 12 saatlik veya 24 saatlik saat.

### 📋 Raporlama & Denetim

- **5 rapor türü** — Kâr/Zarar, Envanter, Satış, Yem, Yumurta.
- **Tarih aralığı filtreleme** — Özel dönem analizi.
- **Dışa aktarma yeteneği** — Harici kullanım için raporları indirin.
- **Denetim günlükleri** — Kullanıcı, eylem, varlık takibi ile tam etkinlik geçmişi.

### 🔐 Güvenlik & Kimlik Doğrulama

- **Better Auth** — Güvenli oturum tabanlı kimlik doğrulama.
- **Rol tabanlı erişim** — Yönetici ve personel rolleri.
- **Korunan rotalar** — Tüm çiftlik verileri kimlik doğrulama arkasında.

---

## Ekran Görüntüleri

| Kontrol Paneli                                                 | Parti Yönetimi                                    |
| -------------------------------------------------------------- | ------------------------------------------------- |
| ![Panel](../../public/screenshots/dashboard.png)               | ![Partiler](../../public/screenshots/batches.png) |
| _KPI'lar, uyarılar ve hızlı eylemler ile çiftlik genel bakışı_ | _Durum, tür ve ölüm oranları ile parti listesi_   |

| Parti Detayı                                                | Finansal Raporlar                                 |
| ----------------------------------------------------------- | ------------------------------------------------- |
| ![Parti Detayı](../../public/screenshots/batch-details.png) | ![Raporlar](../../public/screenshots/reports.png) |
| _Büyüme grafiği, projeksiyonlar ve parti zaman çizelgesi_   | _Gider dökümü ile Kâr/Zarar analizi_              |

| Mobil Görünüm                                           | Çevrimdışı Mod                                      |
| ------------------------------------------------------- | --------------------------------------------------- |
| ![Mobil](../../public/screenshots/mobile-dashboard.png) | ![Çevrimdışı](../../public/screenshots/offline.png) |
| _Saha kullanımı için duyarlı tasarım_                   | _İnternet bağlantısı olmadan çalışır_               |

| Ayarlar                                           | Faturalar                                           |
| ------------------------------------------------- | --------------------------------------------------- |
| ![Ayarlar](../../public/screenshots/settings.png) | ![Faturalar](../../public/screenshots/invoices.png) |
| _Para birimi, tarih ve birim tercihleri_          | _Ödeme takibi ile müşteri faturalandırması_         |

## Teknoloji Yığını

| Katman     | Teknoloji                                                           |
| ---------- | ------------------------------------------------------------------- |
| Çerçeve    | [TanStack Start](https://tanstack.com/start) (React 19, SSR)        |
| Veritabanı | [Neon](https://neon.tech) (sunucusuz) üzerinden PostgreSQL          |
| ORM        | [Kysely](https://kysely.dev) (tip güvenli SQL)                      |
| Stil       | [Tailwind CSS v4](https://tailwindcss.com)                          |
| Durum      | [TanStack Query](https://tanstack.com/query) + IndexedDB kalıcılığı |
| Dağıtım    | [Cloudflare Workers](https://workers.cloudflare.com)                |

---

## Hızlı Başlangıç

### Önkoşullar

- **Node.js 22+** (veya Bun 1.0+)
- **Neon hesabı** — [neon.tech](https://neon.tech) adresinde ücretsiz (veritabanı kurulumu otomatiktir)

### 1. Klonla & Yükle

```bash
git clone https://github.com/yourusername/livestock-ai.git
cd livestock-ai
bun install
```

### 2. Otomatik Kurulum

```bash
kiro-cli
@quickstart  # Etkileşimli kurulum sihirbazı
```

Hızlı başlangıç sihirbazı şunları yapacaktır:

- ✅ Ortamınızı kontrol etme (Node, Bun)
- ✅ Neon MCP aracılığıyla veritabanınızı otomatik olarak oluşturma
- ✅ Ortam değişkenlerini yapılandırma
- ✅ Göçleri ve demo verilerini çalıştırma
- ✅ Geliştirme sunucusunu başlatma

### 3. Geliştirmeye Başla

```bash
bun dev  # Eğer otomatik olarak başlatılmadıysa
```

[http://localhost:3001](http://localhost:3001) adresini açın

### Varsayılan Giriş Bilgileri

Seeder'ı çalıştırdıktan sonra, bu varsayılan hesaplarla giriş yapabilirsiniz:

#### Üretim Seeder'ı (`bun run db:seed`)

| Rol      | E-posta                   | Şifre         |
| -------- | ------------------------- | ------------- |
| Yönetici | `admin@livestockai.local` | `password123` |

#### Geliştirme Seeder'ı (`bun run db:seed:dev`)

| Rol      | E-posta                   | Şifre         |
| -------- | ------------------------- | ------------- |
| Yönetici | `admin@livestockai.local` | `password123` |
| Demo     | `demo@livestockai.local`  | `demo123`     |

**⚠️ Güvenlik Notu**: Üretim ortamlarında bu varsayılan şifreleri hemen değiştirin. Ortam değişkenleri aracılığıyla özel kimlik bilgileri ayarlayabilirsiniz:

```env
ADMIN_EMAIL=your-admin@example.com
ADMIN_PASSWORD=your-secure-password
ADMIN_NAME=Adınız
```

### Manuel Kurulum (Alternatif)

Manuel kurulumu tercih ederseniz veya Kiro CLI'nız yoksa:

<details>
<summary>Manuel kurulum talimatlarını genişletmek için tıklayın</summary>

#### Ortamı Yapılandır

```bash
cp .env.example .env
```

`.env` dosyasını değerlerinizle düzenleyin:

```env
# Database - Get a free Neon database at https://neon.tech
DATABASE_URL=postgresql://user:password@your-neon-host/dbname?sslmode=require

# Auth - Generate with: openssl rand -base64 32
BETTER_AUTH_SECRET=your-secret-key-at-least-32-chars
BETTER_AUTH_URL=http://localhost:3001
```

#### Veritabanını Başlat

```bash
bun run db:migrate   # Göçleri çalıştır
bun run db:seed      # Üretim verilerini ekle (yönetici kullanıcı + referans verileri)
```

Demo verileriyle geliştirme için:

```bash
bun run db:seed:dev  # Tam demo verilerini ekle
```

</details>

---

## Dağıtım

### Cloudflare Workers (Önerilen)

1. Wrangler CLI'yı yükleyin:

   ```bash
   bun add -g wrangler
   wrangler login
   ```

2. Sırlarınızı ayarlayın:

   ```bash
   wrangler secret put DATABASE_URL
   wrangler secret put BETTER_AUTH_SECRET
   wrangler secret put BETTER_AUTH_URL
   ```

3. Dağıtın:
   ```bash
   bun run deploy
   ```

### Diğer Platformlar

Uygulama, Node.js destekleyen herhangi bir platforma dağıtılabilir:

- Vercel
- Railway
- Render
- Docker ile kendi sunucunuzda barındırma

---

## Belgeleme

Kullanıcılar, geliştiriciler ve YZ ajanları için kapsamlı kılavuzlar:

| Belge                                              | Açıklama                     | Hedef Kitle        |
| -------------------------------------------------- | ---------------------------- | ------------------ |
| **[../docs/INDEX.md](../docs/INDEX.md)**           | **Belgeleme merkezi**        | Herkes             |
| [../AGENTS.md](../AGENTS.md)                       | YZ ajanı geliştirme kılavuzu | YZ asistanları     |
| [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) | Sistem mimarisi              | Geliştiriciler     |
| [../docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md)     | Üretim dağıtımı              | DevOps             |
| [../docs/TESTING.md](../docs/TESTING.md)           | Test stratejileri            | Geliştiriciler     |
| [../docs/DATABASE.md](../docs/DATABASE.md)         | Veritabanı şeması & Kysely   | Geliştiriciler     |
| [../docs/INTEGRATIONS.md](../docs/INTEGRATIONS.md) | SMS/E-posta sağlayıcıları    | Geliştiriciler     |
| [../DEVLOG.md](../DEVLOG.md)                       | Geliştirme zaman çizelgesi   | Herkes             |
| [../CONTRIBUTING.md](../CONTRIBUTING.md)           | Katkıda bulunma kılavuzu     | Katkıda bulunanlar |

## YZ Ajanları İçin

Bu proje YZ ajanı dostu olacak şekilde tasarlanmıştır. Bu kaynaklara bakın:

| Dosya                                    | Amaç                                         |
| ---------------------------------------- | -------------------------------------------- |
| [../AGENTS.md](../AGENTS.md)             | YZ kodlama asistanları için kapsamlı kılavuz |
| [../DEVLOG.md](../DEVLOG.md)             | Geliştirme zaman çizelgesi ve kararlar       |
| [../.kiro/README.md](../.kiro/README.md) | Kiro CLI yapılandırma kılavuzu               |

### Kiro CLI Kurulumu

Proje, kapsamlı Kiro CLI yapılandırmasını içerir:

**Hızlı Başlangıç:**

```bash
kiro-cli
@quickstart  # Etkileşimli kurulum sihirbazı
```

**Mevcut Ajanlar (7):**

```bash
kiro-cli --agent livestock-specialist  # Alan uzmanlığı
kiro-cli --agent backend-engineer      # DB, API, Kysely
kiro-cli --agent frontend-engineer     # React, UI, PWA
kiro-cli --agent devops-engineer       # Cloudflare, dağıtım
kiro-cli --agent data-analyst          # Analitik, tahmin
kiro-cli --agent qa-engineer           # Test
kiro-cli --agent security-engineer     # Auth, güvenlik
```

Tam belgeleme için [../.kiro/README.md](../.kiro/README.md) dosyasına bakın.

---

## Proje Yapısı

```
├── app/
│   ├── components/     # Yeniden kullanılabilir UI bileşenleri
│   ├── lib/            # İş mantığı & yardımcı programlar
│   │   ├── auth/       # Kimlik Doğrulama (Better Auth)
│   │   ├── batches/    # Parti yönetimi
│   │   ├── db/         # Veritabanı (Kysely + göçler)
│   │   ├── finance/    # Finansal hesaplamalar
│   │   └── ...         # Diğer alan modülleri
│   └── routes/         # TanStack Router sayfaları
├── public/             # Statik varlıklar
├── .kiro/              # YZ ajanı yapılandırması
│   ├── settings/       # MCP yapılandırmaları
│   ├── steering/       # Kodlama yönergeleri
│   └── specs/          # Özellik spesifikasyonları
└── ...
```

---

## Komut Dosyaları (Scripts)

| Komut                 | Açıklama                                        |
| --------------------- | ----------------------------------------------- |
| `bun dev`             | Geliştirme sunucusunu başlat                    |
| `bun build`           | Üretim için derle                               |
| `bun run test`        | Testleri çalıştır                               |
| `bun run lint`        | ESLint çalıştır                                 |
| `bun run check`       | Formatla + lint                                 |
| `bun run db:migrate`  | Veritabanı göçlerini çalıştır                   |
| `bun run db:seed`     | Üretim verilerini ekle (yönetici + referanslar) |
| `bun run db:seed:dev` | Tam demo verilerini ekle                        |
| `bun run db:rollback` | Son göçü geri al                                |
| `bun run deploy`      | Derle & Cloudflare'e dağıt                      |

---

## Katkıda Bulunma

Katkılarınızı bekliyoruz! Lütfen şunlar için [../CONTRIBUTING.md](../CONTRIBUTING.md) dosyasına bakın:

- Geliştirme iş akışı
- Commit kuralları
- Pull request yönergeleri

---

## Lisans

MIT Lisansı — detaylar için [../LICENSE](../LICENSE) dosyasına bakın.

---

<p align="center">
  Her yerdeki çiftçiler için ❤️ ile yapıldı
</p>
