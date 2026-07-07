# TegLion — Backlog Master

**Plataforma de Crescimento · 350 melhorias**

**Documento oficial · Última actualização: Julho 2026**

Índice detalhado do backlog referenciado em [ROADMAP.md](./ROADMAP.md). Cada item mapeia para uma das 10 fases estratégicas e para os 6 pilares de crescimento.

---

## Legenda

| Campo | Significado |
|-------|-------------|
| **#** | ID único |
| **Pri** | P0 (crítico) · P1 (alto) · P2 (médio) · P3 (futuro) |
| **Impacto** | Efeito no negócio/utilizador |
| **Complexidade** | Esforço de engenharia |
| **Valor Cliente** | Benefício para escritório/cliente final |
| **Valor Negócio** | Benefício TegLion (receita, retenção, moat) |

---

## Backlog por categoria

Formato compacto: **# | Título | Cat | Pri | Impacto | Complexidade | Valor Cliente | Valor Negócio**

---

### A. Plataforma & Fundação (1–40)

1. Job queue BullMQ | Platform | P0 | Crítico | Alta | Estabilidade | Escala
2. Multi-instance backend | Platform | P0 | Alto | Média | Uptime | Escala
3. Redis obrigatório produção | Platform | P0 | Alto | Baixa | Performance | Escala
4. WAF Cloudflare OWASP | Security | P0 | Alto | Baixa | Segurança | Confiança
5. Pentest anual | Security | P0 | Alto | Média | Confiança | Vendas
6. SOC2 roadmap | Security | P2 | Alto | Muito alta | Enterprise | Deals
7. Status page pública | DevOps | P1 | Médio | Baixa | Transparência | Confiança
8. API versioning v2 strategy | Platform | P2 | Médio | Média | Longevidade | Partners
9. Feature flags (LaunchDarkly) | Platform | P1 | Alto | Média | Release safe | Velocidade
10. Monorepo CI <10min | DevOps | P1 | Médio | Média | Dev UX | Velocidade
11. Staging environment real | DevOps | P0 | Alto | Média | QA | Qualidade
12. IaC Terraform Render/Supabase | DevOps | P1 | Médio | Alta | Reprodutibilidade | Escala
13. Backup PITR documentado | DevOps | P0 | Crítico | Baixa | DR | Confiança
14. Runbook incident response | DevOps | P1 | Alto | Baixa | Recovery | SLA
15. SLO 99.9% definido | DevOps | P1 | Alto | Média | Expectativa | Enterprise
16. Error budget policy | DevOps | P2 | Médio | Média | Qualidade | Cultura
17. OpenTelemetry tracing | DevOps | P1 | Alto | Alta | Debug | MTTR
18. Log aggregation (Datadog) | DevOps | P1 | Alto | Média | Ops | MTTR
19. Rate limit edge + app | Security | P0 | Alto | Média | Abuse | Custo
20. DDoS testing | Security | P1 | Médio | Baixa | Uptime | Confiança
21. Secrets rotation policy | Security | P1 | Alto | Média | Segurança | Compliance
22. Dependency audit CI | Security | P1 | Médio | Baixa | CVE | Risco
23. Tenant isolation CI weekly | Security | P0 | Crítico | Baixa | Isolamento | Legal
24. GDPR export automático | Compliance | P1 | Alto | Média | Direitos | Legal
25. GDPR delete workflow | Compliance | P1 | Alto | Alta | Direitos | Legal
26. DPA generator | Compliance | P1 | Médio | Baixa | Onboarding | Vendas
27. Cookie consent v2 | Compliance | P2 | Baixo | Baixa | Legal | Legal
28. Audit log UI escritório | Compliance | P1 | Alto | Média | Transparência | Enterprise
29. Data residency EU | Compliance | P1 | Alto | Média | RGPD | Europa
30. Supabase RLS hardening | Security | P2 | Médio | Alta | Defense depth | Segurança
31. Break-glass admin access | Security | P2 | Médio | Média | Support | Ops
32. IP allowlist enterprise | Security | P2 | Baixo | Média | Enterprise | ARPU
33. Session management UI | Security | P1 | Médio | Média | Segurança | Confiança
34. 2FA TOTP | Security | P1 | Alto | Média | Segurança | Enterprise
35. WebAuthn passkeys | Security | P2 | Médio | Alta | UX segurança | Premium
36. SAML SSO enterprise | Security | P2 | Alto | Alta | Enterprise | ARPU
37. Google SSO registo | Auth | P0 | Alto | Média | Onboarding | Conversão
38. Apple SSO | Auth | P3 | Baixo | Média | UX | Nice
39. Microsoft SSO | Auth | P2 | Médio | Média | Enterprise PT | Deals
40. Passwordless magic link | Auth | P2 | Médio | Média | UX | Conversão

