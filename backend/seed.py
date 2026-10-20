"""Execute `python seed.py` para cadastrar os vales iniciais uma única vez."""
from main import iniciar, conexao
iniciar()
vales = [
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
with conexao() as db:
    if db.execute('SELECT COUNT(*) FROM vales').fetchone()[0]:
        print('Banco já contém vales; nenhuma alteração realizada.')
    else:
        db.executemany('INSERT INTO vales(titulo,descricao,icone,tema) VALUES(?,?,?,?)', vales)
        print('10 vales cadastrados; todos disponíveis.')
