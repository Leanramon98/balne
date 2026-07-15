package httpadapter

import (
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"

	portin "users-service/internal/ports/in"
)

// RegisterAuthRecoveryRoutes adds public auth recovery routes.
func RegisterAuthRecoveryRoutes(e *echo.Group, uc portin.UsersServiceUseCase) {
	e.POST("/auth/forgot-password", handleForgotPassword(uc))
	e.POST("/auth/reset-password", handleResetPassword(uc))
	e.POST("/auth/change-password", handleChangePassword(uc))
	e.POST("/auth/complete-onboarding", handleCompleteOnboarding(uc))
}

func handleForgotPassword(uc portin.UsersServiceUseCase) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req struct {
			Email string `json:"email"`
		}
		if err := c.Bind(&req); err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}
		if req.Email == "" {
			return echo.NewHTTPError(http.StatusBadRequest, "email is required")
		}
		if err := uc.ForgotPassword(c.Request().Context(), req.Email); err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}
		return c.JSON(http.StatusOK, map[string]string{
			"message": "Si el email está registrado, recibirás un enlace de recuperación",
		})
	}
}

func handleResetPassword(uc portin.UsersServiceUseCase) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req struct {
			Token       string `json:"token"`
			NewPassword string `json:"new_password"`
		}
		if err := c.Bind(&req); err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}
		if req.Token == "" || req.NewPassword == "" {
			return echo.NewHTTPError(http.StatusBadRequest, "token and new_password are required")
		}
		if err := uc.ResetPassword(c.Request().Context(), req.Token, req.NewPassword); err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}
		return c.JSON(http.StatusOK, map[string]string{
			"message": "Contraseña actualizada exitosamente",
		})
	}
}

// handleChangePassword lets an authenticated user change their own password.
// It re-uses the JWT user_id (NOT a body field) so a logged-in user can only
// change their own password. Requires current_password for safety.
func handleChangePassword(uc portin.UsersServiceUseCase) echo.HandlerFunc {
	return func(c echo.Context) error {
		userID, ok := c.Get("user_id").(string)
		if !ok || userID == "" {
			return echo.NewHTTPError(http.StatusUnauthorized, "user not authenticated")
		}
		var req struct {
			CurrentPassword string `json:"current_password"`
			NewPassword     string `json:"new_password"`
		}
		if err := c.Bind(&req); err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}
		if req.CurrentPassword == "" || req.NewPassword == "" {
			return echo.NewHTTPError(http.StatusBadRequest, "current_password and new_password are required")
		}
		if err := uc.ChangePassword(c.Request().Context(), userID, req.CurrentPassword, req.NewPassword); err != nil {
			msg := err.Error()
			switch {
			case strings.Contains(msg, "current password is incorrect"):
				return echo.NewHTTPError(http.StatusUnauthorized, "contraseña actual incorrecta")
			case strings.Contains(msg, "at least 8 characters"):
				return echo.NewHTTPError(http.StatusBadRequest, msg)
			default:
				return echo.NewHTTPError(http.StatusInternalServerError, msg)
			}
		}
		return c.JSON(http.StatusOK, map[string]string{
			"message": "Contraseña actualizada exitosamente",
		})
	}
}

// handleCompleteOnboarding lets a first-login user set their password without
// providing the current password. Also sets first_login = false on the backend.
func handleCompleteOnboarding(uc portin.UsersServiceUseCase) echo.HandlerFunc {
	return func(c echo.Context) error {
		userID, ok := c.Get("user_id").(string)
		if !ok || userID == "" {
			return echo.NewHTTPError(http.StatusUnauthorized, "user not authenticated")
		}
		var req struct {
			NewPassword string `json:"new_password"`
		}
		if err := c.Bind(&req); err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}
		if req.NewPassword == "" {
			return echo.NewHTTPError(http.StatusBadRequest, "new_password is required")
		}
		if err := uc.CompleteOnboarding(c.Request().Context(), userID, req.NewPassword); err != nil {
			msg := err.Error()
			switch {
			case strings.Contains(msg, "at least 8 characters"):
				return echo.NewHTTPError(http.StatusBadRequest, msg)
			default:
				return echo.NewHTTPError(http.StatusInternalServerError, msg)
			}
		}
		return c.JSON(http.StatusOK, map[string]string{
			"message": "Contraseña actualizada exitosamente",
		})
	}
}
