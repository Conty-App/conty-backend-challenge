package server

import (
	"encoding/json"
	"log"
	"net/http"

	"RoyMusthang/internal/entity"
	"RoyMusthang/internal/repository"
	"RoyMusthang/internal/service"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

type Handler struct {
	service *service.PaymentService
}

func NewHandler(service *service.PaymentService) *Handler {
	return &Handler{service: service}
}

func (s *Server) RegisterRoutes() http.Handler {
	r := gin.Default()

	failureRate := 0.1 // 10% de falha
	log.Printf("[INIT] Starting server with failureRate=%.2f", failureRate)

	repo := repository.NewPaymentRepository(s.db.DB())
	pixService := service.NewPIXService(failureRate)
	paymentService := service.NewPaymentService(repo, pixService)
	handler := NewHandler(paymentService)

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowHeaders:     []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
	}))

	r.GET("/", s.HelloWorldHandler)
	r.POST("/payouts/batch", handler.ProcessBatch)
	r.GET("/health", s.healthHandler)

	return r
}

func (s *Server) HelloWorldHandler(c *gin.Context) {
	log.Println("[INFO] HelloWorld endpoint called")
	resp := map[string]string{"message": "Hello World"}
	c.JSON(http.StatusOK, resp)
}

func (s *Handler) ProcessBatch(c *gin.Context) {
	var req entity.BatchRequest
	if err := json.NewDecoder(c.Request.Body).Decode(&req); err != nil {
		log.Printf("[ERROR] Failed to decode request: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	log.Printf("[INFO] Processing batch request. BatchID=%s Items=%d", req.BatchID, len(req.Items))

	if req.BatchID == "" {
		log.Println("[WARN] Empty BatchID received")
		c.JSON(http.StatusBadRequest, gin.H{"error": "batch_id is required"})
		return
	}
	if len(req.Items) == 0 {
		log.Println("[WARN] Empty Items list received")
		c.JSON(http.StatusBadRequest, gin.H{"error": "items cannot be empty"})
		return
	}

	// Process batch
	response := s.service.ProcessBatch(req)

	log.Printf("[INFO] Batch %s processed successfully. ProcessedItems=%d", req.BatchID, len(req.Items))

	c.JSON(http.StatusOK, response)
}

func (s *Server) healthHandler(c *gin.Context) {
	log.Println("[INFO] Health check called")
	c.JSON(http.StatusOK, s.db.Health())
}
