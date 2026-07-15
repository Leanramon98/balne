package usecases

import (
	"context"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"evaluations-service/internal/domain"

	"github.com/labstack/echo/v4"
	"github.com/google/uuid"
)

// ══════════════════════════════════════════════════════════════════════
// Catalog Translation Helper
// ══════════════════════════════════════════════════════════════════════

// Locales is the list of target locales for catalog translation. Add a locale
// here to enable translation to a new language. Currently Portuguese only.
var Locales = []string{"pt"}

// translateCatalogEntityOnWrite is the fire-on-write entrypoint. After a
// successful Create or Update of a catalog entity, callers invoke this helper
// (typically as a goroutine: `go l.translateCatalogEntityOnWrite(...)`) to
// upsert a `catalog_translation` row for every entry in Locales. The helper
// reads the existing row first to preserve human-review metadata
// (TranslationReviewed / ReviewedBy / ReviewedAt) across re-translations.
// Errors are logged, never returned to the caller.
func (l *Logic) translateCatalogEntityOnWrite(
	entityType string,
	entityID uuid.UUID,
	sourceName string,
	sourceDescription string,
	sourceCriteria string, // JSON string for indicator criteria; "" for others
) {
	if l.deeplClient == nil {
		return
	}
	for _, locale := range Locales {
		l.upsertCatalogTranslation(
			context.Background(), entityType, entityID, locale,
			sourceName, sourceDescription, sourceCriteria,
		)
	}
}

// upsertCatalogTranslation does one (entityType, entityID, locale) upsert.
// Translates name/description/criteria on the fly, then Create-or-Update,
// preserving review metadata when an existing row is found.
func (l *Logic) upsertCatalogTranslation(
	ctx context.Context,
	entityType string,
	entityID uuid.UUID,
	locale string,
	sourceName, sourceDescription, sourceCriteria string,
) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	existing, err := l.repo.FindCatalogTranslation(ctx, entityType, entityID, locale)
	if err != nil && err != sql.ErrNoRows {
		log.Printf("[translate-upsert] find failed for %s %s %s: %v", entityType, entityID, locale, err)
		return
	}

	// Translate name
	var namePt *string
	if sourceName != "" {
		n, err := l.deeplClient.TranslateText(ctx, sourceName, "es", locale)
		if err != nil {
			log.Printf("[translate-upsert] failed to translate name for %s %s: %v", entityType, entityID, err)
		} else if n != "" {
			namePt = &n
		}
	}

	// Translate description
	var descPt *string
	if sourceDescription != "" {
		d, err := l.deeplClient.TranslateText(ctx, sourceDescription, "es", locale)
		if err != nil {
			log.Printf("[translate-upsert] failed to translate description for %s %s: %v", entityType, entityID, err)
		} else if d != "" {
			descPt = &d
		}
	}

	// Translate criteria JSON (for indicators)
	var criteriaPt *string
	if sourceCriteria != "" && entityType == "indicator" {
		if translated, err := translateCriteriaJSON(ctx, l.deeplClient, sourceCriteria, locale); err == nil && translated != "" {
			criteriaPt = &translated
		}
	}

	// Only persist if at least one field was translated
	if namePt == nil && descPt == nil && criteriaPt == nil {
		return
	}

	now := time.Now()
	if existing != nil {
		if namePt != nil {
			existing.Name = namePt
		}
		if descPt != nil {
			existing.Description = descPt
		}
		if criteriaPt != nil {
			existing.Criteria = criteriaPt
		}
		existing.TranslatedAt = now
		// TranslationReviewed, ReviewedBy, ReviewedAt are preserved untouched.
		if err := l.repo.UpdateCatalogTranslation(ctx, existing); err != nil {
			log.Printf("[translate-upsert] update failed for %s %s: %v", entityType, entityID, err)
		}
		return
	}

	if err := l.repo.CreateCatalogTranslation(ctx, &domain.CatalogTranslation{
		ID:                  uuid.New(),
		EntityType:          entityType,
		EntityID:            entityID,
		Locale:              locale,
		Name:                namePt,
		Description:         descPt,
		Criteria:            criteriaPt,
		TranslatedAt:        now,
		TranslationReviewed: false,
	}); err != nil {
		log.Printf("[translate-upsert] create failed for %s %s: %v", entityType, entityID, err)
		return
	}
	log.Printf("[translate-upsert] successfully upserted %s %s to %s", entityType, entityID, locale)
}

