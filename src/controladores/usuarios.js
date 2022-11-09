const knex = require('../conexao');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const yup = require('yup');
require('dotenv').config();

const cadastrarUsuario = async (req, res) => {
    const { nome, email, senha } = req.body;

    const dadosObrigatorios = yup.object().shape({
        nome: yup.string().max(60, { mensagem: 'O campo nome não aceita mais de 60 caracteres' }).required({ mensagem: 'É necessário informar o nome do usuário' }),
        email: yup.string().email({ mensagem: 'Você não digitou um e-mail válido' }).max(60, { mensagem: 'O campo e-mail não aceita mais de 60 caracteres' }).required({ mensagem: 'É necessário informar o e-mail do usuário' }),
        senha: yup.string().required({ mensagem: 'É necessário informar a senha do usuário' })
    });

    try {
        await dadosObrigatorios.validate(req.body);
    } catch (error) {
        return res.status(400).json(error.message);
    }

    try {
        const consulta = await knex('usuarios').where({ email });

        if (consulta.length > 0) {
            return res.status(401).json({ mensagem: 'Já existe usuário com o e-mail informado.' });
        }

        const senhaCriptografada = await bcrypt.hash(senha, 10);

        const insercao = await knex('usuarios').insert({ nome, email, senha: senhaCriptografada });

        if (insercao.rowCount === 0) {
            return res.status(500).json({ mensagem: 'Não foi possível cadastrar o usuário.' });
        }

        const usuario = await knex('usuarios').where({ email }).first();

        const { senha: _, ...dadosUsuario } = usuario;

        return res.status(201).json(dadosUsuario);

    } catch (error) {
        return res.status(500).json(error.message);
    }
}

const efetuarLogin = async (req, res) => {
    const { email, senha } = req.body;

    const dadosObrigatorios = yup.object().shape({
        email: yup.string().email({ mensagem: 'Você não digitou um e-mail válido' }).max(60, { mensagem: 'O campo e-mail não aceita mais de 60 caracteres' }).required({ mensagem: 'É necessário informar o e-mail do usuário' }),
        senha: yup.string().required({ mensagem: 'É necessário informar a senha do usuário' })
    });

    try {
        await dadosObrigatorios.validate(req.body);
    } catch (error) {
        return res.status(400).json(error.message);
    }

    try {
        const usuario = await knex('usuarios').where({ email }).first();

        if (!usuario) {
            return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
        }

        const senhaVerificada = await bcrypt.compare(senha, usuario.senha);

        if (!senhaVerificada) {
            return res.status(401).json({ mensagem: 'Usuário e/ou senha inválido(s).' });
        }

        const token = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET, { expiresIn: '8h' });

        const { senha: _, ...dadosUsuario } = usuario;

        return res.status(201).json({
            usuario: dadosUsuario,
            token
        });

    } catch (error) {
        return res.status(500).json(error.message);
    }
}

const detalharPerfil = async (req, res) => {
    const { usuario } = req;

    try {
        return res.status(200).json(usuario);
    } catch (error) {
        return res.status(500).json(error.message);
    }

}

const editarDados = async (req, res) => {
    const { nome, email, senha, cpf, telefone } = req.body;
    const { usuario } = req;

    const dadosValidacao = yup.object().shape({
        nome: yup.string().max(60, { mensagem: 'O campo nome não aceita mais de 60 caracteres' }).required({ mensagem: 'É necessário informar o nome do usuário' }),
        email: yup.string().email({ mensagem: 'Você não digitou um e-mail válido' }).max(60, { mensagem: 'O campo e-mail não aceita mais de 60 caracteres' }).required({ mensagem: 'É necessário informar o e-mail do usuário' }),
        cpf: yup.string().length(14, { mensagem: 'O campo CPF possui necessariamente 14 caracteres' }).nullable(),
        telefone: yup.string().max(15, { mensagem: 'O campo telefone não aceita mais de 15 caracteres' }).nullable()
    });

    try {
        await dadosValidacao.validate(req.body);
    } catch (error) {
        return res.status(400).json(error.message);
    }

    try {
        const consultaEmail = await knex('usuarios').where('id', '!=', usuario.id).andWhere({ email });

        if (consultaEmail.length > 0) {
            return res.status(401).json({ mensagem: 'O e-mail informado já está sendo utilizado por outro usuário.' });
        }

        const consultaCPF = await knex('usuarios').where('id', '!=', usuario.id).andWhere({ cpf });

        if (cpf && consultaCPF.length > 0) {
            return res.status(401).json({ mensagem: 'Já existe outro usuário com o CPF informado.' });
        }

        let update = '';

        if (!senha) {
            update = await knex('usuarios').update({ nome, email, cpf, telefone }).where('id', usuario.id).returning('*');
        } else {
            const senhaCriptografada = await bcrypt.hash(senha, 10);

            update = await knex('usuarios').update({ nome, email, senha: senhaCriptografada, cpf, telefone }).where('id', usuario.id).returning('*');
        }

        if (update.length === 0) {
            return res.status(500).json({ mensagem: 'Não foi possível atualizar o usuário.' });
        }

        return res.status(204).json();

    } catch (error) {
        return res.status(500).json(error.message);
    }
}

module.exports = {
    cadastrarUsuario,
    efetuarLogin,
    detalharPerfil,
    editarDados
}
