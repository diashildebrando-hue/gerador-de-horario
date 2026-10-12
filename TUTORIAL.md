# Tutorial do Gerador de Horário

Este guia ensina, passo a passo, a montar e cuidar do horário da escola no Gerador de Horário, do primeiro cadastro ao dia a dia, sem precisar de conhecimento de computação.

## Roteiro rápido

No primeiro uso, faça os passos nesta ordem. Depois, no dia a dia, use só os passos 7 a 10 e a parte de aulas vagas.

1. **Instituição** — dados da escola e brasão (Cadastro › Instituição).
2. **Horários** — horário das aulas e dos intervalos (Cadastro › Horários).
3. **Professores** — nomes, contatos e horários em que não podem (Cadastro › Professores).
4. **Turmas e aulas** — turmas, disciplinas e quantas aulas por semana (Cadastro › Turmas e aulas).
5. **Regras** — confira as regras da escola (Cadastro › Regras).
6. **Gerar** — clique em ✏️ Editar, depois em Gerar do zero, e salve (aba Gerar).
7. **Conferir e ajustar** — veja a grade e acerte o que precisar com o mouse (aba Grade).
8. **Hora-atividade** — gere a HA de todos (Cadastro › Hora-atividade).
9. **Equipamentos** — gere a reserva de laboratório, biblioteca e aparelhos (Cadastro › Equipamentos).
10. **Avisar** — mande o horário para cada professor (aba Avisos).
11. **Backup** — guarde uma cópia de tudo (Relatórios › Backup).

## Antes de começar

O gerador é um arquivo só, que abre no navegador e funciona sem internet. Não precisa instalar nada.

1. Salve o arquivo do gerador (termina em **.html**) numa pasta fácil de achar, por exemplo **Documentos**.
2. Dê dois cliques no arquivo. Ele abre no navegador (Google Chrome ou Microsoft Edge funcionam melhor).
3. Use sempre **o mesmo computador e o mesmo navegador**. Os dados ficam guardados dentro do navegador desse computador.

Cuidados importantes:

- **Tudo é salvo sozinho** a cada mudança. Não existe botão "Salvar arquivo".
- **Limpar o histórico do navegador** ("apagar dados de navegação") pode apagar os dados do gerador. Por isso, faça **backup** toda semana (Relatórios › Backup).
- **Para usar em outro computador**, faça um backup neste e recupere o backup no outro.
- **Uma janela de cada vez**: não abra o gerador em duas abas ao mesmo tempo, para uma não apagar o que a outra fez.
- **Versão Modelo**: o arquivo para outros colégios já vem com dados marcados como **EXEMPLO** e uma faixa amarela de ajuda no alto. Troque os exemplos pelos dados da sua escola, seguindo os passos 1 a 5.

## Conhecendo a tela

No alto fica o **menu** com seis abas. Algumas abas têm partes; quando você clica nelas, aparece logo abaixo uma barra com botões redondos para escolher a parte.

| Aba | Partes | Para que serve |
| --- | --- | --- |
| **Cadastro** | Instituição · Professores · Turmas e aulas · Horários · Hora-atividade · Regras · Equipamentos | Tudo o que o gerador precisa saber da escola |
| **Gerar** | — | Montar a grade, ver os pontos de atenção e ajustar uma aula só |
| **Grade** | Grade de aulas · Aulas vagas | Ver e mudar a grade; marcar faltas e substitutos |
| **Avisos** | — | Mandar o horário para os professores por WhatsApp ou e-mail |
| **Histórico** | — | Ver tudo o que mudou e voltar a uma grade anterior |
| **Relatórios** | Imprimir e Baixar · Backup · Importar/Exportar | PDFs, Excel, cópia de segurança e horário de outros colégios |

Três coisas aparecem em várias telas:

- **Registro das mudanças** (faixa clara no alto, com "Solicitado por" e "Motivo da mudança"): antes de mexer, escreva quem pediu e por quê. Isso vai para o Histórico junto com cada mudança.
- **Números nas abas**: o número vermelho em **Gerar** mostra quantos conflitos a grade tem; o laranja em **Grade** mostra quantas aulas estão vagas hoje.
- **Botão direito do mouse numa aula** da grade: abre as opções daquela aula (editar, ver possibilidades para tirar o professor dali, travar).