// translateCriteriaJSON parses indicator criteria JSON and translates each description field.
// Returns empty string if the result would have all-empty descriptions (DeepL failure
// or same-lang no-op), so the caller treats it as "not translated" and keeps the original.
func translateCriteriaJSON(ctx context.Context, client domain.DeepLClient, criteriaJSON, locale string) (string, error) {
	var criteria []map[string]interface{}
	if err := json.Unmarshal([]byte(criteriaJSON), &criteria); err != nil {
		return "", err
	}

	for _, item := range criteria {
		if desc, ok := item["description"].(string); ok && desc != "" {
			translated, err := client.TranslateText(ctx, desc, "es", locale)
			if err != nil {
				log.Printf("[translate] failed to translate criteria description: %v", err)
				continue
			}
			item["description"] = translated
		}
	}

	// Sanity check: if every description came back empty, treat the whole
	// translation as failed (DeepL es→es returns empty, or quota/rate issue).
	anyTranslated := false
	for _, item := range criteria {
		if desc, ok := item["description"].(string); ok && desc != "" {
			anyTranslated = true
			break
		}
	}
	if !anyTranslated {
		return "", nil
	}

	out, err := json.Marshal(criteria)
	if err != nil {
		return "", err
	}
	return string(out), nil
}

// ══════════════════════════════════════════════════════════════════════
// Admin: Translate All Catalog Entities
// ══════════════════════════════════════════════════════════════════════

// translateAll sequentially translates each item with a delay to respect DeepL Free rate limits.
func (l *Logic) translateAll(items []translationItem, locale string) int {
	log.Printf("[translate] processing %d items sequentially with 2s delay", len(items))
	count := 0
	for i, item := range items {
		l.translateAllItem(item, locale)
		if i%10 == 0 {
			log.Printf("[translate] progress: %d/%d items processed", i+1, len(items))
		}
		time.Sleep(2 * time.Second)
		count++
	}
	log.Printf("[translate] completed: %d items processed", count)
	return count
}

// translateAllItem unpacks a translationItem and delegates to the new
// fire-on-write helper. Preserves the sequential 2s-delay pacing of
// HandleTranslateAll (the sleep stays at the loop layer above).
// Note: the `locale` parameter from HandleTranslateAll is intentionally
// unused here — the helper iterates the package-level Locales list.
func (l *Logic) translateAllItem(item translationItem, _ string) {
	l.translateCatalogEntityOnWrite(item.entityType, item.entityID,
		item.name, item.description, item.criteria)
}

type translationItem struct {
	entityType  string
	entityID    uuid.UUID
	name        string
	description string
	criteria    string // JSON string for indicator criteria
}

