const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');

const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const firmUsersRepository = require('../../db/supabase/repositories/firm-users.repository');
const firmPublicSitesRepository = require('../../db/supabase/repositories/firm-public-sites.repository');
const accountingServicesRepository = require('../../db/supabase/repositories/accounting-services.repository');
const contabilStorage = require('../../services/storage/contabil-storage.service');
const firmPublicSiteService = require('./firm-public-site.service');

const OWNER = { id: 'user-1', firm_id: 'firm-1', role: 'FIRM_OWNER' };
const STAFF = { id: 'user-2', firm_id: 'firm-1', role: 'FIRM_STAFF' };

function resetMocks() {
  mock.restoreAll();
}

test('normalizeSiteConfig: sem input usa as secções por omissão, na ordem esperada', () => {
  const config = firmPublicSiteService.normalizeSiteConfig(null);
  assert.equal(config.schemaVersion, 1);
  assert.deepEqual(
    config.sections.map((s) => s.type),
    ['header', 'hero', 'about', 'services', 'bookingServices', 'features', 'process', 'faq', 'contact', 'footer'],
  );
  assert.ok(config.sections.every((s) => s.key), 'toda secção tem um key estável');
});

test('normalizeSiteConfig: descarta secções com type desconhecido, preserva as válidas', () => {
  const config = firmPublicSiteService.normalizeSiteConfig({
    sections: [
      { key: 'sec_a', type: 'hero', enabled: true, order: 0, content: { tagline: 'Olá' } },
      { key: 'sec_b', type: 'nao-existe', enabled: true, order: 1, content: {} },
    ],
  });
  assert.equal(config.sections.length, 1);
  assert.equal(config.sections[0].type, 'hero');
  assert.equal(config.sections[0].content.tagline, 'Olá');
});

test('normalizeSiteConfig: aceita cores de fundo, cartão e texto secundário', () => {
  const config = firmPublicSiteService.normalizeSiteConfig({
    theme: {
      primaryColor: '#12352a',
      backgroundColor: '#f5f0e8',
      surfaceColor: '#ffffff',
      mutedTextColor: '#667788',
    },
  });
  assert.equal(config.theme.primaryColor, '#12352a');
  assert.equal(config.theme.backgroundColor, '#f5f0e8');
  assert.equal(config.theme.surfaceColor, '#ffffff');
  assert.equal(config.theme.mutedTextColor, '#667788');
});

test('normalizeSiteConfig: rejeita cor hex inválida', () => {
  assert.throws(
    () => firmPublicSiteService.normalizeSiteConfig({ theme: { primaryColor: 'not-a-color' } }),
    (err) => {
      assert.equal(err.statusCode, 400);
      return true;
    },
  );
});

test('normalizeSiteConfig: redes sociais — handle e WhatsApp só com número', () => {
  const config = firmPublicSiteService.normalizeSiteConfig({
    socialLinks: {
      instagram: 'meu_escritorio',
      facebook: '@pagina',
      linkedin: 'empresa-x',
      whatsapp: '351 912 345 678',
      website: 'www.exemplo.pt',
    },
  });
  assert.equal(config.socialLinks.instagram, 'https://instagram.com/meu_escritorio');
  assert.equal(config.socialLinks.facebook, 'https://facebook.com/pagina');
  assert.equal(config.socialLinks.linkedin, 'https://linkedin.com/company/empresa-x');
  assert.equal(config.socialLinks.whatsapp, 'https://wa.me/351912345678');
  assert.equal(config.socialLinks.website, 'https://www.exemplo.pt');
});

