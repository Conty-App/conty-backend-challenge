package tests

import (
	"errors"
	"reflect"
	"testing"

	"github.com/matheusandre1/conty-backend-challenge/submissions/matheusandre1/pix/core/domain"
	"github.com/matheusandre1/conty-backend-challenge/submissions/matheusandre1/pix/core/dto/payment"
	"github.com/matheusandre1/conty-backend-challenge/submissions/matheusandre1/pix/core/dto/request"
	"github.com/matheusandre1/conty-backend-challenge/submissions/matheusandre1/pix/core/dto/response"
	"github.com/matheusandre1/conty-backend-challenge/submissions/matheusandre1/pix/core/service"
	"github.com/matheusandre1/conty-backend-challenge/submissions/matheusandre1/pix/database"
)

type MockRepository struct {
	duplicates   map[string]bool
	saved        *domain.Payment
	allPayments  []*domain.Payment
	shouldError  bool
	errorMessage string
}

func (m *MockRepository) CheckDuplicate(externalID string) bool {
	return m.duplicates[externalID]
}

func (m *MockRepository) SavePayment(p *domain.Payment) error {
	if m.shouldError {
		return errors.New(m.errorMessage)
	}
	m.saved = p
	m.allPayments = append(m.allPayments, p)
	return nil
}

func (m *MockRepository) SavePaymentIfNotDuplicate(p *domain.Payment) error {
	if m.shouldError {
		return errors.New(m.errorMessage)
	}

	for _, detail := range p.Details {
		if m.duplicates[detail.ExternalID] {
			return domain.ErrDuplicateExternalID
		}
	}

	m.saved = p
	m.allPayments = append(m.allPayments, p)

	for _, detail := range p.Details {
		m.duplicates[detail.ExternalID] = true
	}

	return nil
}

func (m *MockRepository) FindAllPayments() ([]*domain.Payment, error) {
	if m.shouldError {
		return nil, errors.New(m.errorMessage)
	}
	return m.allPayments, nil
}

func TestProcessPaymentBatch_Success_NewItems(t *testing.T) {
	repo := database.NewInMemoryPaymentRepository()
	svc := service.NewPaymentService(repo)

	requestDto := request.PaymentRequestDto{
		BatchID: "batch_123",
		Items: []payment.PaymentItemDto{
			{ExternalID: "u1-001", UserID: "u1", AmountCents: 1000, PixKey: "u1@email.com"},
			{ExternalID: "u2-001", UserID: "u2", AmountCents: 2000, PixKey: "+55 11 91234-5678"},
		},
	}

	resp, err := svc.ProcessPaymentBatch(requestDto)

	if err != nil {
		t.Fatalf("esperava nenhum erro, mas recebeu: %v", err)
	}

	if resp.BatchID != "batch_123" {
		t.Errorf("BatchID incorreto. Esperado 'batch_123', obtido '%s'", resp.BatchID)
	}
	if resp.Processed != 2 {
		t.Errorf("Processed incorreto. Esperado 2, obtido %d", resp.Processed)
	}
	if resp.Successful != 2 {
		t.Errorf("Successful incorreto. Esperado 2, obtido %d", resp.Successful)
	}
	if resp.Failed != 0 {
		t.Errorf("Failed incorreto. Esperado 0, obtido %d", resp.Failed)
	}
	if resp.Duplicates != 0 {
		t.Errorf("Duplicates incorreto. Esperado 0, obtido %d", resp.Duplicates)
	}
	if len(resp.Details) != 2 {
		t.Errorf("Details incorreto. Esperado 2 itens, obtido %d", len(resp.Details))
	}

	all, _ := repo.FindAllPayments()
	if len(all) != 1 {
		t.Fatalf("esperava 1 pagamento salvo, mas encontrou %d", len(all))
	}
}

