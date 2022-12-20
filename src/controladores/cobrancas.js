const knex = require('../conexao');
const yup = require('yup');
const { isBefore } = require('date-fns');

const cadastrarCobranca = async (req, res) => {
    let { cliente_id, descricao, status, valor, vencimento } = req.body;

    const dadosObrigatorios = yup.object().shape({
        cliente_id: yup.number({ mensagem: 'O id do cliente é necessariamente um número inteiro' }).required({ mensagem: 'É necessário informar o id do cliente' }),
        descricao: yup.string().required({ mensagem: 'É necessário informar a descrição da cobrança' }),
        status: yup.string().required({ mensagem: 'É necessário informar o status da cobrança' }),
        valor: yup.number({ mensagem: 'O valor da cobrança é necessariamente um número decimal com 2 casas após o ponto' }).required({ mensagem: 'É necessário informar o valor da cobrança' }),
        vencimento: yup.date({ mensagem: 'O campo vencimento é necessariamente uma data' }).required({ mensagem: 'É necessário informar a data do vencimento da cobrança' })
    });

    try {
        await dadosObrigatorios.validate(req.body);
    } catch (error) {
        return res.status(400).json(error.message);
    }

    try {
        const consulta = await knex('clientes').where({ id: cliente_id });

        if (consulta.length === 0) {
            return res.status(404).json({ mensagem: 'Este cliente não existe no banco de dados.' });
        }

        const cobrancaEstaVencida = isBefore(new Date(vencimento), new Date());

        if (status === 'Pendente' && cobrancaEstaVencida) {
            status = 'Vencida';
        }

        const insercao = await knex('cobrancas').insert({ cliente_id, descricao, status, valor, vencimento });

        if (insercao.rowCount === 0) {
            return res.status(500).json({ mensagem: 'Não foi possível cadastrar a cobrança.' });
        }

        return res.status(201).json({ mensagem: 'Cobrança cadastrada com sucesso.' });
    } catch (error) {
        return res.status(500).json(error.message);
    }
}

const listarCobrancas = async (req, res) => {
    try {

        const consultaCobrancas = await knex('cobrancas');

        for (let cobranca of consultaCobrancas) {
            const cobrancaEstaVencida = isBefore(new Date(cobranca.vencimento), new Date());

            if (cobranca.status === 'Pendente' && cobrancaEstaVencida) {
                await knex('cobrancas').update('status', 'Vencida').where('id', cobranca.id);
            }
        }

        const listagemCobrancas = await knex('cobrancas').join('clientes', 'cobrancas.cliente_id', 'clientes.id').select(knex.ref('clientes.nome').as('nome_cliente'), 'cobrancas.id', 'cobrancas.valor', 'cobrancas.vencimento', 'cobrancas.status', 'cobrancas.descricao').orderBy('cobrancas.id');

        if (listagemCobrancas.length === 0) {
            return res.status(404).json({ mensagem: 'Nenhuma cobrança foi encontrada.' });
        }

        return res.status(200).json(listagemCobrancas);
    } catch (error) {
        return res.status(500).json(error.message);
    }
}

const listarCobrancasCliente = async (req, res) => {
    const { idCliente } = req.params;

    try {
        const consultaCliente = await knex('clientes').where({ id: idCliente });

        if (consultaCliente.length === 0) {
            return res.status(404).json({ mensagem: 'Este cliente não existe no banco de dados.' });
        }

        const consultaCobrancasCliente = await knex('cobrancas').join('clientes', 'cobrancas.cliente_id', 'clientes.id').select(knex.ref('clientes.nome').as('nome_cliente'), 'cobrancas.id', 'cobrancas.valor', 'cobrancas.vencimento', 'cobrancas.status', 'cobrancas.descricao').where({ cliente_id: idCliente }).orderBy('cobrancas.id');

        return res.status(200).json(consultaCobrancasCliente);
    } catch (error) {
        return res.status(500).json(error.message);
    }
}

const detalharCobranca = async (req, res) => {
    const { id } = req.params;

    try {
        const consulta = await knex('cobrancas').join('clientes', 'cobrancas.cliente_id', 'clientes.id').select(knex.ref('clientes.nome').as('nome_cliente'), 'cobrancas.id', 'cobrancas.valor', 'cobrancas.vencimento', 'cobrancas.status', 'cobrancas.descricao').where('cobrancas.id', id).first();

        if (!consulta) {
            return res.status(404).json({ mensagem: 'Esta cobrança não existe no banco de dados.' });
        }

        return res.status(200).json(consulta);
    } catch (error) {
        return res.status(500).json(error.message);
    }
}

