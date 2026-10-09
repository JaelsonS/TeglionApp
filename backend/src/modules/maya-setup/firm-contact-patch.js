/**
 * Preenche rodapé/contacto da página a partir de firm.settings.contact (sem expor na OpenAI).
 */
function trimContact(value, max = 200) {
  if (value == null) return null;
  const s = String(value).trim();
  return s ? s.slice(0, max) : null;
}

function mergeFirmContactIntoDraft(draft, firm) {
  if (!draft || typeof draft !== 'object' || !firm) return draft;
  const contact = firm.settings?.contact || {};
  const email = trimContact(contact.email, 120);
  const phone = trimContact(contact.phone, 40);
  const address = trimContact(contact.address, 300);
  if (!email && !phone && !address) return draft;

  const base = JSON.parse(JSON.stringify(draft));
  if (!Array.isArray(base.sections)) return base;

  base.sections = base.sections.map((sec) => {
    if (sec.type === 'footer' && sec.content && typeof sec.content === 'object') {
      return {
        ...sec,
        content: {
          ...sec.content,
          ...(email ? { email } : {}),
          ...(phone ? { phone } : {}),
          ...(address ? { address } : {}),
        },
      };
    }
    if (sec.type === 'contact' && sec.content && typeof sec.content === 'object') {
      return {
        ...sec,
        content: {
          ...sec.content,
          showEmail: email ? true : sec.content.showEmail !== false,
          showPhone: phone ? true : sec.content.showPhone !== false,
          showAddress: address ? true : sec.content.showAddress !== false,
        },
      };
    }
    return sec;
  });

  return base;
}

function sanitizeContactForAiContext(firm) {
  const contact = firm?.settings?.contact || {};
  return {
    hasEmail: Boolean(trimContact(contact.email)),
    hasPhone: Boolean(trimContact(contact.phone)),
    hasAddress: Boolean(trimContact(contact.address)),
  };
}

module.exports = { mergeFirmContactIntoDraft, sanitizeContactForAiContext };
