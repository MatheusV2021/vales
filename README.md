# Carteira de Vales 💜

Projeto mobile-first feito em React + Vite, seguindo a organização em `pages`, `components`, `services` e `styles`. Backend FastAPI, SQLite para desenvolvimento e PostgreSQL persistente para produção. Vales somente visualizados no frontend; cadastro é exclusivo da API administrativa.

## Desenvolvimento local

### API
```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Ao iniciar, a API cria o banco local e cadastra 10 vales **uma única vez**. Não execute seed manualmente no Render. Acesse `http://localhost:8000/api/health`.

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:5173`. Durante desenvolvimento, Vite encaminha `/api` para o servidor Python na porta 8000. Não configure `VITE_API_URL` no `.env` local para usar o proxy.

## Render — publicação da API

1. Suba o projeto no GitHub (ambas as pastas e `render.yaml` na raiz).
2. Crie um banco **PostgreSQL persistente** (Render Postgres pago ou provedor externo, como Neon). Copie a URL de conexão. Um serviço gratuito do Render não preserva arquivos SQLite entre deploys/reinicializações, logo **não use SQLite em produção**.
3. Em Render, escolha **New > Blueprint**, conecte o repositório e selecione o `render.yaml`. Alternativamente, crie **Web Service** com Root Directory `backend`, runtime Python, build `pip install -r requirements.txt` e start `uvicorn main:app --host 0.0.0.0 --port $PORT`.
4. Configure no serviço as variáveis:
   - `DATABASE_URL`: URL PostgreSQL. Para driver psycopg use `postgresql+psycopg://...`; URLs `postgresql://...` e `postgres://...` são convertidas automaticamente para o driver instalado (`psycopg`).
   - `FRONTEND_ORIGINS`: URL exata da Vercel, ex. `https://minha-carteira.vercel.app`. Pode usar múltiplas URLs separadas por vírgulas.
   - `ADMIN_TOKEN`: token secreto gerado pelo Render Blueprint.
   - `VALIDADE`: `2026-12-20`.
5. Confira `https://SEU-SERVICO.onrender.com/api/health`. Ao iniciar, a API cria as tabelas e cadastra 10 vales se o banco estiver vazio.

**Importante:** o Render Free pode entrar em suspensão e demorar a atender o primeiro acesso. Isso não altera a persistência do PostgreSQL.

## Vercel — publicação do site

1. Crie/import o mesmo repositório na Vercel.
2. Configure **Root Directory: `frontend`**. Framework Preset: **Vite**; Build Command: `npm run build`; Output Directory: `dist`.
3. Em Settings > Environment Variables adicione `VITE_API_URL=https://SEU-SERVICO.onrender.com` (sem `/api` nem barra final).
4. Faça Deploy. As rotas React (`/vales`, `/favoritos`, `/perfil`) usam o rewrite definido em `frontend/vercel.json`.
5. Atualize `FRONTEND_ORIGINS` no Render com a URL definitiva do seu site na Vercel, e reinicie/deploy a API se necessário.
6. Toda vez que mudar `VITE_API_URL`, faça novo deploy na Vercel para recompilar.

## Resgate e segurança

- `GET /api/vales` retorna os vales. `POST /api/vales/{id}/resgatar` marca como usado permanentemente.
- `UPDATE` condicional em transação evita resgates duplicados simultâneos (409 se já usado).
- A partir de 21/12/2026 não é possível resgatar.
- `POST /api/admin/vales` exige cabeçalho `Authorization: Bearer SEU_ADMIN_TOKEN`. **Nunca coloque o token no frontend nem em uma variável `VITE_`.**
- Quando API está indisponível, o site não exibe vales fictícios, nem permite resgate.
- **A rota de resgate é pública.** Quem conhece a URL pode resgatar um vale; para impedir resgates de terceiros, adicione autenticação antes de divulgar o site publicamente. CORS não substitui autenticação.