---

### B. Clientes & CRM (41–70)

41. Import CSV clientes | Clientes | P0 | Alto | Média | Onboarding | Activation
42. Export CSV clientes | Clientes | P1 | Médio | Baixa | Portabilidade | Trust
43. Perfil 360 cliente | Clientes | P0 | Alto | Alta | Produtividade | Retention
44. Tags clientes | Clientes | P1 | Médio | Baixa | Organização | UX
45. Segmentos dinâmicos | Clientes | P1 | Alto | Média | Marketing interno | CS
46. Pipeline onboarding cliente | Clientes | P1 | Alto | Média | Activation | Retention
47. Score risco atraso | Clientes | P1 | Alto | Alta | Proactividade | Valor
48. Validação NIF AT | Clientes | P1 | Alto | Média | Qualidade dados | PT killer
49. Campos custom JSON | Clientes | P2 | Médio | Média | Flexibilidade | Enterprise
50. Duplicados detection | Clientes | P2 | Médio | Média | Data quality | Ops
51. Merge clientes | Clientes | P2 | Médio | Alta | Data quality | Ops
52. Arquivo cliente | Clientes | P1 | Médio | Baixa | GDPR | Organização
53. Histórico alterações cliente | Clientes | P1 | Médio | Média | Auditoria | Enterprise
54. Notas internas cliente | Clientes | P1 | Médio | Baixa | CRM | Produtividade
55. Assign staff default | Clientes | P1 | Médio | Baixa | Routing | Ops
56. Bulk assign staff | Clientes | P1 | Alto | Média | Produtividade | Escala
57. Bulk status change | Clientes | P2 | Médio | Baixa | Ops | Escala
58. Filtros salvos | Clientes | P1 | Médio | Média | UX | Power user
59. Vista kanban clientes | Clientes | P2 | Médio | Alta | Visual | UX
60. Cliente favoritos | Clientes | P2 | Baixo | Baixa | Velocidade | UX
61. Pesquisa global ⌘K | UX | P0 | Alto | Alta | Velocidade | UX
62. Recent clients | UX | P1 | Médio | Baixa | Velocidade | UX
63. Cliente grupos holdings | Clientes | P3 | Baixo | Alta | Enterprise | ARPU
64. Contactos múltiplos cliente | Clientes | P2 | Médio | Média | B2B | Real world
65. Portal multi-user cliente | Portal | P2 | Médio | Alta | Empresas | ARPU
66. Permissões portal cliente | Portal | P2 | Médio | Alta | Segurança | Enterprise
67. Convite segundo user portal | Portal | P2 | Médio | Média | Adoption | Retention
68. Link público upload temporário | Documentos | P2 | Médio | Média | Friction | UX
69. QR code convite cliente | Portal | P2 | Médio | Baixa | Onboarding | Growth
70. CRM atividades timeline | Clientes | P1 | Alto | Média | Visão única | Retention

---

### C. Documentos (71–110)