## Passo 1 — Instituição

Aqui ficam os dados da escola no padrão da SEED-PR. O nome e o brasão aparecem nos PDFs, nas mensagens aos professores e nos arquivos baixados.

1. Clique em **Cadastro** e depois em **Instituição**.
2. Clique em **Editar** (no canto direito).
3. Preencha os campos. Os principais são:
   - **Nome oficial do estabelecimento** (como está nos documentos);
   - **Nome curto** (o que aparece nas mensagens, por exemplo "Colégio Exemplo");
   - **Código do estabelecimento (SEED)** e **Código INEP** (8 números);
   - **NRE**, **Município**, endereço, telefone e e-mail;
   - **Equipe gestora**: diretor(a), pedagogos e secretário(a).
4. Para o brasão, clique em **Escolher imagem (PNG ou JPG)** e escolha o arquivo da imagem.
5. Clique em **Salvar**. Se algum campo estiver errado (CEP, e-mail, INEP), aparece um aviso dizendo qual conferir.

Nada muda até você clicar em Salvar. Se desistir, clique em **Cancelar**.

## Passo 2 — Horários

Um "horário" é o modelo do dia de aula: a que horas começa, quantas aulas tem, quanto dura cada uma e onde fica o intervalo. Cada turma segue um desses modelos. Se a escola tem horários diferentes (por exemplo, Fundamental e Médio de manhã, e outros à tarde), crie um modelo para cada.

1. Clique em **Cadastro** e depois em **Horários**.
2. Para criar um modelo novo, clique em **+ Novo horário**. Para aproveitar um parecido, escolha-o e clique em **Duplicar**.
3. Preencha:
   - **Nome do horário** (ex.: "Tipo 1 — Manhã 9º ao 3º");
   - **Período** (Manhã, Tarde, Noite ou Integral);
   - **Aulas por dia**, **Início** e **Duração da aula (min)**.
4. Em **Intervalos**, escolha depois de qual aula vem o intervalo, a duração em minutos, e clique em **+ Intervalo**. Intervalo de 45 minutos ou mais aparece como "Almoço".
5. Confira a tabela de aulas que aparece embaixo. Se só uma aula tem horário diferente, mude o início ou o fim direto nela.

Cuidado: mudar aulas por dia, início, duração ou intervalos recalcula todas as aulas daquele modelo, e todas as turmas que usam ele mudam juntas. Um modelo só pode ser excluído quando nenhuma turma usa.

## Passo 3 — Professores

Cada professor tem um nome curto (o que aparece na grade), o nome completo, contatos e os horários em que não pode dar aula.

**Cadastrar um professor novo**

1. Clique em **Cadastro** e depois em **Professores**.
2. Na coluna da esquerda, escreva o nome no campo do novo professor e clique em **Adicionar**.
3. Clique no nome dele na lista e depois em **Editar**.
4. Preencha **Nome na grade** (curto, ex.: "SILVA"), **Nome completo**, **E-mail** e **Celular (WhatsApp)**. O e-mail e o celular são usados na aba Avisos.
5. Se quiser, preencha **Máximo de aulas por dia**, **HA manual** (deixe vazio para seguir a tabela da SEED) e marque **Prefere concentrar as aulas em menos dias**.
6. Clique em **Salvar**.

**Marcar os horários em que ele não pode**

1. Com o professor aberto, clique em **Editar**.
2. Na grade da semana, clique no horário. Cada clique muda a marcação nesta ordem: **livre → evitar → não pode → formador → livre**.
   - **Evitar**: o gerador tenta não pôr aula ali, mas pode, se não houver outro jeito.
   - **Não pode**: o gerador não põe aula ali.
   - **Formador**: não põe aula nem hora-atividade ali.
3. Clique em **Salvar**.

Horários marcados como **em outra escola** vêm sozinhos de Relatórios › Importar/Exportar. Para tirar um professor que saiu da escola, use **Excluir professor** (as aulas dele precisam ir para outro antes, em Turmas e aulas). O botão **Sortear cores novas** troca as cores dos professores na grade sem repetir.

## Passo 4 — Turmas e aulas

