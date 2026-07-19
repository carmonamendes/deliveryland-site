# Festas — App de locação de kits

Frontend estático (GitHub Pages) do sistema de locação de kits de festa e arcos
de balão. Conversa com o backend n8n do repositório **`prevent-n8n-pack`**
(pasta `workflows/kit-festas/`).

## Páginas

| Arquivo | URL | O que faz |
|---|---|---|
| `index.html` | `/festas/` | Catálogo → escolha da data na agenda → taxas de entrega/montagem → dados do cliente → pagamento (Pix ou Mercado Pago) |
| `admin.html` | `/festas/admin.html` | Painel: lista reservas, confirma Pix manualmente, cancela. Pede o `FESTAS_ADMIN_TOKEN` |
| `obrigado.html` / `pendente.html` / `erro.html` | retorno do Mercado Pago | Telas de retorno do checkout |
| `config.js` | — | Configuração: **defina `N8N_BASE`** com a URL pública do seu n8n |

## Configurar

1. Edite `festas/config.js` e troque `N8N_BASE` pela URL do n8n
   (ex.: `https://n8n.seudominio.com.br`).
2. No n8n, importe e ative os 5 workflows de `prevent-n8n-pack/workflows/kit-festas/`
   e preencha as variáveis `FESTAS_*` (veja `docs/kit-festas.md` naquele repo).
3. Cadastre os kits na aba **Kits** da planilha do Google Sheets.

## Fluxo

```
index.html ──GET  /webhook/festas-catalogo   → kits + datas ocupadas + taxas
           ──POST /webhook/festas-reserva     → cria reserva + Pix/checkout
admin.html ──POST /webhook/festas-admin-reserva → listar / confirmar / cancelar
```

O valor total é sempre recalculado no backend — o frontend só mostra a prévia.
