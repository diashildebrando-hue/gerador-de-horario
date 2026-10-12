
// =====================================================================
// VERSÃO MODELO (para outras escolas): começa só com EXEMPLOS, um em cada lugar
// =====================================================================
function instPadrao(){ return {nome:"ESCOLA EXEMPLO (troque pelo nome oficial da sua escola)",curto:"Escola Exemplo",codSeed:"",inep:"",cnpj:"",dependencia:"Estadual",localizacao:"Urbana",
  nre:"EXEMPLO",municipio:"Cidade Exemplo",uf:"PR",endereco:"Rua Exemplo, 123",bairro:"Centro (EXEMPLO)",cep:"",telefone:"",email:"exemplo@escola.pr.gov.br",oferta:"EXEMPLO: Ensino Fundamental (anos finais) e Ensino Médio",turnos:"EXEMPLO: Manhã",
  diretor:"Diretor(a) EXEMPLO",diretorAux:"",pedagogos:"Pedagogo(a) EXEMPLO",secretario:"Secretário(a) EXEMPLO",logo:"",logoW:0,logoH:0}; }
function freshState(){
  var o=conv1(freshState1());
  // um único modelo de horário
  o.tipos=[o.tipos[0]]; o.tipos[0].nome="Horário EXEMPLO (manhã)"; o.tipos[0].periodo="Manhã";
  o.turmas.forEach(function(T){ T.tipo=o.tipos[0].id; });
  // grade da turma de exemplo: Matemática na segunda e quarta, Português na terça e quinta (1ª e 2ª aulas)
  var g=new Array(25).fill(""), M=kOf("MAT",0,false), P=kOf("PORT",1,false);
  [0,1,10,11].forEach(function(s){ g[s]=M; }); [5,6,15,16].forEach(function(s){ g[s]=P; });
  o.grid=[g]; o.gridNome="Grade de EXEMPLO";
  // professores: contato e um horário marcado em cada um
  o.profs[0].email="exemplo.a@escola.pr.gov.br"; o.profs[0].cel="(41) 99999-0001"; o.profs[0].ind={"4|07:30-08:20":2};
  o.profs[1].email="exemplo.b@escola.pr.gov.br"; o.profs[1].cel="(41) 99999-0002"; o.profs[1].ind={"0|11:10-12:00":1};
  // regras: uma regra adicional e um par que não pode coincidir
  o.extras=[{tipo:"dialivre",p:1,forca:"preferencia"}];
  o.pares=[{a:0,b:1,ta:[],tb:[],modo:"recomp",discs:[],dias:[0,1,2,3,4],forca:"preferencia",obs:"EXEMPLO: 1ª e 2ª docência da recomposição"}];
  // hora-atividade e equipamentos
  o.haLocais=["Sala dos professores (EXEMPLO)"]; o.haLocPad={};
  o.equip={chrome:"30",tablet:"20",robo:1,inf:"M",bib:"M",tbBib:false,chBib:false,pri:[{disc:"MAT",regra:"1"}],robo_d:[]};
  // aulas vagas: uma ausência na próxima segunda-feira
  var seg=addDias(segundaDe(hoje()),7);
  o.ausencias=[{id:"exemplo1",p:0,de:seg,ate:seg,so:null,fora:{},subs:{},motivo:"EXEMPLO: curso de formação",quem:"EXEMPLO: direção",ts:agora()}];
  // outras escolas: um horário de exemplo (à tarde, sem conflito)
  o.externo={usar:true,margem:20,escolas:[{id:"exemplo1",nome:"OUTRA ESCOLA (EXEMPLO)",cenario:"",arquivo:"exemplo",origem:"Exemplo",ts:agora(),quem:"",itens:[{p:0,d:1,ini:"13:30",fim:"14:20",nomeLa:"EXEMPLO A",txt:"7º B EXEMPLO MAT"}]}]};
  // histórico e grades guardadas
  o.hist=[{ts:agora(),tipo:"EXEMPLO",txt:"EXEMPLO: aqui fica registrada cada mudança (o que mudou, quem pediu, o motivo e quando). Pode apagar ou ignorar este registro.",quem:"",motivo:""}];
  o.snaps=[{id:"exemplo1",ts:agora(),nome:"EXEMPLO de grade guardada",grid:deep(g),quem:"",motivo:"EXEMPLO"}];
  o.aviso.rem="Equipe pedagógica";
  o.inst=instPadrao(); o.exemploInicial=true;
  return o;
}
// na primeira abertura, já deixa pronta a hora-atividade e os equipamentos do exemplo
function exPrepararInicio(){ if(!ST.exemploInicial) return; delete ST.exemploInicial;
  try{ var md=buildModelData(), tm=TM(), r=Motor.gerarHA(md.M,md.grid,[0,1],tm.usedK); ST.ha={};
    Object.keys(r).forEach(function(p){ var x=r[p]; ST.ha[p]={slots:x.slots.map(function(v){ var d=(v/tm.K)|0, k=v%tm.K; return d+"|"+hmP(tm.TS[k][0])+"-"+hmP(tm.TS[k][1]); }),need:x.need,aulas:x.aulas,locais:{}}; });
    var E=ST.equip, q=Motor.gerarEquip(md.M,md.grid,{chrome:E.chrome,tablet:E.tablet,robo:E.robo,infNivel:E.inf,biblioNivel:E.bib,tabletSoBiblio:E.tbBib,chromeSoBiblio:E.chBib,prioridades:E.pri,roboDiscs:E.robo_d});
    ST.eq={aloc:q.aloc,falta:q.falta}; }catch(e){}
  _TM=null; CACHE=null; save(); }
