const express = require('express');
const usuarios = require('./controladores/usuarios');
const verificarLogin = require('./filtros/verificarLogin');
const clientes = require('./controladores/clientes');
const cobrancas = require('./controladores/cobrancas');

const rotas = express();

// usuários
rotas.post('/usuario', usuarios.cadastrarUsuario);
rotas.post('/login', usuarios.efetuarLogin);

rotas.use(verificarLogin);

// A partir daqui, todas as rotas necessitam de autenticação do usuário
rotas.get('/usuario', usuarios.detalharPerfil)
rotas.put('/usuario', usuarios.editarDados);

// clientes
rotas.post('/cliente', clientes.cadastrarCliente);
rotas.get('/cliente', clientes.listarClientes);
rotas.get('/cliente/:id', clientes.detalharCliente);
rotas.put('/cliente/:id', clientes.atualizarCliente);
rotas.get('/clientes', clientes.pesquisarClientes);
rotas.get('/clientesPorStatus', clientes.listarClientesPorStatus);

// cobranças
rotas.post('/cobranca', cobrancas.cadastrarCobranca);
rotas.get('/cobranca', cobrancas.listarCobrancas);
rotas.get('/cobrancas/:idCliente', cobrancas.listarCobrancasCliente);
rotas.get('/cobranca/:id', cobrancas.detalharCobranca);
rotas.put('/cobranca/:id', cobrancas.atualizarCobranca);
rotas.delete('/cobranca/:id', cobrancas.excluirCobranca);
rotas.get('/cobrancas', cobrancas.pesquisarCobrancas);
rotas.get('/cobrancasPorStatus', cobrancas.listarCobrancasPorStatus);

module.exports = rotas;