test('normalizeSiteConfig: cores por secção e por botão', () => {
  const config = firmPublicSiteService.normalizeSiteConfig({
    sections: [
      {
        type: 'hero',
        content: {
          tagline: 'Olá',
          bio: '',
          backgroundColor: '#112233',
          titleColor: '#aabbcc',
          taglineColor: '#ddeeff',
          ctas: [
            {
              label: 'Contactar',
              style: 'primary',
              backgroundColor: '#ff5500',
              textColor: '#ffffff',
              target: { type: 'booking' },
            },
          ],
        },
      },
      {
        type: 'header',
        content: { backgroundColor: '#010101', textColor: '#fefefe' },
      },
    ],
  });
  const hero = config.sections.find((s) => s.type === 'hero');
  const header = config.sections.find((s) => s.type === 'header');
  assert.equal(hero.content.backgroundColor, '#112233');
  assert.equal(hero.content.titleColor, '#aabbcc');
  assert.equal(hero.content.taglineColor, '#ddeeff');
  assert.equal(hero.content.ctas[0].backgroundColor, '#ff5500');
  assert.equal(hero.content.ctas[0].textColor, '#ffffff');
  assert.equal(header.content.backgroundColor, '#010101');
  assert.equal(header.content.textColor, '#fefefe');
});

test('normalizeSiteConfig: hero imageFit ausente cai em cover; contain e foco são aceites', () => {
  const legacy = firmPublicSiteService.normalizeSiteConfig({
    sections: [{ type: 'hero', content: { tagline: 'Olá', bio: '' } }],
  });
  const heroLegacy = legacy.sections.find((s) => s.type === 'hero');
  assert.equal(heroLegacy.content.imageFit, 'cover');
  assert.equal(heroLegacy.content.imagePosition, 'center');

  const configured = firmPublicSiteService.normalizeSiteConfig({
    sections: [
      {
        type: 'hero',
        content: {
          tagline: 'Olá',
          bio: '',
          imageFit: 'contain',
          imagePosition: 'top',
        },
      },
    ],
  });
  const hero = configured.sections.find((s) => s.type === 'hero');
  assert.equal(hero.content.imageFit, 'contain');
  assert.equal(hero.content.imagePosition, 'top');

  const invalid = firmPublicSiteService.normalizeSiteConfig({
    sections: [{ type: 'hero', content: { tagline: 'Olá', imageFit: 'stretch', imagePosition: 'left' } }],
  });
  const heroInvalid = invalid.sections.find((s) => s.type === 'hero');
  assert.equal(heroInvalid.content.imageFit, 'cover');
  assert.equal(heroInvalid.content.imagePosition, 'center');
});

test('normalizeSiteConfig: header.title e hero.title são independentes e truncados', () => {
  const config = firmPublicSiteService.normalizeSiteConfig({
    sections: [
      {
        type: 'header',
        content: { title: '  Maya Contabilidade  ' },
      },
      {
        type: 'hero',
        content: {
          title: 'Contabilidade clara para o seu negócio',
          tagline: 'Frase',
          bio: '',
        },
      },
    ],
  });
  const header = config.sections.find((s) => s.type === 'header');
  const hero = config.sections.find((s) => s.type === 'hero');
  assert.equal(header.content.title, 'Maya Contabilidade');
  assert.equal(hero.content.title, 'Contabilidade clara para o seu negócio');
  assert.notEqual(header.content.title, hero.content.title);
  assert.equal(hero.content.tagline, 'Frase');
  assert.equal(Object.prototype.hasOwnProperty.call(header.content, 'title'), true);
  assert.equal(Object.prototype.hasOwnProperty.call(config.sections.find((s) => s.type === 'footer')?.content || {}, 'title'), false);
});

test('normalizeSiteConfig: header nav links default to visible and can be turned off', () => {
  const defaults = firmPublicSiteService.normalizeSiteConfig({
    sections: [{ type: 'header', content: { title: 'AfDigital' } }],
  });
  const header = defaults.sections.find((s) => s.type === 'header');
  assert.equal(header.content.showNav, true);
  assert.equal(header.content.showServicesLink, true);
  assert.equal(header.content.showAreasMenu, true);
  assert.equal(header.content.showContactLink, true);

  const off = firmPublicSiteService.normalizeSiteConfig({
    sections: [
      {
        type: 'header',
        content: {
          title: 'AfDigital',
          showNav: true,
          showServicesLink: false,
          showAreasMenu: false,
          showContactLink: true,
        },
      },
    ],
  });
  const headerOff = off.sections.find((s) => s.type === 'header');
  assert.equal(headerOff.content.showServicesLink, false);
  assert.equal(headerOff.content.showAreasMenu, false);
  assert.equal(headerOff.content.showContactLink, true);
  assert.equal(header.content.navLinks.length, 3);
  assert.equal(header.content.navLinks[0].label, 'Serviços');
});

