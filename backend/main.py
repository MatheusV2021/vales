"""API FastAPI: SQLite local, PostgreSQL em produção (DATABASE_URL)."""
import hmac
import os
from datetime import date, datetime, timezone
from pathlib import Path
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import Boolean, Column, DateTime, Integer, MetaData, String, Table, Text, create_engine, insert, select, update, func
from sqlalchemy.exc import SQLAlchemyError

BASE_DIR = Path(__file__).resolve().parent
DATABASE_URL = os.getenv('DATABASE_URL') or 'sqlite:///' + str(Path(os.getenv('DB_PATH', str(BASE_DIR / 'vales.db'))).resolve())
if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = 'postgresql+psycopg://' + DATABASE_URL[len('postgres://'):]
elif DATABASE_URL.startswith('postgresql://'):
    DATABASE_URL = 'postgresql+psycopg://' + DATABASE_URL[len('postgresql://'):]
engine = create_engine(DATABASE_URL, pool_pre_ping=True, connect_args={'check_same_thread': False, 'timeout': 15} if DATABASE_URL.startswith('sqlite:') else {})
metadata = MetaData()
vales = Table('vales', metadata,
    Column('id', Integer, primary_key=True, autoincrement=True),
    Column('titulo', String(100), nullable=False),
    Column('descricao', Text, nullable=False, default=''),
    Column('icone', String(40), nullable=False, default='heart'),
    Column('tema', String(40), nullable=False, default='pink'),
    Column('usado', Boolean, nullable=False, default=False),
    Column('usado_em', DateTime(timezone=True), nullable=True),
)
ADMIN_TOKEN = os.getenv('ADMIN_TOKEN', '')
VALIDADE = os.getenv('VALIDADE', '2026-12-20')
origins = [s.strip().rstrip('/') for s in os.getenv('FRONTEND_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173').split(',') if s.strip()]
app = FastAPI(title='API Carteira de Vales', version='2.0.0')
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=False, allow_methods=['GET', 'POST'], allow_headers=['Authorization', 'Content-Type'])

VALES_INICIAIS = [
 ('Beijos e abraços','Beijos e abraços a qualquer hora','heart','pink'),
 ('Passeio de bike + coquinha no final','Nosso passeio especial de bicicleta','bike','lilac'),
 ('Um monte de beijinhos','Muitos beijinhos só para você','sparkles-heart','cream'),
 ('O que você quiser','Você escolhe nosso momento especial','wand','violet'),
 ('Cineminha com pipoca','Sessão de cinema com pipoca','clapper','pink'),
 ('Massagem','Uma massagem relaxante feita com carinho','flower','cream'),
 ('Noite de jogos','Jogos e risadas juntinhos','gamepad','lilac'),
 ('Cafuné','Um cafuné demorado','heart','violet'),
 ('Dia de sorvete','Vamos escolher um sorvete juntos','icecream','pink'),
 ('Pôr do sol juntos','Um fim de tarde especial','sun','cream'),
]

def iniciar():
    metadata.create_all(engine)
    # Seed idempotente. PostgreSQL usa transação + lock para evitar seeds duplicados em inicializações concorrentes.
    with engine.begin() as conn:
        if engine.dialect.name == 'postgresql':
            conn.exec_driver_sql('SELECT pg_advisory_xact_lock(481209)')
        if conn.execute(select(func.count()).select_from(vales)).scalar_one() == 0:
            conn.execute(insert(vales), [dict(titulo=t, descricao=d, icone=i, tema=m) for t, d, i, m in VALES_INICIAIS])

@app.on_event('startup')
def startup():
    iniciar()

@app.get('/api/health')
def health():
    try:
        with engine.connect() as conn:
            conn.execute(select(func.count()).select_from(vales))
        return {'ok': True, 'database': 'connected'}
    except SQLAlchemyError:
        raise HTTPException(503, 'Banco de dados indisponível.')

@app.get('/api/vales')
def listar():
    with engine.connect() as conn:
        itens = [dict(row) for row in conn.execute(select(vales).order_by(vales.c.id)).mappings()]
    for item in itens:
        if item['usado_em']:
            item['usado_em'] = item['usado_em'].isoformat()
    return {'validade': VALIDADE, 'vales': itens}

@app.post('/api/vales/{vale_id}/resgatar')
def resgatar(vale_id: int):
    if date.today() > date.fromisoformat(VALIDADE):
        raise HTTPException(403, 'A validade desta carteira expirou.')
    with engine.begin() as conn:
        resultado = conn.execute(update(vales).where(vales.c.id == vale_id, vales.c.usado.is_(False)).values(usado=True, usado_em=datetime.now(timezone.utc)))
        if resultado.rowcount == 0:
            if conn.execute(select(vales.c.id).where(vales.c.id == vale_id)).first():
                raise HTTPException(409, 'Este vale já foi utilizado.')
            raise HTTPException(404, 'Vale não encontrado.')
    return {'ok': True, 'message': 'Vale resgatado com sucesso.', 'id': vale_id}

def verificar_admin(authorization: str | None = Header(None)):
    if not ADMIN_TOKEN or not authorization or not hmac.compare_digest(authorization, 'Bearer ' + ADMIN_TOKEN):
        raise HTTPException(401, 'Token administrativo inválido.')

class ValeNovo(BaseModel):
    titulo: str = Field(min_length=1, max_length=100)
    descricao: str = Field(default='', max_length=500)
    icone: str = Field(default='heart', pattern='^(heart|bike|sparkles-heart|wand|clapper|flower|gamepad|icecream|sun)$')
    tema: str = Field(default='pink', pattern='^(pink|lilac|cream|violet)$')

@app.post('/api/admin/vales', status_code=201, dependencies=[Depends(verificar_admin)])
def criar(vale: ValeNovo):
    with engine.begin() as conn:
        result = conn.execute(insert(vales).values(**vale.model_dump()))
        return {'id': result.inserted_primary_key[0], **vale.model_dump(), 'usado': False}
