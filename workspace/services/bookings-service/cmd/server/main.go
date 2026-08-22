package main

import (
	"database/sql"
	"log"
	"os"

	"github.com/labstack/echo/v4"
	_ "github.com/jackc/pgx/v5/stdlib" // registers the "pgx" database/sql driver

	httpadapter "github.com/Leanramon98/balne/workspace/services/bookings-service/internal/adapters/in/http"
	postgres "github.com/Leanramon98/balne/workspace/services/bookings-service/internal/adapters/out/postgres"
	"github.com/Leanramon98/balne/workspace/services/bookings-service/internal/usecases"
)

func main() {
	logger := log.New(os.Stdout, "[bookings-service] ", log.LstdFlags)
	logger.Println("starting service...")

	// 0. Database connection. DB_URL carries search_path=bookings_service so
	//    the service owns an isolated schema (schema-per-service convention).
	dbURL := os.Getenv("DB_URL")
	var db *sql.DB
	if dbURL != "" {
		var err error
		db, err = sql.Open("pgx", dbURL)
		if err != nil {
			logger.Fatalf("failed to connect to database: %v", err)
		}
		defer db.Close()
	} else {
		logger.Println("warning: DB_URL not set; persistence will fail at runtime")
	}

	// 1. Build use case (logic in internal/usecases/logic.go).
	repo := postgres.NewRepo(db)
	uc := usecases.NewLogic(usecases.WithRepository(repo))

	// 2. Wire HTTP adapter.
	e := echo.New()
	e.HideBanner = true

	e.GET("/health", func(c echo.Context) error {
		if db != nil {
			if err := db.Ping(); err != nil {
				return c.JSON(503, map[string]string{"status": "unhealthy", "database": "unreachable"})
			}
		}
		return c.JSON(200, map[string]string{"status": "ok"})
	})

	api := e.Group("/api")
	// Auth for the internal subset is enforced by the API gateway (JWT).
	// Public routes within the group are intentionally open.
	httpadapter.NewHandler(api, uc)

	// 3. Start server.
	port := os.Getenv("PORT")
	if port == "" {
		port = "8083"
	}
	logger.Printf("listening on :%s", port)
	if err := e.Start(":" + port); err != nil {
		logger.Fatalf("server error: %v", err)
	}
}