test('normalizeSiteConfig: header navLinks aceitam texto, âncora, serviço e https', () => {
  const config = firmPublicSiteService.normalizeSiteConfig({
    sections: [
      {
        type: 'header',
        content: {
          navLinks: [
            { id: 'a', label: '  O que fazemos  ', enabled: true, kind: 'section', sectionId: 'sobre' },
            { id: 'b', label: 'IRS', enabled: true, kind: 'service', serviceId: 'irs-modelo-3' },
            { id: 'c', label: 'Site', enabled: true, kind: 'external', url: 'https://afdigital.example/' },
            { id: 'd', label: 'Mau', enabled: true, kind: 'external', url: 'http://inseguro.example/' },
            { id: 'e', label: '', enabled: true, kind: 'section', sectionId: 'faq' },
          ],
        },
      },
    ],
  });
  const header = config.sections.find((s) => s.type === 'header');
  assert.equal(header.content.navLinks.length, 4);
  assert.equal(header.content.navLinks[0].label, 'O que fazemos');
  assert.equal(header.content.navLinks[0].sectionId, 'sobre');
  assert.equal(header.content.navLinks[1].kind, 'service');
  assert.equal(header.content.navLinks[2].url, 'https://afdigital.example/');
  assert.equal(header.content.navLinks[3].kind, 'external');
  assert.equal(header.content.navLinks[3].url, undefined);
});

test('normalizeSiteConfig: faq filtra entradas sem pergunta ou sem resposta', () => {
  const config = firmPublicSiteService.normalizeSiteConfig({
    sections: [
      {
        type: 'faq',
        content: {
          items: [
            { question: 'Como funciona?', answer: 'Assim.' },
            { question: '', answer: 'Sem pergunta' },
            { question: 'Sem resposta', answer: '' },
          ],
        },
      },
    ],
  });
  assert.equal(config.sections[0].content.items.length, 1);
});

test('normalizeSiteConfig: cta com type desconhecido é descartado', () => {
  const config = firmPublicSiteService.normalizeSiteConfig({
    sections: [
      {
        type: 'hero',
        content: {
          ctas: [
            { label: 'Agendar', target: { type: 'booking' } },
            { label: 'Malicioso', target: { type: 'javascript-alert' } },
          ],
        },
      },
    ],
  });
  const ctas = config.sections[0].content.ctas;
  assert.equal(ctas.length, 1);
  assert.equal(ctas[0].target.type, 'booking');
});

test('normalizeSiteConfig: external-url só aceita https, http:// fica sem url mas mantém a CTA', () => {
  const config = firmPublicSiteService.normalizeSiteConfig({
    sections: [
      {
        type: 'hero',
        content: {
          ctas: [
            { label: 'Site inseguro', target: { type: 'external-url', url: 'http://sem-https.com' } },
            { label: 'Site seguro', target: { type: 'external-url', url: 'https://com-https.com' } },
          ],
        },
      },
    ],
  });
  const ctas = config.sections[0].content.ctas;
  assert.equal(ctas.length, 2);
  assert.equal(ctas[0].target.url, undefined, 'url http:// nunca deve ser aceite');
  assert.equal(ctas[1].target.url, 'https://com-https.com');
});

test('normalizeSiteConfig: secção hero limita a 3 CTAs mesmo que o payload traga mais', () => {
  const config = firmPublicSiteService.normalizeSiteConfig({
    sections: [
      {
        type: 'hero',
        content: {
          ctas: Array.from({ length: 5 }, (_, i) => ({ label: `CTA ${i}`, target: { type: 'booking' } })),
        },
      },
    ],
  });
  assert.equal(config.sections[0].content.ctas.length, 3);
});

