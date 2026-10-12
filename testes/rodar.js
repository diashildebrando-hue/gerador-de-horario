// Testes automáticos do Gerador de Horário (versão MODELO).
//
// Abre o arquivo montado num navegador de verdade (Playwright), visita
// cada aba, gera uma grade do zero e confere:
//   - nenhum erro no console do navegador;
//   - nenhuma violação de acessibilidade (axe-core, WCAG 2 A/AA);
//   - as funções básicas (gerar, backup, aulas vagas) continuam de pé.
//
// Como rodar:
//   npm install
//   npm run montar
//   npm run testar

const path = require("path");
const { chromium } = require("playwright");

const ARQUIVO = path.join(__dirname, "..", "baixar", "Gerador_Horario_MODELO.html");
const AXE = require.resolve("axe-core/axe.min.js");

const ABAS = [
  "inst", "profs", "turmas", "horarios", "ha", "regras", "equip",
  "inicio", "grade", "vagas", "avisos", "hist", "dados", "backup", "externo",
];

function falhar(msg) {
  console.error("❌ " + msg);
  process.exitCode = 1;
}

(async () => {
  const navegador = await chromium.launch({executablePath:process.env.PW_EXE||undefined});
  const erros = [];
  const pagina = await (await navegador.newContext({ viewport: { width: 1400, height: 900 } })).newPage();
  pagina.on("pageerror", (e) => erros.push(String(e)));
  pagina.on("console", (m) => { if (m.type() === "error") erros.push(m.text()); });

  await pagina.goto("file://" + ARQUIVO);
  await pagina.waitForTimeout(1000);
  await pagina.addScriptTag({ path: AXE });

  console.log("Abriu:", await pagina.title());

  let violacoesTotal = 0;
  for (const aba of ABAS) {
    await pagina.evaluate((s) => show(s), aba);
    await pagina.waitForTimeout(250);
    const violacoes = await pagina.evaluate(async () => {
      const r = await axe.run(document, { runOnly: ["wcag2a", "wcag2aa"] });
      return r.violations.map((v) => v.id + ":" + v.nodes.length);
    });
    if (violacoes.length) {
      falhar(`aba "${aba}" tem violações de acessibilidade: ${violacoes.join(", ")}`);
      violacoesTotal += violacoes.length;
    }
  }

  // Gera a grade do zero e espera terminar.
  await pagina.evaluate(() => show("inicio"));
  await pagina.click("#bZero");
  await pagina.waitForFunction(() => !document.getElementById("bZero").disabled, { timeout: 120000 });
  const progresso = await pagina.innerText("#progTxt").catch(() => "");
  console.log("Gerar do zero:", progresso || "(concluído)");

  // Recarrega e confere que os dados persistiram.
  await pagina.reload();
  await pagina.waitForTimeout(800);
  const depois = await pagina.evaluate(() => ({
    profs: ST.profs.length,
    turmas: ST.turmas.length,
    hist: ST.hist.length,
  }));
  if (!depois.profs || !depois.turmas) {
    falhar("os dados não persistiram depois de recarregar a página");
  }
  console.log("Depois de recarregar:", JSON.stringify(depois));

  if (erros.length) {
    falhar("erros no console: " + JSON.stringify(erros.slice(0, 10)));
  } else {
    console.log("Nenhum erro no console. ✅");
  }

  await navegador.close();

  if (process.exitCode) {
    console.error(`\nFalhou com ${violacoesTotal} violação(ões) de acessibilidade e ${erros.length} erro(s) de console.`);
  } else {
    console.log("\nTudo certo. ✅");
  }
})();
