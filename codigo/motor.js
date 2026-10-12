// ===== Motor do gerador de horário — versão 2 (horários livres por tipo) =====
// Cada turma segue um "tipo de horário" com N aulas por dia. Os conflitos são verificados
// pelo horário real (início/fim de cada aula), não pelo número da aula.
(function (root) {
  "use strict";

  var DEFAULT_W = {
    dup: 1000,        // professor em dois lugares ao mesmo tempo (horários que se sobrepõem)
    block: 1000,      // professor em horário "não pode" / formador
    maxSame: 1000,    // mais aulas da mesma disciplina no dia do que o permitido
    twoSameDay: 500,  // disciplina de 2 aulas no mesmo dia
    maxDia: 300,      // passou do máximo de aulas por dia do professor
    pref: 25,         // horário "evitar" do professor
    cross: 40,        // menos de 1 hora entre a última aula da manhã e a primeira da tarde
    pair: 20,         // pares de recomposição coincidindo
    gemLate: 4,       // geminada nas duas últimas aulas
    split: 3,         // disciplina com 3+ aulas: 2 aulas no dia mas separadas
    single: 2,        // disciplina com 3+ aulas: aula sozinha no dia
    gap: 1,           // janela do professor (por aula vaga)
    janLonga: 6,      // janela de 3 ou mais aulas seguidas sem aula (por aula além de 2)
    conc: 6,          // professor que prefere concentrar: custo por dia trabalhado
    sep: 0,           // mesma disciplina 2x no dia sem ser geminada
    intervalo: 800    // professor sem intervalo
  };
  var HARD_MIN = 300;
  var DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];

  function hm(m) { return ("0" + Math.floor(m / 60)).slice(-2) + ":" + ("0" + (m % 60)).slice(-2); }

  function buildModel(D, opts) {
    opts = opts || {};
    var W = Object.assign({}, DEFAULT_W, opts.weights || {});
    var T = D.turmas.length, P = D.profs.length, K = D.K, TS = D.TS, OVL = D.OVL;
    var discIds = {}, nDisc = 0;
    var L = D.lessons.map(function (l) {
      if (!(l.disc in discIds)) discIds[l.disc] = nDisc++;
      return { t: l.t, disc: l.disc, d: discIds[l.disc], p: l.p, doc2: !!l.doc2 };
    });
    var nd = {};
    L.forEach(function (l) { var k = l.t + "|" + l.d; nd[k] = (nd[k] || 0) + 1; });
    var RECOMP = { "RAM": 1, "RAP": 1, "L.RAP": 1, "R.LEIT": 1 };
    L.forEach(function (l) { l.nd = nd[l.t + "|" + l.d]; l.recomp = !!RECOMP[l.disc] || l.doc2; l.mp = l.nd >= 3; });
    var nA = D.turmas.map(function (t) { return t.nA; });
    var tsOf = D.turmas.map(function (t) { return t.ts; });
    var per = D.turmas.map(function (t) { return t.per || 0; });
    var DK = 5 * K;
    var blk = new Int8Array(P * DK), maxDia = new Int16Array(P), conc = new Uint8Array(P);
    D.profs.forEach(function (p, i) {
      for (var x = 0; x < DK; x++) blk[i * DK + x] = (p.blk && p.blk[x]) || 0;
      maxDia[i] = p.maxDia ? +p.maxDia : 0; conc[i] = p.concentrar ? 1 : 0;
    });
    var partners = []; for (var i = 0; i < P; i++) partners.push([]);
    // pares que não podem coincidir: cada par tem turmas de cada professor, quais aulas contam, dias e força
    var pares = [], parA = [], lr = L.map(function () { return []; });
    for (var i1 = 0; i1 < P; i1++) parA.push([]);
    (D.pares || []).forEach(function (pr) {
      var o = Array.isArray(pr) ? { a: pr[0], b: pr[1] } : (pr || {}), a = +o.a, b = +o.b;
      if (!(a >= 0 && b >= 0 && a < P && b < P) || a === b || a % 1 || b % 1) return;
      var set = function (x) { if (!x || !x.length) return null; var r = {}; x.forEach(function (v) { r[v] = 1; }); return r; };
      var TA = set(o.ta), TB = set(o.tb), DS = set(o.discs), modo = o.modo === "todas" || o.modo === "disc" ? o.modo : "recomp";
      var dm = 0; (o.dias && o.dias.length ? o.dias : [0, 1, 2, 3, 4]).forEach(function (d) { dm |= 1 << d; });
      var ri = pares.length; pares.push({ a: a, b: b, modo: modo, dm: dm, w: o.forca === "rigida" ? 800 : W.pair });
      parA[a].push(ri); if (partners[a].indexOf(b) < 0) partners[a].push(b); if (partners[b].indexOf(a) < 0) partners[b].push(a);
      L.forEach(function (l, li) { var side = -1; if (l.p === a && (!TA || TA[l.t])) side = 0; else if (l.p === b && (!TB || TB[l.t])) side = 1; if (side < 0) return;
        var f = modo === "todas" ? 1 : modo === "recomp" ? (l.recomp ? 1 : 0) : (DS && DS[l.disc] ? 1 : 0); lr[li].push(ri * 4 + side * 2, f); });
    });

    // ---- regras adicionais ----
    // cada regra vale por si: se houver duas regras de máximo para o mesmo professor, as duas contam
    function RW(f) { return f === "rigida" ? 800 : 30; }
    var maxDiaL = [], seqL = [], livre = new Float64Array(P);
    for (var q0 = 0; q0 < P; q0++) { maxDiaL.push(maxDia[q0] ? [{ n: maxDia[q0], w: W.maxDia }] : []); seqL.push([]); }
    var NPER = 4, posMask = new Int32Array(nDisc * NPER), posW = new Float64Array(nDisc);
    var spL = [], simL = []; for (var d0 = 0; d0 < nDisc; d0++) { spL.push([]); simL.push([]); }
    var hasSpread = false, hasSim = false;
    function profsOf(r) { if (r.p == null || r.p < 0) { var a = []; for (var i2 = 0; i2 < P; i2++) a.push(i2); return a; } return r.p < P ? [r.p] : []; }
    function discsOf(r) { if (r.disc === "*") { var a = []; for (var i3 = 0; i3 < nDisc; i3++) a.push(i3); return a; } return (r.disc in discIds) ? [discIds[r.disc]] : []; }
    (opts.extras || []).forEach(function (r) {
      var w = RW(r.forca), n = +r.n || 0;
      if (r.tipo === "seguidas" && n > 0) profsOf(r).forEach(function (p) { seqL[p].push({ n: n, w: w }); });
      else if (r.tipo === "maxdia" && n > 0) profsOf(r).forEach(function (p) { maxDiaL[p].push({ n: n, w: w }); });
      else if (r.tipo === "dialivre") profsOf(r).forEach(function (p) { livre[p] = Math.max(livre[p], w); });
      else if (r.tipo === "posicao") discsOf(r).forEach(function (d) {
        var mask = 0; (r.aulas || []).forEach(function (a) { mask |= 1 << (a - 1); });
        for (var pq = 0; pq < NPER; pq++) if (r.turno == null || r.turno < 0 || +r.turno === pq) posMask[d * NPER + pq] |= mask;
        posW[d] = Math.max(posW[d], w);
      });
      else if (r.tipo === "espalhar") { hasSpread = true; discsOf(r).forEach(function (d) { spL[d].push({ dias: +r.dias || 3, min: +r.minAulas || 0, w: w }); }); }
      else if (r.tipo === "simult" && n > 0) { hasSim = true; discsOf(r).forEach(function (d) { simL[d].push({ n: n, w: w }); }); }
    });
    var secTS = D.secTS || TS.map(function () { return 0; });
    return { D: D, W: W, T: T, P: P, K: K, DK: DK, TS: TS, OVL: OVL, recess: D.recess || [], L: L, nA: nA, tsOf: tsOf, per: per,
      blk: blk, maxDia: maxDia, conc: conc, partners: partners, pares: pares, parA: parA, lr: lr, maxSame: opts.maxSamePerDay || 2, nDisc: nDisc, discIds: discIds,
      minBreak: opts.minBreak == null ? 15 : +opts.minBreak, NPER: NPER,
      maxDiaL: maxDiaL, seqL: seqL, livre: livre, posMask: posMask, posW: posW, secTS: secTS,
      spL: spL, hasSpread: hasSpread, simL: simL, hasSim: hasSim };
  }

  // grade: array T x (nA*5) de índices de aula (-1 = vago)
  function initState(M, grade) {
    var occ = new Int16Array(M.P * M.DK), rec = new Int16Array(M.P * M.DK), dOcc = new Int16Array(M.nDisc * M.DK);
    var g = grade.map(function (r) { return Int32Array.from(r); });
    for (var t = 0; t < M.T; t++) for (var s = 0; s < g[t].length; s++) {
      var li = g[t][s]; if (li < 0) continue;
      var l = M.L[li], x = slotX(M, t, s);
      occ[l.p * M.DK + x]++; if (l.recomp) rec[l.p * M.DK + x]++; dOcc[l.d * M.DK + x]++;
    }
    var ro = new Int16Array(Math.max(1, M.pares.length * 4 * M.DK));
    for (var t2 = 0; t2 < M.T; t2++) for (var s2 = 0; s2 < g[t2].length; s2++) { var li2 = g[t2][s2]; if (li2 < 0) continue; var e = M.lr[li2]; if (!e.length) continue; var x2 = slotX(M, t2, s2);
      for (var q = 0; q < e.length; q += 2) { ro[e[q] * M.DK + x2]++; if (e[q + 1]) ro[(e[q] + 1) * M.DK + x2]++; } }
    return { g: g, occ: occ, rec: rec, dOcc: dOcc, ro: ro };
  }
  function slotX(M, t, s) { var n = M.nA[t], d = (s / n) | 0; return d * M.K + M.tsOf[t][s % n]; }

  // análise do dia do professor pelo horário real
  var _iv = new Int32Array(256), _ivk = new Int32Array(128);
  function diaProf(M, S, p, d) {
    var base = p * M.DK + d * M.K, n = 0, cnt = 0;
    for (var k = 0; k < M.K; k++) { var c = S.occ[base + k]; if (c > 0) { _iv[n * 2] = M.TS[k][0]; _iv[n * 2 + 1] = M.TS[k][1]; _ivk[n] = k; n++; cnt += c; } }
    return { n: n, cnt: cnt };
  }

  // pares que não podem coincidir (o custo conta do lado do 1º professor do par); out = lista de conflitos achados
  function paresCusto(M, S, p, d, out) {
    var lst = M.parA[p], c = 0, K = M.K, DK = M.DK, ro = S.ro; if (!lst.length) return 0;
    for (var i = 0; i < lst.length; i++) { var ri = lst[i], r = M.pares[ri]; if (!(r.dm & (1 << d))) continue;
      var bA = ri * 4 * DK + d * K, bAf = bA + DK, bB = bA + 2 * DK, bBf = bA + 3 * DK;
      for (var k = 0; k < K; k++) { if (ro[bA + k] <= 0) continue; var ov = M.OVL[k];
        for (var j = 0; j < ov.length; j++) { var k2 = ov[j]; if (ro[bB + k2] <= 0) continue;
          if (r.modo === "todas" || ro[bAf + k] > 0 || ro[bBf + k2] > 0) { c += r.w; if (out) out.push({ ri: ri, k: k, k2: k2 }); } } } }
    return c; }
  function profDayCost(M, S, p, d) {
    var W = M.W, K = M.K, base = p * M.DK + d * K, cost = 0;
    var occ = S.occ, rec = S.rec;
    var info = diaProf(M, S, p, d); // _iv tem os intervalos ordenados (TS já é ordenado por início)
    if (info.n === 0) return 0;
    for (var k = 0; k < K; k++) {
      var c = occ[base + k]; if (c <= 0) continue;
      if (c > 1) cost += W.dup * (c - 1);
      var b = M.blk[base + k];
      if (b >= 2 && b !== 5) cost += W.block * c; else if (b === 1 || b === 5) cost += W.pref * c; // 4 = em outra escola (rígido); 5 = pouco tempo para chegar da outra escola (preferência)
      var ov = M.OVL[k];
      for (var j = 0; j < ov.length; j++) { var k2 = ov[j]; if (k2 > k && occ[base + k2] > 0) cost += W.dup; }
    }
    cost += paresCusto(M, S, p, d, null);
    // análise de tempo: janelas no mesmo período, almoço entre períodos e aulas seguidas
    var n = info.n, run = 1, end = _iv[1], kPrev = _ivk[0], sl = M.seqL[p];
    for (var i = 1; i < n; i++) {
      var st = _iv[i * 2], en = _iv[i * 2 + 1], gap = st - end, kc = _ivk[i];
      if (M.secTS[kPrev] === M.secTS[kc]) {
        if (gap >= 40) { var qj = Math.floor((gap + 10) / 50); cost += W.gap * qj; if (qj >= 3) cost += W.janLonga * (qj - 2); }
      } else if (gap < 60) cost += W.cross;
      if (gap < 30) run++; else run = 1;
      for (var z1 = 0; z1 < sl.length; z1++) if (run > sl[z1].n) cost += sl[z1].w;
      if (en > end) { end = en; kPrev = kc; }
    }
    // intervalo: blocos separados por pausas de 1 hora ou mais (almoço, janela longa)
    if (W.intervalo && M.recess.length) {
      var bi = _iv[0], be = _iv[1], mg = 0;
      for (var i2 = 1; i2 <= n; i2++) {
        var st2 = i2 < n ? _iv[i2 * 2] : 1e9, g2 = st2 - be;
        if (i2 < n && g2 < 60) { if (g2 > mg) mg = g2; if (_iv[i2 * 2 + 1] > be) be = _iv[i2 * 2 + 1]; }
        else {
          for (var r = 0; r < M.recess.length; r++) { var w = M.recess[r]; if (bi < w[0] && be > w[1] && mg < M.minBreak) { cost += W.intervalo; break; } }
          if (i2 < n) { bi = st2; be = _iv[i2 * 2 + 1]; mg = 0; }
        }
      }
    }
    var ml = M.maxDiaL[p]; for (var z2 = 0; z2 < ml.length; z2++) if (info.cnt > ml[z2].n) cost += ml[z2].w * (info.cnt - ml[z2].n);
    if (M.conc[p]) cost += W.conc;
    return cost;
  }

  function turmaDayCost(M, S, t, d) {
    var W = M.W, row = S.g[t], n = M.nA[t], cost = 0, pq = M.per[t];
    var ids = [], cnt = [], adj = [], first = [];
    for (var a = 0; a < n; a++) {
      var li = row[d * n + a]; if (li < 0) continue;
      var l = M.L[li], k = ids.indexOf(l.d);
      if (M.posMask[l.d * M.NPER + pq] & (1 << a)) cost += M.posW[l.d];
      if (k < 0) { ids.push(l.d); cnt.push(1); adj.push(0); first.push(li); k = ids.length - 1; } else cnt[k]++;
      if (a > 0) { var pl = row[d * n + a - 1]; if (pl >= 0 && M.L[pl].d === l.d) { adj[k]++; if (a >= n - 2) cost += W.gemLate; } }
    }
    for (var j = 0; j < ids.length; j++) {
      var c = cnt[j], L0 = M.L[first[j]];
      if (c > M.maxSame) cost += W.maxSame * (c - M.maxSame);
      if (L0.nd === 2 && c >= 2) cost += W.twoSameDay;
      if (c >= 2 && adj[j] === 0) cost += W.sep;
      if (L0.mp) { if (c === 1) cost += W.single; else if (c === 2 && adj[j] === 0) cost += W.split; }
    }
    return cost;
  }

  function profWeekCost(M, S, p) {
    if (!M.livre[p]) return 0;
    for (var d = 0; d < 5; d++) { var any = 0, b = p * M.DK + d * M.K; for (var k = 0; k < M.K; k++) any += S.occ[b + k]; if (!any) return 0; }
    return M.livre[p];
  }
  function turmaWeekCost(M, S, t) {
    if (!M.hasSpread) return 0;
    var row = S.g[t], n = M.nA[t], seen = {}, cost = 0;
    for (var s = 0; s < row.length; s++) {
      var li = row[s]; if (li < 0) continue; var l = M.L[li]; if (!M.spL[l.d].length) continue;
      var o = seen[l.d] || (seen[l.d] = { n: 0, days: 0, mask: 0 });
      o.n++; var bit = 1 << ((s / n) | 0); if (!(o.mask & bit)) { o.mask |= bit; o.days++; }
    }
    for (var dd in seen) { var o2 = seen[dd], rl = M.spL[dd]; for (var z = 0; z < rl.length; z++) { var need = Math.min(rl[z].dias, o2.n); if (o2.n >= rl[z].min && o2.days < need) cost += rl[z].w * (need - o2.days); } }
    return cost;
  }
  function simAt(M, S, d, k, disc) {
    if (disc < 0 || !M.simL[disc].length) return 0;
    var c = 0, ov = M.OVL[k], b = disc * M.DK + d * M.K, cost = 0, rl = M.simL[disc];
    for (var j = 0; j < ov.length; j++) c += S.dOcc[b + ov[j]];
    for (var z = 0; z < rl.length; z++) if (c > rl[z].n) cost += rl[z].w * (c - rl[z].n);
    return cost;
  }
  function simLocal(M, S, d, k, disc) { // soma em k e nos horários que se sobrepõem a ele
    if (disc < 0 || !M.simL[disc].length) return 0; var c = 0, ov = M.OVL[k];
    for (var j = 0; j < ov.length; j++) c += simAt(M, S, d, ov[j], disc);
    return c;
  }

  function totalCost(M, S) {
    var c = 0;
    for (var p = 0; p < M.P; p++) { c += profWeekCost(M, S, p); for (var d = 0; d < 5; d++) c += profDayCost(M, S, p, d); }
    for (var t = 0; t < M.T; t++) { c += turmaWeekCost(M, S, t); for (var d2 = 0; d2 < 5; d2++) c += turmaDayCost(M, S, t, d2); }
    if (M.hasSim) for (var di = 0; di < M.nDisc; di++) if (M.simL[di].length) for (var d3 = 0; d3 < 5; d3++) for (var k = 0; k < M.K; k++) c += simAt(M, S, d3, k, di);
    return c;
  }

  function applyMove(M, S, t, s, li, sign) {
    if (li < 0) return;
    var l = M.L[li], x = slotX(M, t, s);
    S.occ[l.p * M.DK + x] += sign; if (l.recomp) S.rec[l.p * M.DK + x] += sign; S.dOcc[l.d * M.DK + x] += sign;
    var e = M.lr[li]; for (var q = 0; q < e.length; q += 2) { S.ro[e[q] * M.DK + x] += sign; if (e[q + 1]) S.ro[(e[q] + 1) * M.DK + x] += sign; }
  }

  function rng(seed) { var x = seed >>> 0 || 1; return function () { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return (x >>> 0) / 4294967296; }; }

  function Solver(M, grade, opts) {
    opts = opts || {};
    this.M = M; this.S = initState(M, grade);
    this.wMove = opts.estavel ? (opts.wMove || 4) : 0;
    this.base = grade.map(function (r) { return r.map(function (li) { return li < 0 ? -1 : M.L[li].d * 4096 + M.L[li].p; }); });
    this.cost = totalCost(M, this.S) + this.moveCostAll();
    this.best = this.cost; this.bestGrid = this.S.g.map(function (r) { return Int32Array.from(r); });
    this.rand = rng(opts.seed || (Date.now() & 0xffffffff));
    this.T0 = opts.T0 || 30; this.T1 = opts.T1 || 0.05;
    this.total = opts.iters || 4000000; this.done = 0;
    this.locked = opts.locked || null;
  }
  Solver.prototype.moveCost = function (t, s) { if (!this.wMove) return 0; var li = this.S.g[t][s], k = li < 0 ? -1 : this.M.L[li].d * 4096 + this.M.L[li].p; return k === this.base[t][s] ? 0 : this.wMove; };
  Solver.prototype.moveCostAll = function () { var c = 0; if (!this.wMove) return 0; for (var t = 0; t < this.M.T; t++) for (var s = 0; s < this.S.g[t].length; s++) c += this.moveCost(t, s); return c; };
  Solver.prototype.local = function (t, profs, days, s1, s2, da, db) {
    var M = this.M, S = this.S, c = turmaWeekCost(M, S, t);
    for (var j0 = 0; j0 < profs.length; j0++) c += profWeekCost(M, S, profs[j0]);
    for (var i = 0; i < days.length; i++) { c += turmaDayCost(M, S, t, days[i]); for (var j = 0; j < profs.length; j++) c += profDayCost(M, S, profs[j], days[i]); }
    if (M.hasSim) {
      var n = M.nA[t], x1 = slotX(M, t, s1), x2 = slotX(M, t, s2), d1 = (x1 / M.K) | 0, k1 = x1 % M.K, d2 = (x2 / M.K) | 0, k2 = x2 % M.K;
      c += simLocal(M, S, d1, k1, da) + simLocal(M, S, d2, k2, da);
      if (db !== da) c += simLocal(M, S, d1, k1, db) + simLocal(M, S, d2, k2, db);
    }
    return c + this.moveCost(t, s1) + this.moveCost(t, s2);
  };
  Solver.prototype.step = function (nIt) {
    var M = this.M, S = this.S, R = this.rand, profs = [], days = [];
    for (var it = 0; it < nIt && this.done < this.total; it++, this.done++) {
      var temp = this.T0 * Math.pow(this.T1 / this.T0, this.done / this.total);
      var t = (R() * M.T) | 0, len = S.g[t].length; if (len < 2) continue;
      var s1 = (R() * len) | 0, s2 = (R() * len) | 0;
      if (s1 === s2) continue;
      if (this.locked && this.locked[t] && (this.locked[t][s1] || this.locked[t][s2])) continue;
      var a = S.g[t][s1], b = S.g[t][s2];
      if (a === b) continue;
      if (a >= 0 && b >= 0 && M.L[a].d === M.L[b].d && M.L[a].p === M.L[b].p) continue;
      var n = M.nA[t], d1 = (s1 / n) | 0, d2 = (s2 / n) | 0;
      days.length = 0; days.push(d1); if (d2 !== d1) days.push(d2);
      profs.length = 0;
      var pa = a >= 0 ? M.L[a].p : -1, pb = b >= 0 ? M.L[b].p : -1;
      [pa, pb].forEach(function (pp) { if (pp < 0) return; if (profs.indexOf(pp) < 0) profs.push(pp); M.partners[pp].forEach(function (q) { if (profs.indexOf(q) < 0) profs.push(q); }); });
      var da = a >= 0 ? M.L[a].d : -1, db = b >= 0 ? M.L[b].d : -1;
      var before = this.local(t, profs, days, s1, s2, da, db);
      applyMove(M, S, t, s1, a, -1); applyMove(M, S, t, s2, b, -1);
      S.g[t][s1] = b; S.g[t][s2] = a;
      applyMove(M, S, t, s1, b, 1); applyMove(M, S, t, s2, a, 1);
      var after = this.local(t, profs, days, s1, s2, da, db), delta = after - before;
      if (delta <= 0 || R() < Math.exp(-delta / temp)) {
        this.cost += delta;
        if (this.cost < this.best) { this.best = this.cost; for (var r = 0; r < M.T; r++) this.bestGrid[r].set(S.g[r]); }
      } else {
        applyMove(M, S, t, s1, b, -1); applyMove(M, S, t, s2, a, -1);
        S.g[t][s1] = a; S.g[t][s2] = b;
        applyMove(M, S, t, s1, a, 1); applyMove(M, S, t, s2, b, 1);
      }
    }
    return this.done >= this.total;
  };
  Solver.prototype.result = function () { return { grade: this.bestGrid.map(function (r) { return Array.from(r); }), custo: this.best }; };

  // ===== Pontos de atenção =====
  function problemas(M, grade) {
    var S = initState(M, grade), out = [], D = M.D;
    function nomeP(p) { return D.profs[p].nome; }
    function hora(k) { return hm(M.TS[k][0]) + "–" + hm(M.TS[k][1]); }
    function tipo(w) { return w >= HARD_MIN ? "rígida" : "preferência"; }
    // professor em dois lugares (mesmo horário ou horários que se sobrepõem)
    var at = {};
    for (var t = 0; t < M.T; t++) for (var s = 0; s < S.g[t].length; s++) { var li = S.g[t][s]; if (li < 0) continue; var x = slotX(M, t, s); (at[M.L[li].p + "|" + x] = at[M.L[li].p + "|" + x] || []).push(D.turmas[t].nome + " (" + M.L[li].disc + ")"); }
    for (var p = 0; p < M.P; p++) for (var d = 0; d < 5; d++) for (var k = 0; k < M.K; k++) {
      var here = at[p + "|" + (d * M.K + k)]; if (!here) continue;
      if (here.length > 1) out.push({ loc: { p: p, d: d, k: k }, tipo: "rígida", txt: nomeP(p) + " está em dois lugares — " + DIAS[d] + ", " + hora(k) + ": " + here.join(" e ") });
      M.OVL[k].forEach(function (k2) { if (k2 <= k) return; var o = at[p + "|" + (d * M.K + k2)]; if (o) out.push({ loc: { p: p, d: d, k: k }, tipo: "rígida", txt: nomeP(p) + " tem aulas com horário sobreposto — " + DIAS[d] + ": " + hora(k) + " " + here.join(", ") + " e " + hora(k2) + " " + o.join(", ") }); });
      var b = M.blk[p * M.DK + d * M.K + k];
      var lc = { p: p, d: d, k: k, b: b };
      if (b === 4) out.push({ loc: lc, tipo: "rígida", txt: nomeP(p) + " (" + here.join(", ") + ") tem aula em outra escola nesse horário — " + DIAS[d] + ", " + hora(k) + " (veja a aba Relatórios › Importar/Exportar)" });
      else if (b === 5) out.push({ loc: lc, tipo: "preferência", txt: nomeP(p) + " (" + here.join(", ") + ") com pouco tempo para chegar da outra escola — " + DIAS[d] + ", " + hora(k) });
      else if (b >= 2) out.push({ loc: lc, tipo: "rígida", txt: nomeP(p) + " (" + here.join(", ") + ") em horário que não pode — " + DIAS[d] + ", " + hora(k) });
      else if (b === 1) out.push({ loc: lc, tipo: "preferência", txt: nomeP(p) + " (" + here.join(", ") + ") em horário que prefere evitar — " + DIAS[d] + ", " + hora(k) });
    }
    // turmas: disciplina repetida no dia, 2 aulas no mesmo dia, posição, espalhar
    for (var t3 = 0; t3 < M.T; t3++) {
      var n = M.nA[t3], seen = {};
      for (var d3 = 0; d3 < 5; d3++) {
        var c = {}, fl = {}, adj = {};
        for (var a = 0; a < n; a++) { var li3 = S.g[t3][d3 * n + a]; if (li3 < 0) continue; var l3 = M.L[li3]; c[l3.disc] = (c[l3.disc] || 0) + 1; fl[l3.disc] = l3;
          if (a > 0) { var pl = S.g[t3][d3 * n + a - 1]; if (pl >= 0 && M.L[pl].d === l3.d) adj[l3.disc] = 1; }
          if (M.posMask[l3.d * M.NPER + M.per[t3]] & (1 << a)) out.push({ loc: { t: t3, d: d3, disc: l3.disc }, tipo: tipo(M.posW[l3.d]), txt: D.turmas[t3].nome + ": " + l3.disc + " na " + (a + 1) + "ª aula de " + DIAS[d3] + " (regra de posição)" });
          if (M.spL[l3.d].length) { var o = seen[l3.disc] || (seen[l3.disc] = { n: 0, mask: 0, d: l3.d }); o.n++; o.mask |= 1 << d3; }
        }
        Object.keys(c).forEach(function (disc) {
          var lt = { t: t3, d: d3, disc: disc };
          if (c[disc] > M.maxSame) out.push({ loc: lt, tipo: "rígida", txt: D.turmas[t3].nome + ": " + c[disc] + " aulas de " + disc + " na " + DIAS[d3] });
          else if (fl[disc].nd === 2 && c[disc] >= 2) {
            var pp = fl[disc].p, dd = 0;
            for (var y = 0; y < 5; y++) { var ok = false; for (var z = 0; z < n; z++) { var bz = M.blk[pp * M.DK + y * M.K + M.tsOf[t3][z]]; if (bz < 2 || bz === 5) { ok = true; break; } } if (ok) dd++; }
            out.push({ loc: lt, tipo: "regra", txt: D.turmas[t3].nome + ": as 2 aulas de " + disc + " no mesmo dia (" + DIAS[d3] + ")" + (dd <= 2 ? " — " + nomeP(pp) + " só pode " + dd + " dia(s) nesse horário" : "") });
          }
          if (M.W.sep && c[disc] >= 2 && !adj[disc]) out.push({ loc: lt, tipo: tipo(M.W.sep), txt: D.turmas[t3].nome + ": " + disc + " duas vezes na " + DIAS[d3] + " sem ser geminada" });
        });
      }
      Object.keys(seen).forEach(function (k7) { var o = seen[k7], days = 0; for (var q = 0; q < 5; q++) if (o.mask & (1 << q)) days++;
        M.spL[o.d].forEach(function (rr) { var need = Math.min(rr.dias, o.n);
          if (o.n >= rr.min && days < need) out.push({ loc: { t: t3, disc: k7 }, tipo: tipo(rr.w), txt: D.turmas[t3].nome + ": as " + o.n + " aulas de " + k7 + " estão em só " + days + " dia(s) (mínimo " + need + ")" }); }); });
    }
    // professor: análise de tempo do dia
    for (var p4 = 0; p4 < M.P; p4++) {
      var worked = 0;
      for (var d4 = 0; d4 < 5; d4++) {
        var r = analiseDia(M, S, p4, d4); if (!r) continue; worked++;
        M.maxDiaL[p4].forEach(function (rr) { if (r.cnt > rr.n) out.push({ loc: { p: p4, d: d4, maxDia: rr.n }, tipo: tipo(rr.w), txt: nomeP(p4) + ": " + r.cnt + " aulas na " + DIAS[d4] + " (máximo " + rr.n + ")" }); });
        M.seqL[p4].forEach(function (rr) { if (r.maxRun > rr.n) out.push({ loc: { p: p4, d: d4 }, tipo: tipo(rr.w), txt: nomeP(p4) + ": " + r.maxRun + " aulas seguidas na " + DIAS[d4] + " (máximo " + rr.n + ")" }); });
        if (M.W.cross && r.almoco) out.push({ loc: { p: p4, d: d4 }, tipo: "preferência", txt: nomeP(p4) + ": menos de 1 hora entre um período e outro (manhã/tarde) na " + DIAS[d4] + " (" + r.almoco + ")" });
        if (M.W.gap) r.janelas.forEach(function (jn) { if (jn[2] >= 4) out.push({ loc: { p: p4, d: d4 }, tipo: "preferência", txt: nomeP(p4) + ": " + jn[2] + " aulas vagas seguidas (janela) na " + DIAS[d4] + " (das " + hm(jn[0]) + " às " + hm(jn[1]) + ")" }); });
        if (M.W.intervalo) r.semIntervalo.forEach(function (bk) { out.push({ loc: { p: p4, d: d4 }, tipo: tipo(M.W.intervalo), txt: nomeP(p4) + ": sem intervalo de " + M.minBreak + " min na " + DIAS[d4] + " (das " + hm(bk[0]) + " às " + hm(bk[1]) + ")" }); });
      }
      if (M.livre[p4] && worked === 5) out.push({ loc: { p: p4 }, tipo: tipo(M.livre[p4]), txt: nomeP(p4) + ": tem aula nos 5 dias (regra: pelo menos 1 dia livre)" });
      for (var d5 = 0; d5 < 5; d5++) { var achou = []; paresCusto(M, S, p4, d5, achou);
        achou.forEach(function (z) { var r = M.pares[z.ri], A = at[r.a + "|" + (d5 * M.K + z.k)] || [], B = at[r.b + "|" + (d5 * M.K + z.k2)] || [];
          out.push({ loc: { p: r.a, q: r.b, d: d5, k: z.k }, tipo: r.w >= HARD_MIN ? "rígida" : "preferência", txt: (r.modo === "recomp" ? "Recomposição: " : "Não podem coincidir: ") + nomeP(r.a) + " (" + A.join(", ") + ") e " + nomeP(r.b) + " (" + B.join(", ") + ") ao mesmo tempo — " + DIAS[d5] + ", " + hora(z.k) + (z.k2 !== z.k ? " e " + hora(z.k2) : "") }); }); }
    }
    if (M.hasSim) for (var d8 = 0; d8 < M.nDisc; d8++) if (M.simL[d8].length) for (var dd8 = 0; dd8 < 5; dd8++) for (var k8 = 0; k8 < M.K; k8++) {
      var c8 = 0; M.OVL[k8].forEach(function (k9) { c8 += S.dOcc[d8 * M.DK + dd8 * M.K + k9]; });
      if (S.dOcc[d8 * M.DK + dd8 * M.K + k8] > 0) M.simL[d8].forEach(function (rr) { if (c8 > rr.n) { var nm = Object.keys(M.discIds).filter(function (x) { return M.discIds[x] === d8; })[0];
        out.push({ loc: { d: dd8, k: k8, disc: nm }, tipo: tipo(rr.w), txt: c8 + " turmas com " + nm + " ao mesmo tempo — " + DIAS[dd8] + ", " + hora(k8) + " (máximo " + rr.n + ")" }); } });
    }
    // tira repetidos
    var vis = {}; return out.filter(function (x) { if (vis[x.txt]) return false; vis[x.txt] = 1; return true; });
  }
  function analiseDia(M, S, p, d) {
    var info = diaProf(M, S, p, d); if (!info.n) return null;
    var n = info.n, iv = []; for (var i = 0; i < n; i++) iv.push([_iv[i * 2], _iv[i * 2 + 1], _ivk[i]]);
    var res = { cnt: info.cnt, maxRun: 1, almoco: "", semIntervalo: [], blocos: [], janelas: [] }, run = 1, bIni = iv[0][0], end = iv[0][1], kEnd = iv[0][2], maxGap = 0, gi = 0, gf = 0;
    function fecha() { var bk = { ini: bIni, fim: end, gap: maxGap, gi: gi, gf: gf, precisa: false };
      for (var r = 0; r < M.recess.length; r++) { var w = M.recess[r]; if (bIni < w[0] && end > w[1]) { bk.precisa = true; break; } }
      if (bk.precisa && maxGap < M.minBreak) res.semIntervalo.push([bIni, end]); res.blocos.push(bk); }
    for (var j = 1; j < n; j++) {
      var st = iv[j][0], en = iv[j][1], gap = st - end;
      if (M.secTS[kEnd] !== M.secTS[iv[j][2]]) { if (gap < 60) res.almoco = hm(end) + " → " + hm(st); }
      else if (gap >= 40) res.janelas.push([end, st, Math.floor((gap + 10) / 50)]);
      if (gap < 30) run++; else run = 1; if (run > res.maxRun) res.maxRun = run;
      if (gap < 60) { if (gap > maxGap) { maxGap = gap; gi = end; gf = st; } if (en > end) { end = en; kEnd = iv[j][2]; } }
      else { fecha(); bIni = st; end = en; kEnd = iv[j][2]; maxGap = 0; }
    }
    fecha();
    return res;
  }

  // ===== Hora-atividade =====
  var HA_TAB = [0, 0, 0, 1, 1, 2, 2, 2, 2, 3, 3, 4, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8, 9, 9, 10, 10];
  function haPorAulas(n) { if (n <= 0) return 0; if (n <= 30) return HA_TAB[n]; return HA_TAB[30] + haPorAulas(n - 30); }
  // fixos: {p: [x...]} HA já colocadas à mão (x = d*K+k) que devem ser mantidas
  function gerarHA(M, grade, profList, cands) {
    var S = initState(M, grade), out = {};
    profList.forEach(function (p) {
      var n = 0; for (var x0 = 0; x0 < M.DK; x0++) n += S.occ[p * M.DK + x0];
      var prof = M.D.profs[p];
      var need = prof.haManual != null && prof.haManual !== "" ? +prof.haManual : haPorAulas(n);
      var busy = new Uint8Array(M.DK), res = [];
      for (var x1 = 0; x1 < M.DK; x1++) if (S.occ[p * M.DK + x1] > 0) busy[x1] = 1;
      var days = [0, 0, 0, 0, 0]; for (var x2 = 0; x2 < M.DK; x2++) if (busy[x2]) days[(x2 / M.K) | 0] = 1;
      var cand = cands || []; // ks que podem ter HA (horários de aula existentes)
      function livre(d, k) { var ov = M.OVL[k]; for (var j = 0; j < ov.length; j++) if (busy[d * M.K + ov[j]]) return false; return true; }
      while (res.length < need) {
        var best = -1, bs = -1e9;
        for (var d = 0; d < 5; d++) for (var ci = 0; ci < cand.length; ci++) {
          var k = cand[ci], x = d * M.K + k;
          var bx = M.blk[p * M.DK + x]; if (!livre(d, k) || (bx >= 2 && bx !== 5)) continue;
          var st = M.TS[k][0], en = M.TS[k][1], before = false, after = false, touch = false, same = false;
          for (var k2 = 0; k2 < M.K; k2++) if (busy[d * M.K + k2] === 1) { var a0 = M.TS[k2][0], a1 = M.TS[k2][1];
            if (Math.abs(a0 - st) < 300) same = true; if (a1 <= st && st - a1 < 240) before = true; if (a0 >= en && a0 - en < 240) after = true; if (Math.abs(a1 - st) <= 20 || Math.abs(en - a0) <= 20) touch = true; }
          var sc = before && after ? 100 : touch ? 60 : same ? 30 : days[d] ? 10 : -50;
          if (bx === 1 || bx === 5) sc -= 20;
          sc -= res.filter(function (r) { return ((r / M.K) | 0) === d; }).length * 3;
          if (sc > bs) { bs = sc; best = x; }
        }
        if (best < 0) break;
        busy[best] = 2; res.push(best); days[(best / M.K) | 0] = 1;
      }
      out[p] = { slots: res, need: need, aulas: n };
    });
    return out;
  }

  // ===== Equipamentos =====
  function gerarEquip(M, grade, cfg) {
    var D = M.D, aloc = [], falta = [], use = {};
    function U(d, k) { var key = d * M.K + k; return use[key] || (use[key] = { inf: 0, bib: 0, ch: 0, tab: 0, rob: 0 }); }
    function soma(d, k, f) { var s = 0; M.OVL[k].forEach(function (k2) { s += U(d, k2)[f]; }); return s; }
    function lim(v) { return v == null || v === "" || isNaN(+v) ? Infinity : +v; }
    var CH = lim(cfg.chrome), TB = lim(cfg.tablet), RB = lim(cfg.robo);
    var regra = {}; (cfg.prioridades || []).forEach(function (p) { regra[p.disc] = p.regra; });
    var robo = {}; (cfg.roboDiscs || []).forEach(function (d) { robo[d] = 1; });
    function ok(nv, nivel) { return nv === "FM" || nv === nivel; }
    function tryFit(t, s, l) {
      var tm = D.turmas[t], x = slotX(M, t, s), d = (x / M.K) | 0, k = x % M.K, u = U(d, k), n = tm.alunos || 30;
      if (ok(cfg.infNivel || "M", tm.nivel) && soma(d, k, "inf") === 0) { u.inf = 1; return { rec: "INF", qtd: 0 }; }
      var bibOk = ok(cfg.biblioNivel || "M", tm.nivel) && soma(d, k, "bib") === 0;
      var need = n, r = 0, c = 0, b = 0;
      if (robo[l.disc]) { r = Math.max(0, Math.min(need, RB - soma(d, k, "rob"))); need -= r; }
      var chAv = cfg.chromeSoBiblio && !bibOk ? 0 : CH - soma(d, k, "ch"); c = Math.min(need, Math.max(0, chAv)); need -= c;
      var tbAv = cfg.tabletSoBiblio && !bibOk ? 0 : TB - soma(d, k, "tab"); b = Math.min(need, Math.max(0, tbAv)); need -= b;
      if (need <= 0) { var pb = (cfg.tabletSoBiblio && b > 0) || (cfg.chromeSoBiblio && c > 0);
        u.rob += r; u.ch += c; u.tab += b; if (pb) u.bib = 1;
        return { rec: (r > 0 ? "ROB" : (b > 0 ? "CROM/TAB" : "CROM")) + (pb ? " (na biblioteca)" : ""), qtd: r + c + b }; }
      if (bibOk) { u.bib = 1; return { rec: "BIBLIO", qtd: 0 }; }
      return null;
    }
    var reqT = [], req1 = {};
    for (var t = 0; t < M.T; t++) for (var s = 0; s < grade[t].length; s++) {
      var li = grade[t][s]; if (li < 0) continue; var l = M.L[li], rg = regra[l.disc];
      if (rg === "todas") reqT.push({ t: t, s: s, l: l }); else if (rg === "1") { var key = t + "|" + l.disc; (req1[key] = req1[key] || []).push({ t: t, s: s, l: l }); }
    }
    function nv(x) { return D.turmas[x.t].nivel === "F" ? 0 : 1; }
    reqT.sort(function (a, b) { return nv(a) - nv(b); });
    reqT.forEach(function (q) { var f = tryFit(q.t, q.s, q.l); if (f) aloc.push(Object.assign({ t: q.t, s: q.s, p: q.l.p, disc: q.l.disc }, f)); else falta.push({ t: q.t, disc: q.l.disc, p: q.l.p, s: q.s, motivo: "sem equipamento livre nesse horário" }); });
    var gs = Object.keys(req1).map(function (k) { return req1[k]; }); gs.sort(function (a, b) { return nv(a[0]) - nv(b[0]); });
    gs.forEach(function (g) {
      var n = M.nA[g[0].t]; g.sort(function (a, b) { return (b.s % n) - (a.s % n); });
      for (var i = 0; i < g.length; i++) { var f = tryFit(g[i].t, g[i].s, g[i].l); if (f) { aloc.push(Object.assign({ t: g[i].t, s: g[i].s, p: g[i].l.p, disc: g[i].l.disc }, f)); return; } }
      falta.push({ t: g[0].t, disc: g[0].l.disc, p: g[0].l.p, s: -1, motivo: "nenhuma aula da semana teve equipamento livre" });
    });
    return { aloc: aloc, falta: falta };
  }

  var api = { buildModel: buildModel, Solver: Solver, totalCost: totalCost, initState: initState, problemas: problemas, analiseDia: analiseDia,
    gerarHA: gerarHA, gerarEquip: gerarEquip, haPorAulas: haPorAulas, slotX: slotX, DEFAULT_W: DEFAULT_W, HARD_MIN: HARD_MIN, DIAS: DIAS, hm: hm };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.Motor = api;
})(this);
