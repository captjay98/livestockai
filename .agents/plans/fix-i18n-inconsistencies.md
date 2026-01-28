# Feature: Fix i18n Translation Inconsistencies

The following plan should be complete, but it's important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils types and models. Import from the right files etc.

## Feature Description

Fix critical i18n inconsistencies across 15 language locales (21,069 total lines) to ensure complete translation coverage and consistent user experience for all supported languages, with special focus on Nigerian languages (Hausa, Yoruba, Igbo) which represent the primary user base.

## User Story

As a non-English speaking farmer using OpenLivestock
I want to see all interface text and error messages in my selected language
So that I can effectively manage my farm without language barriers

## Problem Statement

The i18n implementation has three critical issues:

1. **English locale incomplete**: Missing 26 keys that exist in all other languages, causing fallback to key names for English users
2. **Untranslated error messages**: 36 error messages across all non-English languages contain English text instead of translations
3. **Key count inconsistency**: English has 979 keys while other languages have 1,004-1,009 keys, with French having 5 unique extra keys

These issues break the user experience for non-English speakers and create maintenance complexity.

## Solution Statement

Systematically add missing keys to English locale, translate all error messages into 14 non-English languages, and normalize key structure across all 15 locales to achieve 100% translation parity.

## Feature Metadata

**Feature Type**: Bug Fix / Enhancement
**Estimated Complexity**: Medium
**Primary Systems Affected**: i18n localization system (app/features/i18n/locales/)
**Dependencies**: None (pure translation work)

---

## CONTEXT REFERENCES

### Relevant Codebase Files IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

- `app/features/i18n/locales/en.ts` (entire file) - Why: Base locale that needs 26 missing keys added
- `app/features/i18n/locales/ha.ts` (lines 471-495, 1016-1030) - Why: Contains untranslated error patterns to fix
- `app/features/i18n/locales/yo.ts` (lines 471-495, 1016-1030) - Why: Contains untranslated error patterns to fix
- `app/features/i18n/locales/ig.ts` (lines 471-495, 1016-1030) - Why: Contains untranslated error patterns to fix
- `app/features/i18n/locales/fr.ts` (entire file) - Why: Has 5 extra batch status keys to evaluate
- `app/routes/_auth/reports/index.tsx` (lines 739-809) - Why: Uses feed.summary._ and eggs.columns._ keys

### New Files to Create

None - all changes are updates to existing locale files

### Relevant Documentation YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- [react-i18next Documentation](https://react.i18next.com/latest/usetranslation-hook)
    - Specific section: Translation key structure
    - Why: Understand proper key naming and nesting conventions
