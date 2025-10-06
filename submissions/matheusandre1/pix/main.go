package main

import (
	"log"
	"net/http"

	adapter "github.com/matheusandre1/conty-backend-challenge/submissions/matheusandre1/pix/adapter/http"
	_ "github.com/matheusandre1/conty-backend-challenge/submissions/matheusandre1/pix/adapter/http/docs"
	"github.com/matheusandre1/conty-backend-challenge/submissions/matheusandre1/pix/core/service"
	"github.com/matheusandre1/conty-backend-challenge/submissions/matheusandre1/pix/database"
	httpSwagger "github.com/swaggo/http-swagger"
)

// @title Conty – Desafio Técnico (Backend)
// @version 1.0
// @contact.name Matheus André
// @host localhost:8080
// @BasePath /
func main() {

	repository := database.NewInMemoryPaymentRepository()

	paymentService := service.NewPaymentService(repository)

	paymentController := adapter.NewPaymentController(paymentService)

	http.HandleFunc("/payouts/batch", paymentController.ProcessPaymentBatch)
	http.HandleFunc("/payouts", paymentController.GetAllPayments)

	http.Handle("/swagger/", httpSwagger.WrapHandler)

	log.Println("Clique no link abaixo para acessar a documentação da API:")
	log.Println("http://localhost:8080/swagger/index.html")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("Erro ao iniciar o servidor: %v", err)
	}
}
