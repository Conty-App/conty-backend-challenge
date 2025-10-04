package server

import (
	"encoding/json"
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

	repo := repository.NewPaymentRepository()
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
	resp := make(map[string]string)
	resp["message"] = "Hello World"

	c.JSON(http.StatusOK, resp)
}

func (s *Handler) ProcessBatch(c *gin.Context) {
	var req entity.BatchRequest
	if err := json.NewDecoder(c.Request.Body).Decode(&req); err != nil {
		c.JSON(http.StatusBadRequest, req)
		return
	}

	// Validate request
	if req.BatchID == "" {
		c.JSON(http.StatusBadRequest, req)
		return
	}
	if len(req.Items) == 0 {
		c.JSON(http.StatusBadRequest, req)
		return
	}

	// Process batch
	response := s.service.ProcessBatch(req)

	// Return response
	c.JSON(http.StatusOK, response)
}

func (s *Server) healthHandler(c *gin.Context) {
	c.JSON(http.StatusOK, s.db.Health())
}