test('buildConfigFromLegacySettings: traduz tagline/bio/faqs/socialLinks/cores do formato antigo', () => {
  const firm = {
    settings: {
      publicProfile: {
        tagline: 'Contabilidade sem stress',
        bio: 'Trabalhamos com PMEs.',
        faqs: [{ id: 'faq_1', question: 'Q1', answer: 'A1' }],
        socialLinks: { instagram: 'https://instagram.com/x', whatsapp: null },
      },
      branding: { primaryColor: '#112233', secondaryColor: '#445566', logoStorageKey: 'firm/x/branding/logo.png' },
    },
  };

  const config = firmPublicSiteService.buildConfigFromLegacySettings(firm);

  const hero = config.sections.find((s) => s.type === 'hero');
  assert.equal(hero.content.tagline, 'Contabilidade sem stress');
  assert.equal(hero.content.bio, 'Trabalhamos com PMEs.');
  const faq = config.sections.find((s) => s.type === 'faq');
  assert.equal(faq.content.items.length, 1);
  assert.equal(faq.content.items[0].question, 'Q1');
  assert.equal(config.theme.primaryColor, '#112233');
  assert.equal(config.theme.secondaryColor, '#445566');
  assert.equal(config.socialLinks.instagram, 'https://instagram.com/x');
  assert.equal(config.socialLinks.whatsapp, null);
});

test('buildConfigFromLegacySettings: escritório sem nenhuma configuração antiga não rebenta, devolve secções vazias válidas', () => {
  const config = firmPublicSiteService.buildConfigFromLegacySettings({ settings: {} });
  assert.equal(config.sections.find((s) => s.type === 'hero').content.tagline, '');
  assert.equal(config.sections.find((s) => s.type === 'faq').content.items.length, 0);
});

test('getSite: devolve a linha existente (imagens resolvidas à parte) quando já há firm_public_sites', async () => {
  resetMocks();
  const stored = { firmId: 'firm-1', draft: { schemaVersion: 1 }, published: null };
  mock.method(firmPublicSitesRepository, 'findByFirmId', async () => stored);

  const result = await firmPublicSiteService.getSite('firm-1');
  assert.equal(result.firmId, 'firm-1');
  assert.equal(result.draft.schemaVersion, 1);
  assert.equal(result.published, null);
});

test('getSite: sem linha ainda, cai para a tradução do settings legado (nunca uma página em branco)', async () => {
  resetMocks();
  mock.method(firmPublicSitesRepository, 'findByFirmId', async () => null);
  mock.method(firmsRepository, 'findFirmById', async () => ({
    id: 'firm-1',
    settings: { publicProfile: { tagline: 'Legado' } },
  }));

  const result = await firmPublicSiteService.getSite('firm-1');
  assert.equal(result.published, null);
  assert.equal(result.draft.sections.find((s) => s.type === 'hero').content.tagline, 'Legado');
});

test('saveDraft: rejeita quem não é FIRM_OWNER', async () => {
  resetMocks();
  mock.method(firmUsersRepository, 'findFirmUserById', async () => STAFF);

  await assert.rejects(
    () => firmPublicSiteService.saveDraft('firm-1', 'user-2', {}),
    (err) => {
      assert.equal(err.statusCode, 403);
      return true;
    },
  );
});

test('saveDraft: normaliza o config e grava via repository', async () => {
  resetMocks();
  mock.method(firmUsersRepository, 'findFirmUserById', async () => OWNER);
  mock.method(accountingServicesRepository, 'listByFirm', async () => []);
  let savedConfig = null;
  mock.method(firmPublicSitesRepository, 'upsertDraft', async (firmId, config) => {
    savedConfig = config;
    return { draft: config, draftUpdatedAt: '2026-08-11T00:00:00Z' };
  });

  const result = await firmPublicSiteService.saveDraft('firm-1', 'user-1', {
    sections: [{ type: 'hero', content: { tagline: 'Novo slogan' } }],
  });

  assert.equal(savedConfig.sections.find((s) => s.type === 'hero').content.tagline, 'Novo slogan');
  assert.equal(result.draftUpdatedAt, '2026-08-11T00:00:00Z');
});