71. Upload multi-ficheiro | Docs | P0 | Alto | Média | UX | Activation
72. Drag-drop zona ampla | Docs | P1 | Médio | Baixa | UX | Polish
73. Progress bar upload | Docs | P1 | Médio | Baixa | Confiança | UX
74. Retry upload falhado | Docs | P1 | Médio | Média | Resiliência | UX
75. Preview PDF inline | Docs | P1 | Alto | Média | Produtividade | UX
76. Preview imagens | Docs | P0 | Médio | Baixa | UX | Básico
77. Versioning documentos | Docs | P2 | Médio | Alta | Auditoria | Enterprise
78. Diff versões | Docs | P3 | Baixo | Alta | Niche | Enterprise
79. Virus scan ClamAV | Docs | P1 | Alto | Média | Segurança | Trust
80. OCR campos v1 | AI | P1 | Muito alto | Alta | Tempo | Killer
81. Classificação IA tipo doc | AI | P1 | Muito alto | Alta | Tempo | Killer
82. Duplicado detection hash | Docs | P1 | Médio | Média | Qualidade | Ops
83. Pedido formal template | Docs | P0 | Alto | Baixa | Core | Core
84. Pedido recorrente auto | Automação | P1 | Alto | Média | Tempo | Retention
85. Lembrete pedido pendente | Automação | P1 | Alto | Média | Cobrança docs | Valor
86. SLA pedido visual | Docs | P1 | Médio | Baixa | Clareza | UX
87. Aprovar/rejeitar doc | Docs | P0 | Alto | Média | Workflow | Core
88. Motivo rejeição template | Docs | P1 | Médio | Baixa | Comunicação | UX
89. Comentário interno doc | Docs | P1 | Médio | Baixa | Colaboração | Team
90. Bulk approve | Docs | P2 | Médio | Média | Escala | Produtividade
91. Bulk download ZIP | Docs | P2 | Médio | Média | Export | UX
92. Pesquisa full-text docs | Docs | P1 | Alto | Alta | Encontrar | UX
93. Filtros docs avançados | Docs | P1 | Médio | Média | Power user | UX
94. Storage lifecycle cold | Infra | P2 | Médio | Alta | Custo | Margem
95. Signed URL TTL config | Docs | P2 | Baixo | Baixa | Segurança | Enterprise
96. Watermark download | Docs | P3 | Baixo | Média | IP | Niche
97. Assinatura digital integração | Docs | P2 | Alto | Muito alta | Legal | Enterprise
98. Integração Drive import | Integrações | P2 | Médio | Alta | Migração | Activation
99. Email-to-upload | Docs | P2 | Médio | Alta | Friction | UX
100. WhatsApp doc receive | Integrações | P1 | Muito alto | Alta | Canal | Killer PT
101. Foto câmara compress | Portal | P1 | Alto | Média | Mobile | UX
102. Heic convert | Portal | P2 | Médio | Baixa | iOS | UX
103. Limite tamanho claro UX | Docs | P1 | Baixo | Baixa | Friction | Support
104. Lista docs por obrigação | Docs | P1 | Alto | Média | Fiscal | Core
105. Checklist doc obrigatório | Docs | P1 | Alto | Média | Compliance | Valor
106. Mapa calor docs pendentes | Analytics | P1 | Alto | Média | Visão | Retention
107. Histórico doc imutável | Docs | P0 | Alto | Média | Auditoria | Legal
108. Retention policy 7 anos | Compliance | P1 | Alto | Média | Fiscal | Legal
109. Anonimização pós-retention | Compliance | P2 | Médio | Alta | GDPR | Legal
110. Doc request API webhook | API | P1 | Médio | Média | Integração | Platform

---

### D. Obrigações & Fiscal (111–145)

