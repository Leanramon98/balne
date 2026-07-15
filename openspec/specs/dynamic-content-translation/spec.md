# Dynamic Content Translation — Specification

## Purpose

Enable Portuguese content delivery for good practices published on the public platform. Automatically translate action content (name, summary, description, ODS contributions) via DeepL upon designation, provide admin review capabilities to correct and approve translations, and serve locale-aware content to public endpoints — all while remaining backward-compatible with existing Spanish-only consumers.

## Requirements

### Requirement: Action Translation Table

The system MUST persist translations in an `action_translation` table with columns: `id` (UUID PK), `action_id` (UUID FK → actions), `locale` (VARCHAR(5)), `name`, `summary`, `description` (TEXT), `ods` (JSONB), `translated_at` (TIMESTAMPTZ), `translation_reviewed` (BOOLEAN DEFAULT false), `reviewed_by` (UUID FK → users, nullable), `reviewed_at` (TIMESTAMPTZ, nullable). A UNIQUE constraint on `(action_id, locale)` MUST be enforced.

#### Scenario: Translation stored after designation

- GIVEN an action with Spanish content and ODS contributions
- WHEN the action is designated as a good practice
- THEN an `action_translation` row is inserted with `locale='pt'`, `translation_reviewed=false`, and all translatable fields populated via DeepL

#### Scenario: Duplicate locale prevented

- GIVEN an `action_translation` row exists for `(action_id=X, locale='pt')`
- WHEN a second insert attempts the same `(action_id, locale)` pair
- THEN the database MUST reject the insert with a unique constraint violation

### Requirement: DeepL Translation Client

The system MUST provide a DeepL client that translates text from Spanish (`es`) to Portuguese (`pt`) using the DeepL API. The client SHALL accept an optional glossary for DTI terminology. If the `DEEPL_API_KEY` environment variable is absent or the API call fails (timeout after 5s, network error, or 4xx/5xx response), the translation MUST be gracefully skipped — the designation flow completes without translation, logging the failure.

#### Scenario: Successful translation

- GIVEN a valid `DEEPL_API_KEY` and network connectivity
- WHEN `DeepL.translateText("Gobernanza digital", "es", "pt")` is called
- THEN the client returns `"Governança digital"` with a non-error response

#### Scenario: Translation skipped on missing API key

- GIVEN `DEEPL_API_KEY` is not set
- WHEN a good practice is designated
- THEN the designation succeeds, no `action_translation` row is created, and a warning is logged

#### Scenario: Translation skipped on API timeout

- GIVEN DeepL API does not respond within 5 seconds
- WHEN translation is triggered during designation
- THEN the designation succeeds, translation is skipped, and a warning is logged

### Requirement: Sync Translation on Good Practice Designation

The system MUST trigger automatic Portuguese translation synchronously when an action is designated as a good practice via `HandleDesignateGoodPractice`. After creating the `GoodPractice` workflow record, the use case SHALL fetch the action's `name`, `summary`, `extended_description`, and `ods` fields, translate each via DeepL, and insert an `action_translation` row with `translation_reviewed=false`. The HTTP response to the designation caller MUST NOT be delayed beyond the translation timeout window.

#### Scenario: Translation triggered on designation

- GIVEN a user with `consultor` or `auditor` role
- WHEN they call `PUT /actions/:id/designate-good-practice`
- THEN a `GoodPractice` record is created AND an `action_translation` row with `locale='pt'` and `translation_reviewed=false` is inserted

#### Scenario: Designation succeeds even if translation fails

- GIVEN DeepL is unavailable
- WHEN a good practice is designated
- THEN the `GoodPractice` record is created, no `action_translation` row is created, and the designation HTTP response returns 201

### Requirement: Locale-Aware Public Endpoints

Public endpoints `GET /public/good-practices` and `GET /public/good-practices/:id` MUST accept an optional `?locale=pt` query parameter. When present and set to `pt`, the handler SHALL LEFT JOIN `action_translation` on `action.id = action_translation.action_id AND locale='pt' AND translation_reviewed=true`, using `COALESCE(at.field, a.field)` for `name`, `summary`, `description`, and `ods`. When `locale` is absent or not `pt`, the handler SHALL return untranslated Spanish content — backward compatibility is preserved.

#### Scenario: Portuguese content served when reviewed translation exists

- GIVEN an approved good practice with a reviewed Portuguese translation
- WHEN `GET /public/good-practices?locale=pt` is called
- THEN `action_name` returns the Portuguese `name` and `ods` returns the translated contribution array

#### Scenario: Spanish fallback when translation is unreviewed

- GIVEN an approved good practice with an `action_translation` row where `translation_reviewed=false`
- WHEN `GET /public/good-practices?locale=pt` is called
- THEN all fields return Spanish content (LEFT JOIN excludes the unreviewed row)

#### Scenario: Spanish fallback when no translation exists

- GIVEN an approved good practice with no `action_translation` row
- WHEN `GET /public/good-practices?locale=pt` is called
- THEN all fields return Spanish content

#### Scenario: Backward compatibility without locale parameter

- GIVEN existing public API consumers
- WHEN `GET /public/good-practices` is called without `?locale=`
- THEN the response is identical to the current behavior — Spanish content, no extra columns

### Requirement: Content Translation Admin Review Tab

The admin configuration page at `/configuracion` MUST include a "Contenido Dinámico" tab, separate from the existing `TranslationsTab` (which manages static message key overrides). This tab SHALL list `action_translation` records, filterable by `reviewed` (true/false/all) and `locale`. Each row MUST display the action name, destination, locale, review status, and translation date. Clicking a row SHALL open a side-by-side edit modal showing the Spanish source text and the editable Portuguese translation.

#### Scenario: Admin views pending translations

- GIVEN a user with `administracion` access level
- WHEN they navigate to `/configuracion` and click "Contenido Dinámico"
- THEN a table displays all `action_translation` records with filter controls for review status and locale

#### Scenario: Unauthorized access blocked

- GIVEN a user without `administracion` access level
- WHEN they attempt to access the content translation admin tab
- THEN the tab is not visible OR the API returns 403

### Requirement: Translation Review Workflow

The system MUST allow authorized users to edit translated fields (name, summary, description, ODS contributions) and mark a translation as reviewed. Marking as reviewed SHALL set `translation_reviewed=true`, `reviewed_by` to the current user's ID, and `reviewed_at` to the current timestamp. Once reviewed, the translation becomes eligible for serving on public endpoints.

#### Scenario: Admin edits and approves a translation

- GIVEN an `action_translation` row with `translation_reviewed=false` and auto-translated text
- WHEN an admin edits the `description` field and clicks "Mark as Reviewed"
- THEN `translation_reviewed` is set to `true`, `reviewed_by` and `reviewed_at` are populated, and the translation is now served on `?locale=pt` public requests

#### Scenario: Content updated after review

- GIVEN a reviewed translation served on public endpoints
- WHEN the admin reopens and edits the translation (e.g., correcting a term)
- THEN the updated fields are immediately reflected on the next public API call — no separate publish step required

| Capability | Requirements | Scenarios |
|---|---|---|
| dynamic-content-translation | 4 | 10 |
| content-translation-admin | 2 | 3 |