test('saveDraft: descarta CTA de serviço de outro tenant antes de gravar', async () => {
  resetMocks();
  mock.method(firmUsersRepository, 'findFirmUserById', async () => OWNER);
  mock.method(accountingServicesRepository, 'listByFirm', async () => [
    { id: 'svc-own', slug: 'irs-2026' },
  ]);
  let savedConfig = null;
  mock.method(firmPublicSitesRepository, 'upsertDraft', async (_firmId, config) => {
    savedConfig = config;
    return { draft: config, draftUpdatedAt: '2026-08-17T00:00:00Z' };
  });

  await firmPublicSiteService.saveDraft('firm-1', 'user-1', {
    sections: [
      {
        type: 'about',
        content: {
          heading: 'Sobre',
          ctas: [
            { label: 'Nosso', target: { type: 'service-detail', serviceId: 'irs-2026' } },
            { label: 'Alheio', target: { type: 'service-detail', serviceId: 'slug-de-outro' } },
            { label: 'Ligar', target: { type: 'phone', phone: '+351 912 345 678' } },
          ],
        },
      },
    ],
  });

  const ctas = savedConfig.sections.find((s) => s.type === 'about').content.ctas;
  assert.deepEqual(
    ctas.map((c) => c.label),
    ['Nosso', 'Ligar'],
  );
});

test('publishSite: rejeita quem não é FIRM_OWNER', async () => {
  resetMocks();
  mock.method(firmUsersRepository, 'findFirmUserById', async () => STAFF);

  await assert.rejects(
    () => firmPublicSiteService.publishSite('firm-1', 'user-2'),
    (err) => {
      assert.equal(err.statusCode, 403);
      return true;
    },
  );
});

test('publishSite: sem nenhum rascunho gravado ainda, rejeita com 400', async () => {
  resetMocks();
  mock.method(firmUsersRepository, 'findFirmUserById', async () => OWNER);
  mock.method(firmPublicSitesRepository, 'publish', async () => null);

  await assert.rejects(
    () => firmPublicSiteService.publishSite('firm-1', 'user-1'),
    (err) => {
      assert.equal(err.statusCode, 400);
      return true;
    },
  );
});

test('publishSite: copia draft para published e espelha a cor para firm.settings.branding', async () => {
  resetMocks();
  mock.method(firmUsersRepository, 'findFirmUserById', async () => OWNER);
  mock.method(firmPublicSitesRepository, 'publish', async () => ({
    published: { theme: { primaryColor: '#abcdef', secondaryColor: null } },
    publishedAt: '2026-08-11T00:00:00Z',
  }));
  let brandingPatch = null;
  mock.method(firmsRepository, 'updateFirmBranding', async (firmId, patch) => {
    brandingPatch = patch;
    return { settings: { branding: patch } };
  });

  const result = await firmPublicSiteService.publishSite('firm-1', 'user-1');

  assert.equal(brandingPatch.primaryColor, '#abcdef');
  assert.equal(brandingPatch.secondaryColor, null);
  assert.equal(result.publishedAt, '2026-08-11T00:00:00Z');
});

test('regeneratePreviewToken: rejeita quem não é FIRM_OWNER', async () => {
  resetMocks();
  mock.method(firmUsersRepository, 'findFirmUserById', async () => STAFF);

  await assert.rejects(
    () => firmPublicSiteService.regeneratePreviewToken('firm-1', 'user-2'),
    (err) => {
      assert.equal(err.statusCode, 403);
      return true;
    },
  );
});

test('isPreviewTokenValid: token errado ou ausente nunca é válido', () => {
  const site = {
    previewToken: 'abc123',
    previewTokenExpiresAt: new Date(Date.now() + 60_000).toISOString(),
  };
  assert.equal(firmPublicSiteService.isPreviewTokenValid(site, 'errado'), false);
  assert.equal(firmPublicSiteService.isPreviewTokenValid(site, null), false);
  assert.equal(firmPublicSiteService.isPreviewTokenValid(site, undefined), false);
  assert.equal(firmPublicSiteService.isPreviewTokenValid(null, 'abc123'), false, 'sem site (nunca configurado) nunca é válido');
});

test('isPreviewTokenValid: token certo mas expirado não é válido — nunca serve draft a um link antigo', () => {
  const site = {
    previewToken: 'abc123',
    previewTokenExpiresAt: new Date(Date.now() - 60_000).toISOString(),
  };
  assert.equal(firmPublicSiteService.isPreviewTokenValid(site, 'abc123'), false);
});