111. Calendário fiscal PT completo | Fiscal | P0 | Alto | Média | Core | PT
112. Calendário BR | Fiscal | P1 | Alto | Alta | Expansão | BR
113. Obrigação por cliente | Fiscal | P0 | Alto | Baixa | Core | Core
114. Recurrence rules | Fiscal | P1 | Alto | Média | Automação | Tempo
115. Templates obrigação escritório | Fiscal | P1 | Médio | Média | Custom | UX
116. Vista calendário mensal | Fiscal | P1 | Alto | Média | Planeamento | UX
117. Vista kanban obrigações | Fiscal | P1 | Alto | Alta | Workflow | UX
118. Mapa fecho mês | Fiscal | P0 | Muito alto | Alta | Killer | Retention
119. «Rebenta amanhã» widget | Fiscal | P0 | Alto | Média | Stress ↓ | Valor
120. Bulk marcar concluído | Fiscal | P1 | Médio | Baixa | Produtividade | UX
121. Assign obrigação staff | Fiscal | P1 | Médio | Baixa | Team | Ops
122. Comentários obrigação | Fiscal | P1 | Médio | Baixa | Colaboração | UX
123. Anexos obrigação | Fiscal | P2 | Médio | Média | Contexto | UX
124. Histórico estado | Fiscal | P1 | Médio | Média | Auditoria | Enterprise
125. Integração AT consulta | Integrações | P1 | Muito alto | Alta | Killer PT | Moat
126. Integração AT submissão | Integrações | P2 | Alto | Muito alta | Automação | Moat
127. e-Fatura sync | Integrações | P2 | Alto | Alta | PT | Moat
128. SAF-T import | Integrações | P2 | Médio | Alta | Reconciliação | Niche
129. SS obrigações | Fiscal | P2 | Médio | Alta | PT | Completeness
130. IES/IRC reminders | Fiscal | P1 | Médio | Média | PT | Valor
131. IVA trimestral workflow | Fiscal | P1 | Alto | Média | PT | Valor
132. IRS particulares checklist | Fiscal | P2 | Médio | Média | Seasonal | UX
133. Obrigação custom user | Fiscal | P2 | Médio | Média | Flex | Enterprise
134. Export obrigações Excel | Fiscal | P1 | Médio | Baixa | Reporting | UX
135. ICS export calendário | Fiscal | P2 | Baixo | Baixa | Integração | UX
136. Notificação 7/3/1 dia antes | Automação | P1 | Alto | Média | Compliance | Valor
137. Escalation sem doc | Automação | P1 | Alto | Média | Cobrança | Valor
138. Benchmark prazo médio | Analytics | P3 | Médio | Alta | Insight | Moat
139. CountryConfig ES | International | P2 | Alto | Muito alta | Europa | Growth
140. Multi-moeda display | International | P2 | Baixo | Média | BR/EU | UX
141. Feriados regionais PT | Fiscal | P2 | Médio | Média | Precisão | UX
142. Fecho mês lock | Fiscal | P2 | Médio | Média | Processo | Enterprise
143. Reabrir mês auditado | Fiscal | P2 | Baixo | Média | Correção | Audit
144. Obrigação dependencies | Fiscal | P2 | Médio | Alta | Complex fiscal | Pro
145. Simulador penalidades | Fiscal | P3 | Baixo | Alta | Education | Content

---

### E. Portal Cliente (146–175)

146. Dashboard «o que falta» | Portal | P0 | Muito alto | Média | Clarity | Retention
147. Linguagem simples obrigações | Portal | P0 | Alto | Baixa | UX | B2B2C
148. Tour onboarding 30s | Portal | P1 | Alto | Baixa | Activation | Retention
149. Vídeo contabilista welcome | Portal | P1 | Alto | Baixa | Trust | Premium
150. Upload 2 toques | Portal | P0 | Alto | Média | Mobile | Killer
151. Estado doc visual stepper | Portal | P1 | Médio | Baixa | Ansiedade ↓ | UX
152. Push notifications | Portal | P1 | Alto | Média | Re-engagement | Retention
153. Email digest semanal | Portal | P1 | Médio | Média | Habito | Retention
154. WhatsApp opt-in | Portal | P1 | Alto | Média | Canal | PT
155. Branding logo cores | Portal | P0 | Alto | Baixa | White label lite | Vendas
156. Custom domain portal | Portal | P2 | Médio | Alta | Premium | ARPU
157. Dark mode portal | Portal | P3 | Baixo | Baixa | Preference | Nice
158. Acessibilidade WCAG AA portal | A11y | P1 | Médio | Média | Inclusão | Legal
159. FAQ contextual portal | Portal | P1 | Médio | Baixa | Support ↓ | Custo
160. Chat portal | Portal | P0 | Alto | Média | Core | Core
161. Anexos chat | Portal | P1 | Médio | Média | UX | Comms
162. Read receipts | Portal | P2 | Baixo | Média | Accountability | UX
163. Typing indicator | Portal | P3 | Baixo | Baixa | Modern | Nice
164. Notícias escritório | Portal | P1 | Médio | Baixa | Engagement | ✓
165. Alertas fiscais cliente | Portal | P1 | Alto | Média | Valor | Retention
166. Booking consulta | Portal | P2 | Médio | Média | Serviços | ARPU
167. Pagamento serviços Stripe | Portal | P3 | Médio | Alta | Monetização | ARPU
168. Relatório anual cliente PDF | Portal | P2 | Alto | Média | Wow | Retention
169. TegLion score organização | Portal | P2 | Médio | Alta | Gamification | Moat
170. Partilhar progresso | Portal | P3 | Baixo | Média | Viral | Growth
171. App nativa cliente | Mobile | P2 | Alto | Muito alta | Mobile | Retention
172. Biometria login portal | Mobile | P2 | Médio | Média | UX | Security
173. Offline queue upload | Mobile | P3 | Baixo | Alta | Rural | Niche
174. Portal EN para expats | International | P3 | Baixo | Média | Niche | UX
175. Portal acessível idosos | A11y | P2 | Médio | Média | Inclusão | Brand