const atualizarCobranca = async (req, res) => {
    const { id } = req.params;

    let { descricao, status, valor, vencimento } = req.body;

    const dadosObrigatorios = yup.object().shape({
        descricao: yup.string().required({ mensagem: 'É necessário informar a descrição da cobrança' }),
        status: yup.string().required({ mensagem: 'É necessário informar o status da cobrança' }),
        valor: yup.number({ mensagem: 'O valor da cobrança é necessariamente um número decimal com 2 casas após o ponto' }).required({ mensagem: 'É necessário informar o valor da cobrança' }),
        vencimento: yup.date({ mensagem: 'O campo vencimento é necessariamente uma data' }).required({ mensagem: 'É necessário informar a data do vencimento da cobrança' })
    });

    try {
        await dadosObrigatorios.validate(req.body);
    } catch (error) {
        return res.status(400).json(error.message);
    }

    try {
        const consulta = await knex('cobrancas').where({ id });

        if (consulta.length === 0) {
            return res.status(404).json({ mensagem: 'Esta cobrança não existe no banco de dados.' });
        }

        const cobrancaEstaVencida = isBefore(new Date(vencimento), new Date());

        if (status === 'Pendente' && cobrancaEstaVencida) {
            status = 'Vencida';
        }

        const atualizacao = await knex('cobrancas').update({ descricao, status, valor, vencimento }).where({ id }).returning('*');

        if (atualizacao.length === 0) {
            return res.status(500).json({ mensagem: 'Não foi possível atualizar a cobrança.' });
        }

        return res.status(200).json({ mensagem: 'Cobrança editada com sucesso.' });
    } catch (error) {
        return res.status(500).json(error.message);
    }
}

const excluirCobranca = async (req, res) => {
    const { id } = req.params;

    try {
        const consulta = await knex('cobrancas').where({ id }).first();

        if (!consulta) {
            return res.status(404).json({ mensagem: 'Esta cobrança não existe no banco de dados.' });
        }

        if (consulta.status !== "Pendente") {
            return res.status(400).json({ mensagem: 'Esta cobrança não pode ser excluída!' });
        }

        const exclusao = await knex('cobrancas').delete().where({ id });

        if (!exclusao) {
            return res.status(500).json({ mensagem: 'Não foi possível excluir a cobrança.' });
        }

        return res.status(200).json({ mensagem: 'Cobrança excluída com sucesso.' });
    } catch (error) {
        return res.status(500).json(error.message);
    }
}

const pesquisarCobrancas = async (req, res) => {
    const { pesquisa } = req.query;

    try {
        let consultaCobrancas = [];

        if (isNaN(pesquisa)) {
            consultaCobrancas = await knex('cobrancas').join('clientes', 'cobrancas.cliente_id', 'clientes.id').select(knex.ref('clientes.nome').as('nome_cliente'), 'cobrancas.id', 'cobrancas.valor', 'cobrancas.vencimento', 'cobrancas.status', 'cobrancas.descricao').whereILike('clientes.nome', `%${pesquisa}%`);
        } else {
            consultaCobrancas = await knex('cobrancas').join('clientes', 'cobrancas.cliente_id', 'clientes.id').select(knex.ref('clientes.nome').as('nome_cliente'), 'cobrancas.id', 'cobrancas.valor', 'cobrancas.vencimento', 'cobrancas.status', 'cobrancas.descricao').where('cobrancas.id', Number(pesquisa));
        }

        if (consultaCobrancas.length === 0) {
            return res.status(404).json({ mensagem: 'Nenhuma cobrança foi encontrada nesta pesquisa.' });
        }

        return res.status(200).json(consultaCobrancas);
    } catch (error) {
        return res.status(500).json(error.message);
    }
}

const listarCobrancasPorStatus = async (req, res) => {
    try {
        const pagas = await knex('cobrancas').join('clientes', 'cobrancas.cliente_id', 'clientes.id').select(knex.ref('clientes.nome').as('nome_cliente'), 'cobrancas.id', 'cobrancas.valor', 'cobrancas.vencimento', 'cobrancas.status', 'cobrancas.descricao').where('cobrancas.status', 'Paga');

        const somaPagas = await knex('cobrancas').sum('valor').where('cobrancas.status', 'Paga').first();

        const cobrancasPagas = {
            soma: somaPagas.sum,
            cobrancas: pagas
        };

        const vencidas = await knex('cobrancas').join('clientes', 'cobrancas.cliente_id', 'clientes.id').select(knex.ref('clientes.nome').as('nome_cliente'), 'cobrancas.id', 'cobrancas.valor', 'cobrancas.vencimento', 'cobrancas.status', 'cobrancas.descricao').where('cobrancas.status', 'Vencida');

        const somaVencidas = await knex('cobrancas').sum('valor').where('cobrancas.status', 'Vencida').first();

        const cobrancasVencidas = {
            soma: somaVencidas.sum,
            cobrancas: vencidas
        };

        const previstas = await knex('cobrancas').join('clientes', 'cobrancas.cliente_id', 'clientes.id').select(knex.ref('clientes.nome').as('nome_cliente'), 'cobrancas.id', 'cobrancas.valor', 'cobrancas.vencimento', 'cobrancas.status', 'cobrancas.descricao').where('cobrancas.status', 'Pendente');

        const somaPrevistas = await knex('cobrancas').sum('valor').where('cobrancas.status', 'Pendente').first();

        const cobrancasPrevistas = {
            soma: somaPrevistas.sum,
            cobrancas: previstas
        };

        const listagemCobrancas = {
            cobrancasPagas,
            cobrancasVencidas,
            cobrancasPrevistas
        };

        return res.status(200).json(listagemCobrancas);

    } catch (error) {
        return res.status(500).json(error.message);
    }
}

module.exports = {
    cadastrarCobranca,
    listarCobrancas,
    listarCobrancasCliente,
    detalharCobranca,
    atualizarCobranca,
    excluirCobranca,
    pesquisarCobrancas,
    listarCobrancasPorStatus
}
