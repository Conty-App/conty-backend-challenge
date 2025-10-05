package main

import (
	"context"
	"database/sql"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/hendelsantos/conty-pix-challenge/internal/config"
	"github.com/hendelsantos/conty-pix-challenge/internal/handler"
	"github.com/hendelsantos/conty-pix-challenge/internal/repository"
	"github.com/hendelsantos/conty-pix-challenge/internal/service"
	"github.com/sirupsen/logrus"
	_ "github.com/lib/pq"
)

func main() {
	// Load configuration
	cfg := config.Load()
	cfg.ConfigureLogger()

	logger := logrus.New()
	logger.Info("Starting Conty PIX Service")

	// Connect to database
	db, err := sql.Open("postgres", cfg.DatabaseDSN())
	if err != nil {
		logger.WithError(err).Fatal("Failed to connect to database")
	}
	defer db.Close()

	// Test database connection
	if err := db.Ping(); err != nil {
		logger.WithError(err).Fatal("Failed to ping database")
	}
	logger.Info("Database connection established")

	// Initialize repositories
	payoutRepo := repository.NewPostgresPayoutRepository(db)
	batchReportRepo := repository.NewPostgresBatchReportRepository(db)

	// Initialize services
	pixProcessor := service.NewPIXProcessor(&cfg.PIX, logger)
	payoutService := service.NewPayoutService(payoutRepo, batchReportRepo, pixProcessor, logger)

	// Initialize handlers
	payoutHandler := handler.NewPayoutHandler(payoutService, logger)

	// Setup router
	gin.SetMode(cfg.GinMode)
	router := gin.New()
	
	// Middleware
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	// Routes
	router.GET("/health", payoutHandler.HealthCheck)
	router.POST("/payouts/batch", payoutHandler.ProcessBatch)

	// Setup server
	server := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: router,
	}

	// Start server in a goroutine
	go func() {
		logger.WithField("port", cfg.Port).Info("Server starting")
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.WithError(err).Fatal("Failed to start server")
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	logger.Info("Server shutting down...")

	// Context with timeout for graceful shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		logger.WithError(err).Fatal("Server forced to shutdown")
	}

	logger.Info("Server exited")
}