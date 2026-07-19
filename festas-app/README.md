# Festas App — SPA de locação de kits (React + Vite)

Frontend do sistema de locação de kits de festa. Fala com a **Festas API**
(repositório `prevent-n8n-pack`, pasta `festas-api/`).

- **Código-fonte:** esta pasta (`festas-app/`).
- **Build publicado:** sai em `../festas` (servido pelo GitHub Pages em
  `https://deliveryland.com.br/festas/`). O build já vai versionado no repositório.

## Rodar em desenvolvimento

```bash
cd festas-app
npm install
npm run dev        # http://localhost:5173/festas/
```

Aponte a API criando `festas-app/.env.local` com:

```
VITE_API_BASE=http://localhost:3333
```

## Build de produção

```bash
npm run build      # typecheck + vite build → ../festas
```

Faça commit da pasta `../festas` gerada. O GitHub Pages serve os arquivos.

## Configurar a URL da API em produção

A URL da API é lida em **runtime** de `festas/festas-config.js` (não precisa
rebuildar para trocar):

```js
window.__FESTAS_API__ = "https://api.seudominio.com.br";
```

## Estrutura

```
festas-app/
├── index.html
├── vite.config.ts        # base: /festas/, outDir: ../festas
├── public/festas-config.js
└── src/
    ├── api.ts            # cliente HTTP + auth (token no localStorage)
    ├── types.ts
    ├── components/       # Header, Calendar, Toast, Spinner
    └── pages/
        ├── Catalog.tsx   # catálogo
        ├── Booking.tsx   # reserva + calendário + taxas + checkout Pix/MP
        ├── Retorno.tsx   # retorno do Mercado Pago
        └── admin/        # login, reservas, kits (CRUD), configurações
```

Rotas (HashRouter): `/`, `/kit/:id`, `/retorno/:tipo`, `/admin`,
`/admin/reservas`, `/admin/kits`, `/admin/config`.
