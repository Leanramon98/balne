package postgres

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"

	"github.com/Leanramon98/balne/workspace/services/bookings-service/internal/domain"
	portout "github.com/Leanramon98/balne/workspace/services/bookings-service/internal/ports/out"
)

// DB is an alias for *sql.DB to keep the code concise.
type DB = sql.DB

// Repo implements portout.Repository backed by PostgreSQL via database/sql.
// The connection string (DB_URL) carries search_path=bookings_service so the
// service owns an isolated schema. All queries are parameterized.
type Repo struct {
	db *DB
}

// NewRepo constructs the repository with a *sql.DB connection.
func NewRepo(db *DB) *Repo {
	return &Repo{db: db}
}

// Ensure Repo satisfies the driven port at compile time.
var _ portout.Repository = (*Repo)(nil)

// ---------------- Balnearios ----------------

func (r *Repo) CreateBalneario(ctx context.Context, b *domain.Balneario) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO balnearios (id, name, slug, location, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, b.ID, b.Name, b.Slug, b.Location, b.CreatedAt, b.UpdatedAt)
	return err
}

func (r *Repo) GetBalnearioByID(ctx context.Context, id uuid.UUID) (*domain.Balneario, error) {
	row := r.db.QueryRowContext(ctx, `
		SELECT id, name, slug, location, created_at, updated_at
		FROM balnearios WHERE id = $1
	`, id)
	return scanBalneario(row)
}

func (r *Repo) GetBalnearioBySlug(ctx context.Context, slug string) (*domain.Balneario, error) {
	row := r.db.QueryRowContext(ctx, `
		SELECT id, name, slug, location, created_at, updated_at
		FROM balnearios WHERE slug = $1
	`, slug)
	return scanBalneario(row)
}

func (r *Repo) ListBalnearios(ctx context.Context) ([]*domain.Balneario, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, name, slug, location, created_at, updated_at
		FROM balnearios ORDER BY name
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []*domain.Balneario
	for rows.Next() {
		b, err := scanBalneario(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, b)
	}
	return out, rows.Err()
}

func scanBalneario(scanner interface{ Scan(dest ...interface{}) error }) (*domain.Balneario, error) {
	var b domain.Balneario
	if err := scanner.Scan(&b.ID, &b.Name, &b.Slug, &b.Location, &b.CreatedAt, &b.UpdatedAt); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &b, nil
}

// ---------------- Plan units ----------------

func (r *Repo) GetPlanUnitsByBalneario(ctx context.Context, balnearioID uuid.UUID) ([]*domain.PlanUnit, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, balneario_id, unit_number, zone, capacity, position_x, position_y,
		       width, height, shape, is_rentable, status
		FROM plan_units WHERE balneario_id = $1 ORDER BY unit_number
	`, balnearioID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []*domain.PlanUnit
	for rows.Next() {
		u, err := scanPlanUnit(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, u)
	}
	return out, rows.Err()
}

func (r *Repo) GetPlanUnitByID(ctx context.Context, id uuid.UUID) (*domain.PlanUnit, error) {
	row := r.db.QueryRowContext(ctx, `
		SELECT id, balneario_id, unit_number, zone, capacity, position_x, position_y,
		       width, height, shape, is_rentable, status
		FROM plan_units WHERE id = $1
	`, id)
	return scanPlanUnit(row)
}

func (r *Repo) UpdatePlanUnit(ctx context.Context, u *domain.PlanUnit) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE plan_units
		SET unit_number = $1, zone = $2, capacity = $3, position_x = $4, position_y = $5,
		    width = $6, height = $7, shape = $8, is_rentable = $9, status = $10
		WHERE id = $11
	`, u.UnitNumber, u.Zone, u.Capacity, u.PositionX, u.PositionY,
		u.Width, u.Height, u.Shape, u.IsRentable, u.Status, u.ID)
	return err
}

