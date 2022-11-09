create database desafio_modulo5;

create table if not exists usuarios (
    id serial primary key unique,
    nome varchar(60) not null,
    email varchar(60) not null unique,
    senha text not null,
    cpf char(14) unique,
    telefone varchar(15)
);

create table if not exists clientes (
	id serial primary key unique,
    usuario_id integer not null,
    nome varchar(60) not null,
    email varchar(60) not null unique,
    cpf char(14) not null unique,
    telefone varchar(15) not null,
    status varchar(12) default 'Em dia',
    cep char(9),
    logradouro varchar(80),
    complemento varchar(80),
    bairro varchar(30),
    cidade varchar(30),
    estado char(2),
  	foreign key (usuario_id) references usuarios(id)
);

create table if not exists cobrancas (
    id serial primary key unique,
    cliente_id integer not null,
    descricao text not null,
    status varchar(8) not null,
    valor numeric(11, 2) not null,
    vencimento timestamptz not null,
    foreign key (cliente_id) references clientes(id)
);