Aqui você cria as turmas e diz, para cada uma, quais disciplinas ela tem, com qual professor e quantas aulas por semana. A soma das aulas da turma precisa fechar com o horário dela (aulas por dia × 5). Ex.: horário de 6 aulas por dia = 30 aulas na semana.

**Criar uma turma**

1. Clique em **Cadastro** e depois em **Turmas e aulas**.
2. Em **Nova turma**, preencha **Nome** (ex.: "6A"), escolha o **Horário** que ela segue, o **Nível** (Fundamental ou Médio, usado nos equipamentos) e o número de **Alunos**.
3. Clique em **Criar turma**.

**Colocar as disciplinas da turma**

1. Na tabela **Todas as turmas**, clique em **Disciplinas** na linha da turma.
2. Clique em **Adicionar disciplina**. Escolha a disciplina, o professor e quantas **Aulas/semana**.
3. Se a aula tem segundo professor junto (recomposição, 2ª docência), marque **2ª docência** na linha do segundo professor.
4. Repita até a contagem no alto mostrar, por exemplo, **30 de 30 aulas**.

A coluna **Aulas cadastradas** mostra se cada turma fechou a conta. Se faltar ou sobrar aula, o gerador avisa em Gerar. Depois de mudar turmas ou disciplinas numa grade que já existe, use **Editar** e **Ajustar a grade atual** na aba Gerar.

## Passo 5 — Regras

As regras dizem ao gerador como a escola quer a grade. **Rígida** = só é quebrada se não houver outro jeito (e ele avisa). **Preferência** = ele tenta atender.

**Regras da escola** (ligar ou desligar com um clique na caixinha)

- Máximo de aulas da mesma disciplina por dia na turma.
- Disciplinas com só 2 aulas na semana: em dias diferentes.
- Disciplinas com 3 ou mais aulas: de duas em duas (geminadas).
- Evitar aulas geminadas nas duas últimas aulas.
- Quem dá aula no fim da manhã não pega o começo da tarde (1 hora de almoço).
- Evitar janelas (horário vago entre aulas) do professor.
- Mesma disciplina duas vezes no dia só se for geminada.
- O professor precisa ter intervalo (minutos livres seguidos no recreio).

**Regras adicionais**

1. Em **Tipo de regra**, escolha a regra (ex.: "pelo menos 1 dia sem aula", "no máximo X aulas seguidas").
2. Escolha o professor ou a disciplina, o número e a **Força** (rígida ou preferência).
3. Clique em **Adicionar regra**. Para tirar, clique em **Remover** na lista.

**Professores que não podem coincidir** (recomposição e outros casos)

Use quando dois professores não podem estar em aula ao mesmo tempo (ex.: 1ª e 2ª docência).

1. Escolha o **1º professor** e o **2º professor** (o botão **⇄ inverter** troca a ordem).
2. Para cada um, deixe **Todas as turmas** ou marque **Só as turmas marcadas** e clique nas turmas.
3. Em **Quais aulas contam?**, escolha: só aulas de recomposição, qualquer aula, ou só algumas disciplinas.
4. Marque os **dias** e a **Força**; se quiser, escreva uma **Observação**.
5. Clique em **Adicionar par**. Na lista, dá para **Editar**, **Duplicar** ou **Remover** cada par.

Regras novas só entram na grade quando ela for gerada ou ajustada de novo (Passo 6).

## Passo 6 — Gerar a grade

O gerador distribui todas as aulas sem pôr professor em dois lugares ao mesmo tempo, respeitando os horários em que cada um não pode e as regras. **Toda mudança na grade começa no botão ✏️ Editar e só vale depois de Salvar.**

1. Preencha o **Registro das mudanças** no alto (quem pediu e o motivo).
2. Clique na aba **Gerar** e depois em **✏️ Editar**. Aparece uma **faixa amarela** no alto: "EDITANDO A GRADE".
3. Escolha:
   - **Gerar do zero** — monta a grade inteira de novo (leva até um minuto). Use na primeira vez ou quando mudou muita coisa.
   - **Ajustar a grade atual** — parte da grade que está em uso e muda o mínimo possível. Use depois de mudanças pequenas.
   - **Parar** — interrompe; o gerador fica com o melhor que achou até ali.
