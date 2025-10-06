package http

import (
	"encoding/json"
	"net/http"

	"github.com/matheusandre1/conty-backend-challenge/submissions/matheusandre1/pix/core/dto/request"
	"github.com/matheusandre1/conty-backend-challenge/submissions/matheusandre1/pix/core/dto/response"
	"github.com/matheusandre1/conty-backend-challenge/submissions/matheusandre1/pix/core/service"
)

var _ = response.PaymentResponseDto{}

type PaymentController struct {
	paymentService *service.PaymentService
}

func NewPaymentController(paymentService *service.PaymentService) *PaymentController {
	return &PaymentController{
		paymentService: paymentService,
	}
}

// @Summary Processa um lote de pagamentos via Pix
// @Description Recebe um lote de pagamentos via Pix, processa cada pagamento e retorna o status de cada um.
// @Tags Pagamentos
// @Accept json
// @Produce json
// @Param payment body request.PaymentRequestDto true "Lote de Pagamentos"
// @Success 200 {object} response.PaymentResponseDto "Lote processado com sucesso"
// @Failure 400 {string} string "Requisição inválida"
// @Failure 500 {string} string "Erro interno do servidor"
// @Router /payouts/batch [post]
func (c *PaymentController) ProcessPaymentBatch(w http.ResponseWriter, r *http.Request) {

	if r.Method != http.MethodPost {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	var request request.PaymentRequestDto
	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&request); err != nil {
		http.Error(w, "Erro ao decodificar o corpo da requisição: "+err.Error(), http.StatusBadRequest)
		return
	}

	response, err := c.paymentService.ProcessPaymentBatch(request)
	if err != nil {
		http.Error(w, "Erro ao processar o lote de pagamentos: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	encoder := json.NewEncoder(w)
	if err := encoder.Encode(response); err != nil {
		http.Error(w, "Erro ao codificar a resposta: "+err.Error(), http.StatusInternalServerError)
		return
	}
}

// @Summary Recupera todos os pagamentos processados
// @Description Retorna uma lista de todos os pagamentos processados, incluindo detalhes como status e valores.
// @Tags Pagamentos
// @Produce json
// @Success 200 {array} response.PaymentResponseDto "Lista de pagamentos processados"
// @Failure 500 {string} string "Erro interno do servidor"
// @Router /payouts [get]
func (c *PaymentController) GetAllPayments(w http.ResponseWriter, r *http.Request) {

	responses, err := c.paymentService.GetAllPayments()
	if err != nil {
		http.Error(w, "Erro ao buscar os pagamentos: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	encoder := json.NewEncoder(w)
	if err := encoder.Encode(responses); err != nil {
		http.Error(w, "Erro ao codificar a resposta: "+err.Error(), http.StatusInternalServerError)
		return
	}
}