func TestProcessPaymentBatch_WithDuplicates(t *testing.T) {

	mockRepo := &MockRepository{
		duplicates: map[string]bool{
			"u1-001": true,
			"u2-001": false,
		},
		allPayments: []*domain.Payment{},
	}

	svc := service.NewPaymentService(mockRepo)

	requestDto := request.PaymentRequestDto{
		BatchID: "batch_456",
		Items: []payment.PaymentItemDto{
			{ExternalID: "u1-001", UserID: "u1", AmountCents: 1000, PixKey: "u1@email.com"},
			{ExternalID: "u2-001", UserID: "u2", AmountCents: 2000, PixKey: "+55 11 91234-5678"},
		},
	}

	expectedResponse := &response.PaymentResponseDto{
		BatchID:    "batch_456",
		Processed:  2,
		Successful: 1,
		Failed:     0,
		Duplicates: 1,
		Details: []payment.PaymentDetailDto{
			{ExternalID: "u1-001", Status: "duplicate", AmountCents: 1000},
			{ExternalID: "u2-001", Status: "paid", AmountCents: 2000},
		},
	}

	resp, err := svc.ProcessPaymentBatch(requestDto)

	if err != nil {
		t.Fatalf("Esperava nenhum erro, mas recebeu: %v", err)
	}

	if !reflect.DeepEqual(resp, expectedResponse) {
		t.Errorf("Resposta incorreta.\nEsperado: %+v\nObtido: %+v", expectedResponse, resp)
	}

	if resp.Duplicates != 1 {
		t.Errorf("Esperava 1 duplicado, obtido %d", resp.Duplicates)
	}

	if resp.Successful != 1 {
		t.Errorf("Esperava 1 sucesso, obtido %d", resp.Successful)
	}
}

func TestProcessPaymentBatch_EmptyBatch(t *testing.T) {

	mockRepo := &MockRepository{
		duplicates:  map[string]bool{},
		allPayments: []*domain.Payment{},
	}

	svc := service.NewPaymentService(mockRepo)

	requestDto := request.PaymentRequestDto{
		BatchID: "batch_empty",
		Items:   []payment.PaymentItemDto{},
	}

	expectedResponse := &response.PaymentResponseDto{
		BatchID:    "batch_empty",
		Processed:  0,
		Successful: 0,
		Failed:     0,
		Duplicates: 0,
		Details:    []payment.PaymentDetailDto{},
	}

	resp, err := svc.ProcessPaymentBatch(requestDto)

	if err != nil {
		t.Fatalf("Esperava nenhum erro, mas recebeu: %v", err)
	}

	if !reflect.DeepEqual(resp, expectedResponse) {
		t.Errorf("Resposta incorreta.\nEsperado: %+v\nObtido: %+v", expectedResponse, resp)
	}
}

func TestProcessPaymentBatch_RepositoryError(t *testing.T) {

	mockRepo := &MockRepository{
		duplicates:   map[string]bool{},
		allPayments:  []*domain.Payment{},
		shouldError:  true,
		errorMessage: "erro de conexão com o banco",
	}

	svc := service.NewPaymentService(mockRepo)

	requestDto := request.PaymentRequestDto{
		BatchID: "batch_error",
		Items: []payment.PaymentItemDto{
			{ExternalID: "u1-001", UserID: "u1", AmountCents: 1000, PixKey: "u1@email.com"},
		},
	}

	resp, err := svc.ProcessPaymentBatch(requestDto)

	if err == nil {
		t.Fatalf("Esperava um erro, mas não recebeu nenhum")
	}

	if resp != nil {
		t.Errorf("Esperava resposta nula em caso de erro, mas recebeu: %+v", resp)
	}

	if err.Error() != "erro de conexão com o banco" {
		t.Errorf("Mensagem de erro incorreta. Esperado 'erro de conexão com o banco', obtido '%s'", err.Error())
	}
}

func TestGetAllPayments_Success(t *testing.T) {

	existingPayment := &domain.Payment{
		BatchID:    "batch_existing",
		Processed:  1,
		Successful: 1,
		Failed:     0,
		Duplicates: 0,
		Details: []domain.Detail{
			{ExternalID: "u1-001", Status: "paid", AmountCents: 1000},
		},
	}

	mockRepo := &MockRepository{
		duplicates:  map[string]bool{},
		allPayments: []*domain.Payment{existingPayment},
	}

	svc := service.NewPaymentService(mockRepo)

	payments, err := svc.GetAllPayments()

	if err != nil {
		t.Fatalf("Esperava nenhum erro, mas recebeu: %v", err)
	}

	if len(payments) != 1 {
		t.Fatalf("Esperava 1 pagamento, obtido %d", len(payments))
	}

	if payments[0].BatchID != "batch_existing" {
		t.Errorf("BatchID incorreto. Esperado 'batch_existing', obtido '%s'", payments[0].BatchID)
	}
}

func TestGetAllPayments_Empty(t *testing.T) {

	mockRepo := &MockRepository{
		duplicates:  map[string]bool{},
		allPayments: []*domain.Payment{},
	}

	svc := service.NewPaymentService(mockRepo)

	payments, err := svc.GetAllPayments()

	if err != nil {
		t.Fatalf("Esperava nenhum erro, mas recebeu: %v", err)
	}

	if len(payments) != 0 {
		t.Errorf("Esperava 0 pagamentos, obtido %d", len(payments))
	}
}

