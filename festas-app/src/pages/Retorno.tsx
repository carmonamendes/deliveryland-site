import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Header } from '../components/Header';

const MAP: Record<string, { emoji: string; titulo: string; texto: string }> = {
  sucesso: {
    emoji: '🎉',
    titulo: 'Pagamento aprovado!',
    texto: 'Sua reserva está confirmada. Você vai receber os detalhes no WhatsApp. Obrigado por reservar com a gente!',
  },
  pendente: {
    emoji: '⏳',
    titulo: 'Pagamento em processamento',
    texto: 'Recebemos sua reserva. Assim que o pagamento for aprovado, você recebe a confirmação no WhatsApp.',
  },
  erro: {
    emoji: '😕',
    titulo: 'Não deu certo dessa vez',
    texto: 'O pagamento não foi concluído. Sua data ainda pode estar disponível — tente novamente ou fale com a gente.',
  },
};

export function Retorno() {
  const { tipo } = useParams();
  const [sp] = useSearchParams();
  const info = MAP[tipo || 'pendente'] || MAP.pendente;
  const ref = sp.get('external_reference') || sp.get('reserva') || '';

  return (
    <>
      <Header />
      <main>
        <div className="container">
          <div className="pay-wrap">
            <div className="pay-emoji">{info.emoji}</div>
            <h1 style={{ margin: '10px 0' }}>{info.titulo}</h1>
            {ref && <p className="lead">Reserva <b>#{ref}</b></p>}
            <p className="lead">{info.texto}</p>
            <Link to="/" className="btn btn-primary">Voltar ao catálogo</Link>
          </div>
        </div>
      </main>
    </>
  );
}
