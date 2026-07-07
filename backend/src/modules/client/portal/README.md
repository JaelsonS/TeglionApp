# Módulo Client — Portal

Sub-módulo do portal do cliente final (B2B2C).

## Estrutura

```
client/
├── portal.controller.js   # HTTP — rotas /client-portal/*
├── portal.service.js        # Re-export de compatibilidade → portal/
└── portal/
    ├── index.js             # Facade pública
    ├── hub.service.js       # Hub + dashboard + obrigações
    ├── booking.service.js   # Agendamento / consultas
    ├── tasks.service.js     # Tarefas do cliente
    ├── documents.service.js # Upload e listagem de documentos
    ├── messages.service.js  # Mensagens com o escritório
    ├── notifications.helper.js
    ├── hub.helpers.js       # Funções puras (testadas)
    ├── client.guard.js      # requireLinkedClient
    └── hub.helpers.test.js
```

## Import

```js
const portal = require('./portal'); // preferido
const portal = require('./portal.service'); // compat legado
```
