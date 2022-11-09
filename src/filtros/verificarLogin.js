const knex = require('../conexao');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const verificarLogin = async (req, res, next) => {
    const { authorization } = req.headers;

    if (!authorization) {
        return res.status(401).json({ mensagem: 'É necessário utilizar um método de autenticação.' });
    }

    try {
        const token = authorization.replace('Bearer', '').trim();

        if (!token) {
            return res.status(400).json({ mensagem: 'Token não informado.' });
        }

        const { id } = jwt.verify(token, process.env.JWT_SECRET);

        const consulta = await knex('usuarios').where({ id }).first();

        if (!consulta) {
            return res.status(404).json({ mensagem: 'O usuário não foi encontrado.' });
        }

        const { senha, ...usuario } = consulta;

        req.usuario = usuario;

        next();

    } catch (error) {
        return res.status(500).json(error.message);
    }
}

module.exports = verificarLogin;