func TestGetAllPayments_RepositoryError(t *testing.T) {

	mockRepo := &MockRepository{
		duplicates:   map[string]bool{},
		allPayments:  []*domain.Payment{},
		shouldError:  true,
		errorMessage: "erro de conexão com o banco",
	}

	svc := service.NewPaymentService(mockRepo)

	payments, err := svc.GetAllPayments()

	if err == nil {
		t.Fatalf("Esperava um erro, mas não recebeu nenhum")
	}

	if payments != nil {
		t.Errorf("Esperava resposta nula em caso de erro, mas recebeu: %+v", payments)
	}

	if err.Error() != "erro de conexão com o banco" {
		t.Errorf("Mensagem de erro incorreta. Esperado 'erro de conexão com o banco', obtido '%s'", err.Error())
	}
}

func TestIntegration_PaymentService_WithRealRepository(t *testing.T) {
	repo := database.NewInMemoryPaymentRepository()
	svc := service.NewPaymentService(repo)

	firstBatch := request.PaymentRequestDto{
		BatchID: "integration_batch_1",
		Items: []payment.PaymentItemDto{
			{ExternalID: "int-001", UserID: "u1", AmountCents: 1000, PixKey: "u1@email.com"},
			{ExternalID: "int-002", UserID: "u2", AmountCents: 2000, PixKey: "u2@email.com"},
		},
	}

	resp1, err := svc.ProcessPaymentBatch(firstBatch)
	if err != nil {
		t.Fatalf("Erro no primeiro batch: %v", err)
	}

	if resp1.Successful != 2 || resp1.Duplicates != 0 {
		t.Errorf("Primeiro batch incorreto. Successful: %d, Duplicates: %d", resp1.Successful, resp1.Duplicates)
	}

	secondBatch := request.PaymentRequestDto{
		BatchID: "integration_batch_2",
		Items: []payment.PaymentItemDto{
			{ExternalID: "int-001", UserID: "u1", AmountCents: 1000, PixKey: "u1@email.com"}, // Duplicado
			{ExternalID: "int-003", UserID: "u3", AmountCents: 3000, PixKey: "u3@email.com"}, // Novo
		},
	}

	resp2, err := svc.ProcessPaymentBatch(secondBatch)
	if err != nil {
		t.Fatalf("Erro no segundo batch: %v", err)
	}

	if resp2.Successful != 1 || resp2.Duplicates != 1 {
		t.Errorf("Segundo batch incorreto. Successful: %d, Duplicates: %d", resp2.Successful, resp2.Duplicates)
	}

	allPayments, err := svc.GetAllPayments()
	if err != nil {
		t.Fatalf("Erro ao buscar todos os pagamentos: %v", err)
	}

	if len(allPayments) != 2 {
		t.Errorf("Esperava 2 batches salvos, obtido %d", len(allPayments))
	}

	thirdBatch := request.PaymentRequestDto{
		BatchID: "integration_batch_3",
		Items: []payment.PaymentItemDto{
			{ExternalID: "int-001", UserID: "u1", AmountCents: 1000, PixKey: "u1@email.com"},
			{ExternalID: "int-002", UserID: "u2", AmountCents: 2000, PixKey: "u2@email.com"},
		},
	}

	resp3, err := svc.ProcessPaymentBatch(thirdBatch)
	if err == nil {
		t.Fatal("Esperava erro no terceiro batch (todos duplicados), mas não recebeu")
	}

	if resp3 != nil {
		t.Errorf("Esperava resposta nula para batch com todos duplicados, mas recebeu: %+v", resp3)
	}
}

func TestConcurrency_PaymentRepository(t *testing.T) {
	repo := database.NewInMemoryPaymentRepository()

	done := make(chan bool, 2)

	go func() {
		for i := 0; i < 100; i++ {
			payment := &domain.Payment{
				BatchID: "concurrent_1",
				Details: []domain.Detail{
					{ExternalID: "conc-1-" + string(rune(i)), Status: "paid", AmountCents: 1000},
				},
			}
			repo.SavePayment(payment)
		}
		done <- true
	}()

	go func() {
		for i := 0; i < 100; i++ {
			payment := &domain.Payment{
				BatchID: "concurrent_2",
				Details: []domain.Detail{
					{ExternalID: "conc-2-" + string(rune(i)), Status: "paid", AmountCents: 2000},
				},
			}
			repo.SavePayment(payment)
		}
		done <- true
	}()

	<-done
	<-done

	payments, err := repo.FindAllPayments()
	if err != nil {
		t.Fatalf("Erro ao buscar pagamentos após teste de concorrência: %v", err)
	}

	if len(payments) == 0 {
		t.Error("Nenhum pagamento encontrado após teste de concorrência")
	}
}
