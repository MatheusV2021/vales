# Carteira de Vales 💜

Aplicação **mobile-first** baseada na imagem enviada. Organização inspirada no frontend do [PresenSee](https://github.com/SIN-disciplina-PI5/FRONT-END-PRESENSEE): React + Vite, páginas, componentes, dados, serviços e CSS em pastas separadas.

## Estrutura

```text
carteira-vales/
├── frontend/
│   ├── src/
│   │   ├── components/   # BottomNav, ValeCard, ValeIcon, ValeModal
│   │   ├── data/         # vales de exemplo (somente prévia)
│   │   ├── pages/        # Home, Vales, SimplePage
│   │   ├── services/     # chamadas à API
│   │   ├── styles/       # CSS separado do JSX
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vercel.json
└── backend/
    ├── main.py          # API FastAPI + SQLite
    ├── seed.py          # cadastro inicial, executado uma vez
    └── requirements.txt
```

## Como executar

Requer Python 3.10+ e Node 20+.

**Terminal 1 — API**

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python seed.py
uvicorn main:app --reload --port 8000
```

**Terminal 2 — site**

```bash
cd frontend
npm install
npm run dev
```

Abra `http://localhost:5173` no navegador. Para testar no celular na mesma rede, execute o Vite com `--host`; configure `VITE_API_URL` para o endereço IP acessível da API (o proxy local só funciona através do servidor Vite).

## Regras

- O site **não tem formulário de cadastro**: lista os vales fornecidos pela API.
- Toque num vale para visualizar detalhes e solicitar seu resgate.
- Após a confirmação, o backend faz um UPDATE condicional **atômico**. Um segundo resgate responde HTTP 409, inclusive em concorrência.
- Depois de 20/12/2026, a API bloqueia novos resgates (HTTP 403).
- Caso a API esteja fora do ar, é exibida uma prévia com dados fictícios; **o resgate fica bloqueado**. Nenhum estado de uso é salvo apenas no navegador.
- O seed cadastra 10 vales todos disponíveis. Modifique `backend/seed.py` **antes da primeira execução** para alterar os vales iniciais.

## Cadastro administrativo (fora do site)

Configure a variável de ambiente `ADMIN_TOKEN` somente no backend. Com a API em execução:

```bash
curl -X POST http://localhost:8000/api/admin/vales \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"titulo":"Vale passeio","descricao":"Passeio especial","icone":"heart","tema":"pink"}'
```

Não coloque `ADMIN_TOKEN` em arquivos `VITE_` ou no frontend.

## Deploy

**Frontend / Vercel:** selecione a pasta `frontend` como Root Directory, comando `npm run build`, output `dist`, e adicione `VITE_API_URL=https://sua-api.example.com`.

**API / Render ou outra hospedagem Python:** root `backend`, build `pip install -r requirements.txt`, start `uvicorn main:app --host 0.0.0.0 --port $PORT`; defina `FRONTEND_ORIGINS`, `ADMIN_TOKEN`, `VALIDADE`, `DB_PATH`. Execute `python seed.py` uma vez no **mesmo armazenamento persistente** antes de disponibilizar o serviço. No Render, discos persistentes normalmente exigem plano com disco; sem armazenamento persistente o banco SQLite pode ser perdido em reinícios/deploys. Para produção real, use volume persistente ou migre para PostgreSQL.

**Observação de segurança:** a rota pública de resgate não exige autenticação, adequada apenas para uma carteira privada compartilhada por um link controlado. Se o site ficar público, configure autenticação antes de disponibilizar vales reais.
