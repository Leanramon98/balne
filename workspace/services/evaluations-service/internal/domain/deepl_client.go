package domain

import "context"

// DeepLClient defines the contract for translating text via the DeepL API.
// Implementations should gracefully handle missing API keys, network errors,
// and timeouts — returning an empty string without error on failure.
type DeepLClient interface {
	// TranslateText translates a single text string from sourceLang to targetLang.
	// Returns the translated text or an empty string if translation is skipped.
	TranslateText(ctx context.Context, text, sourceLang, targetLang string) (string, error)
}