// HandleTranslateAll triggers translation of ALL catalog entities to Portuguese.
// Launches processing in background goroutine and returns immediately (202 Accepted)
// to avoid HTTP timeout while translating 280+ entities sequentially.
func (l *Logic) HandleTranslateAll(c echo.Context) error {
	role := roleFromCtx(c)
	if role != "admin" {
		return echo.NewHTTPError(http.StatusForbidden, "admin access required")
	}

	bgCtx := context.Background()
	locale := "pt"

	// Collect all items up front, then launch translation in background.
	var allItems []translationItem

	if scopes, err := l.repo.FindAllScopes(bgCtx); err == nil {
		for _, s := range scopes {
			allItems = append(allItems, translationItem{"scope", s.ID, s.Name, s.Description, ""})
		}
	}

	if reqs, err := l.repo.FindAllRequirements(bgCtx); err == nil {
		for _, r := range reqs {
			allItems = append(allItems, translationItem{"requirement", r.ID, r.Name, r.Description, ""})
		}
	}

	if indicators, err := l.repo.FindAllIndicators(bgCtx); err == nil {
		for _, ind := range indicators {
			allItems = append(allItems, translationItem{"indicator", ind.ID, ind.Name, ind.Description, string(ind.Criteria)})
		}
	}

	if typologies, err := l.repo.FindAllDestinationTypologies(bgCtx); err == nil {
		for _, t := range typologies {
			allItems = append(allItems, translationItem{"destination_typology", t.ID, t.Name, "", ""})
		}
	}

	if popRanges, err := l.repo.FindAllPopulationRanges(bgCtx); err == nil {
		for _, p := range popRanges {
			allItems = append(allItems, translationItem{"population_range", p.ID, p.Name, "", ""})
		}
	}

	if regions, err := l.repo.FindAllRegions(bgCtx); err == nil {
		for _, r := range regions {
			allItems = append(allItems, translationItem{"region", r.ID, r.Name, r.Description, ""})
		}
	}

	if memberTypes, err := l.repo.FindAllMemberTypes(bgCtx); err == nil {
		for _, m := range memberTypes {
			allItems = append(allItems, translationItem{"member_type", m.ID, m.Name, "", ""})
		}
	}

	if areas, err := l.repo.FindAllResponsibleAreas(bgCtx); err == nil {
		for _, a := range areas {
			allItems = append(allItems, translationItem{"responsible_area", a.ID, a.Name, a.Description, ""})
		}
	}

	if levels, err := l.repo.FindAllSubnationalLevels(bgCtx); err == nil {
		for _, lvl := range levels {
			allItems = append(allItems, translationItem{"subnational_level", lvl.ID, lvl.Name, "", ""})
		}
	}

	// Launch background translation
	go l.translateAll(allItems, locale)

	// Return immediately with count summary
	log.Printf("[translate] background translation started for %d items", len(allItems))
	return c.JSON(http.StatusAccepted, map[string]interface{}{
		"status":  "accepted",
		"total":   len(allItems),
		"message": "Translation started in background. Check logs or DB for progress.",
	})
}

// ══════════════════════════════════════════════════════════════════════
// Admin: Catalog Translation CRUD
// ══════════════════════════════════════════════════════════════════════

// HandleListCatalogTranslations returns catalog translations with optional filters.
// Query params: ?entity_type=&locale=&reviewed=
func (l *Logic) HandleListCatalogTranslations(c echo.Context) error {
	role := roleFromCtx(c)
	if role != "admin" {
		return echo.NewHTTPError(http.StatusForbidden, "admin access required")
	}

	entityType := c.QueryParam("entity_type")
	locale := c.QueryParam("locale")
	var reviewed *bool
	if v := c.QueryParam("reviewed"); v != "" {
		b := v == "true"
		reviewed = &b
	}

	items, err := l.repo.ListCatalogTranslations(c.Request().Context(), entityType, locale, reviewed)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, items)
}

// HandleReviewCatalogTranslation updates a catalog translation's fields and marks it as reviewed.
func (l *Logic) HandleReviewCatalogTranslation(c echo.Context) error {
	role := roleFromCtx(c)
	if role != "admin" {
		return echo.NewHTTPError(http.StatusForbidden, "admin access required")
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid translation id")
	}

	var req struct {
		Name        *string `json:"name,omitempty"`
		Description *string `json:"description,omitempty"`
	}
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	// Find the translation by listing all (matching existing pattern)
	items, err := l.repo.ListCatalogTranslations(c.Request().Context(), "", "", nil)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	var translation *domain.CatalogTranslation
	for _, t := range items {
		if t.ID == id {
			translation = t
			break
		}
	}
	if translation == nil {
		return echo.NewHTTPError(http.StatusNotFound, "catalog translation not found")
	}

	// Apply edits
	if req.Name != nil {
		translation.Name = req.Name
	}
	if req.Description != nil {
		translation.Description = req.Description
	}

	// Mark as reviewed
	userID, _ := uuid.Parse(userIDFromCtx(c))
	now := time.Now()
	translation.TranslationReviewed = true
	translation.ReviewedBy = &userID
	translation.ReviewedAt = &now

	if err := l.repo.UpdateCatalogTranslation(c.Request().Context(), translation); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, translation)
}

