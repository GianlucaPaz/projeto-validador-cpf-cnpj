// utilidades -----------------------------------------------------------
const onlyDigits = (s) => (s || "").replace(/\D+/g, "");
const pad = (n, len = 2) => String(n).padStart(len, "0");

// máscara dinâmica (CPF/CNPJ)
function maskDoc(value) {
  const v = onlyDigits(value);
  if (v.length <= 11) {
    // CPF: ###.###.###-##
    return v
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
  }
  // CNPJ: ##.###.###/####-##
  return v
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

// validação CPF --------------------------------------------------------
function isValidCPF(doc) {
  const s = onlyDigits(doc);
  if (s.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(s)) return false; // todos iguais

  const calcDigit = (base) => {
    let sum = 0;
    for (let i = 0; i < base.length; i++)
      sum += parseInt(base[i], 10) * (base.length + 1 - i);
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  const d1 = calcDigit(s.slice(0, 9));
  const d2 = calcDigit(s.slice(0, 9) + d1);
  return s.endsWith(`${d1}${d2}`);
}

// validação CNPJ -------------------------------------------------------
function isValidCNPJ(doc) {
  const s = onlyDigits(doc);
  if (s.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(s)) return false;

  const calcDigit = (base) => {
    const weights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < base.length; i++) {
      sum += parseInt(base[i], 10) * weights[weights.length - base.length + i];
    }
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  const d1 = calcDigit(s.slice(0, 12));
  const d2 = calcDigit(s.slice(0, 12) + d1);
  return s.endsWith(`${d1}${d2}`);
}

// geradores ------------------------------------------------------------
function randomDigits(len) {
  return Array.from({ length: len }, () => Math.floor(Math.random() * 10)).join(
    ""
  );
}

function generateCPF() {
  const base = randomDigits(9);
  const calcDigit = (b) => {
    let sum = 0;
    for (let i = 0; i < b.length; i++)
      sum += parseInt(b[i], 10) * (b.length + 1 - i);
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };
  const d1 = calcDigit(base);
  const d2 = calcDigit(base + d1);
  const full = base + d1 + d2;
  return maskDoc(full);
}

function generateCNPJ() {
  // 8 dígitos base + "0001" (filial) = 12; depois calcula dígitos
  const base = randomDigits(8) + "0001";
  const calcDigit = (b) => {
    const weights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < b.length; i++) {
      sum += parseInt(b[i], 10) * weights[weights.length - b.length + i];
    }
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };
  const d1 = calcDigit(base);
  const d2 = calcDigit(base + d1);
  const full = base + d1 + d2;
  return maskDoc(full);
}

// UI -------------------------------------------------------------------
const $ = (sel) => document.querySelector(sel);
$("#year").textContent = new Date().getFullYear();

const input = $("#docInput");
const result = $("#result");

input.addEventListener("input", () => {
  const masked = maskDoc(input.value);
  input.value = masked;
  result.textContent = "Digite um CPF ou CNPJ e clique em Validar.";
  result.className = "muted";
});

$("#btnValidate").addEventListener("click", () => {
  const v = input.value;
  const digits = onlyDigits(v);
  if (digits.length === 11) {
    const ok = isValidCPF(v);
    result.textContent = ok ? "CPF válido ✅" : "CPF inválido ❌";
    result.className = ok ? "success" : "error";
  } else if (digits.length === 14) {
    const ok = isValidCNPJ(v);
    result.textContent = ok ? "CNPJ válido ✅" : "CNPJ inválido ❌";
    result.className = ok ? "success" : "error";
  } else {
    result.textContent = "Quantidade de dígitos inválida.";
    result.className = "error";
  }
});

$("#btnClear").addEventListener("click", () => {
  input.value = "";
  result.textContent =
    "Digite um CPF (###.###.###-##) ou CNPJ (##.###.###/####-##).";
  result.className = "muted";
  input.focus();
});

$("#btnGenCpf").addEventListener("click", () => {
  $("#outCpf").value = generateCPF();
});
$("#btnGenCnpj").addEventListener("click", () => {
  $("#outCnpj").value = generateCNPJ();
});

document.querySelectorAll("button[data-copy]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const target = document.querySelector(btn.getAttribute("data-copy"));
    try {
      await navigator.clipboard.writeText(target.value);
      btn.textContent = "Copiado!";
      setTimeout(() => (btn.textContent = "Copiar"), 1200);
    } catch {
      alert("Não foi possível copiar automaticamente.");
    }
  });
});
