/* ────────────────────────────────────────────────────────────
   Configuração do app de locação de kits de festa.
   Ajuste N8N_BASE para a URL pública do seu n8n (sem barra no fim).
   Os webhooks correspondem aos workflows de prevent-n8n-pack/workflows/kit-festas.
   ──────────────────────────────────────────────────────────── */
window.FESTAS_CONFIG = {
  // URL base do n8n. Ex: "https://n8n.seudominio.com.br"
  N8N_BASE: "https://SEU_N8N",

  // Endpoints (não precisa mexer se os paths dos webhooks não mudaram)
  ENDPOINTS: {
    catalogo: "/webhook/festas-catalogo",
    reserva: "/webhook/festas-reserva",
    admin: "/webhook/festas-admin-reserva"
  },

  // Marca
  NOME_NEGOCIO: "Kit Festas & Arcos",
  WHATSAPP_CONTATO: "5511977776666" // usado no botão "falar no WhatsApp"
};
