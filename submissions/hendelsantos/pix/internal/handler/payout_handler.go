package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/hendelsantos/conty-pix-challenge/internal/domain"
	"github.com/sirupsen/logrus"
)

type PayoutHandler struct {
	payoutService domain.PayoutService
	logger        *logrus.Logger
}

// NewPayoutHandler creates a new payout handler
func NewPayoutHandler(payoutService domain.PayoutService, logger *logrus.Logger) *PayoutHandler {
	return &PayoutHandler{
		payoutService: payoutService,
		logger:        logger,
	}
}

// ProcessBatch handles batch payout processing
func (h *PayoutHandler) ProcessBatch(c *gin.Context) {
	var request domain.BatchRequest
	
	if err := c.ShouldBindJSON(&request); err != nil {
		h.logger.WithError(err).Error("Invalid request payload")
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request payload",
			"details": err.Error(),
		})
		return
	}

	h.logger.WithFields(logrus.Fields{
		"batch_id":   request.BatchID,
		"item_count": len(request.Items),
	}).Info("Received batch processing request")

	response, err := h.payoutService.ProcessBatch(c.Request.Context(), &request)
	if err != nil {
		h.logger.WithError(err).Error("Failed to process batch")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to process batch",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, response)
}

// HealthCheck handles health check requests
func (h *PayoutHandler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "healthy",
		"service": "conty-pix-service",
	})
}