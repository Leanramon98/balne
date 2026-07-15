package deepl

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"
)

const (
	defaultBaseURL  = "https://api-free.deepl.com/v2/translate"
	defaultTimeout  = 5 * time.Second
)

// Client is an HTTP implementation of domain.DeepLClient that calls the DeepL API.
type Client struct {
	baseURL    string
	apiKey     string
	httpClient *http.Client
}

// NewClient creates a DeepL client. Reads DEEPL_API_KEY from environment.
// If the key is empty, all TranslateText calls return ("", nil) gracefully.
func NewClient() *Client {
	apiKey := os.Getenv("DEEPL_API_KEY")
	baseURL := os.Getenv("DEEPL_API_URL")
	if baseURL == "" {
		baseURL = defaultBaseURL
	}
	return &Client{
		baseURL: baseURL,
		apiKey:  apiKey,
		httpClient: &http.Client{
			Timeout: defaultTimeout,
		},
	}
}

// NewClientWithKey creates a DeepL client with an explicit API key (useful for testing).
func NewClientWithKey(apiKey, baseURL string, httpClient *http.Client) *Client {
	if baseURL == "" {
		baseURL = defaultBaseURL
	}
	if httpClient == nil {
		httpClient = &http.Client{Timeout: defaultTimeout}
	}
	return &Client{
		baseURL:    baseURL,
		apiKey:     apiKey,
		httpClient: httpClient,
	}
}

type deeplRequest struct {
	Text       []string `json:"text"`
	SourceLang string   `json:"source_lang"`
	TargetLang string   `json:"target_lang"`
}

type deeplResponse struct {
	Translations []deeplTranslation `json:"translations"`
}

type deeplTranslation struct {
	Text string `json:"text"`
}

// TranslateText translates text from sourceLang to targetLang using the DeepL API.
// Returns the translated text, or an empty string if the API key is missing or the call fails.
func (c *Client) TranslateText(ctx context.Context, text, sourceLang, targetLang string) (string, error) {
	if text == "" {
		return "", nil
	}

	if c.apiKey == "" {
		log.Println("[deepl] DEEPL_API_KEY not set — skipping translation")
		return "", nil
	}

	reqBody := deeplRequest{
		Text:       []string{text},
		SourceLang: sourceLang,
		TargetLang: targetLang,
	}

	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("deepl marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL, bytes.NewReader(jsonBody))
	if err != nil {
		return "", fmt.Errorf("deepl create request: %w", err)
	}

	req.Header.Set("Authorization", "DeepL-Auth-Key "+c.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		log.Printf("[deepl] API call failed: %v", err)
		return "", nil
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 1024))
		log.Printf("[deepl] API returned %d: %s", resp.StatusCode, string(body))
		return "", nil
	}

	var result deeplResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("deepl decode response: %w", err)
	}

	if len(result.Translations) == 0 {
		return text, nil
	}

	return result.Translations[0].Text, nil
}