---

### F. Comunicação & Notificações (176–205)

176. Templates mensagem | Comms | P1 | Alto | Baixa | Tempo | Produtividade
177. Variáveis template {cliente} | Comms | P1 | Médio | Baixa | Personalização | UX
178. Bulk message clientes segmento | Comms | P2 | Alto | Média | Campanhas | CS
179. Broadcast email | Comms | P1 | Médio | Baixa | News | ✓
180. In-app notification center | Comms | P1 | Alto | Média | UX | ✓
181. Notification preferences | Comms | P1 | Médio | Média | RGPD | UX
182. Quiet hours | Comms | P2 | Baixo | Baixa | Respeito | UX
183. SMS Brevo production | Comms | P2 | Médio | Baixa | Canal | ✓
184. WhatsApp Business API | Comms | P1 | Muito alto | Alta | Canal | Killer
185. Email branded SPF/DKIM | Comms | P1 | Alto | Média | Deliverability | Trust
186. Reply-to contabilista | Comms | P1 | Médio | Baixa | Profissional | UX
187. Thread por cliente unificada | Comms | P1 | Alto | Alta | UX | Retention
188. SLA badge resposta | Comms | P2 | Médio | Média | Qualidade | Premium
189. Auto-ack cliente mensagem | Comms | P2 | Baixo | Baixa | Expectativa | UX
190. Live chat support TegLion | Support | P2 | Médio | Média | PLG | Custo
191. Intercom/Crisp integrate | Support | P2 | Baixo | Baixa | Support | Ops
192. NPS in-app survey | Growth | P1 | Alto | Baixa | Feedback | Product
193. CSAT pós-interação | Growth | P2 | Médio | Baixa | Quality | CS
194. Digest matinal staff email | Comms | P1 | Alto | Média | Produtividade | Retention
195. Escalation rules coms | Automação | P1 | Alto | Média | Risk | Valor
196. Mention @staff interno | Comms | P2 | Médio | Alta | Team | Collaboration
197. Internal notes not visible client | Comms | P1 | Médio | Baixa | Privacy | Core
198. Message search | Comms | P1 | Alto | Alta | Find | UX
199. Pin important messages | Comms | P2 | Baixo | Baixa | UX | Nice
200. Archive threads | Comms | P2 | Baixo | Baixa | Organização | UX
201. Webhook new message | API | P1 | Médio | Média | Integração | Platform
202. Mobile push firm staff | Mobile | P2 | Médio | Alta | Responsiveness | UX
203. Sound notification desktop | UX | P3 | Baixo | Baixa | Alert | Nice
204. Notification grouping | UX | P2 | Médio | Média | Overload ↓ | UX
205. Mark all read | UX | P1 | Baixo | Baixa | UX | Polish

---

### G. Automação & Workflows (206–235)

