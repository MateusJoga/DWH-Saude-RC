/*
=========================================
CRIANDO DATABASE E SCHEMAS
===========================================
Script:
	Este script cria um novo database chamado 'DataWareHouse_RC' chegando se ele já existe.
	Se o database existir, ele será removido e recriado. Posteriormente, o script irá inserir 3 schemas
	no database: 'bronze, 'prata' e 'ouro'.

CUIDADO:
	Rodar este script com o database já criado, resultará em perca de informações que haviam nele.
*/

USE master;
GO

IF EXISTS (SELECT 1 FROM sys.databases WHERE name = 'DataWareHouse_RC')
BEGIN
	ALTER DATABASE DataWareHouse_RC SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
	DROP DATABASE DataWareHouse_RC
END;
GO

CREATE DATABASE DataWareHouse_RC;
GO

USE DataWareHouse_RC;
GO

CREATE SCHEMA bronze;
GO

CREATE SCHEMA prata;
GO

CREATE SCHEMA ouro;
GO