"""API de vales com SQLite. Resgate é atômico e cada vale só pode ser usado uma vez."""
import os
import sqlite3
from contextlib import contextmanager
from datetime import date, datetime, timezone
from pathlib import Path
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

DB_PATH = os.environ.get('DB_PATH', str(Path(__file__).with_name('vales.db')))
ADMIN_TOKEN = os.environ.get('ADMIN_TOKEN', '')
VALIDADE = os.environ.get('VALIDADE', '2026-12-20')
origins = [s.strip() for s in os.environ.get('FRONTEND_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173').split(',') if s.strip()]
app = FastAPI(title='API Carteira de Vales', version='1.0.0')
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=False, allow_methods=['GET', 'POST'], allow_headers=['Authorization', 'Content-Type'])

@contextmanager
def conexao():
    db = sqlite3.connect(DB_PATH, timeout=15, isolation_level=None)
    db.row_factory = sqlite3.Row
    db.execute('PRAGMA busy_timeout=15000')
    try:
        yield db
    finally:
        db.close()

@app.on_event('startup')
def iniciar():
    Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)
    with conexao() as db:
        db.execute('PRAGMA journal_mode=WAL')
        db.execute('''CREATE TABLE IF NOT EXISTS vales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            descricao TEXT NOT NULL DEFAULT '',
            icone TEXT NOT NULL DEFAULT 'heart',
            tema TEXT NOT NULL DEFAULT 'pink',
            usado INTEGER NOT NULL DEFAULT 0 CHECK(usado IN (0,1)),
            usado_em TEXT
        )''')

def verificar_admin(authorization: str | None = Header(default=None)):
    import hmac
    if not ADMIN_TOKEN or not authorization or not hmac.compare_digest(authorization, 'Bearer ' + ADMIN_TOKEN):
        raise HTTPException(status_code=401, detail='Token administrativo inválido.')

class ValeNovo(BaseModel):
    titulo: str = Field(min_length=1, max_length=100)
    descricao: str = Field(default='', max_length=500)
    icone: str = Field(default='heart', pattern='^(heart|bike|sparkles-heart|wand|clapper|flower|gamepad|icecream|sun)$')
    tema: str = Field(default='pink', pattern='^(pink|lilac|cream|violet)$')

@app.get('/api/health')
def health():
    return {'ok': True}

@app.get('/api/vales')
def listar():
    with conexao() as db:
        itens = [dict(row) for row in db.execute('SELECT * FROM vales ORDER BY id')]
    for item in itens:
        item['usado'] = bool(item['usado'])
    return {'validade': VALIDADE, 'vales': itens}

@app.post('/api/vales/{vale_id}/resgatar')
def resgatar(vale_id: int):
    if date.today() > date.fromisoformat(VALIDADE):
        raise HTTPException(status_code=403, detail='A validade desta carteira expirou.')
    with conexao() as db:
        # UPDATE condicional: duas requisições simultâneas nunca conseguem resgatar o mesmo vale.
        cursor = db.execute('UPDATE vales SET usado=1, usado_em=? WHERE id=? AND usado=0', (datetime.now(timezone.utc).isoformat(), vale_id))
        if cursor.rowcount == 0:
            if db.execute('SELECT 1 FROM vales WHERE id=?', (vale_id,)).fetchone():
                raise HTTPException(status_code=409, detail='Este vale já foi utilizado.')
            raise HTTPException(status_code=404, detail='Vale não encontrado.')
    return {'ok': True, 'message': 'Vale resgatado com sucesso.', 'id': vale_id}

@app.post('/api/admin/vales', status_code=201, dependencies=[Depends(verificar_admin)])
def criar(vale: ValeNovo):
    with conexao() as db:
        cursor = db.execute('INSERT INTO vales(titulo,descricao,icone,tema) VALUES(?,?,?,?)', (vale.titulo,vale.descricao,vale.icone,vale.tema))
        return {'id': cursor.lastrowid, **vale.model_dump(), 'usado': False}