206. Rules engine UI | Automação | P1 | Alto | Alta | Self-serve | Moat
207. Trigger: X dias antes prazo | Automação | P1 | Alto | Média | Core | Valor
208. Trigger: doc uploaded | Automação | P1 | Alto | Média | Workflow | Valor
209. Trigger: cliente inativo | Automação | P2 | Médio | Média | Churn | CS
210. Action: send template email | Automação | P1 | Alto | Baixa | Tempo | Valor
211. Action: create task | Automação | P1 | Médio | Média | Workflow | UX
212. Action: assign staff | Automação | P2 | Médio | Baixa | Routing | Ops
213. Action: webhook | Automação | P1 | Médio | Média | Platform | Partners
214. Automation templates gallery | Automação | P1 | Alto | Média | Activation | UX
215. Automation analytics | Automação | P2 | Médio | Média | Optimização | Product
216. Dry-run automation | Automação | P2 | Médio | Média | Safety | Enterprise
217. Version control rules | Automação | P3 | Baixo | Alta | Enterprise | Pro
218. Zapier triggers | Integrações | P2 | Alto | Média | Ecosystem | Growth
219. Make.com | Integrações | P3 | Médio | Média | Ecosystem | Growth
220. n8n self-host partner | Integrações | P3 | Baixo | Alta | Niche | Partners
221. Scheduled reports auto | Automação | P2 | Médio | Média | Reporting | UX
222. Auto-archive old tasks | Automação | P2 | Baixo | Baixa | Hygiene | Ops
223. Auto-remind unopened invite | Automação | P1 | Alto | Baixa | Activation | Growth
224. Onboarding drip firm | Automação | P1 | Alto | Média | Trial conv | Revenue
225. Onboarding drip client | Automação | P1 | Alto | Média | Portal adopt | Retention
226. Churn prevention workflow | CS | P2 | Alto | Alta | Revenue | CS
227. Trial ending sequence | Billing | P1 | Alto | Baixa | Conversion | Revenue
228. Payment failed recovery | Billing | P0 | Alto | Média | Revenue | Critical
229. Upgrade prompt usage limit | Billing | P1 | Alto | Média | Expansion | ARPU
230. Downgrade save offer | Billing | P2 | Médio | Média | Churn | Revenue
231. Usage metering API | Billing | P2 | Alto | Alta | Usage pricing | Model
232. Credits system | Billing | P3 | Baixo | Alta | Flex | Enterprise
233. Invoice PDF PT | Billing | P2 | Médio | Média | Local | Compliance
234. Multi-currency billing | Billing | P2 | Médio | Média | BR/EU | Growth
235. Reseller billing | Billing | P3 | Médio | Alta | Channel | Growth

---

### H. IA & Dados (236–275)

236. AI Gateway produção | AI | P1 | Crítico | Alta | Foundation | Moat
237. OCR facturas PT | AI | P1 | Muito alto | Alta | Tempo | Killer
238. Classify doc type | AI | P1 | Muito alto | Alta | Routing | Killer
239. Extract NIF valor data | AI | P1 | Alto | Alta | Quality | Valor
240. Blur quality detection | AI | P1 | Médio | Média | UX | Support
241. Duplicate doc AI | AI | P1 | Médio | Média | Quality | Ops
242. Summarize PDF | AI | P2 | Alto | Média | Tempo | UX
243. Summarize message thread | AI | P2 | Médio | Média | Tempo | UX
244. Draft client email PT | AI | P2 | Alto | Média | Tempo | UX
245. Draft professional tone BR | AI | P2 | Médio | Média | BR | Expansion
246. Copilot «fecho mês» | AI | P2 | Muito alto | Alta | Killer | Moat
247. Risk score ML | AI | P2 | Alto | Alta | Proactive | Moat
248. Churn prediction firm | AI | P2 | Alto | Alta | CS | Revenue
249. Smart prioritization queue | AI | P2 | Alto | Alta | Produtividade | UX
250. Semantic search | AI | P2 | Alto | Alta | Find | UX
251. RAG help center | AI | P1 | Alto | Média | Support ↓ | Custo
252. RAG fiscal FAQ public | AI | P2 | Médio | Alta | Content | SEO
253. AI guardrails PII | AI | P0 | Crítico | Média | RGPD | Legal
254. Human approve AT submit | AI | P0 | Crítico | Baixa | Liability | Legal
255. Model fallback OpenAI+local | AI | P1 | Médio | Média | Resilience | Ops
256. AI usage metering | AI | P2 | Médio | Média | Pricing | Model
257. Fine-tune domain PT fiscal | AI | P3 | Alto | Muito alta | Accuracy | Moat
258. Voice to text notes | AI | P3 | Médio | Média | Mobile | UX
259. Anomaly detection uploads | AI | P2 | Médio | Alta | Fraud | Security
260. Client sentiment analysis | AI | P2 | Médio | Alta | CS | Retention
261. Suggested automation rules | AI | P2 | Alto | Alta | Activation | Moat
262. Auto-tag clientes | AI | P2 | Médio | Média | CRM | UX
263. Predict doc needed | AI | P2 | Alto | Alta | Proactive | Valor
264. Benchmark anonymized | AI | P3 | Alto | Muito alta | Insight | Moat
265. AI explainability UI | AI | P2 | Médio | Média | Trust | Enterprise
266. Feedback loop thumbs | AI | P1 | Médio | Baixa | Quality | ML
267. Red team AI prompts | Security | P2 | Médio | Média | Safety | Risk
268. Document Q&A cliente | AI | P2 | Médio | Alta | Support | UX
269. Training data opt-out | Compliance | P1 | Alto | Média | RGPD | Legal
270. AI audit log | Compliance | P1 | Alto | Média | Enterprise | Legal
271. Batch OCR overnight | AI | P2 | Médio | Média | Cost | Ops
272. Confidence score display | AI | P1 | Médio | Baixa | Trust | UX
273. Manual override always | AI | P0 | Alto | Baixa | Control | Pro
274. Multi-language AI | AI | P2 | Médio | Alta | EU/BR | Growth
275. Embeddings vault per tenant | AI | P2 | Médio | Alta | Privacy | Enterprise

