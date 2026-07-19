export interface Kit {
  id: number;
  nome: string;
  tema: string;
  descricao: string;
  preco_locacao: number;
  imagem_url: string;
  itens: string[];
}

export interface KitAdmin extends Kit {
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface Taxas {
  montagem: number;
  entrega_base: number;
  entrega_km: number;
}

export interface Catalogo {
  ok: boolean;
  nome_negocio: string;
  kits: Kit[];
  datas_indisponiveis: string[];
  taxas: Taxas;
  antecedencia_min_dias: number;
  metodos_pagamento: Array<'pix' | 'mercadopago'>;
}

export interface ResumoReserva {
  kit_nome: string;
  data_evento: string;
  periodo: string;
  valor_kit: number;
  taxa_entrega: number;
  taxa_montagem: number;
}

export interface PagamentoPix {
  tipo: 'pix';
  pix_copia_cola: string;
  chave: string;
  instrucoes: string;
}
export interface PagamentoMP {
  tipo: 'mercadopago';
  preference_id: string;
  init_point: string;
  instrucoes: string;
}

export interface ReservaCriada {
  ok: boolean;
  reserva_id: string;
  status: string;
  metodo_pagamento: string;
  valor_total: number;
  resumo: ResumoReserva;
  pagamento: PagamentoPix | PagamentoMP;
}

export interface Reserva {
  id: string;
  kit_id: number;
  kit_nome: string;
  data_evento: string;
  periodo: string;
  cliente_nome: string;
  cliente_whatsapp: string;
  endereco: string;
  distancia_km: number;
  taxa_entrega: number;
  taxa_montagem: number;
  valor_kit: number;
  valor_total: number;
  metodo_pagamento: string;
  status: string;
  pagamento_id: string;
  obs: string;
  criado_em: string;
  atualizado_em: string;
}

export interface ConfigNegocio {
  nome_negocio: string;
  taxa_montagem: number;
  taxa_entrega_base: number;
  taxa_entrega_km: number;
  antecedencia_min_dias: number;
}

export interface Dashboard {
  stats: { total: number; aguardando: number; pagas: number; canceladas: number; receita: number };
  proximas: Reserva[];
}
