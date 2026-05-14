/**
 * Script para baixar freguesias de Portugal e gerar ficheiro local.
 *
 * Fonte: https://github.com/cft-org/portugal_freguesias_geojson
 * Mapa concelho→distrito: hardcoded (308 concelhos, lista oficial)
 *
 * Como correr:
 *   npx tsx scripts/fetch-freguesias.ts
 */

import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

type Freguesia = {
  nome: string;
  municipio: string;
  distrito: string;
};

const CONCELHO_TO_DISTRITO: Record<string, string> = {
  // Aveiro
  "águeda": "Aveiro", "albergaria-a-velha": "Aveiro", "anadia": "Aveiro",
  "arouca": "Aveiro", "aveiro": "Aveiro", "castelo de paiva": "Aveiro",
  "espinho": "Aveiro", "estarreja": "Aveiro", "ílhavo": "Aveiro",
  "mealhada": "Aveiro", "murtosa": "Aveiro", "oliveira de azeméis": "Aveiro",
  "oliveira do bairro": "Aveiro", "ovar": "Aveiro", "santa maria da feira": "Aveiro",
  "são joão da madeira": "Aveiro", "sever do vouga": "Aveiro", "vagos": "Aveiro",
  "vale de cambra": "Aveiro",

  // Beja
  "aljustrel": "Beja", "almodôvar": "Beja", "alvito": "Beja", "barrancos": "Beja",
  "beja": "Beja", "castro verde": "Beja", "cuba": "Beja", "ferreira do alentejo": "Beja",
  "mértola": "Beja", "moura": "Beja", "odemira": "Beja", "ourique": "Beja",
  "serpa": "Beja", "vidigueira": "Beja",

  // Braga
  "amares": "Braga", "barcelos": "Braga", "braga": "Braga", "cabeceiras de basto": "Braga",
  "celorico de basto": "Braga", "esposende": "Braga", "fafe": "Braga",
  "guimarães": "Braga", "póvoa de lanhoso": "Braga", "terras de bouro": "Braga",
  "vieira do minho": "Braga", "vila nova de famalicão": "Braga", "vila verde": "Braga",
  "vizela": "Braga",

  // Bragança
  "alfândega da fé": "Bragança", "bragança": "Bragança", "carrazeda de ansiães": "Bragança",
  "freixo de espada à cinta": "Bragança", "macedo de cavaleiros": "Bragança",
  "miranda do douro": "Bragança", "mirandela": "Bragança", "mogadouro": "Bragança",
  "torre de moncorvo": "Bragança", "vila flor": "Bragança", "vimioso": "Bragança",
  "vinhais": "Bragança",

  // Castelo Branco
  "belmonte": "Castelo Branco", "castelo branco": "Castelo Branco",
  "covilhã": "Castelo Branco", "fundão": "Castelo Branco",
  "idanha-a-nova": "Castelo Branco", "oleiros": "Castelo Branco",
  "penamacor": "Castelo Branco", "proença-a-nova": "Castelo Branco",
  "sertã": "Castelo Branco", "vila de rei": "Castelo Branco",
  "vila velha de ródão": "Castelo Branco",

  // Coimbra
  "arganil": "Coimbra", "cantanhede": "Coimbra", "coimbra": "Coimbra",
  "condeixa-a-nova": "Coimbra", "figueira da foz": "Coimbra", "góis": "Coimbra",
  "lousã": "Coimbra", "mira": "Coimbra", "miranda do corvo": "Coimbra",
  "montemor-o-velho": "Coimbra", "oliveira do hospital": "Coimbra",
  "pampilhosa da serra": "Coimbra", "penacova": "Coimbra", "penela": "Coimbra",
  "soure": "Coimbra", "tábua": "Coimbra", "vila nova de poiares": "Coimbra",

  // Évora
  "alandroal": "Évora", "arraiolos": "Évora", "borba": "Évora",
  "estremoz": "Évora", "évora": "Évora", "montemor-o-novo": "Évora",
  "mora": "Évora", "mourão": "Évora", "portel": "Évora",
  "redondo": "Évora", "reguengos de monsaraz": "Évora", "vendas novas": "Évora",
  "viana do alentejo": "Évora", "vila viçosa": "Évora",

  // Faro
  "albufeira": "Faro", "alcoutim": "Faro", "aljezur": "Faro",
  "castro marim": "Faro", "faro": "Faro", "lagoa": "Faro", "lagos": "Faro",
  "loulé": "Faro", "monchique": "Faro", "olhão": "Faro", "portimão": "Faro",
  "são brás de alportel": "Faro", "silves": "Faro", "tavira": "Faro",
  "vila do bispo": "Faro", "vila real de santo antónio": "Faro",

  // Guarda
  "aguiar da beira": "Guarda", "almeida": "Guarda", "celorico da beira": "Guarda",
  "figueira de castelo rodrigo": "Guarda", "fornos de algodres": "Guarda",
  "gouveia": "Guarda", "guarda": "Guarda", "manteigas": "Guarda",
  "mêda": "Guarda", "pinhel": "Guarda", "sabugal": "Guarda", "seia": "Guarda",
  "trancoso": "Guarda", "vila nova de foz côa": "Guarda",

  // Leiria
  "alcobaça": "Leiria", "alvaiázere": "Leiria", "ansião": "Leiria",
  "batalha": "Leiria", "bombarral": "Leiria", "caldas da rainha": "Leiria",
  "castanheira de pera": "Leiria", "figueiró dos vinhos": "Leiria",
  "leiria": "Leiria", "marinha grande": "Leiria", "nazaré": "Leiria",
  "óbidos": "Leiria", "pedrógão grande": "Leiria", "peniche": "Leiria",
  "pombal": "Leiria", "porto de mós": "Leiria",

  // Lisboa
  "alenquer": "Lisboa", "amadora": "Lisboa", "arruda dos vinhos": "Lisboa",
  "azambuja": "Lisboa", "cadaval": "Lisboa", "cascais": "Lisboa",
  "lisboa": "Lisboa", "loures": "Lisboa", "lourinhã": "Lisboa", "mafra": "Lisboa",
  "odivelas": "Lisboa", "oeiras": "Lisboa", "sintra": "Lisboa",
  "sobral de monte agraço": "Lisboa", "torres vedras": "Lisboa",
  "vila franca de xira": "Lisboa",

  // Portalegre
  "alter do chão": "Portalegre", "arronches": "Portalegre", "avis": "Portalegre",
  "campo maior": "Portalegre", "castelo de vide": "Portalegre", "crato": "Portalegre",
  "elvas": "Portalegre", "fronteira": "Portalegre", "gavião": "Portalegre",
  "marvão": "Portalegre", "monforte": "Portalegre", "nisa": "Portalegre",
  "ponte de sor": "Portalegre", "portalegre": "Portalegre", "sousel": "Portalegre",

  // Porto
  "amarante": "Porto", "baião": "Porto", "felgueiras": "Porto", "gondomar": "Porto",
  "lousada": "Porto", "maia": "Porto", "marco de canaveses": "Porto",
  "matosinhos": "Porto", "paços de ferreira": "Porto", "paredes": "Porto",
  "penafiel": "Porto", "porto": "Porto", "póvoa de varzim": "Porto",
  "santo tirso": "Porto", "são joão da pesqueira": "Viseu",
  "trofa": "Porto", "valongo": "Porto", "vila do conde": "Porto",
  "vila nova de gaia": "Porto",

  // Santarém
  "abrantes": "Santarém", "alcanena": "Santarém", "almeirim": "Santarém",
  "alpiarça": "Santarém", "benavente": "Santarém", "cartaxo": "Santarém",
  "chamusca": "Santarém", "constância": "Santarém", "coruche": "Santarém",
  "entroncamento": "Santarém", "ferreira do zêzere": "Santarém", "golegã": "Santarém",
  "mação": "Santarém", "ourém": "Santarém", "rio maior": "Santarém",
  "salvaterra de magos": "Santarém", "santarém": "Santarém", "sardoal": "Santarém",
  "tomar": "Santarém", "torres novas": "Santarém",
  "vila nova da barquinha": "Santarém",

  // Setúbal
  "alcácer do sal": "Setúbal", "alcochete": "Setúbal", "almada": "Setúbal",
  "barreiro": "Setúbal", "grândola": "Setúbal", "moita": "Setúbal",
  "montijo": "Setúbal", "palmela": "Setúbal", "santiago do cacém": "Setúbal",
  "seixal": "Setúbal", "sesimbra": "Setúbal", "setúbal": "Setúbal",
  "sines": "Setúbal",

  // Viana do Castelo
  "arcos de valdevez": "Viana do Castelo", "caminha": "Viana do Castelo",
  "melgaço": "Viana do Castelo", "monção": "Viana do Castelo",
  "paredes de coura": "Viana do Castelo", "ponte da barca": "Viana do Castelo",
  "ponte de lima": "Viana do Castelo", "valença": "Viana do Castelo",
  "viana do castelo": "Viana do Castelo", "vila nova de cerveira": "Viana do Castelo",

  // Vila Real
  "alijó": "Vila Real", "boticas": "Vila Real", "chaves": "Vila Real",
  "mesão frio": "Vila Real", "mondim de basto": "Vila Real", "montalegre": "Vila Real",
  "murça": "Vila Real", "peso da régua": "Vila Real", "ribeira de pena": "Vila Real",
  "sabrosa": "Vila Real", "santa marta de penaguião": "Vila Real",
  "valpaços": "Vila Real", "vila pouca de aguiar": "Vila Real", "vila real": "Vila Real",

  // Viseu
  "armamar": "Viseu", "carregal do sal": "Viseu", "castro daire": "Viseu",
  "cinfães": "Viseu", "lamego": "Viseu", "mangualde": "Viseu", "moimenta da beira": "Viseu",
  "mortágua": "Viseu", "nelas": "Viseu", "oliveira de frades": "Viseu",
  "penalva do castelo": "Viseu", "penedono": "Viseu", "resende": "Viseu",
  "santa comba dão": "Viseu", "são pedro do sul": "Viseu", "sátão": "Viseu",
  "sernancelhe": "Viseu", "tabuaço": "Viseu", "tarouca": "Viseu", "tondela": "Viseu",
  "vila nova de paiva": "Viseu", "viseu": "Viseu", "vouzela": "Viseu",

  // Açores
  "angra do heroísmo": "Açores", "calheta": "Madeira",
  "corvo": "Açores", "horta": "Açores", "lagoa (açores)": "Açores",
  "lajes das flores": "Açores", "lajes do pico": "Açores", "madalena": "Açores",
  "nordeste": "Açores", "ponta delgada": "Açores", "povoação": "Açores",
  "praia da vitória": "Açores", "ribeira grande": "Açores",
  "santa cruz da graciosa": "Açores", "santa cruz das flores": "Açores",
  "são roque do pico": "Açores", "velas": "Açores", "vila do porto": "Açores",
  "vila franca do campo": "Açores",

  // Madeira
  "câmara de lobos": "Madeira", "funchal": "Madeira", "machico": "Madeira",
  "ponta do sol": "Madeira", "porto moniz": "Madeira", "porto santo": "Madeira",
  "ribeira brava": "Madeira", "santa cruz": "Madeira", "santana": "Madeira",
  "são vicente": "Madeira",
};

