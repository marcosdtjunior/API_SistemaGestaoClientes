const knex = require('../conexao');
const yup = require('yup');

const cadastrarCliente = async (req, res) => {
    const { usuario } = req;
    const { nome, email, cpf, telefone, cep, logradouro, complemento, bairro, cidade, estado } = req.body;

    const dadosObrigatorios = yup.object().shape({
        nome: yup.string().max(60, { mensagem: 'O campo nome não aceita mais de 60 caracteres' }).required({ mensagem: 'É necessário informar o nome do cliente' }),
        email: yup.string().email({ mensagem: 'Você não digitou um e-mail válido' }).max(60, { mensagem: 'O campo e-mail não aceita mais de 60 caracteres' }).required({ mensagem: 'É necessário informar o e-mail do cliente' }),
        cpf: yup.string().length(14, { mensagem: 'O campo CPF possui necessariamente 14 caracteres' }).required({ mensagem: 'É necessário informar o CPF do cliente' }),
        telefone: yup.string().max(15, { mensagem: 'O campo telefone não aceita mais de 15 caracteres' }).required({ mensagem: 'É necessário informar o telefone do cliente' })
    });

    try {
        await dadosObrigatorios.validate(req.body);
    } catch (error) {
        return res.status(400).json(error.message);
    }

    try {
        const consultaEmail = await knex('clientes').where({ email });

        if (consultaEmail.length > 0) {
            return res.status(401).json({ mensagem: 'O e-mail informado já está sendo utilizado por outro cliente.' });
        }

        const consultaCPF = await knex('clientes').where({ cpf });

        if (consultaCPF.length > 0) {
            return res.status(401).json({ mensagem: 'Já existe outro cliente com o CPF informado.' });
        }

        const insercao = await knex('clientes').insert({ usuario_id: usuario.id, nome, email, cpf, telefone, cep, logradouro, complemento, bairro, cidade, estado })

        if (insercao.rowCount === 0) {
            return res.status(500).json({ mensagem: 'Não foi possível cadastrar o cliente.' });
        }

        return res.status(201).json({ mensagem: 'Cliente cadastrado com sucesso.' });

    } catch (error) {
        return res.status(500).json(error.message);
    }
}

const listarClientes = async (req, res) => {
    try {
        let possuiCobrancaVencida = false;

        const clientes = await knex('clientes');
        for (let cliente of clientes) {
            const cobrancas = await knex('cobrancas').where('cliente_id', cliente.id);
            for (let cobranca of cobrancas) {
                if (cobranca.status === 'Vencida') {
                    possuiCobrancaVencida = true;
                    break;
                }
            }

            if (possuiCobrancaVencida) {
                await knex('clientes').update('status', 'Inadimplente').where('id', cliente.id);
            } else {
                await knex('clientes').update('status', 'Em dia').where('id', cliente.id);
            }
        }

        const listagemClientes = await knex('clientes').orderBy('id');

        if (listagemClientes.length === 0) {
            return res.status(404).json({ mensagem: 'Nenhum cliente foi encontrado.' });
        }

        return res.status(200).json(listagemClientes);
    } catch (error) {
        return res.status(500).json(error.message);
    }
}

const detalharCliente = async (req, res) => {
    const { id } = req.params;

    try {
        const consulta = await knex('clientes').where({ id }).first();

        if (!consulta) {
            return res.status(404).json({ mensagem: 'Este cliente não existe no banco de dados.' });
        }

        return res.status(200).json(consulta);
    } catch (error) {
        return res.status(500).json(error.message);
    }
}

const atualizarCliente = async (req, res) => {
    const { id } = req.params;

    const { nome, email, cpf, telefone, cep, logradouro, complemento, bairro, cidade, estado } = req.body;

    const dadosObrigatorios = yup.object().shape({
        nome: yup.string().max(60, { mensagem: 'O campo nome não aceita mais de 60 caracteres' }).required({ mensagem: 'É necessário informar o nome do cliente' }),
        email: yup.string().email({ mensagem: 'Você não digitou um e-mail válido' }).max(60, { mensagem: 'O campo e-mail não aceita mais de 60 caracteres' }).required({ mensagem: 'É necessário informar o e-mail do cliente' }),
        cpf: yup.string().length(14, { mensagem: 'O campo CPF possui necessariamente 14 caracteres' }).required({ mensagem: 'É necessário informar o CPF do cliente' }),
        telefone: yup.string().max(15, { mensagem: 'O campo telefone não aceita mais de 15 caracteres' }).required({ mensagem: 'É necessário informar o telefone do cliente' })
    });

    try {
        await dadosObrigatorios.validate(req.body);
    } catch (error) {
        return res.status(400).json(error.message);
    }

    try {
        const consultaCliente = await knex('clientes').where({ id });

        if (consultaCliente.length === 0) {
            return res.status(404).json({ mensagem: 'O cliente informado não existe no banco de dados.' });
        }

        const consultaEmail = await knex('clientes').where('id', '!=', id).andWhere({ email });

        if (consultaEmail.length > 0) {
            return res.status(401).json({ mensagem: 'O e-mail informado já está sendo utilizado por outro cliente.' });
        }

        const consultaCPF = await knex('clientes').where('id', '!=', id).andWhere({ cpf });

        if (consultaCPF.length > 0) {
            return res.status(401).json({ mensagem: 'Já existe outro cliente com o CPF informado.' });
        }

        const atualizacao = await knex('clientes').update({ nome, email, cpf, telefone, cep, logradouro, complemento, bairro, cidade, estado }).where({ id }).returning('*');

        if (atualizacao.rowCount === 0) {
            return res.status(500).json({ mensagem: 'Não foi possível atualizar o cliente.' });
        }

        return res.status(200).json({ mensagem: 'Os dados do cliente foram alterados com sucesso.' });
    } catch (error) {
        return res.status(500).json(error.message);
    }
}

const pesquisarClientes = async (req, res) => {
    const { pesquisa } = req.query;

    try {
        let consultaClientes = [];

        if (isNaN(pesquisa)) {
            consultaClientes = await knex('clientes').whereILike('nome', `%${pesquisa}%`).orWhereILike('email', `%${pesquisa}%`);
        } else {
            consulta = await knex('clientes');
            consulta.forEach(elemento => {
                let cpfPuro = elemento.cpf.replace(/\.|-/gm, '');
                if (cpfPuro.includes(pesquisa)) {
                    consultaClientes.push(elemento);
                }
            });
        }

        if (consultaClientes.length === 0) {
            return res.status(404).json({ mensagem: 'Nenhum cliente foi encontrado nesta pesquisa.' });
        }

        return res.status(200).json(consultaClientes);
    } catch (error) {
        return res.status(500).json(error.message);
    }

}

const listarClientesPorStatus = async (req, res) => {
    try {
        const clientesInadimplentes = await knex('clientes').where('status', 'Inadimplente');

        const clientesEmDia = await knex('clientes').where('status', 'Em dia');

        const consultaClientes = {
            clientesInadimplentes,
            clientesEmDia
        }

        return res.status(200).json(consultaClientes);

    } catch (error) {
        return res.status(500).json(error.message);
    }
}

module.exports = {
    cadastrarCliente,
    listarClientes,
    detalharCliente,
    atualizarCliente,
    pesquisarClientes,
    listarClientesPorStatus
}
