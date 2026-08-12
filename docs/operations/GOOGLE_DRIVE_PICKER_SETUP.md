# Google Drive Picker — configuração operacional (Teglion)

Integração **efémera**: o staff escolhe um ficheiro no Google Picker; o Teglion
descarrega uma vez e anexa à **conversa do cliente**. Não há ligação persistente
ao Drive (ao contrário do Google Calendar).

Scope OAuth: `https://www.googleapis.com/auth/drive.file`  
(só ficheiros escolhidos através do Picker.)

## Google Cloud Console

1. Activar APIs:
   - **Google Picker API**
   - **Google Drive API**
2. Criar / usar uma **API Key**:
   - Restrição de aplicação: **HTTP referrers**
   - Referrers recomendados:
     - `https://teglion.com/*`
     - `https://www.teglion.com/*`
     - `http://localhost:3000/*` (só se testar local)
   - Restrição de API (opcional mas recomendado): Picker API + Drive API
3. OAuth Client (o mesmo da SSO/Calendar):
   - Origens JavaScript autorizadas: `https://teglion.com`, `https://www.teglion.com`
   - Tela de consentimento: scope `drive.file`
   - Em modo **Testing**: emails da equipa em Utilizadores de teste
4. Colar a API Key no Render como `GOOGLE_PICKER_API_KEY`.

## Variáveis de ambiente

```
GOOGLE_OAUTH_CLIENT_ID=...          # já usado na SSO
GOOGLE_PICKER_API_KEY=...           # obrigatório para o Picker
```

Não é necessário `CLIENT_SECRET` nem refresh token para este fluxo.

## Fluxo no produto

1. Mensagens (ou Documentos → botão Drive): abrir Picker
2. Autorizar Google (conta de teste se app em Testing)
3. Escolher ficheiro
4. Backend valida (MIME / tamanho / magic bytes) e envia como anexo na conversa

**Nota Documentos:** o botão Drive envia para a **conversa**, não cria entrada na lista de documentos.

## Checklist manual

- [ ] `GET /contabil/integrations/google-drive/config` → `configured: true`
- [ ] Picker abre em produção (sem bloqueio CSP)
- [ ] Import PDF / imagem OK
- [ ] Google Doc → exportado para PDF OK
- [ ] Cancelar Picker → sem toast de erro
- [ ] Ficheiro de outro tenant / cliente inválido → 404
- [ ] Upload local e Calendar continuam a funcionar

## Fora de scope (futuro)

Browser de Drive, pastas por cliente, sync persistente — ver documento de arquitectura futura (ainda não implementado).
