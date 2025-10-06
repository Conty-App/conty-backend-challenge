# Conty Backend Challenge

Projeto desenvolvido como solução para o desafio backend da Conty, implementado em **FastAPI** com **PostgreSQL**.

O sistema processa batches de pagamentos via PIX, registrando pagamentos com status `paid`, `failed` ou `duplicate`, armazenando os resultados no banco de dados.

---

## Tecnologias Utilizadas

- Python 3.12  
- FastAPI  
- SQLAlchemy (Async)  
- asyncpg  
- PostgreSQL  
- Uvicorn  

---

## Estrutura do Projeto

```
.
├── main.py                  # Arquivo principal com endpoints
├── db/
│   ├── database.py         # Configuração do banco e conexão
│   └── models.py           # Modelos de dados
├── requirements.txt        # Dependências
└── README.md               # Este arquivo
```

---

## Instalação e Execução

1. Clone o repositório:
```bash
git clone <URL_DO_REPOSITORIO>
```

2. Entre no diretório do projeto:
```bash
cd conty-backend-challenge/submissions/pedro-alvesjr
```

3. Crie e ative um ambiente virtual:
```bash
python -m venv venv
# No Linux/Mac
source venv/bin/activate
# No Windows
venv\Scripts\activate
```

4. Instale as dependências:
```bash
pip install -r requirements.txt
```

5. Configure o banco de dados no arquivo `db/database.py`:
```python
DATABASE_URL = "postgresql+asyncpg://postgres:SUA_SENHA@localhost:5432/conty_db"
```

6. Crie o banco de dados no PostgreSQL:
```sql
CREATE DATABASE conty_db;
```

7. Execute a aplicação:
```bash
uvicorn main:app --reload
```
A documentação Swagger estará disponível em:
```
http://127.0.0.1:8000/docs
```

## Banco de Dados

Modelo principal: **Payout**

| Campo        | Tipo         | Descrição                             |
|--------------|--------------|---------------------------------------|
| external_id  | string       | Identificador único do pagamento     |
| batch_id     | string       | Identificador do batch               |
| pix_key      | string       | Chave PIX                             |
| amount_cents | integer      | Valor em centavos                     |
| user_id      | string       | ID do usuário (opcional)             |
| status       | enum         | `paid`, `failed` ou `duplicate`      |
