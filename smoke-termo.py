#!/usr/bin/env python3
# Smoke test do fluxo Termo + Checklist (rodar NA VPS).
# Nao contem segredos: as credenciais vem por variavel de ambiente.
#
#   SMOKE_EMAIL='flademir@atelieabelhinha.com.br' SMOKE_SENHA='SUA_SENHA' \
#     python3 smoke-termo.py
#
# Cria uma reserva de teste (Pix), confere a assinatura/termo armazenados,
# alterna o checklist (montado/entregue/recolhido) e no fim CANCELA a reserva
# de teste para nao poluir a agenda.

import json, os, sys, urllib.request, urllib.error
from datetime import date, timedelta

BASE = os.environ.get("SMOKE_BASE", "http://localhost:3333")
EMAIL = os.environ.get("SMOKE_EMAIL")
SENHA = os.environ.get("SMOKE_SENHA")

# PNG 1x1 valido (data URL) usado como "assinatura"
ASSINATURA = ("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAA"
              "fFcSJAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==")
CPF_TESTE = "52998224725"  # CPF valido para teste (passa no digito verificador)

ok_count = 0
fail_count = 0

def chk(cond, msg):
    global ok_count, fail_count
    if cond:
        ok_count += 1
        print(f"  \033[32mPASS\033[0m {msg}")
    else:
        fail_count += 1
        print(f"  \033[31mFAIL\033[0m {msg}")

def req(method, path, token=None, body=None):
    url = BASE + path
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(url, data=data, method=method)
    r.add_header("Content-Type", "application/json")
    if token:
        r.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(r, timeout=20) as resp:
            return resp.status, json.loads(resp.read().decode() or "null")
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode() or "null")
        except Exception:
            return e.code, None

def main():
    if not EMAIL or not SENHA:
        print("Defina SMOKE_EMAIL e SMOKE_SENHA no ambiente. Ex.:")
        print("  SMOKE_EMAIL='flademir@atelieabelhinha.com.br' SMOKE_SENHA='...' python3 smoke-termo.py")
        sys.exit(2)

    print(f"== Smoke Termo+Checklist em {BASE} ==\n")

    # 0. health
    st, _ = req("GET", "/health")
    chk(st == 200, f"/health responde 200 (got {st})")

    # 1. login
    st, d = req("POST", "/auth/login", body={"email": EMAIL, "senha": SENHA})
    token = (d or {}).get("token")
    chk(st == 200 and token, f"login {EMAIL} (got {st})")
    if not token:
        print("  -> sem token, abortando."); sys.exit(1)

    # 2. catalogo: escolher kit e uma data livre
    st, cat = req("GET", "/catalogo")
    kits = (cat or {}).get("kits", [])
    chk(st == 200 and len(kits) > 0, f"/catalogo tem kits (got {st}, {len(kits)} kits)")
    if not kits:
        print("  -> sem kits, abortando."); sys.exit(1)
    kit_id = kits[0]["id"]
    antecedencia = int((cat or {}).get("antecedencia_min_dias", 2))
    bloqueadas = set((cat or {}).get("datas_indisponiveis", []))

    # 3. criar reserva de teste (tenta datas ate uma livre)
    reserva_id = None
    base_dia = date.today() + timedelta(days=max(antecedencia, 2) + 90)
    for i in range(25):
        dia = (base_dia + timedelta(days=i)).isoformat()
        if dia in bloqueadas:
            continue
        payload = {
            "kit_id": kit_id,
            "data_evento": dia,
            "periodo": "dia",
            "cliente_nome": "SMOKE TESTE (apagar)",
            "cliente_whatsapp": "11999990000",
            "endereco": "Rua de Teste, 123",
            "cliente_cpf": CPF_TESTE,
            "distancia_km": 5,
            "quer_montagem": False,
            "metodo_pagamento": "pix",
            "assinatura": ASSINATURA,
        }
        st, d = req("POST", "/reservas", body=payload)
        if st in (200, 201) and (d or {}).get("reserva_id"):
            reserva_id = d["reserva_id"]
            print(f"  (reserva de teste {reserva_id} em {dia})")
            break
    chk(reserva_id is not None, "POST /reservas cria reserva com CPF+assinatura")
    if not reserva_id:
        print("  -> nao criou reserva, abortando."); sys.exit(1)

    # 4. detalhe: assinatura/termo armazenados
    st, d = req("GET", f"/admin/reservas/{reserva_id}", token=token)
    r = (d or {}).get("reserva", {})
    chk(st == 200, f"GET /admin/reservas/:id (got {st})")
    chk(r.get("assinado") is True, "reserva.assinado == true")
    chk(str(r.get("assinatura_img", "")).startswith("data:image/"), "assinatura_img e um data URL de imagem")
    chk(bool(r.get("termo_versao")), f"termo_versao preenchido (= {r.get('termo_versao')})")
    chk(bool(r.get("assinado_em")), "assinado_em preenchido")
    chk(len("".join(filter(str.isdigit, str(r.get("cliente_cpf", ""))))) == 11, "cliente_cpf armazenado")
    # Caminho B: título executivo — testemunhas, hash e valor de reposição
    chk(len(str(r.get("termo_hash", ""))) == 64, f"termo_hash SHA-256 gravado (len {len(str(r.get('termo_hash','')))})")
    chk(bool(r.get("testemunha1_nome")), f"testemunha 1 gravada (= {r.get('testemunha1_nome')})")
    chk(bool(r.get("testemunha2_nome")), f"testemunha 2 gravada (= {r.get('testemunha2_nome')})")
    chk(float(r.get("valor_reposicao", 0) or 0) >= 0, "valor_reposicao presente no termo")

    # 5. checklist: alternar os tres
    for campo in ("montado", "entregue", "recolhido"):
        st, d = req("PATCH", f"/admin/reservas/{reserva_id}/checklist", token=token, body={campo: True})
        rr = (d or {}).get("reserva", {})
        chk(st == 200 and rr.get(campo) is True and bool(rr.get(campo + "_em")),
            f"checklist {campo} = true + {campo}_em gravado (got {st})")

    # 6. limpeza: cancelar a reserva de teste
    st, _ = req("POST", f"/admin/reservas/{reserva_id}/cancelar", token=token)
    chk(st == 200, f"reserva de teste cancelada (limpeza) (got {st})")

    print(f"\n== Resultado: {ok_count} PASS / {fail_count} FAIL ==")
    sys.exit(0 if fail_count == 0 else 1)

if __name__ == "__main__":
    main()
