#!/usr/bin/env python3
# Smoke test do backend do Montador (rodar NA VPS).
#   SMOKE_EMAIL='flademir@atelieabelhinha.com.br' SMOKE_SENHA='...' python3 smoke-montador.py
import json, os, sys, urllib.request, urllib.error
from datetime import date, timedelta

BASE = os.environ.get("SMOKE_BASE", "http://localhost:3333")
EMAIL = os.environ.get("SMOKE_EMAIL")
SENHA = os.environ.get("SMOKE_SENHA")
ASSINATURA = ("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAA"
              "fFcSJAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==")
CPF = "52998224725"
ok = fail = 0

def chk(c, m):
    global ok, fail
    if c: ok += 1; print(f"  \033[32mPASS\033[0m {m}")
    else: fail += 1; print(f"  \033[31mFAIL\033[0m {m}")

def req(method, path, token=None, body=None):
    r = urllib.request.Request(BASE + path, data=(json.dumps(body).encode() if body is not None else None), method=method)
    r.add_header("Content-Type", "application/json")
    if token: r.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(r, timeout=20) as resp:
            return resp.status, json.loads(resp.read().decode() or "null")
    except urllib.error.HTTPError as e:
        try: return e.code, json.loads(e.read().decode() or "null")
        except Exception: return e.code, None

def main():
    if not EMAIL or not SENHA:
        print("Defina SMOKE_EMAIL e SMOKE_SENHA."); sys.exit(2)
    print(f"== Smoke Montador em {BASE} ==\n")

    st, cat = req("GET", "/montador/catalogo")
    cat = cat or {}
    chk(st == 200, f"/montador/catalogo responde 200 (got {st})")
    chk(len(cat.get("temas", [])) >= 6, f"temas carregados ({len(cat.get('temas', []))})")
    prods = cat.get("produtos", [])
    chk(len(prods) >= 20, f"produtos carregados ({len(prods)})")
    chk(len(cat.get("presets", [])) >= 3, f"presets carregados ({len(cat.get('presets', []))})")
    chk(len(cat.get("regioes", [])) >= 4, f"regiões carregadas ({len(cat.get('regioes', []))})")
    chk(float(cat.get("pedido_minimo", 0)) > 0, f"pedido mínimo = {cat.get('pedido_minimo')}")
    tipos = {p["tipo"] for p in prods}
    chk({"MESA", "PAINEL", "ENFEITE", "EXTRA"}.issubset(tipos), f"categorias presentes ({sorted(tipos)})")

    dia = (date.today() + timedelta(days=95)).isoformat()
    st, d = req("GET", f"/disponibilidade?data={dia}")
    chk(st == 200 and isinstance((d or {}).get("indisponiveis"), list), "GET /disponibilidade responde lista")

    # login para checar o pedido no admin
    st, d = req("POST", "/auth/login", body={"email": EMAIL, "senha": SENHA})
    token = (d or {}).get("token")
    chk(bool(token), "login admin")

    # Monta um pedido: mesa + painel (subtotal 370 >= mínimo 350), retirada
    for i in range(20):
        diaP = (date.today() + timedelta(days=95 + i)).isoformat()
        payload = {
            "data_evento": diaP, "tema": "jardim", "regiao_id": "retirada",
            "itens": [{"produto_id": "m-redonda", "qtd": 1}, {"produto_id": "p-arco", "qtd": 1}],
            "cliente_nome": "SMOKE MONTADOR (apagar)", "cliente_whatsapp": "11999990000",
            "cliente_cpf": CPF, "metodo_pagamento": "pix", "assinatura": ASSINATURA,
        }
        st, d = req("POST", "/pedidos", body=payload)
        if st in (200, 201) and (d or {}).get("reserva_id"):
            break
    rid = (d or {}).get("reserva_id")
    ocode = (d or {}).get("order_code", "")
    chk(rid is not None, f"POST /pedidos cria pedido (got {st})")
    chk(ocode.startswith("AB-"), f"pedido tem order_code ({ocode})")
    chk(float((d or {}).get("valor_total", 0)) > 0, f"valor total calculado no servidor ({(d or {}).get('valor_total')})")

    if rid and token:
        st, d = req("GET", f"/admin/reservas/{rid}", token=token)
        r = (d or {}).get("reserva", {})
        chk(st == 200 and len(r.get("itens_pedido", [])) == 2, f"pedido guarda 2 itens ({len(r.get('itens_pedido', []))})")
        chk(r.get("tema") == "Jardim Encantado", f"tema gravado ({r.get('tema')})")
        chk(float(r.get("subtotal", 0)) == 370.0, f"subtotal = {r.get('subtotal')}")
        chk(bool(r.get("assinado")), "termo assinado no pedido")
        chk(bool(r.get("responsavel_nome")) and bool(r.get("testemunha1_nome")), "responsável + testemunhas no pedido")
        # disponibilidade agora bloqueia os itens
        st, d = req("GET", f"/disponibilidade?data={diaP}")
        ind = set((d or {}).get("indisponiveis", []))
        chk("m-redonda" in ind and "p-arco" in ind, "itens ficam indisponíveis na data")
        # limpeza
        st, _ = req("POST", f"/admin/reservas/{rid}/cancelar", token=token)
        chk(st == 200, "pedido de teste cancelado (limpeza)")

    # Admin: relatório de lucratividade unificado
    if token:
        st, d = req("GET", "/admin/produtos/relatorio", token=token)
        chk(st == 200 and isinstance((d or {}).get("itens"), list), f"relatório de lucratividade responde (got {st})")
        chk("investido" in (d or {}).get("totais", {}), "relatório traz totais (investido/receita/lucro)")

    # Admin: CRUD do catálogo (com custo e estoque unificados)
    if token:
        st, d = req("POST", "/admin/produtos", token=token, body={"tipo": "EXTRA", "nome": "SMOKE Produto (apagar)", "descricao": "teste", "preco": 10, "preco_aquisicao": 40, "estoque": 3, "ativo": True})
        pid = (d or {}).get("produto", {}).get("id")
        chk(float((d or {}).get("produto", {}).get("preco_aquisicao", 0)) == 40.0 and (d or {}).get("produto", {}).get("estoque") == 3, "produto guarda custo e estoque")
        chk(st in (200, 201) and pid, f"admin cria produto no catálogo (got {st})")
        if pid:
            st, c2 = req("GET", "/montador/catalogo")
            chk(any(p.get("id") == pid for p in (c2 or {}).get("produtos", [])), "produto novo aparece no catálogo público")
            st, _ = req("PATCH", f"/admin/produtos/{pid}", token=token, body={"preco": 15})
            chk(st == 200, "admin edita produto")
            st, _ = req("DELETE", f"/admin/produtos/{pid}", token=token)
            chk(st == 200, "admin exclui produto (limpeza)")

    print(f"\n== Resultado: {ok} PASS / {fail} FAIL ==")
    sys.exit(0 if fail == 0 else 1)

if __name__ == "__main__":
    main()
