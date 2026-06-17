# Autenticacao JWT

## Objetivo

A camada de autenticacao protege rotas privadas da API, valida o token JWT
enviado no header `Authorization` e injeta no `request` os dados do usuario
autenticado.

## Header esperado

```text
Authorization: Bearer <jwt>
```

O esquema `Bearer` e aceito sem diferenciar maiusculas/minusculas. Headers sem
token, com esquema diferente ou malformados retornam `401`.

## Payload

O backend usa o claim `sub` como identificador do usuario:

```json
{
  "sub": "user-uuid"
}
```

A role nao e confiada diretamente ao token. Depois de validar a assinatura, o
backend consulta o usuario no banco e injeta a role atual no request. Isso evita
que um token antigo continue carregando permissoes desatualizadas.

## Dados injetados

Depois da autenticacao:

```ts
request.auth = {
  userId: 'user-uuid',
  role: 'OWNER',
};
```

## RBAC

Rotas administrativas usam `requireRole(UserRole.OWNER)`.

- Usuarios `OWNER` podem acessar rotas de gestao dos proprios recursos.
- Usuarios `CLIENT` recebem `403 FORBIDDEN`.
- Tokens validos de usuarios inativos ou inexistentes recebem `401`.

## Erros

```json
{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Token de acesso invalido"
  }
}
```

Codigos usados:

- `UNAUTHORIZED`: token ausente ou header sem `Bearer`.
- `INVALID_TOKEN`: assinatura invalida, payload sem `sub` ou usuario inativo.
- `FORBIDDEN`: usuario autenticado sem role suficiente.
