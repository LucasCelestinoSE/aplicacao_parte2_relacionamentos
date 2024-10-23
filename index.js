const { Client } = require('pg');
const express = require('express');

// Variaveis do banco de dados e conexao
let schema = 'mydb'
const client = new Client({
    user: 'postgres',
    host: 'db-biblioteca.c3bw53fs79fm.us-east-1.rds.amazonaws.com',
    database: 'biblioteca',
    password: 'aluno123',
    port: 5432,
    ssl: {
    rejectUnauthorized: false
    }
});
try{
    client.connect();
    console.log("CONECTADO AO BANCO DE DADOS COM SUCESSO ! ")
}catch(err){
    console.log("conexao inicializada com sucesso ! ")
}
// Classes de dados => Facilitador.
class Pessoa {
    constructor(idpessoas, datadenascimento, cpf, endereco, numero_celular, status, email) {
        this.idpessoas = idpessoas;
        this.datadenascimento = datadenascimento;
        this.cpf = cpf;
        this.endereco = endereco;
        this.numero_celular = numero_celular;
        this.status = status;
        this.email = email;
    }
    toJSON() {
        return JSON.stringify({
            idpessoas: this.idpessoas,
            datadenascimento: this.datadenascimento,
            cpf: this.cpf,
            endereco: this.endereco,
            numero_celular: this.numero_celular,
            status: this.status,
            email: this.email
        });
    }
}

const app = express();
const port = 3000;
app.use(express.json());


app.get('/pessoa/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pessoa = await getPessoaPeloId(id);
        
        if(pessoa == null){
            return res.status(404).json({message: "Pessoa nao existe no banco de dados !"})
        }
       return res.json({pessoa})
    } catch (error) {
        console.error(`Erro ao obter Pessoa: ${error.message}`);
        return res.status(500).json({ error: "Erro ao obter Pessoa " + error.message });
    }
});
// ---------------------------------------------
app.post('/pessoa', async (req, res) => {
    const { idpessoas, datadenascimento, cpf, endereco, numero_celular, status, email } = req.body;

    if (!idpessoas || !datadenascimento || !cpf || !endereco || !numero_celular || !status || !email) {
        return res.status(400).send('Todos os campos são obrigatórios');
    }

    try {
        const result = await inserirPessoa(idpessoas, datadenascimento, cpf, endereco, numero_celular, status, email);

    
        return res.status(201).json(result);
    } catch (err) {
        console.error('Erro ao inserir pessoa:', err);
        return res.status(500).send('Erro ao inserir pessoa');
    }
});
// ---------------------------------------------------------------------------------------------
app.patch("/pessoa", async (req, res) => {
    const { idpessoas, datadenascimento, cpf, endereco, numero_celular, status, email } = req.body;
    if (!idpessoas || !datadenascimento || !cpf || !endereco || !numero_celular || !status || !email) {
        return res.status(400).send('Todos os campos são obrigatórios');
    }

    try {
        let pessoa_existente = await getPessoaPeloId(idpessoas);
        
        if (!pessoa_existente) {
            return res.status(404).json({ error: "Pessoa não encontrada" });
        }

        const pessoaAtualizada = {
            idpessoas: idpessoas,
            datadenascimento: datadenascimento,
            cpf: cpf,
            endereco: endereco,
            numero_celular: numero_celular,
            status: status,
            email: email
        };

        await updatePessoaPeloId(idpessoas, pessoaAtualizada);
        return res.status(200).json(pessoaAtualizada);
    } catch (err) {
        console.error('Erro ao atualizar pessoa:', err);
        return res.status(500).send('Erro ao atualizar pessoa');
    }
});
// ----------------------------------------------------
app.delete('/pessoa/:id', async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).send('ID é obrigatório');
    }

    try {
        const pessoaDeletada = await deletePessoaPeloId(id);

        if (!pessoaDeletada) {
            return res.status(404).json({ error: "Pessoa não encontrada" });
        }

        return res.status(200).json({ message: "Pessoa deletada com sucesso", pessoa: pessoaDeletada });
    } catch (err) {
        console.error('Erro ao deletar pessoa:', err);
        return res.status(500).send('Erro ao deletar pessoa');
    }
});

