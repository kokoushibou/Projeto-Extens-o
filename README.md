# Salão Agenda (Expo SDK 54 + TypeScript)

App de agendamento para salão (sem login), com persistência local:
- **SQLite** para dados de domínio.
- **AsyncStorage** para configurações.

## Requisitos
- Node.js 20+
- npm 10+

## Instalação
```bash
npm install
```

## Executar
```bash
npx expo start
```

Atalhos:
```bash
npm run android
npm run ios
npm run web
```

## Estrutura
```text
src/
  db/
    index.ts
  repositories/
    ClientsRepo.ts
    ServicesRepo.ts
    AppointmentsRepo.ts
  screens/
    AgendaScreen.tsx
    AppointmentFormScreen.tsx
    ClientsScreen.tsx
    ServicesScreen.tsx
    SettingsScreen.tsx
  components/
    ConfirmDialog.tsx
    EmptyState.tsx
  utils/
    datetime.ts
    overlap.ts
    settings.ts
  theme/
  navigation/
    BottomTabs.tsx
    AgendaStack.tsx
```

## Navegação
- Tabs principais: **Agenda | Clientes | Serviços | Config**.
- A tab Agenda usa um **Native Stack**:
  - `AgendaScreen` (lista do dia)
  - `AppointmentFormScreen` (novo/edição/cancelamento)

## Banco e migrações
- `migrate()` roda na inicialização do app.
- Tabelas: `clients`, `services`, `appointments`, `schema_migrations`.
- Seed automático de serviços padrão (se `services` estiver vazio):
  - Corte (R$ 0, 30 min)
  - Escova (R$ 0, 60 min)

## Fluxo de agendamentos
- Agenda possui seletor de data e lista de agendamentos do dia.
- FAB `+` abre formulário de novo agendamento.
- Toque em um card abre edição.
- Formulário permite:
  - selecionar cliente (com busca)
  - criar **cliente rápido** e já selecionar
  - selecionar serviço
  - escolher data/hora
  - ajustar duração (default do serviço)
  - adicionar observação
- Em edição, há botão **Cancelar Agendamento** (status `CANCELED`).

## Regra de conflito (obrigatória)
Ao salvar um agendamento `ACTIVE`:
1. calcula `endAt = startAt + durationMinutes`
2. verifica sobreposição com outros `appointments` `ACTIVE`
3. em edição, exclui o próprio `id` da verificação
4. se houver conflito, bloqueia salvamento com alerta **"Conflito de horário"**

## Configurações
- `src/utils/settings.ts` usa AsyncStorage com defaults:
  - `openTime: '08:00'`
  - `closeTime: '18:00'`
  - `slotInterval: 30`