func (r *Repo) SavePlanUnits(ctx context.Context, balnearioID uuid.UUID, units []*domain.PlanUnit) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	keepIDs := make([]uuid.UUID, 0, len(units))
	for _, u := range units {
		if u.ID == uuid.Nil {
			u.ID = uuid.New()
		}
		u.BalnearioID = balnearioID
		keepIDs = append(keepIDs, u.ID)

		if u.Shape == "" {
			u.Shape = "rectangle"
		}
		if u.Status == "" {
			u.Status = "available"
		}

		_, err := tx.ExecContext(ctx, `
			INSERT INTO plan_units (
				id, balneario_id, unit_number, zone, capacity,
				position_x, position_y, width, height, shape, is_rentable, status
			)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
			ON CONFLICT (id) DO UPDATE SET
				unit_number = EXCLUDED.unit_number,
				zone = EXCLUDED.zone,
				capacity = EXCLUDED.capacity,
				position_x = EXCLUDED.position_x,
				position_y = EXCLUDED.position_y,
				width = EXCLUDED.width,
				height = EXCLUDED.height,
				shape = EXCLUDED.shape,
				is_rentable = EXCLUDED.is_rentable,
				status = EXCLUDED.status;
		`, u.ID, u.BalnearioID, u.UnitNumber, u.Zone, u.Capacity,
			u.PositionX, u.PositionY, u.Width, u.Height, u.Shape, u.IsRentable, u.Status)
		if err != nil {
			return err
		}
	}

	if len(keepIDs) > 0 {
		_, err = tx.ExecContext(ctx, `
			DELETE FROM plan_units
			WHERE balneario_id = $1 AND id NOT IN (
				SELECT unnest($2::uuid[])
			)
		`, balnearioID, fmt.Sprintf("{%s}", joinUUIDs(keepIDs)))
		if err != nil {
			return err
		}
	} else {
		_, err = tx.ExecContext(ctx, `DELETE FROM plan_units WHERE balneario_id = $1`, balnearioID)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func joinUUIDs(ids []uuid.UUID) string {
	var s string
	for i, id := range ids {
		if i > 0 {
			s += ","
		}
		s += id.String()
	}
	return s
}

func scanPlanUnit(scanner interface{ Scan(dest ...interface{}) error }) (*domain.PlanUnit, error) {
	var u domain.PlanUnit
	if err := scanner.Scan(
		&u.ID, &u.BalnearioID, &u.UnitNumber, &u.Zone, &u.Capacity,
		&u.PositionX, &u.PositionY, &u.Width, &u.Height, &u.Shape,
		&u.IsRentable, &u.Status,
	); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &u, nil
}

// ---------------- Tariffs ----------------

func (r *Repo) ListTariffsByBalneario(ctx context.Context, balnearioID uuid.UUID) ([]*domain.Tariff, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, balneario_id, unit_type, period, price, currency, season
		FROM tariffs WHERE balneario_id = $1 ORDER BY period
	`, balnearioID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []*domain.Tariff
	for rows.Next() {
		t, err := scanTariff(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

func (r *Repo) CreateTariff(ctx context.Context, t *domain.Tariff) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO tariffs (id, balneario_id, unit_type, period, price, currency, season)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, t.ID, t.BalnearioID, t.UnitType, t.Period, t.Price, t.Currency, t.Season)
	return err
}

func scanTariff(scanner interface{ Scan(dest ...interface{}) error }) (*domain.Tariff, error) {
	var t domain.Tariff
	if err := scanner.Scan(&t.ID, &t.BalnearioID, &t.UnitType, &t.Period, &t.Price, &t.Currency, &t.Season); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &t, nil
}

// ---------------- Customers ----------------

func (r *Repo) CreateCustomer(ctx context.Context, c *domain.Customer) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO customers (id, name, email, phone, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, c.ID, c.Name, c.Email, c.Phone, c.CreatedAt, c.UpdatedAt)
	return err
}

func (r *Repo) GetCustomerByID(ctx context.Context, id uuid.UUID) (*domain.Customer, error) {
	row := r.db.QueryRowContext(ctx, `
		SELECT id, name, email, phone, created_at, updated_at
		FROM customers WHERE id = $1
	`, id)
	return scanCustomer(row)
}

func (r *Repo) SearchCustomers(ctx context.Context, query string) ([]*domain.Customer, error) {
	// Use parameterized ILIKE with a wrapped pattern; the query value is bound,
	// never interpolated, so it is SQL-injection safe.
	pattern := "%" + query + "%"
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, name, email, phone, created_at, updated_at
		FROM customers
		WHERE name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1
		ORDER BY name
		LIMIT 50
	`, pattern)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []*domain.Customer
	for rows.Next() {
		c, err := scanCustomer(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

func scanCustomer(scanner interface{ Scan(dest ...interface{}) error }) (*domain.Customer, error) {
	var c domain.Customer
	if err := scanner.Scan(&c.ID, &c.Name, &c.Email, &c.Phone, &c.CreatedAt, &c.UpdatedAt); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &c, nil
}

// ---------------- Reservations ----------------

func (r *Repo) CreateReservation(ctx context.Context, res *domain.Reservation) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO reservations
		    (id, balneario_id, unit_id, customer_id, start_date, end_date,
		     guest_count, status, total_price, notes, created_by, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
	`, res.ID, res.BalnearioID, res.UnitID, res.CustomerID, res.StartDate, res.EndDate,
		res.GuestCount, res.Status, res.TotalPrice, res.Notes, res.CreatedBy,
		res.CreatedAt, res.UpdatedAt)
	return err
}

func (r *Repo) GetReservationByID(ctx context.Context, id uuid.UUID) (*domain.Reservation, error) {
	row := r.db.QueryRowContext(ctx, reservationSelectSQL+` WHERE id = $1`, id)
	return scanReservation(row)
}

func (r *Repo) GetReservationsByDateRange(ctx context.Context, balnearioID uuid.UUID, start, end time.Time) ([]*domain.Reservation, error) {
	rows, err := r.db.QueryContext(ctx, reservationSelectSQL+`
		WHERE balneario_id = $1 AND start_date < $3 AND $2 < end_date
		ORDER BY start_date
	`, balnearioID, start, end)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanReservations(rows)
}

// GetReservationsByUnitAndDateRange returns reservations for a unit whose
// [start_date, end_date) overlaps [start, end). Used for conflict detection.
func (r *Repo) GetReservationsByUnitAndDateRange(ctx context.Context, unitID uuid.UUID, start, end time.Time) ([]*domain.Reservation, error) {
	rows, err := r.db.QueryContext(ctx, reservationSelectSQL+`
		WHERE unit_id = $1 AND start_date < $3 AND $2 < end_date
		ORDER BY start_date
	`, unitID, start, end)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanReservations(rows)
}

func (r *Repo) ListReservations(ctx context.Context, balnearioID *uuid.UUID, status string) ([]*domain.Reservation, error) {
	switch {
	case balnearioID != nil && status != "":
		rows, err := r.db.QueryContext(ctx, reservationSelectSQL+`
			WHERE balneario_id = $1 AND status = $2 ORDER BY start_date DESC
		`, *balnearioID, status)
		if err != nil {
			return nil, err
		}
		defer rows.Close()
		return scanReservations(rows)
	case balnearioID != nil:
		rows, err := r.db.QueryContext(ctx, reservationSelectSQL+`
			WHERE balneario_id = $1 ORDER BY start_date DESC
		`, *balnearioID)
		if err != nil {
			return nil, err
		}
		defer rows.Close()
		return scanReservations(rows)
	case status != "":
		rows, err := r.db.QueryContext(ctx, reservationSelectSQL+`
			WHERE status = $1 ORDER BY start_date DESC
		`, status)
		if err != nil {
			return nil, err
		}
		defer rows.Close()
		return scanReservations(rows)
	default:
		rows, err := r.db.QueryContext(ctx, reservationSelectSQL+`
			ORDER BY start_date DESC
		`)
		if err != nil {
			return nil, err
		}
		defer rows.Close()
		return scanReservations(rows)
	}
}

func (r *Repo) UpdateReservationStatus(ctx context.Context, id uuid.UUID, status string) error {
	res, err := r.db.ExecContext(ctx, `
		UPDATE reservations SET status = $1, updated_at = NOW() WHERE id = $2
	`, status, id)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return fmt.Errorf("reservation %s not found", id)
	}
	return nil
}

// GetAvailableUnits returns rentable plan units of a balneario that have no
// active (non-cancelled) reservation overlapping [start, end). Implemented as
// a LEFT JOIN to reservations filtered to overlaps, keeping only units with
// no overlapping active reservation.
func (r *Repo) GetAvailableUnits(ctx context.Context, balnearioID uuid.UUID, start, end time.Time) ([]*domain.PlanUnit, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT u.id, u.balneario_id, u.unit_number, u.zone, u.capacity,
		       u.position_x, u.position_y, u.width, u.height, u.shape, u.is_rentable, u.status
		FROM plan_units u
		WHERE u.balneario_id = $1
		  AND u.is_rentable = TRUE
		  AND NOT EXISTS (
		    SELECT 1 FROM reservations r
		    WHERE r.unit_id = u.id
		      AND r.status <> $4
		      AND r.start_date < $3 AND $2 < r.end_date
		  )
		ORDER BY u.unit_number
	`, balnearioID, start, end, domain.ReservationCancelled)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []*domain.PlanUnit
	for rows.Next() {
		u, err := scanPlanUnit(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, u)
	}
	return out, rows.Err()
}

const reservationSelectSQL = `
	SELECT id, balneario_id, unit_id, customer_id, start_date, end_date,
	       guest_count, status, total_price, notes, created_by, created_at, updated_at
	FROM reservations`

func scanReservations(rows *sql.Rows) ([]*domain.Reservation, error) {
	var out []*domain.Reservation
	for rows.Next() {
		res, err := scanReservation(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, res)
	}
	return out, rows.Err()
}

func scanReservation(scanner interface{ Scan(dest ...interface{}) error }) (*domain.Reservation, error) {
	var (
		res   domain.Reservation
		notes sql.NullString
	)
	if err := scanner.Scan(
		&res.ID, &res.BalnearioID, &res.UnitID, &res.CustomerID,
		&res.StartDate, &res.EndDate, &res.GuestCount, &res.Status,
		&res.TotalPrice, &notes, &res.CreatedBy, &res.CreatedAt, &res.UpdatedAt,
	); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	if notes.Valid {
		res.Notes = notes.String
	}
	return &res, nil
}