// ------------------------------------------------------------------------------------------------------
app.get('/usuario/:id', async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).send('ID é obrigatório');
    }
    try {
        const usuario = await getUsuarioPeloId(id);
        if (usuario == null) {
            return res.status(404).send('Usuário não encontrado');
        }
        
        // Desestruturação dos dados do usuário
        const { pessoas_idpessoas, carteiraemitida, curso, matricula } = usuario;
        
        return res.json({
            id: pessoas_idpessoas,
            carteira: carteiraemitida,
            curso: curso,
            matricula: matricula
        });
    } catch (error) {
        console.error(`Erro ao obter usuário: ${error.message}`);
        return res.status(500).send('Erro ao obter usuário');
    }
});

//-------------------------------------------------
app.post('/usuario', async (req, res) => {
    const { pessoas_idpessoas, carteiraemitida, curso, matricula } = req.body;

    if (!pessoas_idpessoas || !carteiraemitida || !curso || !matricula) {
        return res.status(400).send('Todos os campos são obrigatórios');
    }
    try{
        let pessoa_existe = await getPessoaPeloId(pessoas_idpessoas);

        if(!pessoa_existe){
            return res.status(400).json({error:"Essa pessoa não existe existe"});
        }
        let tem_usuario = await getUsuarioPeloId(pessoas_idpessoas);
        if(tem_usuario){
            return res.status(400).json({error: "Esse usuário já existe"})
        }
        
        const usario_criado = await insertUsuario(pessoas_idpessoas,carteiraemitida,curso,matricula);

        return res.status(201).json({usario_criado})
    }catch(err){
        res.status(500).json({error: err})
    }

})
app.patch('/usuario/:pessoas_idpessoas', async (req, res) => {
    const { pessoas_idpessoas } = req.params;
    if (!pessoas_idpessoas) {
        return res.status(400).send('ID é obrigatório');
    }

    const { carteiraemitida, curso, matricula } = req.body;

    try {
        let usuarioExistente = await getUsuarioPeloId(pessoas_idpessoas);
        if (!usuarioExistente) {
            return res.status(404).json({ error: "Usuário não encontrado" });
        }
        
        const usuarioAtualizado = {
            carteiraemitida: carteiraemitida || usuarioExistente.carteiraemitida,
            curso: curso || usuarioExistente.curso,
            matricula: matricula || usuarioExistente.matricula
        };

        await updateUsuario(pessoas_idpessoas, usuarioAtualizado.carteiraemitida, usuarioAtualizado.curso, usuarioAtualizado.matricula);
        return res.status(200).json(usuarioAtualizado);
    } catch (err) {
        console.error('Erro ao atualizar usuário:', err);
        return res.status(500).send('Erro ao atualizar usuário');
    }
});
//---------------------------------------------------
app.delete('/usuario/:pessoas_idpessoas', async (req, res) => {
    const { pessoas_idpessoas } = req.params;

    if (!pessoas_idpessoas) {
        return res.status(400).send('ID é obrigatório');
    }

    try {

        const usuarioDeletado = await getUsuarioPeloId(pessoas_idpessoas);
        
        if (!usuarioDeletado) {
            return res.status(404).json({ error: "Usuário não encontrado" });
        }
        const debugger_test = await deleteUsuarioPeloId(pessoas_idpessoas);
        return res.status(200).json({ message: "Usuário deletado com sucesso", usuario: usuarioDeletado });
    } catch (err) {
        console.error('Erro ao deletar usuário:', err);
        return res.status(500).send('Erro ao deletar usuário');
    }
});

// Rota GET para pegar títulos virtuais
app.get('/titulos_virtuais/isbn/:ISBN', async (req, res) => {
    const { ISBN } = req.params;

    if (!ISBN) {
        return res.status(400).send('ISBN é obrigatório');
    }

    try {
        const tituloVirtual = await getTituloPeloISBN(ISBN);

        if (!tituloVirtual) {
            return res.status(404).json({ error: "Título virtual não encontrado" });
        }

        return res.status(200).json(tituloVirtual);
    } catch (err) {
        console.error('Erro ao buscar titulo virtual pelo ISBN:', err);
        return res.status(500).send('Erro ao buscar titulo virtual pelo ISBN');
    }
});


