package httpadapter

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/labstack/echo/v4"
)

// RequestLogger logs all HTTP requests with status, duration, and error details.
func RequestLogger() echo.MiddlewareFunc {
	logger := log.New(os.Stdout, "[http] ", log.LstdFlags|log.Lmsgprefix)

	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			start := time.Now()
			req := c.Request()
			res := c.Response()

			// Process request
			err := next(c)

			// Calculate duration
			duration := time.Since(start)

			// Log request
			status := res.Status
			method := req.Method
			uri := req.RequestURI
			userID := c.Get("user_id")
			userIDStr := ""
			if userID != nil {
				userIDStr = fmt.Sprintf(" user=%v", userID)
			}

			// Log with different levels based on status
			if status >= 500 {
				logger.Printf("ERROR %d %s %s %v%s\n", status, method, uri, duration, userIDStr)
				if err != nil {
					logger.Printf("  → error: %v\n", err)
				}
			} else if status >= 400 {
				logger.Printf("WARN  %d %s %s %v%s\n", status, method, uri, duration, userIDStr)
				if err != nil {
					logger.Printf("  → error: %v\n", err)
				}
			} else {
				logger.Printf("OK    %d %s %s %v%s\n", status, method, uri, duration, userIDStr)
			}

			return err
		}
	}
}