test('isPreviewTokenValid: token certo e ainda dentro da validade é válido', () => {
  const site = {
    previewToken: 'abc123',
    previewTokenExpiresAt: new Date(Date.now() + 60_000).toISOString(),
  };
  assert.equal(firmPublicSiteService.isPreviewTokenValid(site, 'abc123'), true);
});

test('regeneratePreviewToken: gera um token com validade de ~24h', async () => {
  resetMocks();
  mock.method(firmUsersRepository, 'findFirmUserById', async () => OWNER);
  let savedToken = null;
  let savedExpiry = null;
  mock.method(firmPublicSitesRepository, 'setPreviewToken', async (firmId, token, expiresAt) => {
    savedToken = token;
    savedExpiry = expiresAt;
    return { previewToken: token, previewTokenExpiresAt: expiresAt };
  });

  const result = await firmPublicSiteService.regeneratePreviewToken('firm-1', 'user-1');

  assert.equal(result.previewToken, savedToken);
  assert.ok(savedToken.length >= 32, 'token deve ter entropia suficiente');
  const hoursUntilExpiry = (new Date(savedExpiry).getTime() - Date.now()) / (60 * 60 * 1000);
  assert.ok(hoursUntilExpiry > 23 && hoursUntilExpiry <= 24, 'expiração deve rondar as 24h');
});

test('uploadImage: rejeita quem não é FIRM_OWNER', async () => {
  resetMocks();
  mock.method(firmUsersRepository, 'findFirmUserById', async () => STAFF);

  await assert.rejects(
    () => firmPublicSiteService.uploadImage('firm-1', 'user-2', { slot: 'hero', file: {} }),
    (err) => {
      assert.equal(err.statusCode, 403);
      return true;
    },
  );
});

test('uploadImage: escreve no storage, devolve um url assinado e cai para o slot "hero" quando desconhecido', async () => {
  resetMocks();
  mock.method(firmUsersRepository, 'findFirmUserById', async () => OWNER);
  let uploadedSlot = null;
  mock.method(contabilStorage, 'uploadPublicSiteImage', async ({ slot }) => {
    uploadedSlot = slot;
    return { bucket: 'contabil-documents', path: 'firm/firm-1/public-site/hero/123-foto.jpg', provider: 'supabase' };
  });
  mock.method(contabilStorage, 'createSignedDownloadUrl', async (path) => `https://signed/${path}`);

  const result = await firmPublicSiteService.uploadImage('firm-1', 'user-1', { slot: 'nao-existe', file: { buffer: Buffer.from('x') } });

  assert.equal(uploadedSlot, 'hero');
  assert.equal(result.storageKey, 'firm/firm-1/public-site/hero/123-foto.jpg');
  assert.equal(result.url, 'https://signed/firm/firm-1/public-site/hero/123-foto.jpg');
  assert.ok(result.id, 'imagem devolvida deve ter um id estável');
});

test('getSite: resolve URLs assinadas para cada imagem do draft e do published', async () => {
  resetMocks();
  const stored = {
    firmId: 'firm-1',
    draft: { images: { hero: [{ id: 'img_1', storageKey: 'firm/firm-1/public-site/hero/a.jpg', alt: '' }], institutional: [] } },
    published: { images: { hero: [], institutional: [{ id: 'img_2', storageKey: 'firm/firm-1/public-site/institutional/b.jpg', alt: '' }] } },
  };
  mock.method(firmPublicSitesRepository, 'findByFirmId', async () => stored);
  mock.method(contabilStorage, 'createSignedDownloadUrl', async (path) => `https://signed/${path}`);

  const result = await firmPublicSiteService.getSite('firm-1');

  assert.equal(result.draft.images.hero[0].url, 'https://signed/firm/firm-1/public-site/hero/a.jpg');
  assert.equal(result.published.images.institutional[0].url, 'https://signed/firm/firm-1/public-site/institutional/b.jpg');
});