app.post('/titulos_virtuais', async (req, res) => {
    const { ISBN, tamanhodoarquivo, edicao, publicacao, tempodeduracao, tipo, formatodoarquivo, idioma, titulovirtual } = req.body;
    if (!ISBN || !tamanhodoarquivo || !edicao || !publicacao || !tempodeduracao || !tipo || !formatodoarquivo || !idioma || !titulovirtual) {
        return res.status(400).send('Todos os campos são obrigatórios');
    }
    const tamanhoArquivoMB = parseFloat(tamanhodoarquivo);
    if (isNaN(tamanhoArquivoMB) || tamanhoArquivoMB <= 0 || tamanhoArquivoMB >= 5) {
        return res.status(400).send('O tamanho do arquivo deve ser maior que 0 e menor que 5 MB');
    }
    const tempoDuracaoMin = parseFloat(tempodeduracao);
    if (isNaN(tempoDuracaoMin) || tempoDuracaoMin <= 0 || tempoDuracaoMin >= 120) {
        return res.status(400).send('O tempo de duração deve ser maior que 0 e menor que 120 minutos');
    }
    try {
        
        const rowCount = await inserirTitulosVirtuais(ISBN, tamanhodoarquivo, edicao, publicacao, tempodeduracao, tipo, formatodoarquivo, idioma, titulovirtual);
        

        return res.status(201).json({ message: "Título virtual inserido com sucesso", linhasAfetadas: rowCount });
    } catch (err) {
        console.error('Erro ao inserir titulo virtual:', err);
        return res.status(500).send('Erro ao inserir titulo virtual');
    }
});

// Rota PATCH para atualizar um título virtual
app.patch('/titulos_virtuais/:ISBN', async (req, res) => {
    const { ISBN } = req.params;
    const { tamanhodoarquivo, edicao, publicacao, tempodeduracao, tipo, formatodoarquivo, idioma, titulovirtual } = req.body;

    if (!ISBN || !tamanhodoarquivo || !edicao || !publicacao || !tempodeduracao || !tipo || !formatodoarquivo || !idioma || !titulovirtual) {
        return res.status(400).send('Todos os campos são obrigatórios');
    }

    // Verificação do tamanho do arquivo
    const tamanhoArquivoMB = parseFloat(tamanhodoarquivo);
    if (isNaN(tamanhoArquivoMB) || tamanhoArquivoMB <= 0 || tamanhoArquivoMB >= 5) {
        return res.status(400).send('O tamanho do arquivo deve ser maior que 0 e menor que 5 MB');
    }

    // Verificação do tempo de duração
    const tempoDuracaoMin = parseFloat(tempodeduracao);
    if (isNaN(tempoDuracaoMin) || tempoDuracaoMin <= 0 || tempoDuracaoMin >= 120) {
        return res.status(400).send('O tempo de duração deve ser maior que 0 e menor que 120 minutos');
    }

    try {
        
        const rowCount = await updateTituloPeloISBN(ISBN, tamanhodoarquivo, edicao, publicacao, tempodeduracao, tipo, formatodoarquivo, idioma, titulovirtual);
        

        if (rowCount === 0) {
            return res.status(404).send('Título virtual não encontrado');
        }

        return res.status(200).json({ message: "Título virtual atualizado com sucesso", linhasAfetadas: rowCount });
    } catch (err) {
        console.error('Erro ao atualizar titulo virtual:', err);
        return res.status(500).send('Erro ao atualizar titulo virtual');
    }
});

app.delete('/titulos_virtuais/:ISBN', async (req, res) => {
    const { ISBN } = req.params;

    if (!ISBN) {
        return res.status(400).send('ISBN é obrigatório');
    }

    try {
        const rowCount = await deleteTituloPeloISBN(ISBN);

        if (rowCount === 0) {
            return res.status(404).send('Título virtual não encontrado');
        }

        return res.status(200).json({ message: "Título virtual deletado com sucesso", linhasAfetadas: rowCount });
    } catch (err) {
        console.error('Erro ao deletar titulo virtual:', err);
        return res.status(500).send('Erro ao deletar titulo virtual');
    }
});

app.post('/titulos_virtuais_usuarios', async (req, res) => {
    const { ISBN, pessoas_idpessoas } = req.body;

    if (!ISBN || !pessoas_idpessoas) {
        return res.status(400).send('ISBN e pessoas_idpessoas são obrigatórios');
    }

    try {
        const rowCount = await insertTituloVirtualHasUsuario(ISBN, pessoas_idpessoas);

        return res.status(201).json({ message: "Relacionamento inserido com sucesso", linhasAfetadas: rowCount });
    } catch (err) {
        console.error('Erro ao inserir relacionamento:', err);
        return res.status(500).send('Erro ao inserir relacionamento');
    }
});
app.get('/titulos_virtuais/:ISBN/pessoas', async (req, res) => {
    const { ISBN } = req.params;

    if (!ISBN) {
        return res.status(400).send('ISBN é obrigatório');
    }

    try {
        const pessoas = await getPessoasPorISBN(ISBN);

        if (pessoas.length === 0) {
            return res.status(404).send('Nenhuma pessoa encontrada para este ISBN');
        }

        return res.status(200).json(pessoas);
    } catch (err) {
        console.error('Erro ao buscar pessoas:', err);
        return res.status(500).send('Erro ao buscar pessoas');
    }
});