---

### I. UX/UI & Design (276–305)

276. Design system unificado | UI | P0 | Alto | Alta | Consistency | Brand
277. Dashboard «Hoje» redesign | UX | P0 | Muito alto | Alta | Focus | Retention
278. Onboarding wizard 3 steps | UX | P0 | Alto | Média | Activation | Revenue
279. Empty states ilustrados | UI | P1 | Médio | Baixa | Education | UX
280. Skeleton loaders all | UI | P1 | Médio | Baixa | Perceived perf | UX
281. Toast consistency | UI | P1 | Baixo | Baixa | Polish | UX
282. Error messages human | UX | P1 | Alto | Baixa | Trust | Support
283. Form validation inline | UX | P1 | Médio | Baixa | Friction | UX
284. Breadcrumbs firm app | UX | P2 | Baixo | Baixa | Navigation | UX
285. Sidebar collapsible | UI | P2 | Baixo | Baixa | Space | UX
286. Keyboard shortcuts modal | UX | P2 | Médio | Média | Power | UX
287. Table virtualization | Performance | P1 | Alto | Alta | Scale | UX
288. Responsive firm tablet | UX | P1 | Médio | Média | Mobility | UX
289. Print styles reports | UX | P2 | Baixo | Baixa | OCC | Niche
290. Ilustrações marca custom | Brand | P2 | Médio | Média | Premium | Marketing
291. Motion reduced respect | A11y | P1 | Baixo | Baixa | A11y | Legal
292. Focus visible all | A11y | P1 | Médio | Baixa | A11y | Legal
293. Skip link | A11y | P1 | Baixo | Baixa | A11y | WCAG
294. Color contrast audit | A11y | P1 | Médio | Baixa | A11y | Legal
295. Icon-only buttons labels | A11y | P1 | Baixo | Baixa | A11y | WCAG
296. Loading progress global | UX | P2 | Baixo | Baixa | Perception | UX
297. Optimistic UI messages | UX | P2 | Médio | Média | Speed feel | UX
298. Undo toast actions | UX | P2 | Médio | Média | Safety | UX
299. Dark mode firm | UI | P3 | Baixo | Média | Preference | Nice
300. Component Storybook | UI | P1 | Médio | Média | Dev speed | Quality
301. Visual regression CI | QA | P1 | Alto | Média | Regressions | Quality
302. UX research 5 users/month | UX | P1 | Alto | Baixa | Product | PMF
303. Heatmaps Hotjar | Growth | P2 | Médio | Baixa | Conversion | Marketing
304. Session replay FullStory | Growth | P2 | Médio | Baixa | Debug UX | Product
305. Design QA checklist release | QA | P1 | Médio | Baixa | Polish | Brand

---

### J. Growth, Landing & Marketing (306–330)