test('getSite: uma imagem cujo ficheiro já não existe no storage não rebenta a leitura — só essa fica com url null', async () => {
  resetMocks();
  const stored = {
    firmId: 'firm-1',
    draft: { images: { hero: [{ id: 'img_1', storageKey: 'firm/firm-1/public-site/hero/apagada.jpg', alt: '' }], institutional: [] } },
    published: null,
  };
  mock.method(firmPublicSitesRepository, 'findByFirmId', async () => stored);
  mock.method(contabilStorage, 'createSignedDownloadUrl', async () => {
    throw new Error('objecto não encontrado');
  });

  const result = await firmPublicSiteService.getSite('firm-1');

  assert.equal(result.draft.images.hero[0].url, null);
  assert.equal(result.draft.images.hero[0].id, 'img_1', 'o resto da referência da imagem mantém-se intacto');
});

test('normalizeSiteConfig: aceita CTA phone e ignora número inválido', () => {
  const config = firmPublicSiteService.normalizeSiteConfig({
    sections: [
      {
        type: 'contact',
        content: {
          ctas: [
            { label: 'Ligar agora', target: { type: 'phone', phone: '+351 912 345 678' } },
            { label: 'Inválido', target: { type: 'phone', phone: '12' } },
          ],
        },
      },
    ],
  });
  const ctas = config.sections.find((s) => s.type === 'contact').content.ctas;
  assert.equal(ctas.length, 2);
  assert.equal(ctas[0].target.type, 'phone');
  assert.equal(ctas[0].target.phone, '+351 912 345 678');
  assert.equal(ctas[1].target.phone, undefined);
});

test('normalizeSiteConfig: about/services guardam ctas; páginas antigas ficam com lista vazia', () => {
  const legacy = firmPublicSiteService.normalizeSiteConfig({
    sections: [{ type: 'about', content: { heading: 'Sobre', body: 'Texto' } }],
  });
  assert.deepEqual(legacy.sections[0].content.ctas, []);

  const withCta = firmPublicSiteService.normalizeSiteConfig({
    sections: [
      {
        type: 'services',
        content: {
          heading: 'Consultoria Fiscal',
          ctas: [{ label: 'Agendar', target: { type: 'service-detail', serviceId: 'consultoria-2026' } }],
        },
      },
    ],
  });
  assert.equal(withCta.sections[0].content.ctas[0].target.serviceId, 'consultoria-2026');
});

test('sanitizeSiteCtasForFirm: descarta serviço de outro escritório e reescreve UUID para slug', () => {
  const config = firmPublicSiteService.normalizeSiteConfig({
    sections: [
      {
        type: 'hero',
        content: {
          ctas: [
            { label: 'Nosso', target: { type: 'service-detail', serviceId: 'irs-2026' } },
            { label: 'Alheio', target: { type: 'service-detail', serviceId: 'slug-de-outro' } },
            { label: 'Por id', target: { type: 'service-detail', serviceId: 'svc-uuid' } },
          ],
        },
      },
      {
        type: 'about',
        content: {
          heading: 'Sobre',
          ctas: [{ label: 'Ver lista', target: { type: 'booking' } }],
        },
      },
    ],
  });
  const sanitized = firmPublicSiteService.sanitizeSiteCtasForFirm(config, [
    { id: 'svc-uuid', slug: 'consultoria-iva' },
    { id: 'other', slug: 'irs-2026' },
  ]);
  const heroCtas = sanitized.sections.find((s) => s.type === 'hero').content.ctas;
  const aboutCtas = sanitized.sections.find((s) => s.type === 'about').content.ctas;
  assert.deepEqual(
    heroCtas.map((c) => c.target.serviceId),
    ['irs-2026', 'consultoria-iva'],
  );
  assert.equal(aboutCtas[0].target.type, 'booking');
});

test('filterPublicCtas: esconde serviço despublicado e mantém booking genérico', () => {
  const sections = [
    {
      type: 'hero',
      content: {
        ctas: [
          { label: 'Público', target: { type: 'service-detail', serviceId: 'irs-2026' } },
          { label: 'Privado', target: { type: 'service-detail', serviceId: 'interno' } },
          { label: 'Agenda', target: { type: 'booking' } },
        ],
      },
    },
  ];
  const filtered = firmPublicSiteService.filterPublicCtas(sections, ['irs-2026']);
  assert.deepEqual(
    filtered[0].content.ctas.map((c) => c.label),
    ['Público', 'Agenda'],
  );
});