// ══════════════════════════════════════════════════════════════════════
// Admin: Translate All Actions (Buenas Prácticas)
// ══════════════════════════════════════════════════════════════════════

// translateAction translates a single action's name, summary, description, and ODS fields.
func (l *Logic) translateAction(action *domain.Action, locale string) {
	if l.deeplClient == nil {
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Translate name
	var namePt string
	if action.Name != "" {
		n, err := l.deeplClient.TranslateText(ctx, action.Name, "es", locale)
		if err != nil {
			log.Printf("[translate-action] failed to translate name for action %s: %v", action.ID, err)
		} else {
			namePt = n
		}
	}

	// Translate summary
	var summaryPt string
	if action.Summary != nil && *action.Summary != "" {
		s, err := l.deeplClient.TranslateText(ctx, *action.Summary, "es", locale)
		if err != nil {
			log.Printf("[translate-action] failed to translate summary for action %s: %v", action.ID, err)
		} else {
			summaryPt = s
		}
	}

	// Translate extended description
	var descPt string
	if action.ExtendedDescription != nil && *action.ExtendedDescription != "" {
		d, err := l.deeplClient.TranslateText(ctx, *action.ExtendedDescription, "es", locale)
		if err != nil {
			log.Printf("[translate-action] failed to translate description for action %s: %v", action.ID, err)
		} else {
			descPt = d
		}
	}

	// Translate ODS JSON
	var odsPt string
	if action.ODS != nil && len(action.ODS) > 0 {
		if translated, err := translateODSJSON(ctx, l.deeplClient, string(action.ODS), locale); err == nil {
			odsPt = translated
		}
	}

	// Persist translation
	if err := l.repo.EnsureActionTranslation(ctx, action.ID, locale, namePt, summaryPt, descPt, odsPt); err != nil {
		log.Printf("[translate-action] failed to store translation for action %s: %v", action.ID, err)
		return
	}
	log.Printf("[translate-action] successfully translated action %s to %s", action.ID, locale)
}

// translateODSJSON parses ODS JSON array and translates each ods_name field.
func translateODSJSON(ctx context.Context, client domain.DeepLClient, odsJSON, locale string) (string, error) {
	var ods []map[string]interface{}
	if err := json.Unmarshal([]byte(odsJSON), &ods); err != nil {
		return "", err
	}

	for _, item := range ods {
		if odsName, ok := item["ods_name"].(string); ok && odsName != "" {
			translated, err := client.TranslateText(ctx, odsName, "es", locale)
			if err != nil {
				log.Printf("[translate-action] failed to translate ods_name: %v", err)
				continue
			}
			item["ods_name"] = translated
		}
	}

	out, err := json.Marshal(ods)
	if err != nil {
		return "", err
	}
	return string(out), nil
}

// HandleTranslateAllActions triggers translation of ALL actions to Portuguese.
// Launches processing in background goroutine and returns immediately (202 Accepted).
func (l *Logic) HandleTranslateAllActions(c echo.Context) error {
	role := roleFromCtx(c)
	if role != "admin" {
		return echo.NewHTTPError(http.StatusForbidden, "admin access required")
	}

	bgCtx := context.Background()
	locale := "pt"

	// Collect all actions
	actions, err := l.repo.FindAllActions(bgCtx)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	log.Printf("[translate-action] starting background translation for %d actions", len(actions))

	// Launch background translation
	go func() {
		for i, action := range actions {
			l.translateAction(action, locale)
			if i%10 == 0 {
				log.Printf("[translate-action] progress: %d/%d actions processed", i+1, len(actions))
			}
			time.Sleep(2 * time.Second)
		}
		log.Printf("[translate-action] completed: %d actions translated", len(actions))
	}()

	return c.JSON(http.StatusAccepted, map[string]interface{}{
		"status":  "accepted",
		"total":   len(actions),
		"message": "Translation started in background. Check logs or DB for progress.",
	})
}