async function main() {
  console.log("[fetch-freguesias] A baixar dados do GitHub...");

  const url = "https://raw.githubusercontent.com/cft-org/portugal_freguesias_geojson/main/concelhos-freguesias.json";
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`GitHub respondeu ${response.status}`);
  }

  const raw = (await response.json()) as Record<string, string[]>;
  console.log(`[fetch-freguesias] Recebidos ${Object.keys(raw).length} concelhos.`);

  const freguesias: Freguesia[] = [];
  const concelhosSemDistrito = new Set<string>();

  for (const [concelhoRaw, freguesiasArr] of Object.entries(raw)) {
    const concelhoKey = concelhoRaw.toLowerCase().trim();
    const distrito = CONCELHO_TO_DISTRITO[concelhoKey];

    if (!distrito) {
      concelhosSemDistrito.add(concelhoRaw);
      continue;
    }

    // Capitalizar concelho (primeira letra de cada palavra)
    const municipio = concelhoRaw
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    for (const nome of freguesiasArr) {
      freguesias.push({
        nome: nome.trim(),
        municipio,
        distrito,
      });
    }
  }

  console.log(`[fetch-freguesias] Processadas: ${freguesias.length} freguesias.`);

  if (concelhosSemDistrito.size > 0) {
    console.warn(`[fetch-freguesias] ⚠️ Concelhos sem distrito mapeado:`, [...concelhosSemDistrito]);
  }

  freguesias.sort((a, b) => a.nome.localeCompare(b.nome, "pt"));

  const fileContent = `// AUTO-GERADO por scripts/fetch-freguesias.ts
// Não editar manualmente. Para actualizar, correr:
//   npx tsx scripts/fetch-freguesias.ts
//
// Fonte: https://github.com/cft-org/portugal_freguesias_geojson
// Última actualização: ${new Date().toISOString()}
// Total: ${freguesias.length} freguesias

export type FreguesiaPT = {
  nome: string;
  municipio: string;
  distrito: string;
};

export const FREGUESIAS_PT: FreguesiaPT[] = ${JSON.stringify(freguesias, null, 2)};

/**
 * Formato: "Esmoriz, Aveiro, Portugal"
 */
export function formatFreguesia(f: FreguesiaPT): string {
  return \`\${f.nome}, \${f.distrito}, Portugal\`;
}
`;

  const outputPath = join("src", "lib", "data", "freguesias-pt.ts");
  const outputDir = dirname(outputPath);

  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true });
  }

  await writeFile(outputPath, fileContent, "utf-8");

  console.log(`[fetch-freguesias] ✅ Ficheiro gerado: ${outputPath}`);
}

main().catch((err) => {
  console.error("[fetch-freguesias] ❌ Erro:", err);
  process.exit(1);
});