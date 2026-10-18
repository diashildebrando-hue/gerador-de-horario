"""
Monta o Gerador de Horário (versão MODELO) num único arquivo .html,
juntando a tela, o motor, os módulos de código e as bibliotecas de PDF.

Como usar:
    npm install          (uma vez só, baixa as bibliotecas)
    python3 montar.py    (gera baixar/Gerador_Horario_MODELO.html)

O arquivo gerado funciona sozinho, sem internet: pode ser copiado e
aberto em qualquer computador com um navegador.
"""
import base64
import zlib
from pathlib import Path

AQUI = Path(__file__).parent
CODIGO = AQUI / "codigo"
NODE_MODULES = AQUI / "node_modules"

MODULOS = [
    "01_base_e_navegacao.js",
    "02_grade_cadastro.js",
    "03_avisos_e_historico.js",
    "04_imprimir_pdf.js",
    "05_outras_escolas.js",
    "06_instituicao.js",
    "07_pontos_de_atencao.js",
    "08_recomposicao_pares.js",
    "09_backup.js",
    "10_edicao_com_mouse.js",
    "11_ajustar_uma_aula.js",
    "13_formulario_professores.js",
    "14_novo_ano_letivo.js",
    "dados_exemplo_overrides.js",
    "12_inicializacao.js",
]


def ler(caminho):
    return Path(caminho).read_text(encoding="utf-8")


def ler_escapado(caminho):
    # evita que um </script> dentro do arquivo feche a tag cedo demais
    return ler(caminho).replace("</script", "<\\/script")


def deflate_b64(caminho):
    dados = Path(caminho).read_bytes()
    c = zlib.compressobj(9, zlib.DEFLATED, -15)
    z = c.compress(dados) + c.flush()
    b = base64.b64encode(z).decode("ascii")
    return "\n".join(b[i:i + 1000] for i in range(0, len(b), 1000))


def troca(texto, de, para):
    assert de in texto, f"não achei no texto: {de[:60]!r}"
    return texto.replace(de, para)


def montar():
    html = ler(CODIGO / "tela.html")
    html = troca(html, "<title>Gerador de Horário 29 de Abril</title>", "<title>Gerador de Horário — Modelo</title>")
    html = troca(
        html,
        "Gerador de horário escolar gratuito do Colégio 29 de Abril",
        "Gerador de horário escolar gratuito e livre",
    )
    html = troca(
        html,
        "<h1>Gerador de Horário — Colégio 29 de Abril</h1>",
        "<h1>Gerador de Horário — Escola Exemplo</h1>",
    )

    js = "".join(ler(CODIGO / m) for m in MODULOS)
    js = troca(
        js,
        'var KEY = "gerador29abril_v2", KEY1 = "gerador29abril_v1";',
        'var KEY = "geradorHorarioModelo_v2", KEY1 = "geradorHorarioModelo_v1";',
    )
    js = troca(js, '"ex.: Colégio Estadual Cívico-Militar 29 de Abril"', '"ex.: Colégio Estadual Exemplo"')
    js = troca(js, '"ex.: Colégio 29 de Abril"', '"ex.: Colégio Exemplo"')
    js = troca(js, '"ex.: Paranaguá"', '"ex.: Curitiba"').replace('"ex.: Guaratuba"', '"ex.: Curitiba"')
    js = troca(js, "inst(); aplicarInst();\n", "inst(); aplicarInst(); exPrepararInicio(); exBanner();\n")
    for de, para in [
        ("Colégio Estadual Cívico-Militar 29 de Abril", "Escola Exemplo"),
        ("Colégio 29 de Abril", "Escola Exemplo"),
        ("Paranaguá", "EXEMPLO"),
        ("Guaratuba", "Cidade Exemplo"),
    ]:
        js = js.replace(de, para)

    tpl = (
        html
        + "\n<script>\n/*MOTOR*/\n</script>\n<script>\n" + js + "\n</script>\n"
        "<script>/*JSPDF*/</script>\n"
        "<script>/*AUTOTABLE*/</script>\n"
        "<script>/*FFLATE*/</script>\n"
        '<script type="text/plain" id="libPdf">/*PDFJS*/</script>\n'
        '<script type="text/plain" id="libPdfW">/*PDFJSW*/</script>\n'
        "</body>\n</html>\n"
    )

    nm = NODE_MODULES
    out = tpl
    out = out.replace("/*JSPDF*/", ler_escapado(nm / "jspdf/dist/jspdf.umd.min.js"))
    out = out.replace("/*AUTOTABLE*/", ler_escapado(nm / "jspdf-autotable/dist/jspdf.plugin.autotable.min.js"))
    out = out.replace("/*FFLATE*/", ler_escapado(nm / "fflate/umd/index.js"))
    out = out.replace("/*PDFJS*/", deflate_b64(nm / "pdfjs-dist/legacy/build/pdf.min.js"))
    out = out.replace("/*PDFJSW*/", deflate_b64(nm / "pdfjs-dist/legacy/build/pdf.worker.min.js"))
    out = out.replace("/*MOTOR*/", ler_escapado(CODIGO / "motor.js"))
    out = out.replace("/*DATA*/", ler(CODIGO / "dados/exemplo.json"))

    destino = AQUI / "baixar" / "Gerador_Horario_MODELO.html"
    destino.parent.mkdir(exist_ok=True)
    destino.write_text(out, encoding="utf-8")
    print(f"Pronto: {destino} ({len(out):,} caracteres)")


if __name__ == "__main__":
    montar()