306. Hero headline A/B | Growth | P0 | Alto | Baixa | CVR | Revenue
307. Vídeo demo 90s | Growth | P0 | Muito alto | Média | CVR | Revenue
308. ROI calculator | Growth | P0 | Alto | Média | CVR | Sales
309. 10 video testemunhos | Growth | P0 | Muito alto | Média | Trust | CVR
310. Case studies reais | Growth | P0 | Alto | Baixa | Trust | CVR
311. Comparativo vs WhatsApp | Growth | P1 | Alto | Baixa | Position | CVR
312. Comparativo vs ERP | Growth | P1 | Alto | Baixa | Position | CVR
313. Pricing page transparent | Growth | P1 | Alto | Média | CVR | Revenue
314. Calendly demo enterprise | Growth | P1 | Médio | Baixa | Pipeline | ARPU
315. Blog 2 posts/semana SEO | SEO | P1 | Alto | Média | Traffic | PLG
316. Pillar pages fiscal PT | SEO | P1 | Alto | Alta | Traffic | PLG
317. Webinars mensais OCC | Growth | P2 | Alto | Média | Leads | Brand
318. Referral program escritório | Growth | P2 | Alto | Média | Viral | CAC
319. Affiliate contabilistas | Growth | P2 | Médio | Alta | Channel | Growth
320. Google Ads landing variants | Growth | P1 | Alto | Média | CVR | ROI ads
321. LinkedIn ABM escritórios | Growth | P2 | Alto | Média | B2B | Pipeline
322. Trust badges landing | Growth | P1 | Médio | Baixa | Trust | CVR
323. Live chat pre-sales | Growth | P2 | Médio | Baixa | CVR | Pipeline
324. Free tools SEO (calculadora IVA) | SEO | P2 | Alto | Alta | Traffic | PLG
325. Newsletter contabilistas | Growth | P2 | Médio | Baixa | Nurture | Brand
326. PR Portugal tech+fiscal | Brand | P2 | Médio | Média | Awareness | Brand
327. Partnership OCC official | Brand | P1 | Muito alto | Alta | Trust | Moat
328. AppSumo não — manter premium | Strategy | - | - | - | Brand | ARPU
329. Freemium tier limitado | Growth | P2 | Alto | Alta | PLG | Model
330. Annual plan discount 20% | Billing | P1 | Alto | Baixa | Cash | LTV

---

### K. Integrações, API & Platform (331–350)

331. Public REST API v1 docs | API | P1 | Alto | Alta | Platform | Moat
332. API keys per firm | API | P1 | Alto | Média | Security | Platform
333. Webhooks signatures | API | P1 | Alto | Média | Trust | Platform
334. Rate limit API tiered | API | P1 | Médio | Média | Abuse | Model
335. SDK JavaScript | API | P3 | Baixo | Alta | Devs | Ecosystem
336. PHC export sync | Integrações | P2 | Alto | Alta | PT | Retention
337. Primavera connector | Integrações | P2 | Alto | Alta | PT | Retention
338. Moloni link | Integrações | P2 | Médio | Alta | PT | UX
339. Stripe Connect escritório | Integrações | P3 | Médio | Alta | Fintech | ARPU
340. Open Banking PT | Integrações | P3 | Alto | Muito alta | Auto recon | Future
341. Microsoft 365 email | Integrações | P2 | Médio | Alta | Workflow | Enterprise
342. Google Workspace | Integrações | P2 | Médio | Média | Workflow | UX
343. Slack notifications firm | Integrações | P3 | Baixo | Média | Team | Niche
344. Teams webhook | Integrações | P3 | Baixo | Média | Enterprise | Niche
345. Marketplace app review | Platform | P3 | Médio | Alta | Quality | Ecosystem
346. Partner portal | Platform | P3 | Médio | Alta | Channel | Growth
347. OAuth third-party apps | Platform | P2 | Alto | Alta | Ecosystem | Moat
348. Sandbox API environment | API | P1 | Médio | Média | Devs | Platform
349. OpenAPI spec publish | API | P1 | Médio | Baixa | Devs | Platform
350. GraphQL optional | API | P3 | Baixo | Alta | Devs | Nice

**Total: 350 itens** no backlog master.

---

## Como usar este backlog

1. **Priorizar P0** antes de qualquer P2/P3
2. **Mapear para fase** — ver [ROADMAP.md](./ROADMAP.md) secção 5
3. **Validar pilar** — cada item deve servir Poupar, Reter, Ganhar, Premium, Escalar ou Ecossistema
4. **Não shippar sem métrica** — definir activation metric antes de desenvolver

---

*Derivado do Plano Estratégico TegLion · Julho 2026*