4. Espere a barra chegar a 100%. Durante a geração não dá para trocar de aba.
5. Leia os **Pontos de atenção** (abaixo). Se quiser resolver algum, clique nele (veja a seguir).
6. Na faixa amarela, clique em **💾 Salvar**.
   - Se a grade estiver certa, aparece "✓ Grade salva e conferida".
   - Se ainda houver algum problema, abre uma janela com a lista. O que foi criado agora aparece como **NOVO**. Para salvar mesmo assim, marque **"Estou ciente…"** e clique em **Salvar mesmo assim**. Isso fica registrado no Histórico.
7. Para desistir de tudo, clique em **Cancelar** duas vezes: a grade volta a ser como era antes de Editar.

**Pontos de atenção** — a lista em Gerar mostra o que não ficou perfeito:

- **Rígida** (vermelho): não pode acontecer, ex.: professor em dois lugares ao mesmo tempo.
- **Regra**: regra da escola quebrada porque não havia outro jeito.
- **Preferência**: pedido do professor que não deu para atender.

Clique em um ponto para ver **o que é**, **onde está** ("Ver na grade") e de **3 a 9 opções de ajuste**, das melhores para as piores, cada uma dizendo o que muda. Escolha uma e clique em **Aplicar** (com a edição aberta). Se não gostar, use **Desfazer**. Quando não há jeito melhor para uma preferência, a opção **Manter assim** tira o destaque.

**Ajustar uma aula só** — para tirar um professor de uma aula específica: escolha o **Professor** e o **Dia**, clique na aula dele, e o gerador mostra as possibilidades (trocar com outra aula, rearrumar só as turmas dele, marcar que ele não pode ali, ou deixar vago). Aplique a que preferir e depois **Salve**.

## Passo 7 — Conferir e ajustar a grade com o mouse

**Ver a grade**

1. Clique em **Grade** e depois em **Grade de aulas**.
2. No primeiro campo, escolha como ver:
   - **Quadro geral do período** — todas as turmas de manhã (ou de tarde) lado a lado;
   - **Por turma** — a semana de uma turma;
   - **Por professor** — a semana de um professor, com o nome completo embaixo do nome curto.
3. Marque **Caber na tela** se o quadro geral ficar largo demais para o seu monitor.
4. Em **Mostrar**, "Grade oficial" é a grade de sempre; escolhendo uma semana, aparecem as aulas vagas e os substitutos daquela semana.

**Mudar aulas de lugar**

1. Clique em **✏️ Editar**. A faixa amarela aparece no alto.
2. **Arraste uma aula até outra** e solte: as duas trocam de lugar. Quem preferir pode clicar numa aula e depois na outra.
3. Para deixar um horário vazio, arraste a aula até **🗑 Solte aqui para deixar vago** (na faixa amarela). Ela vai para **Aulas que faltam colocar**; de lá, arraste para outro horário da mesma turma.
4. Com o **botão direito** numa aula aparecem: **Deixar vago**, **Incluir aqui — quem pode** (mostra cada professor como ✓ livre ou ✗ batendo / não pode), **💡 Tirar daqui — ver possibilidades** e **Travar**.
5. A cada mudança o gerador confere tudo. Aula com problema fica **amarela com letra vermelha**. A faixa amarela diz quantos erros há (batendo, sobrando, faltando, não pode); clique em **Ver os erros** para ir até cada um.
6. Errou? Clique em **↶ Desfazer**.
7. Terminou? Clique em **💾 Salvar** (com a mesma conferência do Passo 6). A grade anterior fica guardada no Histórico.

**Travar uma aula** — aula travada (🔒) não muda quando a grade é gerada ou ajustada de novo. Use o botão direito › **Travar esta aula**, ou, na visão **Por turma**, marque **Modo travar** e clique nas aulas.

Durante a edição dá para usar as abas Gerar, Grade e Histórico; as outras ficam bloqueadas até Salvar ou Cancelar. Se o computador desligar no meio, a edição continua aberta quando você voltar.

## Passo 8 — Hora-atividade

A quantidade de HA de cada professor segue a tabela oficial da SEED (HA 15/5), que aparece em Relatórios › Imprimir e Baixar. O gerador encaixa as HAs nos horários livres, perto das aulas, e evita criar um dia a mais na escola.

