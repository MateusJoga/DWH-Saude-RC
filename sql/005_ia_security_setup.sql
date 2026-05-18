/*
=========================================================================
SCRIPT DE SEGURANÇA: CRIAÇÃO DO USUÁRIO DA IA COM PRIVILÉGIOS MÍNIMOS
=========================================================================
Este script deve ser executado no SQL Server por uma conta com permissões
administrativas (ex: sa). Ele isola completamente o acesso da IA, permitindo
leitura apenas no schema "ouro".

IMPORTANTE: 
Substitua a senha de demonstração abaixo pela sua senha real definida
nas variáveis de ambiente (.env) do projeto.
*/

USE master;
GO

-- 1. Criação do Login no nível do servidor com senha (substitua a senha abaixo)
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'dw_ia_login')
BEGIN
    CREATE LOGIN dw_ia_login WITH PASSWORD = 'SUA_SENHA_DE_DEMONSTRACAO_AQUI_123!', 
    CHECK_EXPIRATION = OFF, 
    CHECK_POLICY = ON;
END;
GO

USE DataWareHouse_RC;
GO

-- 2. Criação do Usuário no banco DataWareHouse_RC associado ao login
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'dw_ia_user')
BEGIN
    CREATE USER dw_ia_user FOR LOGIN dw_ia_login;
END;
GO

-- 3. Concessão de permissão de conexão ao banco
GRANT CONNECT TO dw_ia_user;
GO

-- 4. Permissão exclusiva de SELECT na camada Ouro
GRANT SELECT ON SCHEMA::ouro TO dw_ia_user;
GO

-- 5. Negação explícita de qualquer escrita (DML) na camada Ouro (segurança extra)
DENY INSERT, UPDATE, DELETE, ALTER, CONTROL ON SCHEMA::ouro TO dw_ia_user;
GO

-- 6. Negação física de leitura/escrita e DDL nos schemas Bronze e Prata (Zero Trust absoluto)
DENY SELECT, INSERT, UPDATE, DELETE, ALTER, CONTROL ON SCHEMA::bronze TO dw_ia_user;
DENY SELECT, INSERT, UPDATE, DELETE, ALTER, CONTROL ON SCHEMA::prata TO dw_ia_user;
GO

PRINT 'Configuração de Segurança de IA criada com sucesso no DataWareHouse_RC!';
GO
