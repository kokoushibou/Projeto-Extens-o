# AgendaBella (Expo) — App simples de agendamento para salão

Aplicativo mobile feito com **Expo + React Native** para organizar **agendamentos**, **clientes** e **serviços** de um salão de beleza, com **armazenamento local** (funciona offline).

## Funcionalidades

### Agenda
- Visualizar a **agenda por dia**
- **Criar agendamento** (cliente + serviço + data/hora + duração + observação)
- **Editar** agendamento
- **Cancelar** agendamento (não apaga; muda o status para “Cancelado”)
- **Regra anti-conflito**: impede agendamentos que batem no mesmo horário (considerando duração)

### Clientes
- Listar clientes
- Buscar cliente (nome/telefone)
- Adicionar / editar / excluir (com confirmação)

### Serviços
- Listar serviços
- Adicionar / editar / excluir
- Serviço tem: **nome**, **preço (opcional)** e **duração (min)**

### Configurações
- Definir **horário de funcionamento** (ex.: 08:00–18:00)
- Definir **intervalo padrão** (ex.: 30 minutos)

## Tecnologias
- Expo (React Native)
- TypeScript
- SQLite (dados: clientes, serviços, agendamentos)
- AsyncStorage (configurações)

## Como rodar (Expo Go)

1. Instale as dependências:
   ```bash
   npm install