app.patch('/titulos_virtuais_usuarios', async (req, res) => {
    const { oldISBN, newISBN, pessoas_idpessoas } = req.body;

    if (!oldISBN || !newISBN || !pessoas_idpessoas) {
        return res.status(400).send('oldISBN, newISBN e pessoas_idpessoas são obrigatórios');
    }

    try {
        const rowCount = await updateTituloVirtualHasUsuario(oldISBN, newISBN, pessoas_idpessoas);

        if (rowCount === 0) {
            return res.status(404).send('Relacionamento não encontrado');
        }

        return res.status(200).json({ message: "Relacionamento atualizado com sucesso", linhasAfetadas: rowCount });
    } catch (err) {
        console.error('Erro ao atualizar relacionamento:', err);
        return res.status(500).send('Erro ao atualizar relacionamento');
    }
});
app.delete('/titulos_virtuais_usuarios', async (req, res) => {
    const { titulos_virtuais_isbn, usuario_pessoas_idpessoas } = req.body;

    if (!titulos_virtuais_isbn || !usuario_pessoas_idpessoas) {
        return res.status(400).send('titulos_virtuais_isbn e pessoas_idpessoas são obrigatórios');
    }

    try {
        const rowCount = await deleteTituloVirtualHasUsuario(titulos_virtuais_isbn, usuario_pessoas_idpessoas);

        if (rowCount === 0) {
            return res.status(404).send('Relacionamento não encontrado');
        }

        return res.status(200).json({ message: "Relacionamento deletado com sucesso", linhasAfetadas: rowCount });
    } catch (err) {
        console.error('Erro ao deletar relacionamento:', err);
        return res.status(500).send('Erro ao deletar relacionamento');
    }
});
// Função para deletar títulos virtuais pelo ISBN
async function deleteTituloPeloISBN(ISBN) {
    try {
         const result = await client.query(`DELETE FROM ${schema}.titulos_virtuais_has_usuario WHERE titulos_virtuais_isbn = ${ISBN};
                DELETE FROM ${schema}.titulos_virtuais WHERE isbn = ${ISBN};
            `);
        return result;
    } catch (e) {
        console.log(`Algo deu errado na deleção de titulo virtual: ${e.message}`);
        throw e;
    }
}

// Funcoes e regras de negocio da API
async function getUsuarioPeloId(idPessoa) {
    try {
        const query = `SELECT * FROM ${schema}.usuario WHERE pessoas_idpessoas = $1`;
        const values = [idPessoa];
        const res = await client.query(query, values);
        if (res.rows.length > 0) {
            return res[0];
        } else {
            console.log(`Usuario com ID ${idPessoa} não encontrado.`);
            return null;
        }
    } catch (e) {
        console.log(`Algo deu errado na busca de usuario: ${e.message}`);
        throw e;
    }
}