**Gerar a HA de todos**

1. Clique em **Cadastro** e depois em **Hora-atividade**.
2. No campo do professor, deixe **Todos os professores**.
3. Clique em **Gerar HA**.
4. Confira o **Resumo**: a coluna **Situação** mostra "ok" ou quantas faltaram (quando não há horário livre suficiente).

**Ajustar a HA de um professor à mão**

1. Escolha o professor (não "Todos").
2. Marque **Modo edição manual**.
3. Clique num horário livre da grade dele para pôr uma HA; clique numa HA para tirar. Para tirar todas as HAs dele de uma vez, use Tirar todas as HAs dele.
4. Escolha o **Local padrão deste professor** (ex.: Sala dos professores) e clique em **Aplicar o local padrão em todas as HAs dele**. A lista de locais pode ser editada em **Lista de locais de HA**.

Sempre que a grade de aulas mudar, gere a HA de novo: o gerador avisa quando alguma HA ficou em cima de uma aula.

## Passo 9 — Equipamentos

O gerador monta a reserva do laboratório de informática, da biblioteca, dos Chromebooks e dos tablets a partir da grade de aulas. O Fundamental é atendido primeiro.

1. Clique em **Cadastro** e depois em **Equipamentos**.
2. Preencha as quantidades: **Chromebooks**, **Tablets** e **Chromebooks da robótica**. Campo em branco = o gerador considera que sempre tem aparelho suficiente.
3. Escolha quem o **Laboratório de informática** e a **Biblioteca** atendem, e marque se tablets ou Chromebooks só podem ser usados dentro da biblioteca.
4. Em **Prioridade por matéria**, escolha a matéria e o uso (todas as aulas ou 1 por turma na semana) e clique em **Adicionar**.
5. Em **Matérias que usam o kit da robótica**, marque as matérias.
6. Clique em **Gerar horário dos equipamentos**. A reserva aparece embaixo, por período, e pode ser impressa no botão **Imprimir**.

Sempre que a grade de aulas mudar, gere os equipamentos de novo.

## Passo 10 — Avisar os professores

Depois de salvar uma grade nova ou uma mudança, avise quem foi afetado. Vá na aba **Avisos**. Ela tem quatro partes, uma embaixo da outra.

1. **Quem recebe** — escolha **Só os afetados pela mudança**, **Todos os professores** ou **Escolher na lista** (marque os nomes um a um).
2. **O que vai em anexo (PDF)** — marque o que vai junto: **Horário individual do professor**, **Com a hora-atividade (HA)**, **Horário das turmas dele** e **Equipamentos reservados para ele**.
3. **Mensagem** — preencha **Vale a partir de** (a data em que o horário começa) e a **Assinatura**. O **Assunto do e-mail** se preenche sozinho. O texto já vem pronto e pode ser mudado à vontade, para todos ou só para um professor. As palavras entre chaves são trocadas sozinhas para cada professor: {nome} vira o nome dele, {mudancas} vira a lista do que mudou, {motivo}, {data} e {assinatura} também. **Aplicar a mensagem padrão em todos** põe o mesmo texto para todos; **Voltar ao texto original** desfaz as mudanças no texto.
4. **Enviar** — para cada professor aparecem os botões **WhatsApp** e **E-mail**, que abrem a mensagem pronta. Use **Baixar um PDF por professor** para salvar um arquivo para cada um, ou **Baixar um PDF único com todos**.

Quando terminar, clique em **Marcar estes como avisados**. Assim o gerador lembra quem já recebeu e não repete o aviso.

**Sobre o anexo:** no celular, o PDF já vai junto sozinho — é só escolher o WhatsApp ou o e-mail no compartilhamento. No computador, o navegador não deixa anexar sozinho: o gerador baixa o PDF (pasta Downloads) e abre a conversa. Aí é só clicar no clipe (📎) e escolher o arquivo. O próprio gerador mostra esse lembrete na tela.

## No dia a dia: aulas vagas, ausências e substitutos

Quando um professor falta, a grade oficial **não muda**. Você só marca a ausência, e o gerador mostra quais aulas ficaram vagas e quem pode cobrir. Vá em **Grade › Aulas vagas**.

**Marcar uma ausência**

