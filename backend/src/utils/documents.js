function digitsOnly(input) {
  return String(input ?? '').replace(/\D+/g, '');
}

// CPF (Brasil): 11 dígitos, 2 dígitos verificadores.
function isValidCPF(input) {
  const cpf = digitsOnly(input);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const calc = (len) => {
    let sum = 0;
    for (let i = 0; i < len; i++) {
      sum += Number(cpf[i]) * (len + 1 - i);
    }
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  const d1 = calc(9);
  const d2 = calc(10);
  return d1 === Number(cpf[9]) && d2 === Number(cpf[10]);
}

// NIF (Portugal): 9 dígitos, checksum por módulo 11.
function isValidNIF(input) {
  const nif = digitsOnly(input);
  if (nif.length !== 9) return false;
  if (/^(\d)\1{8}$/.test(nif)) return false;

  // Primeiros dígitos válidos mais comuns: 1,2,3,5,6,8,9 (pessoas/entidades)
  // Não travamos aqui para evitar falso-negativo em casos especiais; só checksum.
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += Number(nif[i]) * (9 - i);
  }
  const mod = sum % 11;
  const check = mod < 2 ? 0 : 11 - mod;
  return check === Number(nif[8]);
}

// CNPJ (Brasil): 14 dígitos, 2 dígitos verificadores.
function isValidCNPJ(input) {
  const cnpj = digitsOnly(input);
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  const calc = (base, weights) => {
    let sum = 0;
    for (let i = 0; i < weights.length; i++) {
      sum += Number(base[i]) * weights[i];
    }
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  const base12 = cnpj.slice(0, 12);
  const d1 = calc(base12, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const base13 = cnpj.slice(0, 13);
  const d2 = calc(base13, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

  return d1 === Number(cnpj[12]) && d2 === Number(cnpj[13]);
}

function isValidPostalCode(country, postalCode) {
  if (!postalCode) return true;
  const raw = String(postalCode).trim();
  if (!raw) return true;

  const c = String(country || '').toUpperCase();
  if (c === 'BR') return /^\d{5}-?\d{3}$/.test(raw);
  if (c === 'PT') return /^\d{4}-?\d{3}$/.test(raw);
  if (c === 'ES') return /^\d{5}$/.test(raw);
  if (c === 'US' || c === 'EN-US') return /^\d{5}(-?\d{4})?$/.test(raw);
  // Se país não estiver definido, não bloqueia.
  return true;
}

module.exports = {
  digitsOnly,
  isValidCPF,
  isValidNIF,
  isValidCNPJ,
  isValidPostalCode,
};
