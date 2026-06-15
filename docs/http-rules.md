# Regras HTTP do ByAgenda

## Base da API

- Prefixo atual: `/api/v1`.
- Corpo e respostas usam `application/json`.
- Campos JSON usam `camelCase`.
- IDs sao UUIDs.
- Datas usam ISO 8601 em UTC.
- Valores monetarios sao enviados nas respostas como string decimal, por
  exemplo `"50.00"`.

## Autenticacao e autorizacao

- Rotas protegidas recebem `Authorization: Bearer <token>`.
- O identificador do usuario vem do claim JWT `sub`.
- O usuario e consultado no banco a cada requisicao protegida.
- `ownerId` e outros identificadores de autoria nunca sao aceitos pelo body.
- `ownerId` nao e exposto nas respostas de estabelecimentos.
- Operacoes de gestao exigem usuario ativo com papel `OWNER`.
- Um proprietario so pode alterar os proprios estabelecimentos e servicos.

## Respostas

Resposta simples:

```json
{
  "data": {}
}
```

Resposta paginada:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

Resposta de erro:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados invalidos",
    "details": [
      {
        "field": "body.name",
        "message": "Too small"
      }
    ]
  }
}
```

## Status HTTP

- `200 OK`: consulta ou atualizacao concluida.
- `201 Created`: recurso criado.
- `204 No Content`: exclusao logica concluida.
- `401 Unauthorized`: token ausente, invalido ou usuario inativo.
- `403 Forbidden`: usuario autenticado sem permissao.
- `404 Not Found`: recurso ou rota inexistente.
- `409 Conflict`: conflito de unicidade.
- `422 Unprocessable Entity`: body, params ou query invalidos.
- `500 Internal Server Error`: falha inesperada.

## Paginacao e filtros

- Listagens recebem `page`, iniciando em `1`.
- `limit` usa valor padrao `20` e maximo `100`.
- Ordenacoes possuem criterio secundario por ID para estabilidade.
- Filtros desconhecidos sao descartados pela validacao.
- Estabelecimentos publicos exibem apenas status `ACTIVE`.
- Servicos publicos exibem apenas registros ativos de estabelecimentos ativos.

## Exclusao

- `DELETE` nao remove estabelecimentos nem servicos fisicamente.
- Estabelecimentos passam para `INACTIVE`.
- Servicos passam para `isActive = false`.
- Ao inativar um estabelecimento via `DELETE`, seus servicos tambem sao
  inativados.
- A exclusao logica preserva agendamentos e demais referencias historicas.

## Endpoints implementados

### Categorias

```text
GET /api/v1/categories
```

### Estabelecimentos

```text
GET    /api/v1/establishments
GET    /api/v1/establishments/:id
POST   /api/v1/establishments
PATCH  /api/v1/establishments/:id
PATCH  /api/v1/establishments/:id/status
DELETE /api/v1/establishments/:id
GET    /api/v1/owner/establishments
```

Filtros publicos:

```text
page, limit, search, categoryId, city, state
```

O cadastro exige ao menos uma categoria ativa. O slug e gerado pelo backend,
permanece estavel quando o nome muda e recebe sufixo numerico em caso de
duplicidade.

### Servicos

```text
GET    /api/v1/establishments/:establishmentId/services
GET    /api/v1/establishments/:establishmentId/services/:serviceId
POST   /api/v1/establishments/:establishmentId/services
PATCH  /api/v1/establishments/:establishmentId/services/:serviceId
DELETE /api/v1/establishments/:establishmentId/services/:serviceId
```

- `price` deve estar entre `0` e `99999999.99`.
- `durationMinutes` deve estar entre `1` e `1440`.
- Um servico inativo pode ser reativado com `PATCH` e `isActive: true`.

## Evolucao

- Novas versoes incompatíveis devem usar outro prefixo, como `/api/v2`.
- Codigos de erro sao contratos estaveis para o frontend.
- Novos campos opcionais podem ser adicionados sem alterar a versao.
- Remocao ou mudanca semantica de campos exige nova versao.
