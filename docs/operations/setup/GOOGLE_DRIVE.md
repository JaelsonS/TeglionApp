# Google Drive Picker — configuração operacional

> Fonte: `docs/operations/GOOGLE_DRIVE_PICKER_SETUP.md` (pasta antiga, removida após esta consolidação). Editado para PT-BR, sem reescrita de conteúdo técnico.

Integração **efêmera**: o funcionário escolhe um arquivo no Google Picker, o Teglion baixa uma vez e anexa à **conversa do cliente**. Não há conexão persistente ao Drive (diferente do Google Calendar).

Escopo OAuth: `https://www.googleapis.com/auth/drive.file` (só arquivos escolhidos através do Picker).

## Google Cloud Console

1. Ativar APIs:
   - **Google Picker API**
   - **Google Drive API**
2. Criar / usar uma **API Key**:
   - Restrição de aplicação: **HTTP referrers**.
   - Referrers recomendados: `https://teglion.com/*`, `https://www.teglion.com/*`, `http://localhost:3000/*` (só para teste local).
   - Restrição de API (opcional, mas recomendado): Picker API + Drive API.
3. OAuth Client (o mesmo da SSO/Calendar):
   - Origens JavaScript autorizadas: `https://teglion.com`, `https://www.teglion.com`.
   - Tela de consentimento: escopo `drive.file`.
   - Em modo **Testing**: emails da equipe em Usuários de teste.
4. Colar a API Key no Render como `GOOGLE_PICKER_API_KEY`.

## Variáveis de ambiente

```
GOOGLE_OAUTH_CLIENT_ID=...          # já usado na SSO
GOOGLE_PICKER_API_KEY=...           # obrigatório para o Picker
```

Não é necessário `CLIENT_SECRET` nem refresh token para este fluxo.

## Fluxo no produto

1. Mensagens (ou Documentos → botão Drive): abrir Picker.
2. Autorizar Google (conta de teste se o app estiver em Testing).
3. Escolher arquivo.
4. Backend valida (MIME / tamanho / magic bytes) e envia como anexo na conversa.

**Nota sobre Documentos:** o botão Drive envia para a **conversa**, não cria entrada na lista de documentos.

## Checklist manual

- [ ] `GET /contabil/integrations/google-drive/config` → `configured: true`
- [ ] Picker abre em produção (sem bloqueio de CSP)
- [ ] Importar PDF / imagem OK
- [ ] Google Doc → exportado para PDF OK
- [ ] Cancelar Picker → sem toast de erro
- [ ] Arquivo de outro tenant / cliente inválido → 404
- [ ] Upload local e Calendar continuam funcionando

## Fora de escopo (futuro)

Navegador de Drive, pastas por cliente, sincronização persistente — ainda não implementado.
