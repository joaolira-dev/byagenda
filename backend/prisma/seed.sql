INSERT INTO "categories" ("id", "name", "slug", "icon", "is_active", "created_at", "updated_at")
VALUES
  ('2e1543ef-29a4-4f92-8f76-e3eea5de22ad', 'Barbearia', 'barbearia', 'cut', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('8227bc16-35f7-483d-ad10-a53b5607e619', 'Salao de beleza', 'salao-de-beleza', 'sparkles', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('d7ee6e81-c513-41fe-a246-5295dbafbf64', 'Manicure e pedicure', 'manicure-e-pedicure', 'hand', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ef45f91e-b580-4eba-a28c-ef60cccb63a6', 'Clinica estetica', 'clinica-estetica', 'heart', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "icon" = EXCLUDED."icon",
  "is_active" = EXCLUDED."is_active",
  "updated_at" = CURRENT_TIMESTAMP;
