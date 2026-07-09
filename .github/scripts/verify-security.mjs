/**
 * verify-security.mjs
 *
 * Valida configurações de segurança do projeto.
 * Corre em CI (GitHub Actions) para garantir que
 * as proteções não regridem.
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");

let exitCode = 0;

function fail(where, msg) {
  console.error(`  FAIL   ${where}  — ${msg}`);
  exitCode = 1;
}

function pass(where, msg) {
  console.log(`  PASS   ${where}  — ${msg}`);
}

// ============================================================
// 1. proxy.ts — CSP headers
// ============================================================
console.log("\n[ proxy.ts — Content Security Policy ]");

try {
  const proxy = readFileSync(join(ROOT, "src", "proxy.ts"), "utf-8");

  if (proxy.includes('"object-src \'none\'"')) {
    pass("object-src", "object-src 'none' presente");
  } else {
    fail("object-src", "object-src 'none' em falta — permite plugin XSS via <object>/<embed>");
  }

  if (proxy.includes('"frame-ancestors \'none\'"')) {
    pass("frame-ancestors", "frame-ancestors 'none' presente");
  } else {
    fail("frame-ancestors", "frame-ancestors 'none' em falta");
  }

  if (proxy.includes('"base-uri \'self\'"')) {
    pass("base-uri", "base-uri 'self' presente");
  } else {
    fail("base-uri", "base-uri 'self' em falta");
  }

  if (proxy.includes("setSecurityHeaders")) {
    pass("setSecurityHeaders", "função setSecurityHeaders existe");
  } else {
    fail("setSecurityHeaders", "função setSecurityHeaders em falta");
  }

  if (proxy.includes("Strict-Transport-Security")) {
    pass("HSTS", "Strict-Transport-Security presente");
  } else {
    fail("HSTS", "Strict-Transport-Security em falta");
  }

  if (proxy.includes("X-Content-Type-Options")) {
    pass("X-Content-Type-Options", "X-Content-Type-Options presente");
  } else {
    fail("X-Content-Type-Options", "X-Content-Type-Options em falta");
  }
} catch (err) {
  fail("proxy.ts", `Não foi possível ler: ${err.message}`);
}

// ============================================================
// 2. next.config.ts
// ============================================================
console.log("\n[ next.config.ts ]");

try {
  const config = readFileSync(join(ROOT, "next.config.ts"), "utf-8");

  if (config.includes("poweredByHeader: false")) {
    pass("poweredByHeader", "desativado (não revela versão do Next.js)");
  } else {
    fail("poweredByHeader", "não está desativado — vaza info do servidor");
  }

  const bodySizeMatch = config.match(/bodySizeLimit:\s*"(\d+)mb"/);
  if (bodySizeMatch) {
    const mb = parseInt(bodySizeMatch[1], 10);
    if (mb <= 2) {
      pass("bodySizeLimit", `${mb}mb — dentro do limite seguro`);
    } else {
      fail("bodySizeLimit", `${mb}mb — demasiado grande, expõe a DoS por body grande`);
    }
  } else {
    fail("bodySizeLimit", "não definido ou não encontrado");
  }
} catch (err) {
  fail("next.config.ts", `Não foi possível ler: ${err.message}`);
}

// ============================================================
// 3. RLS migrations — check for common gaps
// ============================================================
console.log("\n[ supabase/migrations/ — RLS policies ]");

try {
  const migrationsDir = join(ROOT, "supabase", "migrations");
  if (existsSync(migrationsDir)) {
    const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql"));

    if (files.length === 0) {
      fail("migrations", "Nenhum ficheiro .sql encontrado");
    } else {
      pass("migrations", `${files.length} migrations encontradas`);
    }
  } else {
    fail("migrations", "Diretório supabase/migrations/ não encontrado");
  }
} catch (err) {
  fail("migrations", `Erro: ${err.message}`);
}

// ============================================================
// 4. .env.local — ensure it's gitignored
// ============================================================
console.log("\n[ .env ]");

try {
  const gitignore = readFileSync(join(ROOT, ".gitignore"), "utf-8");
  if (gitignore.includes(".env")) {
    pass(".env", ".env nos ficheiros ignorados pelo git");
  } else {
    fail(".env", ".env NÃO está no .gitignore — risco de expor secrets");
  }
} catch (err) {
  fail(".gitignore", `Não foi possível ler: ${err.message}`);
}

// ============================================================
// 5. create-action.ts — exists
// ============================================================
console.log("\n[ src/lib/create-action.ts ]");

try {
  const helper = readFileSync(join(ROOT, "src", "lib", "create-action.ts"), "utf-8");
  if (helper.includes("defineMutation")) {
    pass("defineMutation", "helper de segurança existe");
  } else {
    fail("defineMutation", "helper não encontrado ou incompleto");
  }
} catch (err) {
  fail("create-action.ts", `Não foi possível ler: ${err.message}`);
}

// ============================================================
// Resultado
// ============================================================
console.log(`\n${exitCode === 0 ? "✓ Todos os checks passaram" : "✗ Alguns checks falharam"}`);
process.exit(exitCode);