1. Escolha o **Professor**.
2. Preencha **De** e **Até** (as datas). Se ele falta a semana toda, marque **Semana inteira**.
3. Escreva o **Motivo** e quem pediu, em **Solicitado por**.
4. Para cada aula vaga, o gerador mostra quem está livre naquele horário. Escolha o **substituto**, se houver.
5. Clique em **Marcar ausência**.

**Aulas vagas de um dia** — escolha a data e veja a lista das aulas sem professor. Dali você pode baixar o **PDF do dia** ou o **PDF da semana**, e usar **Avisar equipe** (WhatsApp ou e-mail) para mandar a lista à coordenação e aos inspetores.

**Ausências marcadas** — a lista das faltas registradas. Em cada uma há **Ver na grade**, **Editar**, **Encerrar** (quando o professor volta antes) e **Excluir** (quando foi marcada por engano). As encerradas somem da lista; para vê-las, marque **Mostrar também as encerradas**.

O botão **Grade** do menu mostra um número quando há aulas vagas sem substituto.

## Outras instituições: cruzar o horário de quem trabalha em outro colégio

Muitos professores dão aula em mais de uma escola. Se você trouxer o horário da outra escola, o gerador evita colocar aula nossa no mesmo momento. Vá em **Relatórios › Importar/Exportar**.

**Trazer o horário da outra escola**

1. Escreva o **nome da outra escola**.
2. Clique em **Escolher o arquivo**. Serve o PDF do SIGAH, uma planilha .xlsx, ou o PDF ou arquivo .json feito por este mesmo gerador em outra escola.
3. O gerador lê o arquivo e mostra os nomes que encontrou. Confira se cada um foi ligado ao professor certo daqui; corrija se precisar.
4. Clique em **Guardar**.

Depois, deixe marcado **Considerar esses horários ao gerar**. Em **Tempo para ir de uma escola à outra**, diga quantos minutos o professor precisa para chegar. Assim o gerador não põe aula colada com a da outra escola.

Se a grade atual já bate com a outra escola, aparece um aviso com o professor, o dia e o horário. Para resolver, gere de novo ou ajuste à mão com **Editar**.

**Mandar o nosso horário para outra escola** — no fim da página, escolha **Todos os professores** ou **Só os que eu marcar** (o botão **Marcar quem já tem horário de outra escola** marca esses de uma vez). Depois clique em **Baixar arquivo para a outra escola (.json)** ou **Baixar PDF (para ler e para importar)**. Se a outra escola também usa este gerador, o .json entra direto, sem precisar conferir nomes.

## Imprimir e baixar: PDFs e Excel

Tudo o que sai do gerador em papel ou arquivo está em **Relatórios › Imprimir e Baixar**.

**Baixar tudo em Excel** — um botão só gera uma planilha com todas as grades, professores, turmas e hora-atividade, cada uma numa aba.

**Imprimir em PDF**

1. Na lista, marque o que quer imprimir. Os itens estão em quatro grupos: **Grades de aula** (quadro geral, todas as turmas ou só algumas, todos os professores ou só alguns), **Hora-atividade e equipamentos**, **Aulas vagas** (do dia, da semana e o quadro geral da semana com substitutos) e **Consulta e registro** (disciplinas de cada turma, pontos de atenção, histórico, disponibilidade dos professores e conflitos com outras escolas). **Marcar todos** e **Desmarcar todos** ajudam.
2. Escolha o **Papel**: deixe **Automático** para escolher na hora de imprimir, ou fixe A4, A3, Ofício ou Carta.
3. Escolha a **Orientação** — **Paisagem (deitado)** ou **Retrato (em pé)** — e as **Cores** — **Coloridas** ou **Tons de cinza** (economiza tinta).
4. Em **Grades**, escolha **Grade oficial** ou **Semana da data, com aulas vagas**. A **Data de referência** diz qual dia e qual semana usar nas aulas vagas.
5. Em **Formato**, escolha **Um PDF único com tudo** ou **Um arquivo por item**. Se quiser, marque **Cabeçalho com "vale a partir de" e assinatura**.
6. Clique em **Gerar PDF para imprimir**.

Com o papel em **Automático**, escolha o papel na janela de impressão e marque **Ajustar à página** para a tabela caber inteira na folha.