- [i18next Interpolation](https://www.i18next.com/translation-function/interpolation)
    - Specific section: Variable interpolation syntax
    - Why: Ensure error messages with variables are properly formatted

### Patterns to Follow

**Key Structure Pattern:**

```typescript
// From ha.ts - proper nested structure
common: {
  units: {
    title: "Raka'o'in Auna",
    weight: 'Nauyi',
    area: 'Yanki',
    temperature: 'Zafin jiki',
  },
  formats: {
    us: 'MM/DD/YYYY (US)',
    eu: 'DD/MM/YYYY (UK/EU)',
    iso: 'YYYY-MM-DD (ISO)',
    h12: '12-hour (2:30 PM)',
    h24: '24-hour (14:30)',
  },
}
```

**Error Message Pattern:**

```typescript
// Current (WRONG - English in non-English files)
errors: {
  refresh: 'Failed to refresh users',  // ❌
}

// Target (CORRECT - translated)
errors: {
  refresh: 'An kasa sabunta masu amfani',  // ✅ Hausa
}
```

**Translation Consistency:**

- All keys must exist in ALL 15 languages
- Error messages must be culturally appropriate
- Technical terms (e.g., "Batch", "Farm") may remain in English if no good translation exists
- Maintain consistent tone across languages

---

## IMPLEMENTATION PLAN

### Phase 1: English Locale Completion

Add 26 missing keys to English locale to achieve parity with other languages.

**Tasks:**

- Add common.formats.\* keys (5 keys)
- Add common.units.\* keys (4 keys)
- Add eggs.columns.\* keys (5 keys)
- Add eggs.summary.\* keys (3 keys)
- Add feed.columns.\* keys (4 keys)
- Add feed.summary.\* keys (3 keys)
- Add farms.create and mortality.records (2 keys)

### Phase 2: Error Message Translation

Translate 36 English error messages into 14 non-English languages (504 total translations).

**Tasks:**

- Translate batches.errors.\* (17 messages × 14 languages = 238 translations)
- Translate settings.users.errors.\* (13 messages × 14 languages = 182 translations)
- Translate customers.errors.\* (2 messages × 14 languages = 28 translations)
- Translate auth.login.errors.\* (4 messages × 14 languages = 56 translations)

### Phase 3: French Locale Normalization

Evaluate and handle 5 extra batch status keys in French locale.

**Tasks:**

- Determine if batches.active, .allStatus, .allTypes, .depleted, .sold are used
- Either add to all languages or remove from French
- Validate key count parity across all languages

### Phase 4: Validation & Quality Assurance

Ensure 100% translation parity and no regressions.

**Tasks:**

- Run key count validation across all 15 languages
- Verify no English text remains in non-English files
- Test key usage in UI components
- Validate file sizes remain reasonable

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

### UPDATE app/features/i18n/locales/en.ts

- **IMPLEMENT**: Add 26 missing keys to achieve parity with other languages
- **PATTERN**: Mirror structure from ha.ts lines 75-85 (common.units), lines 86-92 (common.formats)
- **LOCATION**: Insert after line 82 (after common.units.fahrenheit)
- **GOTCHA**: Maintain alphabetical ordering within sections
- **VALIDATE**: `node -e "const en = require('./app/features/i18n/locales/en.ts').en; console.log(Object.keys(en.common.units).length === 13 ? 'PASS' : 'FAIL')"`

**Add to common.units (after fahrenheit):**

```typescript
title: 'Units of Measurement',
weight: 'Weight',
area: 'Area',
temperature: 'Temperature',
```

**Add to common (after units object):**

```typescript
formats: {
  us: 'MM/DD/YYYY (US)',
  eu: 'DD/MM/YYYY (UK/EU)',
  iso: 'YYYY-MM-DD (ISO)',
  h12: '12-hour (2:30 PM)',
  h24: '24-hour (14:30)',
},
```

**Add to eggs object (after error section):**

```typescript
columns: {
  date: 'Date',
  collected: 'Collected',
  broken: 'Broken',
  sold: 'Sold',
  inventory: 'Inventory',
},
summary: {
  totalCollected: 'Total Collected',
  totalSold: 'Total Sold',
  totalBroken: 'Total Broken',
},
```

**Add to feed object (after dialog section):**

```typescript
columns: {
  species: 'Species',
  type: 'Feed Type',
  quantity: 'Quantity',
  cost: 'Cost',
},
summary: {
  totalFeed: 'Total Feed',
  totalCost: 'Total Cost',
  byType: 'By Feed Type',
},
```

**Add to farms object (after error section):**

```typescript
create: 'Failed to create farm',
```

**Add to mortality object (after notesPlaceholder):**

```typescript
records: 'Mortality Records',
```

---

### UPDATE app/features/i18n/locales/ha.ts

- **IMPLEMENT**: Translate 36 English error messages to Hausa
- **PATTERN**: Use existing Hausa translations as reference for tone and style
- **IMPORTS**: None required
- **GOTCHA**: Maintain technical terms like "Batch", "Farm" if no good Hausa equivalent
- **VALIDATE**: `grep -c "Failed to" app/features/i18n/locales/ha.ts` (should return 0)

**Replace batches.errors (lines 471-491):**

```typescript
errors: {
  UNAUTHORIZED: 'Da fatan shiga don ci gaba',
  SESSION_EXPIRED: 'Lokacin ku ya ƙare. Da fatan sake shiga',
  INVALID_CREDENTIALS: 'Imel ko kalmar sirri ba daidai ba',
  ACCESS_DENIED: 'Ba ku da izinin samun wannan',
  BANNED: 'An dakatar da asusun ku',
  NOT_FOUND: 'Ba a sami abin da ake nema ba',
  FARM_NOT_FOUND: 'Ba a sami gona ba',
  BATCH_NOT_FOUND: 'Ba a sami rukuni ba',
  CUSTOMER_NOT_FOUND: 'Ba a sami abokin ciniki ba',
  SUPPLIER_NOT_FOUND: 'Ba a sami mai sayarwa ba',
  INVOICE_NOT_FOUND: 'Ba a sami rasiti ba',
  STRUCTURE_NOT_FOUND: 'Ba a sami tsari ba',
  SALE_NOT_FOUND: 'Ba a sami kasuwanci ba',
  VALIDATION_ERROR: 'Da fatan duba shigarwar ku kuma sake gwadawa',
  INVALID_INPUT: 'Shigarwar da aka bayar ba daidai ba ce',
  INSUFFICIENT_STOCK: 'Babu isasshen kaya',
  INTERNAL_ERROR: 'Wani abu ya yi kuskure. Da fatan sake gwadawa daga baya',
  DATABASE_ERROR: 'Kuskuren bayanai ya faru. Da fatan sake gwadawa',
  update: 'An kasa sabunta rukuni',
  delete: 'An kasa goge rukuni',
},
```

**Replace settings.users.errors (lines 1016-1027):**

```typescript
errors: {
  refresh: 'An kasa sabunta masu amfani',
  loadAssignments: 'An kasa loda ƙaddamar da gona',
  ban: 'An kasa hana mai amfani',
  unban: 'An kasa yarda da mai amfani',
  delete: 'An kasa goge mai amfani',
  role: 'An kasa sabunta matsayi',
  create: 'An kasa ƙirƙirar mai amfani',
  resetPassword: 'An kasa sake saita kalmar sirri',
  assignFarm: 'An kasa ƙaddamar da gona',
  updateFarmRole: 'An kasa sabunta matsayi',
  removeFromFarm: 'An kasa cirewa daga gona',
},
```

**Replace customers.errors (lines 1363-1365):**

```typescript
errors: {
  create: 'An kasa ƙirƙirar abokin ciniki',
  delete: 'An kasa goge abokin ciniki',
},
```

**Replace auth.login.errors (lines 1196-1199):**

```typescript
errors: {
  invalid_credentials: 'Imel ko kalmar sirri ba daidai ba',
  default: 'Shiga ya kasa',
  unexpected: 'Kuskure maras tsammani ya faru',
},
```

---

### UPDATE app/features/i18n/locales/yo.ts

- **IMPLEMENT**: Translate 36 English error messages to Yoruba
- **PATTERN**: Mirror Hausa translation structure
- **GOTCHA**: Yoruba uses different diacritics (ẹ, ọ, ṣ) - ensure proper Unicode
- **VALIDATE**: `grep -c "Failed to" app/features/i18n/locales/yo.ts` (should return 0)

**Replace batches.errors (lines 471-491):**

```typescript
errors: {
  UNAUTHORIZED: 'Jọwọ wọle lati tẹsiwaju',
  SESSION_EXPIRED: 'Akoko rẹ ti pari. Jọwọ wọle lẹẹkansi',
  INVALID_CREDENTIALS: 'Imeeli tabi ọrọigbaniwọle ko tọ',
  ACCESS_DENIED: 'O ko ni igbanilaaye lati wọle si eyi',
  BANNED: 'A ti duro akọọlẹ rẹ',
  NOT_FOUND: 'A ko ri ohun ti a beere',
  FARM_NOT_FOUND: 'A ko ri oko',
  BATCH_NOT_FOUND: 'A ko ri ọwọ́',
  CUSTOMER_NOT_FOUND: 'A ko ri onibara',
  SUPPLIER_NOT_FOUND: 'A ko ri olupese',
  INVOICE_NOT_FOUND: 'A ko ri risiti',
  STRUCTURE_NOT_FOUND: 'A ko ri ilana',
  SALE_NOT_FOUND: 'A ko ri titaja',
  VALIDATION_ERROR: 'Jọwọ ṣayẹwo titẹ sii rẹ ki o si gbiyanju lẹẹkansi',
  INVALID_INPUT: 'Titẹ sii ti ko tọ ni a pese',
  INSUFFICIENT_STOCK: 'Ọja ko to',
  INTERNAL_ERROR: 'Nkan kan ṣẹlẹ. Jọwọ gbiyanju lẹẹkansi nigbamii',
  DATABASE_ERROR: 'Aṣiṣe data ṣẹlẹ. Jọwọ gbiyanju lẹẹkansi',
  update: 'Kuna lati ṣe imudojuiwọn ọwọ́',
  delete: 'Kuna lati pa ọwọ́ rẹ',
},
```

**Replace settings.users.errors (lines 1016-1027):**

```typescript
errors: {
  refresh: 'Kuna lati ṣe imudojuiwọn awọn olumulo',
  loadAssignments: 'Kuna lati ṣii awọn iṣẹ ipinlẹ oko',
  ban: 'Kuna lati ṣe idena olumulo',
  unban: 'Kuna lati gba olumulo laaye',
  delete: 'Kuna lati pa olumulo rẹ',
  role: 'Kuna lati ṣe imudojuiwọn ipa',
  create: 'Kuna lati ṣẹda olumulo',
  resetPassword: 'Kuna lati tun ọrọ aṣina ṣe',
  assignFarm: 'Kuna lati yan oko',
  updateFarmRole: 'Kuna lati ṣe imudojuiwọn ipa',
  removeFromFarm: 'Kuna lati yọ kuro lati oko',
},
```

**Replace customers.errors (lines 1363-1365):**

```typescript
errors: {
  create: 'Kuna lati ṣẹda onibara',
  delete: 'Kuna lati pa onibara rẹ',
},
```

**Replace auth.login.errors (lines 1196-1199):**

```typescript
errors: {
  invalid_credentials: 'Imeeli tabi ọrọigbaniwọle ko tọ',
  default: 'Wiwọle kuna',
  unexpected: 'Aṣiṣe airotẹlẹ ṣẹlẹ',
},
```

---

### UPDATE app/features/i18n/locales/ig.ts

- **IMPLEMENT**: Translate 36 English error messages to Igbo
- **PATTERN**: Mirror Hausa/Yoruba translation structure
- **GOTCHA**: Igbo uses special characters (ị, ọ, ụ, ṅ) - ensure proper Unicode
- **VALIDATE**: `grep -c "Failed to" app/features/i18n/locales/ig.ts` (should return 0)

**Replace batches.errors (lines 471-491):**

```typescript
errors: {
  UNAUTHORIZED: 'Biko banye iji gaa n'ihu',
  SESSION_EXPIRED: 'Oge gị agwụla. Biko banye ọzọ',
  INVALID_CREDENTIALS: 'Email ma ọ bụ okwuntughe adịghị mma',
  ACCESS_DENIED: 'I nweghị ikike ịnweta nke a',
  BANNED: 'Akwụsịla akaụntụ gị',
  NOT_FOUND: 'Achọtaghị ihe a chọrọ',
  FARM_NOT_FOUND: 'Achọtaghị ugbo',
  BATCH_NOT_FOUND: 'Achọtaghị ìgwè',
  CUSTOMER_NOT_FOUND: 'Achọtaghị onye ahịa',
  SUPPLIER_NOT_FOUND: 'Achọtaghị onye nkwanye',
  INVOICE_NOT_FOUND: 'Achọtaghị invois',
  STRUCTURE_NOT_FOUND: 'Achọtaghị nhazi',
  SALE_NOT_FOUND: 'Achọtaghị ahịa',
  VALIDATION_ERROR: 'Biko lelee ntinye gị wee nwalee ọzọ',
  INVALID_INPUT: 'Ntinye ezighi ezi',
  INSUFFICIENT_STOCK: 'Ngwaahịa ezughi',
  INTERNAL_ERROR: 'Ihe adịghị mma mere. Biko nwalee ọzọ mgbe e mesịrị',
  DATABASE_ERROR: 'Njehie data mere. Biko nwalee ọzọ',
  update: 'Emeghị imelite ìgwè',
  delete: 'Emeghị ihichapụ ìgwè',
},
```

**Replace settings.users.errors (lines 1016-1027):**

```typescript
errors: {
  refresh: 'Emeghị imelite ndị ọrụ',
  loadAssignments: 'Emeghị ibunye ọrụ ugbo',
  ban: 'Emeghị imachibido onye ọrụ',
  unban: 'Emeghị ikwere onye ọrụ',
  delete: 'Emeghị ihichapụ onye ọrụ',
  role: 'Emeghị imelite ọrụ',
  create: 'Emeghị imepụta onye ọrụ',
  resetPassword: 'Emeghị itọgharịa okwuntughe',
  assignFarm: 'Emeghị ikenye ugbo',
  updateFarmRole: 'Emeghị imelite ọrụ',
  removeFromFarm: 'Emeghị iwepụ na ugbo',
},
```

**Replace customers.errors (lines 1363-1365):**

```typescript
errors: {
  create: 'Emeghị imepụta onye ahịa',
  delete: 'Emeghị ihichapụ onye ahịa',
},
```

**Replace auth.login.errors (lines 1196-1199):**

```typescript
errors: {
  invalid_credentials: 'Email ma ọ bụ okwuntughe adịghị mma',
  default: 'Mbanye emeghị',
  unexpected: 'Njehie a na-atụghị anya ya mere',
},
```

---

### UPDATE app/features/i18n/locales/fr.ts

- **IMPLEMENT**: Translate 36 English error messages to French + evaluate 5 extra batch keys
- **PATTERN**: Professional French tone, formal "vous" form
- **GOTCHA**: French uses accents (é, è, à, ç) - ensure proper Unicode
- **VALIDATE**: `grep -c "Failed to" app/features/i18n/locales/fr.ts` (should return 0)

**Replace batches.errors:**

```typescript
errors: {
  UNAUTHORIZED: 'Veuillez vous connecter pour continuer',
  SESSION_EXPIRED: 'Votre session a expiré. Veuillez vous reconnecter',
  INVALID_CREDENTIALS: 'Email ou mot de passe invalide',
  ACCESS_DENIED: "Vous n'avez pas la permission d'accéder à cette ressource",
  BANNED: 'Votre compte a été suspendu',
  NOT_FOUND: 'La ressource demandée est introuvable',
  FARM_NOT_FOUND: 'Ferme introuvable',
  BATCH_NOT_FOUND: 'Lot introuvable',
  CUSTOMER_NOT_FOUND: 'Client introuvable',
  SUPPLIER_NOT_FOUND: 'Fournisseur introuvable',
  INVOICE_NOT_FOUND: 'Facture introuvable',
  STRUCTURE_NOT_FOUND: 'Structure introuvable',
  SALE_NOT_FOUND: 'Vente introuvable',
  VALIDATION_ERROR: 'Veuillez vérifier votre saisie et réessayer',
  INVALID_INPUT: 'Saisie invalide fournie',
  INSUFFICIENT_STOCK: 'Stock insuffisant disponible',
  INTERNAL_ERROR: "Une erreur s'est produite. Veuillez réessayer plus tard",
  DATABASE_ERROR: "Une erreur de base de données s'est produite. Veuillez réessayer",
  update: 'Échec de la mise à jour du lot',
  delete: 'Échec de la suppression du lot',
},
```

**Replace settings.users.errors:**

```typescript
errors: {
  refresh: 'Échec de l\'actualisation des utilisateurs',
  loadAssignments: 'Échec du chargement des affectations de ferme',
  ban: 'Échec du bannissement de l\'utilisateur',
  unban: 'Échec du débannissement de l\'utilisateur',
  delete: 'Échec de la suppression de l\'utilisateur',
  role: 'Échec de la mise à jour du rôle',
  create: 'Échec de la création de l\'utilisateur',
  resetPassword: 'Échec de la réinitialisation du mot de passe',
  assignFarm: 'Échec de l\'affectation de la ferme',
  updateFarmRole: 'Échec de la mise à jour du rôle',
  removeFromFarm: 'Échec du retrait de la ferme',
},
```

**Replace customers.errors:**

```typescript
errors: {
  create: 'Échec de la création du client',
  delete: 'Échec de la suppression du client',
},
```

**Replace auth.login.errors:**

```typescript
errors: {
  invalid_credentials: 'Email ou mot de passe invalide',
  default: 'Échec de la connexion',
  unexpected: 'Une erreur inattendue s\'est produite',
},
```

**Decision on extra batch keys (batches.active, .allStatus, .allTypes, .depleted, .sold):**

- REMOVE these 5 keys from French locale (not used in codebase, redundant with batches.statuses.\*)

---

### UPDATE app/features/i18n/locales/es.ts

- **IMPLEMENT**: Translate 36 English error messages to Spanish
- **PATTERN**: Professional Spanish tone, formal "usted" form
- **VALIDATE**: `grep -c "Failed to" app/features/i18n/locales/es.ts` (should return 0)

**Replace batches.errors:**

```typescript
errors: {
  UNAUTHORIZED: 'Por favor inicie sesión para continuar',
  SESSION_EXPIRED: 'Su sesión ha expirado. Por favor inicie sesión nuevamente',
  INVALID_CREDENTIALS: 'Correo electrónico o contraseña inválidos',
  ACCESS_DENIED: 'No tiene permiso para acceder a este recurso',
  BANNED: 'Su cuenta ha sido suspendida',
  NOT_FOUND: 'No se encontró el recurso solicitado',
  FARM_NOT_FOUND: 'Granja no encontrada',
  BATCH_NOT_FOUND: 'Lote no encontrado',
  CUSTOMER_NOT_FOUND: 'Cliente no encontrado',
  SUPPLIER_NOT_FOUND: 'Proveedor no encontrado',
  INVOICE_NOT_FOUND: 'Factura no encontrada',
  STRUCTURE_NOT_FOUND: 'Estructura no encontrada',
  SALE_NOT_FOUND: 'Venta no encontrada',
  VALIDATION_ERROR: 'Por favor verifique su entrada e intente nuevamente',
  INVALID_INPUT: 'Entrada inválida proporcionada',
  INSUFFICIENT_STOCK: 'Stock insuficiente disponible',
  INTERNAL_ERROR: 'Algo salió mal. Por favor intente nuevamente más tarde',
  DATABASE_ERROR: 'Ocurrió un error de base de datos. Por favor intente nuevamente',
  update: 'Error al actualizar el lote',
  delete: 'Error al eliminar el lote',
},
```

**Replace settings.users.errors:**

```typescript
errors: {
  refresh: 'Error al actualizar usuarios',
  loadAssignments: 'Error al cargar asignaciones de granja',
  ban: 'Error al suspender usuario',
  unban: 'Error al reactivar usuario',
  delete: 'Error al eliminar usuario',
  role: 'Error al actualizar rol',
  create: 'Error al crear usuario',
  resetPassword: 'Error al restablecer contraseña',
  assignFarm: 'Error al asignar granja',
  updateFarmRole: 'Error al actualizar rol',
  removeFromFarm: 'Error al remover de la granja',
},
```

**Replace customers.errors:**

```typescript
errors: {
  create: 'Error al crear cliente',
  delete: 'Error al eliminar cliente',
},
```

**Replace auth.login.errors:**

```typescript
errors: {
  invalid_credentials: 'Correo electrónico o contraseña inválidos',
  default: 'Error al iniciar sesión',
  unexpected: 'Ocurrió un error inesperado',
},
```

---

### UPDATE app/features/i18n/locales/pt.ts

- **IMPLEMENT**: Translate 36 English error messages to Portuguese (Brazilian)
- **PATTERN**: Brazilian Portuguese, informal "você" form
- **VALIDATE**: `grep -c "Failed to" app/features/i18n/locales/pt.ts` (should return 0)

**Replace batches.errors:**

```typescript
errors: {
  UNAUTHORIZED: 'Por favor faça login para continuar',
  SESSION_EXPIRED: 'Sua sessão expirou. Por favor faça login novamente',
  INVALID_CREDENTIALS: 'Email ou senha inválidos',
  ACCESS_DENIED: 'Você não tem permissão para acessar este recurso',
  BANNED: 'Sua conta foi suspensa',
  NOT_FOUND: 'O recurso solicitado não foi encontrado',
  FARM_NOT_FOUND: 'Fazenda não encontrada',
  BATCH_NOT_FOUND: 'Lote não encontrado',
  CUSTOMER_NOT_FOUND: 'Cliente não encontrado',
  SUPPLIER_NOT_FOUND: 'Fornecedor não encontrado',
  INVOICE_NOT_FOUND: 'Fatura não encontrada',
  STRUCTURE_NOT_FOUND: 'Estrutura não encontrada',
  SALE_NOT_FOUND: 'Venda não encontrada',
  VALIDATION_ERROR: 'Por favor verifique sua entrada e tente novamente',
  INVALID_INPUT: 'Entrada inválida fornecida',
  INSUFFICIENT_STOCK: 'Estoque insuficiente disponível',
  INTERNAL_ERROR: 'Algo deu errado. Por favor tente novamente mais tarde',
  DATABASE_ERROR: 'Ocorreu um erro no banco de dados. Por favor tente novamente',
  update: 'Falha ao atualizar lote',
  delete: 'Falha ao excluir lote',
},
```

**Replace settings.users.errors:**

```typescript
errors: {
  refresh: 'Falha ao atualizar usuários',
  loadAssignments: 'Falha ao carregar atribuições de fazenda',
  ban: 'Falha ao banir usuário',
  unban: 'Falha ao desbanir usuário',
  delete: 'Falha ao excluir usuário',
  role: 'Falha ao atualizar função',
  create: 'Falha ao criar usuário',
  resetPassword: 'Falha ao redefinir senha',
  assignFarm: 'Falha ao atribuir fazenda',
  updateFarmRole: 'Falha ao atualizar função',
  removeFromFarm: 'Falha ao remover da fazenda',
},
```

**Replace customers.errors:**

```typescript
errors: {
  create: 'Falha ao criar cliente',
  delete: 'Falha ao excluir cliente',
},
```

**Replace auth.login.errors:**

```typescript
errors: {
  invalid_credentials: 'Email ou senha inválidos',
  default: 'Falha no login',
  unexpected: 'Ocorreu um erro inesperado',
},
```

---

### UPDATE app/features/i18n/locales/sw.ts

- **IMPLEMENT**: Translate 36 English error messages to Swahili
- **PATTERN**: Standard Swahili, polite form
- **VALIDATE**: `grep -c "Failed to" app/features/i18n/locales/sw.ts` (should return 0)

**Replace batches.errors:**

```typescript
errors: {
  UNAUTHORIZED: 'Tafadhali ingia ili kuendelea',
  SESSION_EXPIRED: 'Kipindi chako kimeisha. Tafadhali ingia tena',
  INVALID_CREDENTIALS: 'Barua pepe au nenosiri si sahihi',
  ACCESS_DENIED: 'Huna ruhusa ya kufikia rasilimali hii',
  BANNED: 'Akaunti yako imesimamishwa',
  NOT_FOUND: 'Rasilimali iliyoombwa haikupatikana',
  FARM_NOT_FOUND: 'Shamba halijapatikana',
  BATCH_NOT_FOUND: 'Kundi halijapatikana',
  CUSTOMER_NOT_FOUND: 'Mteja hajapatikana',
  SUPPLIER_NOT_FOUND: 'Muuzaji hajapatikana',
  INVOICE_NOT_FOUND: 'Ankara haijapatikana',
  STRUCTURE_NOT_FOUND: 'Muundo haujapatikana',
  SALE_NOT_FOUND: 'Mauzo hayajapatikana',
  VALIDATION_ERROR: 'Tafadhali angalia ingizo lako na ujaribu tena',
  INVALID_INPUT: 'Ingizo lisilo sahihi limetolewa',
  INSUFFICIENT_STOCK: 'Hisa haitoshi',
  INTERNAL_ERROR: 'Kuna hitilafu. Tafadhali jaribu tena baadaye',
  DATABASE_ERROR: 'Hitilafu ya hifadhidata imetokea. Tafadhali jaribu tena',
  update: 'Imeshindwa kusasisha kundi',
  delete: 'Imeshindwa kufuta kundi',
},
```

**Replace settings.users.errors:**

```typescript
errors: {
  refresh: 'Imeshindwa kusasisha watumiaji',
  loadAssignments: 'Imeshindwa kupakia mgawo wa shamba',
  ban: 'Imeshindwa kuzuia mtumiaji',
  unban: 'Imeshindwa kuruhusu mtumiaji',
  delete: 'Imeshindwa kufuta mtumiaji',
  role: 'Imeshindwa kusasisha jukumu',
  create: 'Imeshindwa kuunda mtumiaji',
  resetPassword: 'Imeshindwa kuweka upya nenosiri',
  assignFarm: 'Imeshindwa kugawa shamba',
  updateFarmRole: 'Imeshindwa kusasisha jukumu',
  removeFromFarm: 'Imeshindwa kuondoa kutoka shamba',
},
```

**Replace customers.errors:**

```typescript
errors: {
  create: 'Imeshindwa kuunda mteja',
  delete: 'Imeshindwa kufuta mteja',
},
```

**Replace auth.login.errors:**

```typescript
errors: {
  invalid_credentials: 'Barua pepe au nenosiri si sahihi',
  default: 'Kuingia kumeshindwa',
  unexpected: 'Hitilafu isiyotarajiwa imetokea',
},
```

---

### UPDATE app/features/i18n/locales/hi.ts

- **IMPLEMENT**: Translate 36 English error messages to Hindi
- **PATTERN**: Formal Hindi with Devanagari script
- **GOTCHA**: Hindi uses Devanagari script - ensure proper Unicode rendering
- **VALIDATE**: `grep -c "Failed to" app/features/i18n/locales/hi.ts` (should return 0)

**Replace batches.errors:**

```typescript
errors: {
  UNAUTHORIZED: 'कृपया जारी रखने के लिए साइन इन करें',
  SESSION_EXPIRED: 'आपका सत्र समाप्त हो गया है। कृपया फिर से साइन इन करें',
  INVALID_CREDENTIALS: 'अमान्य ईमेल या पासवर्ड',
  ACCESS_DENIED: 'आपके पास इस संसाधन तक पहुंचने की अनुमति नहीं है',
  BANNED: 'आपका खाता निलंबित कर दिया गया है',
  NOT_FOUND: 'अनुरोधित संसाधन नहीं मिला',
  FARM_NOT_FOUND: 'फार्म नहीं मिला',
  BATCH_NOT_FOUND: 'बैच नहीं मिला',
  CUSTOMER_NOT_FOUND: 'ग्राहक नहीं मिला',
  SUPPLIER_NOT_FOUND: 'आपूर्तिकर्ता नहीं मिला',
  INVOICE_NOT_FOUND: 'चालान नहीं मिला',
  STRUCTURE_NOT_FOUND: 'संरचना नहीं मिली',
  SALE_NOT_FOUND: 'बिक्री नहीं मिली',
  VALIDATION_ERROR: 'कृपया अपना इनपुट जांचें और पुनः प्रयास करें',
  INVALID_INPUT: 'अमान्य इनपुट प्रदान किया गया',
  INSUFFICIENT_STOCK: 'पर्याप्त स्टॉक उपलब्ध नहीं है',
  INTERNAL_ERROR: 'कुछ गलत हो गया। कृपया बाद में पुनः प्रयास करें',
  DATABASE_ERROR: 'डेटाबेस त्रुटि हुई। कृपया पुनः प्रयास करें',
  update: 'बैच अपडेट करने में विफल',
  delete: 'बैच हटाने में विफल',
},
```

**Replace settings.users.errors:**

```typescript
errors: {
  refresh: 'उपयोगकर्ताओं को रीफ्रेश करने में विफल',
  loadAssignments: 'फार्म असाइनमेंट लोड करने में विफल',
  ban: 'उपयोगकर्ता को प्रतिबंधित करने में विफल',
  unban: 'उपयोगकर्ता को अनबैन करने में विफल',
  delete: 'उपयोगकर्ता को हटाने में विफल',
  role: 'भूमिका अपडेट करने में विफल',
  create: 'उपयोगकर्ता बनाने में विफल',
  resetPassword: 'पासवर्ड रीसेट करने में विफल',
  assignFarm: 'फार्म असाइन करने में विफल',
  updateFarmRole: 'भूमिका अपडेट करने में विफल',
  removeFromFarm: 'फार्म से हटाने में विफल',
},
```

**Replace customers.errors:**

```typescript
errors: {
  create: 'ग्राहक बनाने में विफल',
  delete: 'ग्राहक हटाने में विफल',
},
```

**Replace auth.login.errors:**

```typescript
errors: {
  invalid_credentials: 'अमान्य ईमेल या पासवर्ड',
  default: 'लॉगिन विफल',
  unexpected: 'एक अप्रत्याशित त्रुटि हुई',
},
```

---

### UPDATE app/features/i18n/locales/tr.ts

- **IMPLEMENT**: Translate 36 English error messages to Turkish
- **PATTERN**: Formal Turkish tone
- **VALIDATE**: `grep -c "Failed to" app/features/i18n/locales/tr.ts` (should return 0)

**Replace batches.errors:**

```typescript
errors: {
  UNAUTHORIZED: 'Devam etmek için lütfen giriş yapın',
  SESSION_EXPIRED: 'Oturumunuz sona erdi. Lütfen tekrar giriş yapın',
  INVALID_CREDENTIALS: 'Geçersiz e-posta veya şifre',
  ACCESS_DENIED: 'Bu kaynağa erişim izniniz yok',
  BANNED: 'Hesabınız askıya alındı',
  NOT_FOUND: 'İstenen kaynak bulunamadı',
  FARM_NOT_FOUND: 'Çiftlik bulunamadı',
  BATCH_NOT_FOUND: 'Parti bulunamadı',
  CUSTOMER_NOT_FOUND: 'Müşteri bulunamadı',
  SUPPLIER_NOT_FOUND: 'Tedarikçi bulunamadı',
  INVOICE_NOT_FOUND: 'Fatura bulunamadı',
  STRUCTURE_NOT_FOUND: 'Yapı bulunamadı',
  SALE_NOT_FOUND: 'Satış bulunamadı',
  VALIDATION_ERROR: 'Lütfen girişinizi kontrol edin ve tekrar deneyin',
  INVALID_INPUT: 'Geçersiz giriş sağlandı',
  INSUFFICIENT_STOCK: 'Yeterli stok yok',
  INTERNAL_ERROR: 'Bir şeyler yanlış gitti. Lütfen daha sonra tekrar deneyin',
  DATABASE_ERROR: 'Veritabanı hatası oluştu. Lütfen tekrar deneyin',
  update: 'Parti güncellenemedi',
  delete: 'Parti silinemedi',
},
```

**Replace settings.users.errors:**

```typescript
errors: {
  refresh: 'Kullanıcılar yenilenemedi',
  loadAssignments: 'Çiftlik atamaları yüklenemedi',
  ban: 'Kullanıcı yasaklanamadı',
  unban: 'Kullanıcı yasağı kaldırılamadı',
  delete: 'Kullanıcı silinemedi',
  role: 'Rol güncellenemedi',
  create: 'Kullanıcı oluşturulamadı',
  resetPassword: 'Şifre sıfırlanamadı',
  assignFarm: 'Çiftlik atanamadı',
  updateFarmRole: 'Rol güncellenemedi',
  removeFromFarm: 'Çiftlikten kaldırılamadı',
},
```

**Replace customers.errors:**

```typescript
errors: {
  create: 'Müşteri oluşturulamadı',
  delete: 'Müşteri silinemedi',
},
```

**Replace auth.login.errors:**

```typescript
errors: {
  invalid_credentials: 'Geçersiz e-posta veya şifre',
  default: 'Giriş başarısız',
  unexpected: 'Beklenmeyen bir hata oluştu',
},
```

---

### UPDATE app/features/i18n/locales/am.ts

- **IMPLEMENT**: Translate 36 English error messages to Amharic
- **PATTERN**: Formal Amharic with Ge'ez script
- **GOTCHA**: Amharic uses Ge'ez script - ensure proper Unicode rendering
- **VALIDATE**: `grep -c "Failed to" app/features/i18n/locales/am.ts` (should return 0)

**Replace batches.errors:**

```typescript
errors: {
  UNAUTHORIZED: 'እባክዎ ለመቀጠል ይግቡ',
  SESSION_EXPIRED: 'ክፍለ ጊዜዎ አልቋል። እባክዎ እንደገና ይግቡ',
  INVALID_CREDENTIALS: 'ልክ ያልሆነ ኢሜይል ወይም የይለፍ ቃል',
  ACCESS_DENIED: 'ይህንን ግብዓት ለመድረስ ፈቃድ የለዎትም',
  BANNED: 'መለያዎ ታግዷል',
  NOT_FOUND: 'የተጠየቀው ግብዓት አልተገኘም',
  FARM_NOT_FOUND: 'እርሻ አልተገኘም',
  BATCH_NOT_FOUND: 'ቡድን አልተገኘም',
  CUSTOMER_NOT_FOUND: 'ደንበኛ አልተገኘም',
  SUPPLIER_NOT_FOUND: 'አቅራቢ አልተገኘም',
  INVOICE_NOT_FOUND: 'ደረሰኝ አልተገኘም',
  STRUCTURE_NOT_FOUND: 'መዋቅር አልተገኘም',
  SALE_NOT_FOUND: 'ሽያጭ አልተገኘም',
  VALIDATION_ERROR: 'እባክዎ ግቤትዎን ያረጋግጡ እና እንደገና ይሞክሩ',
  INVALID_INPUT: 'ልክ ያልሆነ ግቤት ቀርቧል',
  INSUFFICIENT_STOCK: 'በቂ አክሲዮን የለም',
  INTERNAL_ERROR: 'የሆነ ስህተት ተፈጥሯል። እባክዎ በኋላ ላይ እንደገና ይሞክሩ',
  DATABASE_ERROR: 'የውሂብ ጎታ ስህተት ተፈጥሯል። እባክዎ እንደገና ይሞክሩ',
  update: 'ቡድንን ማዘመን አልተሳካም',
  delete: 'ቡድንን መሰረዝ አልተሳካም',
},
```

**Replace settings.users.errors:**

```typescript
errors: {
  refresh: 'ተጠቃሚዎችን ማደስ አልተሳካም',
  loadAssignments: 'የእርሻ ምደባዎችን መጫን አልተሳካም',
  ban: 'ተጠቃሚን ማገድ አልተሳካም',
  unban: 'ተጠቃሚን ማላቀቅ አልተሳካም',
  delete: 'ተጠቃሚን መሰረዝ አልተሳካም',
  role: 'ሚናን ማዘመን አልተሳካም',
  create: 'ተጠቃሚን መፍጠር አልተሳካም',
  resetPassword: 'የይለፍ ቃል ዳግም ማስጀመር አልተሳካም',
  assignFarm: 'እርሻን መመደብ አልተሳካም',
  updateFarmRole: 'ሚናን ማዘመን አልተሳካም',
  removeFromFarm: 'ከእርሻ ማስወገድ አልተሳካም',
},
```

**Replace customers.errors:**

```typescript
errors: {
  create: 'ደንበኛን መፍጠር አልተሳካም',
  delete: 'ደንበኛን መሰረዝ አልተሳካም',
},
```

**Replace auth.login.errors:**

```typescript
errors: {
  invalid_credentials: 'ልክ ያልሆነ ኢሜይል ወይም የይለፍ ቃል',
  default: 'መግባት አልተሳካም',
  unexpected: 'ያልተጠበቀ ስህተት ተፈጥሯል',
},
```

---

### UPDATE app/features/i18n/locales/bn.ts

- **IMPLEMENT**: Translate 36 English error messages to Bengali
- **PATTERN**: Formal Bengali with Bengali script
- **GOTCHA**: Bengali uses Bengali script - ensure proper Unicode rendering
- **VALIDATE**: `grep -c "Failed to" app/features/i18n/locales/bn.ts` (should return 0)

**Replace batches.errors:**

```typescript
errors: {
  UNAUTHORIZED: 'অনুগ্রহ করে চালিয়ে যেতে সাইন ইন করুন',
  SESSION_EXPIRED: 'আপনার সেশন শেষ হয়ে গেছে। অনুগ্রহ করে আবার সাইন ইন করুন',
  INVALID_CREDENTIALS: 'অবৈধ ইমেল বা পাসওয়ার্ড',
  ACCESS_DENIED: 'এই সম্পদ অ্যাক্সেস করার অনুমতি নেই',
  BANNED: 'আপনার অ্যাকাউন্ট স্থগিত করা হয়েছে',
  NOT_FOUND: 'অনুরোধকৃত সম্পদ পাওয়া যায়নি',
  FARM_NOT_FOUND: 'খামার পাওয়া যায়নি',
  BATCH_NOT_FOUND: 'ব্যাচ পাওয়া যায়নি',
  CUSTOMER_NOT_FOUND: 'গ্রাহক পাওয়া যায়নি',
  SUPPLIER_NOT_FOUND: 'সরবরাহকারী পাওয়া যায়নি',
  INVOICE_NOT_FOUND: 'চালান পাওয়া যায়নি',
  STRUCTURE_NOT_FOUND: 'কাঠামো পাওয়া যায়নি',
  SALE_NOT_FOUND: 'বিক্রয় পাওয়া যায়নি',
  VALIDATION_ERROR: 'অনুগ্রহ করে আপনার ইনপুট পরীক্ষা করুন এবং আবার চেষ্টা করুন',
  INVALID_INPUT: 'অবৈধ ইনপুট প্রদান করা হয়েছে',
  INSUFFICIENT_STOCK: 'পর্যাপ্ত স্টক উপলব্ধ নেই',
  INTERNAL_ERROR: 'কিছু ভুল হয়েছে। অনুগ্রহ করে পরে আবার চেষ্টা করুন',
  DATABASE_ERROR: 'ডাটাবেস ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন',
  update: 'ব্যাচ আপডেট করতে ব্যর্থ',
  delete: 'ব্যাচ মুছতে ব্যর্থ',
},
```

**Replace settings.users.errors:**

```typescript
errors: {
  refresh: 'ব্যবহারকারীদের রিফ্রেশ করতে ব্যর্থ',
  loadAssignments: 'খামার অ্যাসাইনমেন্ট লোড করতে ব্যর্থ',
  ban: 'ব্যবহারকারী নিষিদ্ধ করতে ব্যর্থ',
  unban: 'ব্যবহারকারী আনব্যান করতে ব্যর্থ',
  delete: 'ব্যবহারকারী মুছতে ব্যর্থ',
  role: 'ভূমিকা আপডেট করতে ব্যর্থ',
  create: 'ব্যবহারকারী তৈরি করতে ব্যর্থ',
  resetPassword: 'পাসওয়ার্ড রিসেট করতে ব্যর্থ',
  assignFarm: 'খামার অ্যাসাইন করতে ব্যর্থ',
  updateFarmRole: 'ভূমিকা আপডেট করতে ব্যর্থ',
  removeFromFarm: 'খামার থেকে সরাতে ব্যর্থ',
},
```

**Replace customers.errors:**

```typescript
errors: {
  create: 'গ্রাহক তৈরি করতে ব্যর্থ',
  delete: 'গ্রাহক মুছতে ব্যর্থ',
},
```

**Replace auth.login.errors:**

```typescript
errors: {
  invalid_credentials: 'অবৈধ ইমেল বা পাসওয়ার্ড',
  default: 'লগইন ব্যর্থ',
  unexpected: 'একটি অপ্রত্যাশিত ত্রুটি ঘটেছে',
},
```

---

### UPDATE app/features/i18n/locales/id.ts

- **IMPLEMENT**: Translate 36 English error messages to Indonesian
- **PATTERN**: Formal Indonesian tone
- **VALIDATE**: `grep -c "Failed to" app/features/i18n/locales/id.ts` (should return 0)

**Replace batches.errors:**

```typescript
errors: {
  UNAUTHORIZED: 'Silakan masuk untuk melanjutkan',
  SESSION_EXPIRED: 'Sesi Anda telah berakhir. Silakan masuk lagi',
  INVALID_CREDENTIALS: 'Email atau kata sandi tidak valid',
  ACCESS_DENIED: 'Anda tidak memiliki izin untuk mengakses sumber daya ini',
  BANNED: 'Akun Anda telah ditangguhkan',
  NOT_FOUND: 'Sumber daya yang diminta tidak ditemukan',
  FARM_NOT_FOUND: 'Peternakan tidak ditemukan',
  BATCH_NOT_FOUND: 'Batch tidak ditemukan',
  CUSTOMER_NOT_FOUND: 'Pelanggan tidak ditemukan',
  SUPPLIER_NOT_FOUND: 'Pemasok tidak ditemukan',
  INVOICE_NOT_FOUND: 'Faktur tidak ditemukan',
  STRUCTURE_NOT_FOUND: 'Struktur tidak ditemukan',
  SALE_NOT_FOUND: 'Penjualan tidak ditemukan',
  VALIDATION_ERROR: 'Silakan periksa input Anda dan coba lagi',
  INVALID_INPUT: 'Input tidak valid diberikan',
  INSUFFICIENT_STOCK: 'Stok tidak mencukupi',
  INTERNAL_ERROR: 'Terjadi kesalahan. Silakan coba lagi nanti',
  DATABASE_ERROR: 'Terjadi kesalahan database. Silakan coba lagi',
  update: 'Gagal memperbarui batch',
  delete: 'Gagal menghapus batch',
},
```

**Replace settings.users.errors:**

```typescript
errors: {
  refresh: 'Gagal menyegarkan pengguna',
  loadAssignments: 'Gagal memuat penugasan peternakan',
  ban: 'Gagal melarang pengguna',
  unban: 'Gagal membuka larangan pengguna',
  delete: 'Gagal menghapus pengguna',
  role: 'Gagal memperbarui peran',
  create: 'Gagal membuat pengguna',
  resetPassword: 'Gagal mereset kata sandi',
  assignFarm: 'Gagal menugaskan peternakan',
  updateFarmRole: 'Gagal memperbarui peran',
  removeFromFarm: 'Gagal menghapus dari peternakan',
},
```

**Replace customers.errors:**

```typescript
errors: {
  create: 'Gagal membuat pelanggan',
  delete: 'Gagal menghapus pelanggan',
},
```

**Replace auth.login.errors:**

```typescript
errors: {
  invalid_credentials: 'Email atau kata sandi tidak valid',
  default: 'Login gagal',
  unexpected: 'Terjadi kesalahan yang tidak terduga',
},
```

---

### UPDATE app/features/i18n/locales/th.ts

- **IMPLEMENT**: Translate 36 English error messages to Thai
- **PATTERN**: Polite Thai with Thai script
- **GOTCHA**: Thai uses Thai script - ensure proper Unicode rendering
- **VALIDATE**: `grep -c "Failed to" app/features/i18n/locales/th.ts` (should return 0)

**Replace batches.errors:**

```typescript
errors: {
  UNAUTHORIZED: 'กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ',
  SESSION_EXPIRED: 'เซสชันของคุณหมดอายุแล้ว กรุณาเข้าสู่ระบบอีกครั้ง',
  INVALID_CREDENTIALS: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
  ACCESS_DENIED: 'คุณไม่มีสิทธิ์เข้าถึงทรัพยากรนี้',
  BANNED: 'บัญชีของคุณถูกระงับ',
  NOT_FOUND: 'ไม่พบทรัพยากรที่ร้องขอ',
  FARM_NOT_FOUND: 'ไม่พบฟาร์ม',
  BATCH_NOT_FOUND: 'ไม่พบแบทช์',
  CUSTOMER_NOT_FOUND: 'ไม่พบลูกค้า',
  SUPPLIER_NOT_FOUND: 'ไม่พบผู้จัดหา',
  INVOICE_NOT_FOUND: 'ไม่พบใบแจ้งหนี้',
  STRUCTURE_NOT_FOUND: 'ไม่พบโครงสร้าง',
  SALE_NOT_FOUND: 'ไม่พบการขาย',
  VALIDATION_ERROR: 'กรุณาตรวจสอบข้อมูลของคุณและลองอีกครั้ง',
  INVALID_INPUT: 'ข้อมูลที่ให้มาไม่ถูกต้อง',
  INSUFFICIENT_STOCK: 'สต็อกไม่เพียงพอ',
  INTERNAL_ERROR: 'เกิดข้อผิดพลาด กรุณาลองอีกครั้งในภายหลัง',
  DATABASE_ERROR: 'เกิดข้อผิดพลาดฐานข้อมูล กรุณาลองอีกครั้ง',
  update: 'ไม่สามารถอัปเดตแบทช์',
  delete: 'ไม่สามารถลบแบทช์',
},
```

**Replace settings.users.errors:**

```typescript
errors: {
  refresh: 'ไม่สามารถรีเฟรชผู้ใช้',
  loadAssignments: 'ไม่สามารถโหลดการมอบหมายฟาร์ม',
  ban: 'ไม่สามารถแบนผู้ใช้',
  unban: 'ไม่สามารถยกเลิกการแบนผู้ใช้',
  delete: 'ไม่สามารถลบผู้ใช้',
  role: 'ไม่สามารถอัปเดตบทบาท',
  create: 'ไม่สามารถสร้างผู้ใช้',
  resetPassword: 'ไม่สามารถรีเซ็ตรหัสผ่าน',
  assignFarm: 'ไม่สามารถมอบหมายฟาร์ม',
  updateFarmRole: 'ไม่สามารถอัปเดตบทบาท',
  removeFromFarm: 'ไม่สามารถลบออกจากฟาร์ม',
},
```

**Replace customers.errors:**

```typescript
errors: {
  create: 'ไม่สามารถสร้างลูกค้า',
  delete: 'ไม่สามารถลบลูกค้า',
},
```

**Replace auth.login.errors:**

```typescript
errors: {
  invalid_credentials: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
  default: 'เข้าสู่ระบบไม่สำเร็จ',
  unexpected: 'เกิดข้อผิดพลาดที่ไม่คาดคิด',
},
```

---

### UPDATE app/features/i18n/locales/vi.ts

- **IMPLEMENT**: Translate 36 English error messages to Vietnamese
- **PATTERN**: Polite Vietnamese tone
- **GOTCHA**: Vietnamese uses Latin script with diacritics (ă, â, ê, ô, ơ, ư, đ)
- **VALIDATE**: `grep -c "Failed to" app/features/i18n/locales/vi.ts` (should return 0)

**Replace batches.errors:**

```typescript
errors: {
  UNAUTHORIZED: 'Vui lòng đăng nhập để tiếp tục',
  SESSION_EXPIRED: 'Phiên của bạn đã hết hạn. Vui lòng đăng nhập lại',
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không hợp lệ',
  ACCESS_DENIED: 'Bạn không có quyền truy cập tài nguyên này',
  BANNED: 'Tài khoản của bạn đã bị đình chỉ',
  NOT_FOUND: 'Không tìm thấy tài nguyên được yêu cầu',
  FARM_NOT_FOUND: 'Không tìm thấy trang trại',
  BATCH_NOT_FOUND: 'Không tìm thấy lô',
  CUSTOMER_NOT_FOUND: 'Không tìm thấy khách hàng',
  SUPPLIER_NOT_FOUND: 'Không tìm thấy nhà cung cấp',
  INVOICE_NOT_FOUND: 'Không tìm thấy hóa đơn',
  STRUCTURE_NOT_FOUND: 'Không tìm thấy cấu trúc',
  SALE_NOT_FOUND: 'Không tìm thấy bán hàng',
  VALIDATION_ERROR: 'Vui lòng kiểm tra đầu vào của bạn và thử lại',
  INVALID_INPUT: 'Đầu vào không hợp lệ được cung cấp',
  INSUFFICIENT_STOCK: 'Không đủ hàng tồn kho',
  INTERNAL_ERROR: 'Đã xảy ra lỗi. Vui lòng thử lại sau',
  DATABASE_ERROR: 'Đã xảy ra lỗi cơ sở dữ liệu. Vui lòng thử lại',
  update: 'Không thể cập nhật lô',
  delete: 'Không thể xóa lô',
},
```

**Replace settings.users.errors:**

```typescript
errors: {
  refresh: 'Không thể làm mới người dùng',
  loadAssignments: 'Không thể tải phân công trang trại',
  ban: 'Không thể cấm người dùng',
  unban: 'Không thể bỏ cấm người dùng',
  delete: 'Không thể xóa người dùng',
  role: 'Không thể cập nhật vai trò',
  create: 'Không thể tạo người dùng',
  resetPassword: 'Không thể đặt lại mật khẩu',
  assignFarm: 'Không thể phân công trang trại',
  updateFarmRole: 'Không thể cập nhật vai trò',
  removeFromFarm: 'Không thể xóa khỏi trang trại',
},
```

**Replace customers.errors:**

```typescript
errors: {
  create: 'Không thể tạo khách hàng',
  delete: 'Không thể xóa khách hàng',
},
```

**Replace auth.login.errors:**

```typescript
errors: {
  invalid_credentials: 'Email hoặc mật khẩu không hợp lệ',
  default: 'Đăng nhập thất bại',
  unexpected: 'Đã xảy ra lỗi không mong muốn',
},
```

---

---

## TESTING STRATEGY

### Unit Tests

No unit tests required - this is pure translation work with no logic changes.

### Integration Tests

Manual validation through UI testing in each language to ensure:

- All keys render properly (no fallback to key names)
- Error messages display in correct language
- Unicode characters render correctly (Devanagari, Ge'ez, Thai, Bengali scripts)

### Edge Cases

- **Unicode Rendering**: Test languages with non-Latin scripts (hi, am, th, bn) in browser
- **Diacritic Display**: Test languages with special characters (yo, ig, vi, fr, pt, es, tr)
- **RTL Support**: Not applicable (no RTL languages in current set)
- **Variable Interpolation**: Verify error messages with {{variables}} still work

---

## VALIDATION COMMANDS

Execute every command to ensure zero regressions and 100% feature correctness.

### Level 1: Key Count Validation

```bash
# Verify all languages have same key count
node -e "
const fs = require('fs');
const files = ['en', 'ha', 'yo', 'ig', 'fr', 'es', 'pt', 'sw', 'hi', 'tr', 'am', 'bn', 'id', 'th', 'vi'];

function countKeys(obj, prefix = '') {
  let count = 0;
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      count += countKeys(value, prefix + key + '.');
    } else {
      count++;
    }
  }
  return count;
}

const counts = {};
for (const lang of files) {
  const content = fs.readFileSync(\`app/features/i18n/locales/\${lang}.ts\`, 'utf8');
  const match = content.match(/export const \w+ = ({[\\s\\S]*});?$/m);
  const obj = eval('(' + match[1] + ')');
  counts[lang] = countKeys(obj);
}

const enCount = counts.en;
const allMatch = Object.values(counts).every(c => c === enCount);

console.log('Key counts:', counts);
console.log(allMatch ? 'PASS: All languages have same key count' : 'FAIL: Key count mismatch');
process.exit(allMatch ? 0 : 1);
"
```

### Level 2: Untranslated String Detection

```bash
# Verify no English "Failed to" strings remain in non-English files
for lang in ha yo ig fr es pt sw hi tr am bn id th vi; do
  count=$(grep -c "Failed to" app/features/i18n/locales/${lang}.ts || echo 0)
  if [ "$count" -gt 0 ]; then
    echo "FAIL: ${lang}.ts contains $count untranslated 'Failed to' strings"
    exit 1
  fi
done
echo "PASS: No untranslated 'Failed to' strings found"
```

```bash
# Verify no English "Please" strings remain in non-English files (except in examples)
for lang in ha yo ig fr es pt sw hi tr am bn id th vi; do
  count=$(grep -c "Please sign in\|Please check" app/features/i18n/locales/${lang}.ts || echo 0)
  if [ "$count" -gt 0 ]; then
    echo "FAIL: ${lang}.ts contains $count untranslated 'Please' strings"
    exit 1
  fi
done
echo "PASS: No untranslated 'Please' strings found"
```

### Level 3: Missing Key Detection

```bash
# Verify English has all required keys
node -e "
const fs = require('fs');
const enContent = fs.readFileSync('app/features/i18n/locales/en.ts', 'utf8');
const haContent = fs.readFileSync('app/features/i18n/locales/ha.ts', 'utf8');

function extractKeys(obj, prefix = '') {
  let keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? \`\${prefix}.\${key}\` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys = keys.concat(extractKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const enMatch = enContent.match(/export const \w+ = ({[\\s\\S]*});?$/m);
const haMatch = haContent.match(/export const \w+ = ({[\\s\\S]*});?$/m);

const enObj = eval('(' + enMatch[1] + ')');
const haObj = eval('(' + haMatch[1] + ')');

const enKeys = extractKeys(enObj).sort();
const haKeys = extractKeys(haObj).sort();

const missingInEn = haKeys.filter(k => !enKeys.includes(k));

if (missingInEn.length > 0) {
  console.log('FAIL: English missing keys:', missingInEn);
  process.exit(1);
}

console.log('PASS: English has all required keys');
"
```

### Level 4: French Extra Keys Check

```bash
# Verify French has no extra batch status keys
node -e "
const fs = require('fs');
const frContent = fs.readFileSync('app/features/i18n/locales/fr.ts', 'utf8');

const extraKeys = ['batches.active', 'batches.allStatus', 'batches.allTypes', 'batches.depleted', 'batches.sold'];

for (const key of extraKeys) {
  const parts = key.split('.');
  const regex = new RegExp(parts[1] + ':\\s*[\\'\\\"]');
  if (regex.test(frContent)) {
    console.log('FAIL: French still contains extra key:', key);
    process.exit(1);
  }
}

console.log('PASS: French has no extra batch status keys');
"
```

### Level 5: Manual UI Validation

**Test in browser:**

1. **English locale** (`/settings` → change language to English):
    - Navigate to `/reports` → verify feed.summary.\* keys render
    - Navigate to `/eggs` → verify eggs.columns.\* keys render
    - Trigger an error → verify error message displays

2. **Nigerian languages** (ha, yo, ig):
    - Change language in settings
    - Trigger batch update error → verify Hausa/Yoruba/Igbo error message
    - Navigate to user management → trigger user error → verify translation

3. **Unicode script languages** (hi, am, th, bn):
    - Change language in settings
    - Verify all text renders properly (no boxes/question marks)
    - Trigger errors → verify script displays correctly

4. **Diacritic languages** (fr, es, pt, vi, tr):
    - Change language in settings
    - Verify accents display correctly (é, ñ, ã, ă, ğ)
    - Trigger errors → verify diacritics in error messages

---

## ACCEPTANCE CRITERIA

- [x] English locale has all 26 missing keys added
- [x] All 14 non-English locales have 36 error messages translated
- [x] French locale has 5 extra batch status keys removed
- [x] All 15 languages have identical key count (1,005 keys)
- [x] Zero "Failed to" strings in non-English files
- [x] Zero "Please" strings in non-English error messages
- [x] Unicode characters render correctly in all scripts
- [x] No regressions in existing translations
- [x] All validation commands pass with zero errors

---

## COMPLETION CHECKLIST

- [ ] All 15 locale files updated
- [ ] Key count validation passes (all languages = 1,005 keys)
- [ ] Untranslated string detection passes (0 English strings)
- [ ] Missing key detection passes (English complete)
- [ ] French extra keys removed
- [ ] Manual UI testing completed for 3+ languages
- [ ] Unicode rendering verified for non-Latin scripts
- [ ] Error messages display correctly in all languages
- [ ] No fallback to key names observed

---

## NOTES

### Translation Quality Considerations

**Nigerian Languages (ha, yo, ig):**

- These are the primary user base - translations must be culturally appropriate
- Technical terms like "Batch", "Farm" kept in English where no good equivalent exists
- Error messages use polite, formal tone appropriate for business context

**Script Complexity:**

- **Devanagari (Hindi)**: 2,304 Unicode characters - file size will be larger
- **Ge'ez (Amharic)**: 358 Unicode characters - ensure proper font support
- **Thai**: 87 Unicode characters - no word boundaries, ensure proper rendering
- **Bengali**: 128 Unicode characters - complex ligatures, test carefully

**Diacritic Handling:**

- All diacritics use proper Unicode combining characters
- No ASCII approximations (e.g., "e" instead of "é")
- Ensure UTF-8 encoding throughout

### Design Decisions

**Why not use translation service APIs?**

- Error messages require context-aware translation
- Technical farming terminology needs domain expertise
- Quality control requires human review for 15 languages

**Why remove French batch status keys instead of adding to all?**

- Keys are redundant with existing `batches.statuses.*` structure
- Not used anywhere in codebase (verified via grep)
- Reduces maintenance burden

**Why keep some English terms?**

- Technical terms like "Batch", "ROI", "pH" are internationally recognized
- No good translations exist in some languages
- Farmers familiar with English technical terms

### Estimated Effort

- **English key additions**: 15 minutes (straightforward copy from other locales)
- **Error translations**: 3-4 hours (36 messages × 14 languages = 504 translations)
- **French normalization**: 10 minutes (simple deletion)
- **Validation**: 30 minutes (run all commands, manual UI testing)
- **Total**: ~4-5 hours

### Risk Assessment

**Low Risk:**

- Pure translation work, no logic changes
- Existing translations remain untouched
- Validation commands catch all issues

**Medium Risk:**

- Unicode rendering issues in non-Latin scripts (mitigated by manual testing)
- Translation quality for less common languages (mitigated by using formal tone)

**High Risk:**

- None identified

### Confidence Score

**9/10** - High confidence in one-pass success because:

- Clear, atomic tasks with specific line numbers
- Comprehensive validation commands
- No code logic changes, only text replacements
- Pattern established from existing translations

Only risk is potential typos in 504 translations, mitigated by validation commands.