// aviso no alto da tela enquanto ainda houver dados de EXEMPLO
function temExemplo(){ try{ return /EXEMPLO/.test(JSON.stringify([ST.profs.map(function(p){ return p.nome; }),ST.turmas.filter(function(T){ return !T.excluida; }).map(function(T){ return T.nome; }),ST.tipos.map(function(t){ return t.nome; }),inst().nome,inst().curto])); }catch(e){ return false; } }
function exBanner(){ var el=document.getElementById("exBanner"); if(!el){ el=document.createElement("div"); el.id="exBanner"; el.className="noprint"; var ref=document.getElementById("salvarBanner"); ref.parentNode.insertBefore(el,ref); }
  if(!temExemplo()){ el.innerHTML=""; return; }
  if(el.innerHTML) return;
  el.innerHTML='<div class="exban"><b>MODELO COM DADOS DE EXEMPLO.</b> Tudo o que tem a palavra <b>EXEMPLO</b> (professores, turma, horário, regras, instituição, outra escola...) está aqui só para mostrar como preencher. Troque pelos dados da sua escola. '+
    '<details><summary>Por onde começar</summary><ol style="margin:6px 0 0;padding-left:20px">'+
    "<li><b>Cadastro › Instituição</b>: nome, códigos, endereço e brasão da escola.</li>"+
    "<li><b>Cadastro › Horários</b>: os horários das aulas e dos intervalos (edite o horário EXEMPLO ou crie outros).</li>"+
    "<li><b>Cadastro › Professores</b>: um por um, com e-mail, celular e horários em que não podem.</li>"+
    "<li><b>Cadastro › Turmas e aulas</b>: as turmas e, em cada uma, as disciplinas, o professor e quantas aulas por semana.</li>"+
    "<li><b>Cadastro › Regras</b>: confira as regras da escola.</li>"+
    "<li><b>Gerar</b>: clique em “Gerar do zero”. Depois veja a <b>Grade</b>, a hora-atividade e os equipamentos.</li>"+
    "<li>Para tirar os exemplos: exclua os professores e a turma EXEMPLO (ou troque o nome deles pelos de verdade).</li>"+
    "<li>Faça backup sempre: <b>Relatórios › Backup</b>.</li></ol></details></div>"; }
(function(){ var st=document.createElement("style"); st.textContent="#xReset,#hfOficial{display:none!important} .exban{background:#FFF4CE;border:2px solid #E0A800;color:#3d2f00;border-radius:8px;padding:10px 14px;margin:10px 16px 0;font-size:14px} .exban summary{cursor:pointer;font-weight:700;margin-top:6px}"; document.head.appendChild(st);
  document.addEventListener("click",function(){ setTimeout(exBanner,0); }); document.addEventListener("change",function(){ setTimeout(exBanner,0); }); })();