**Tabela oficial de HA** — o modelo de hora-atividade no formato que a escola entrega ao Núcleo.

**Voltar à grade oficial** — troca a grade atual pela grade oficial da escola, a que veio junto com o gerador. Os professores (com e-mail, celular e horários), as regras, o Histórico, as grades guardadas e as aulas vagas continuam. Antes de trocar, o gerador guarda a grade atual em **Grades anteriores**. Como muda a grade, pede **Editar** antes e um segundo clique para confirmar. Na versão modelo, para outras escolas, este botão não aparece.

## Backup: guardar e recuperar todos os dados

Os dados ficam guardados no navegador deste computador. Se alguém limpar o navegador, trocar de computador ou o computador quebrar, tudo some. O backup é um arquivo com **tudo**: cadastro, grades, histórico, ausências. Vá em **Relatórios › Backup**.

**Guardar** — clique em **Baixar backup agora**. Faça isso **toda semana** e sempre depois de uma mudança grande. Guarde o arquivo fora do computador: pen drive, e-mail para você mesma ou Google Drive. Se passar 7 dias sem backup, o gerador lembra você.

**Recuperar**

1. Clique em **Escolher arquivo** e pegue o backup.
2. O gerador mostra uma tabela comparando o que está agora com o que tem no arquivo (quantos professores, turmas, data da grade). Confira se é o arquivo certo.
3. Clique em **Restaurar**. Ele pede um segundo clique para confirmar.

Se restaurou o arquivo errado, use **Desfazer a restauração**: tudo volta como estava antes.

O backup também serve para **levar o gerador para outro computador**: abra o arquivo do gerador lá e restaure o backup.

## Histórico e grades anteriores

A aba **Histórico** guarda tudo o que foi feito: grades geradas, trocas, ausências, avisos, quem fez e quando.

- Use os **filtros** (período, tipo, professor) para achar algo rápido.
- **Baixar relatório Excel** ou **Imprimir** para ter em papel.
- **Adicionar anotação** para registrar algo que não foi feito no gerador, como uma conversa com a direção.

**Grades anteriores** — cópias completas da grade guardadas para comparar ou voltar.

1. Clique em **Guardar a grade atual** antes de uma mudança grande. Dê um nome que lembre o motivo (ex.: "antes da troca de março").
2. Em **Guardar até**, escolha quantas cópias manter; as mais antigas saem sozinhas.
3. Em cada cópia há **Ver**, **Comparar** (mostra o que mudou em relação à atual) e **Restaurar**.

**Restaurar** troca a grade atual pela cópia, por isso pede **Editar** antes e depois **Salvar**.

## Dúvidas comuns: o que fazer quando algo não sai como esperado

| Situação | O que fazer |
| --- | --- |
| Aparece "Para mudar, clique em Editar" | Toda mudança precisa da edição aberta. Clique em **Editar agora** no próprio aviso, faça a mudança e depois **Salvar**. |
| As outras abas ficaram bloqueadas | Você está no meio de uma edição. Clique em **Salvar** ou **Cancelar** na barra amarela e as abas voltam. |
| A grade tem conflito (amarelo com letra vermelha) | Clique na célula marcada e use as sugestões, ou volte em **Gerar** e gere de novo. Salvar com erro só é possível marcando que você está ciente. |
| Uma turma não fecha o número de aulas | Confira no **Cadastro › Turmas e aulas** se a soma das aulas bate com os horários da turma. |
| A hora-atividade não coube | O professor tem pouco horário livre. Libere algum horário marcado como "não pode" ou ajuste a HA à mão. |
| O gerador demora ou não acha solução | Pode haver regra rígida demais. Em **Cadastro › Regras**, passe alguma de "rígida" para "preferência" e gere de novo. |
| Os dados sumiram | Restaure o último backup em **Relatórios › Backup**. |
| Quero usar em outro computador | Baixe o backup aqui, abra o arquivo do gerador no outro computador e restaure. |
| O PDF saiu cortado | Em **Imprimir e Baixar**, marque **Ajustar à página** ou mude a orientação para deitado. |

Se nada disso resolver, faça um backup antes de tentar qualquer outra coisa. Com ele, sempre dá para voltar.