async function inserirPessoa(idpessoas, datadenascimento, cpf, endereco, numero_celular, status, email) {
    try {
        // Verificar se a pessoa já existe
        const res = await client.query(`SELECT cpf, idpessoas FROM ${schema}.pessoas WHERE cpf = $1 OR idpessoas = $2`, [cpf, idpessoas]);
        

        // Inserir nova pessoa
        await client.query(`
            INSERT INTO ${schema}.pessoas (idpessoas, datadenascimento, cpf, endereco, numero_celular, status, email)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [idpessoas, datadenascimento, cpf, endereco, numero_celular, status, email]);

        console.log('Pessoa inserida com sucesso!');
        return {
            idpessoas,
            datadenascimento,
            cpf,
            endereco,
            numero_celular,
            status,
            email,
            message: 'Pessoa inserida com sucesso!'
        };
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erro ao inserir pessoa', err.stack);
        throw err;
    }
}
async function getPessoaPeloId(id) {

    try {
        const res = await client.query(`SELECT * FROM ${schema}.pessoas WHERE idpessoas = $1`, [id]);
        return res.rows[0];
    
}catch (err) {
    console.error('Erro ao buscar pessoa pelo ID', err.stack);
    throw err;
}
}

async function updatePessoaPeloId(id,pessoaAtualizada) {
    try {
        // Atualiza a pessoa no banco de dados
        await client.query(
            `UPDATE ${schema}.pessoas 
             SET datadenascimento = $1, cpf = $2, endereco = $3, numero_celular = $4, status = $5, email = $6 
             WHERE idpessoas = $7`,
            [
                pessoaAtualizada.datadenascimento,
                pessoaAtualizada.cpf,
                pessoaAtualizada.endereco,
                pessoaAtualizada.numero_celular,
                pessoaAtualizada.status,
                pessoaAtualizada.email,
                id
            ]
        );

        return pessoaAtualizada;
    } catch (error) {
        console.error('Erro ao atualizar pessoa na função updatePessoaPeloId :', error);
        throw error;
    }
    
}
// Função para deletar pessoa pelo ID
async function deletePessoaPeloId(id) {
    try {
        const res = await client.query(`DELETE FROM ${schema}.pessoas WHERE idpessoas = $1 RETURNING *`, [id]);
        return res.rows[0];
    } catch (error) {
        console.error('Erro ao deletar pessoa na função deletePessoaPeloId:', error);
        throw error;
    }
}
async function insertUsuario(idPessoa, carteira, curso, matricula) {
    try {
        const query = `INSERT INTO ${schema}.usuario (pessoas_idpessoas, carteiraemitida, curso, matricula) VALUES ($1, $2, $3, $4) RETURNING *`;
        const values = [idPessoa, carteira, curso, matricula];
        const res = await client.query(query, values);
        return res.rows[0];
    } catch (e) {
        console.log(`Algo deu errado na insercao de usuario: ${e.message}`);
    }
}
async function updateUsuario(idPessoa, carteira, curso, matricula) {
    try {
        const query = `UPDATE ${schema}.usuario SET carteiraemitida = $1, curso = $2, matricula = $3 WHERE pessoas_idpessoas = $4`;
        const values = [carteira, curso, matricula, idPessoa];
        const res = await client.query(query, values);
        console.log(`Usuario atualizado com sucesso: ${res.rowCount} linha(s) afetada(s)`);
    } catch (e) {
        console.log(`Algo deu errado na atualizacao de usuario: ${e.message}`);
    }
}
async function deleteUsuarioPeloId(idPessoa) {
    
    try {
        const reuslt = await client.query(`DELETE FROM ${schema}.titulos_virtuais_has_usuario WHERE usuario_pessoas_idpessoas = ${idPessoa};
                DELETE FROM ${schema}.usuario WHERE pessoas_idpessoas = ${idPessoa};
            `)
    } catch (e) {
        console.log(`Algo deu errado na delecao de usuario: ${e.message}`);
        throw e;
    }
}
async function getUsuarioPeloId(idPessoa) {
    try {
        const query = `SELECT * FROM ${schema}.usuario WHERE pessoas_idpessoas = $1`;
        const values = [idPessoa];
        const res = await client.query(query, values);
        if (res.rows.length > 0) {
            
            return res.rows[0];
        } else {
            console.log(`Usuario com ID ${idPessoa} não encontrado.`);
            return null;
        }
    } catch (e) {
        console.log(`Algo deu errado na busca de usuario: ${e.message}`);
        throw e;
    }
}


async function getTituloPeloISBN(ISBN) {
    try {
        const query = `SELECT * FROM ${schema}.titulos_virtuais WHERE ISBN = $1`;
        const res = await client.query(query, [ISBN]);
        return res.rows[0];
    } catch (e) {
        console.log(`Algo deu errado na busca de titulo virtual pelo ISBN: ${e.message}`);
        throw e;
    }
}
async function inserirTitulosVirtuais(ISBN, tamanhodoarquivo, edicao, 
    publicacao, tempodeduracao, tipo, formatodoarquivo,idioma, titulovirtual) {
    try {
        const query = `INSERT INTO ${schema}.titulos_virtuais (ISBN, tamanhodoarquivo, edicao, publicacao, tempodeduracao, tipo, formatodoarquivo, idioma, titulovirtual) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`;
        const values = [ISBN, tamanhodoarquivo, edicao, publicacao, tempodeduracao, tipo, formatodoarquivo, idioma, titulovirtual];
        const res = await client.query(query, values);
        console.log(`Titulo virtual inserido com sucesso: ${res.rowCount} linha(s) afetada(s)`);
    } catch (e) {
        console.log(`Algo deu errado na insercao de titulo virtual: ${e.message}`);
    }
}
async function updateTituloPeloISBN(ISBN, tamanhodoarquivo, edicao, publicacao, tempodeduracao, tipo, formatodoarquivo, idioma, titulovirtual) {
    try {
        const query = `UPDATE ${schema}.titulos_virtuais 
                       SET tamanhodoarquivo = $2, edicao = $3, publicacao = $4, tempodeduracao = $5, tipo = $6, formatodoarquivo = $7, idioma = $8, titulovirtual = $9 
                       WHERE ISBN = $1`;
        const values = [ISBN, tamanhodoarquivo, edicao, publicacao, tempodeduracao, tipo, formatodoarquivo, idioma, titulovirtual];
        const res = await client.query(query, values);
        console.log(`Titulo virtual atualizado com sucesso: ${res.rowCount} linha(s) afetada(s)`);
        return res.rowCount;
    } catch (e) {
        console.log(`Algo deu errado na atualização de titulo virtual: ${e.message}`);
        throw e;
    }
}
async function insertTituloVirtualHasUsuario(ISBN, pessoas_idpessoas) {
    try {
        const query = `INSERT INTO ${schema}.titulos_virtuais_has_usuario (titulos_virtuais_isbn, usuario_pessoas_idpessoas) VALUES ($1, $2)`;
        const values = [ISBN, pessoas_idpessoas];
        const res = await client.query(query, values);
        console.log(`Relacionamento inserido com sucesso: ${res.rowCount} linha(s) afetada(s)`);
        return res.rowCount;
    } catch (e) {
        console.log(`Algo deu errado na inserção do relacionamento: ${e.message}`);
        throw e;
    }
}
async function getPessoasPorISBN(ISBN) {
    try {
        const query = `SELECT usuario_pessoas_idpessoas 
                       FROM ${schema}.titulos_virtuais_has_usuario 
                       WHERE titulos_virtuais_isbn = $1`;
        const values = [ISBN];
        const res = await client.query(query, values);
        return res.rows;
    } catch (e) {
        console.log(`Algo deu errado na busca dos usuários: ${e.message}`);
        throw e;
    }
}

async function updateTituloVirtualHasUsuario(oldISBN, newISBN, pessoas_idpessoas) {
    
    try {
        await client.query('BEGIN');

        // Verificar se o antigo ISBN existe
        let query = `SELECT 1 FROM ${schema}.titulos_virtuais WHERE ISBN = $1`;
        let res = await client.query(query, [oldISBN]);
        if (res.rowCount === 0) {
            throw new Error(`O antigo ISBN ${oldISBN} não existe na tabela titulos_virtuais`);
        }

        // Verificar se o novo ISBN existe
        res = await client.query(query, [newISBN]);
        if (res.rowCount === 0) {
            throw new Error(`O novo ISBN ${newISBN} não existe na tabela titulos_virtuais`);
        }

        // Atualizar o relacionamento
        query = `UPDATE ${schema}.titulos_virtuais_has_usuario 
                 SET titulos_virtuais_isbn = $2 
                 WHERE titulos_virtuais_isbn = $1 AND usuario_pessoas_idpessoas = $3`;
        const values = [oldISBN, newISBN, pessoas_idpessoas];
        res = await client.query(query, values);

        await client.query('COMMIT');
        console.log(`Relacionamento atualizado com sucesso: ${res.rowCount} linha(s) afetada(s)`);
        return res.rowCount;
    } catch (e) {
        await client.query('ROLLBACK');
        console.log(`Algo deu errado na atualização do relacionamento: ${e.message}`);
        throw e;
    }
}
async function deleteTituloVirtualHasUsuario(ISBN, pessoas_idpessoas) {
    try {
        const query = `DELETE FROM ${schema}.titulos_virtuais_has_usuario 
                       WHERE titulos_virtuais_isbn = $1 AND usuario_pessoas_idpessoas = $2`;
        const values = [ISBN, pessoas_idpessoas];
        const res = await client.query(query, values);
        console.log(`Relacionamento deletado com sucesso: ${res.rowCount} linha(s) afetada(s)`);
        return res.rowCount;
    } catch (e) {
        console.log(`Algo deu errado na deleção do relacionamento: ${e.message}`);
        throw e;
    }
}
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});

