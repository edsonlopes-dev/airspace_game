/* Português (Portugal). Mesmas chaves que i18n-en.js. */
(function (root) {
'use strict';
var P = { II: 'IFR–IFR', IV: 'IFR–VFR', VV: 'VFR–VFR' };
function lc(s) { return /^.[a-zà-ÿ ]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s; }
function fr(t) { return t === 'I' ? 'IFR' : 'VFR'; }
function fl(n) { return 'FL' + ('00' + n).slice(-3); }
function list(a) { return a.length === 1 ? a[0] : a.slice(0, -1).join(', ') + ' e ' + a[a.length - 1]; }
function cls(a) { return (a.length > 1 ? 'nas classes ' : 'na classe ') + list(a); }
var PW = { II: 'dois voos IFR', IV: 'um voo IFR e um voo VFR', VV: 'dois voos VFR' };
var PS = { II: 'os voos IFR de outros voos IFR', IV: 'os voos IFR dos voos VFR', VV: 'os voos VFR de outros voos VFR' };
var RELW = { SEP: 'separação ATC', INFO: 'apenas informação de tráfego', ADV: 'serviço consultivo', NONE: 'apenas ver e evitar' };

var L = {
  P: P, fr: fr, fl: fl, list: list,
  /* ---- perguntas ---- */
  q_perm_who: 'Os dois voos querem operar neste espaço aéreo. Qual deles é permitido aqui?',
  q_perm_solo: 'Este voo VFR quer atravessar este espaço aéreo. O voo VFR é permitido aqui?',
  q_ctl: 'Este espaço aéreo é controlado?',
  q_sep_pair: function (v) { return 'São ' + PW[v.p] + ' em rotas convergentes. O que prestam os serviços de tráfego aéreo entre eles?'; },
  q_sep_yn: function (v) { return 'São ' + PW[v.p] + '. O ATC vai separá-los um do outro?'; },
  q_sep_set_SEP: function (v) { return 'Em que classes o ATC separa ' + PS[v.p] + '?'; },
  q_sep_set_INFO: function (v) { return 'Em que classes há informação de tráfego, mas não separação, entre ' + PW[v.p] + '?'; },
  q_sep_set_ADV: function () { return 'Em que classe os voos IFR recebem serviço consultivo em vez de separação ATC de outros voos IFR?'; },
  q_sep_set_NONE: function (v) { return 'Em que classes ver e evitar é a única proteção entre ' + PW[v.p] + ' (sem separação, sem informação de tráfego do ATC)?'; },
  q_svc: function (v) { return 'Que serviço de tráfego aéreo recebe este voo ' + fr(v.t) + ' neste espaço aéreo?'; },
  q_clr: function (v) { return 'Este voo ' + fr(v.t) + ' precisa de autorização ATC para voar neste espaço aéreo?'; },
  q_clr_who: 'Qual destes voos precisa de autorização ATC neste espaço aéreo?',
  q_rad: function (v) { return 'Este voo ' + fr(v.t) + ' tem de manter contacto rádio bilateral contínuo neste espaço aéreo?'; },
  q_rad_who: 'Qual destes voos tem de manter contacto rádio bilateral contínuo aqui?',
  q_spd_who: 'Os dois voos estão acima de 250 kt IAS abaixo de FL100. Qual deles está a exceder o limite de velocidade?',
  q_entry: function (v) { return 'Este voo ' + fr(v.t) + ' está prestes a entrar neste espaço aéreo. De que precisa?'; },
  q_spd_bust: function (v) { return 'Este voo ' + fr(v.t) + ' segue a ' + v.kt + ' kt IAS a ' + fl(v.fl) + '. Está a exceder o limite de velocidade?'; },
  q_spd_max: function (v) { return 'Qual é o limite de velocidade para este voo ' + fr(v.t) + ' a ' + fl(v.fl) + ' neste espaço aéreo?'; },
  q_ssr: 'Segundo a tabela do curso, o transponder SSR é obrigatório neste espaço aéreo?',
  q_change: function (v) { return 'Este voo ' + fr(v.t) + ' sai da classe ' + v.X + ' e entra na classe ' + v.Y + '. Que afirmação é verdadeira?'; },
  q_mystery: 'Que classe de espaço aéreo corresponde aos dois factos?',
  q_boundary: function (v) { return 'Este voo está exatamente a ' + fl(v.fl) + ', o nível onde a classe ' + v.up + ' (acima) encontra a classe ' + v.lo + ' (abaixo). Que regras se lhe aplicam?'; },
  /* ---- opções ---- */
  yes: 'Sim', no: 'Não',
  o_both: 'Os dois voos', o_onlyI: 'Apenas o voo IFR', o_onlyV: 'Apenas o voo VFR', o_neither: 'Nenhum dos voos',
  o_sep_SEP: 'Separação ATC', o_sep_INFO: 'Informação de tráfego do ATC, mas sem separação',
  o_sep_ADV: 'Serviço consultivo: separação na medida do possível', o_sep_NONE: 'Sem separação: os pilotos veem e evitam',
  o_set: function (v) { return v.set.length === 1 ? 'Apenas ' + v.set[0] : list(v.set); },
  o_svc_ATC: 'Serviço de controlo de tráfego aéreo', o_svc_ADV: 'Serviço consultivo de tráfego aéreo e serviço de informação de voo',
  o_svc_INFOP: 'Informação de tráfego na medida do possível, sem serviço ATC', o_svc_FIS: 'Apenas serviço de informação de voo',
  o_svc_NONE: 'Nenhum serviço de tráfego aéreo',
  o_ent_both: 'Autorização ATC e contacto rádio bilateral', o_ent_rad: 'Contacto rádio bilateral, mas sem autorização',
  o_ent_clr: 'Autorização ATC, mas sem contacto rádio', o_ent_none: 'Nem autorização nem contacto rádio',
  o_spd_none: 'Sem limite de velocidade', o_spd_250: '250 kt IAS', o_spd_200: '200 kt IAS', o_spd_180: '180 kt IAS',
  o_cls: function (v) { return 'Classe ' + v.c; }, o_bnd_cls: function (v) { return 'As regras da classe ' + v.c; },
  o_bnd_both: 'As regras das duas classes em simultâneo', o_bnd_pilot: 'As da classe que o piloto preferir',
  c_clr_lose: 'Deixa de precisar de autorização ATC', c_clr_gain: 'Passa a precisar de autorização ATC',
  c_rad_lose: 'O contacto rádio bilateral deixa de ser obrigatório', c_rad_gain: 'O contacto rádio bilateral passa a ser obrigatório',
  c_spd_gain: 'O limite de 250 kt abaixo de FL100 passa a aplicar-se-lhe', c_spd_lose: 'O limite de 250 kt abaixo de FL100 deixa de se lhe aplicar',
  c_atc_lose: 'Deixa de receber serviço ATC', c_atc_gain: 'Passa a receber serviço ATC',
  c_adv_lose: 'Deixa de receber o serviço consultivo', c_adv_gain: 'Passa a receber serviço consultivo de tráfego aéreo',
  c_sepI_lose: 'O ATC deixa de o separar dos voos IFR', c_sepI_gain: 'O ATC passa a separá-lo dos voos IFR',
  c_sepV_lose: 'O ATC deixa de o separar dos voos VFR', c_sepV_gain: 'O ATC passa a separá-lo dos voos VFR',
  c_vfr_in: 'Os voos VFR passam a poder partilhar o espaço aéreo com ele', c_vfr_out: 'Os voos VFR deixam de ser permitidos à sua volta',
  /* ---- pistas ---- */
  u_ifr_only: 'Só são permitidos voos IFR.', u_vv_sep: 'O ATC separa os voos VFR de outros voos VFR.',
  u_iv_sep: 'O ATC separa os voos IFR dos voos VFR.',
  u_iv_nosep: 'É espaço aéreo controlado, mas o ATC não separa IFR de VFR.',
  u_vv_info: 'Entre dois voos VFR há informação de tráfego, mas não separação.',
  u_ii_sep: 'O ATC separa os voos IFR de outros voos IFR.', u_v_clr: 'Os voos VFR precisam de autorização ATC.',
  u_v_noclr: 'Os voos VFR são permitidos e não precisam de autorização ATC.', u_i_clr: 'Os voos IFR precisam de autorização ATC.',
  u_no_clr: 'Nenhum voo precisa de autorização ATC.', u_spd_vonly: 'O limite de 250 kt aplica-se aos voos VFR, mas não aos IFR.',
  u_spd_all: 'O limite de 250 kt abaixo de FL100 aplica-se a todos os voos.', u_spd_none: 'Nenhum voo tem limite de velocidade de 250 kt.',
  u_adv: 'Os voos IFR recebem serviço consultivo de tráfego aéreo, não ATC.',
  u_fis_all: 'Todos os voos, incluindo os IFR, recebem apenas serviço de informação de voo.',
  u_v_norad: 'Os voos VFR são permitidos e não precisam de contacto rádio.', u_v_rad: 'Os voos VFR têm de manter contacto rádio bilateral.',
  u_ctl: 'É espaço aéreo controlado.', u_unctl: 'É espaço aéreo não controlado.',
  u_infop: 'A informação de tráfego sobre voos VFR só é dada na medida do possível.',
  /* ---- regras ---- */
  rule: function (topic, c) {
    var all = 'Classe ' + c + ': ';
    switch (topic) {
      case 'perm': return c === 'A' ? 'Classe A: apenas voos IFR. O voo VFR não é permitido.' : all + 'são permitidos voos IFR e VFR.';
      case 'ctl': return c < 'F' ? all + 'espaço aéreo controlado. As classes A a E são controladas.' : all + 'espaço aéreo não controlado. As classes F e G não são controladas.';
      case 'sep': return {
        A: 'Classe A: todos os voos são IFR e o ATC separa-os todos entre si.',
        B: 'Classe B: o ATC separa todos os voos entre si, até VFR de VFR.',
        C: 'Classe C: o IFR é separado de IFR e de VFR. Dois voos VFR só recebem informação de tráfego um do outro, com sugestão de manobra evasiva a pedido.',
        D: 'Classe D: só o IFR é separado de IFR. IFR–VFR e VFR–VFR recebem informação de tráfego, com sugestão de manobra evasiva a pedido.',
        E: 'Classe E: só o IFR é separado de IFR. A informação de tráfego sobre VFR é dada na medida do possível, porque o VFR pode nem estar em contacto rádio.',
        F: 'Classe F: não há separação ATC. Os voos IFR participantes recebem serviço consultivo, que separa IFR de IFR na medida do possível. Nada entre IFR–VFR ou VFR–VFR.',
        G: 'Classe G: não há qualquer separação. Os pilotos veem e evitam, com serviço de informação de voo a pedido.' }[c];
      case 'svc': return {
        A: 'Classe A: todos os voos recebem serviço de controlo de tráfego aéreo.',
        B: 'Classe B: todos os voos, IFR e VFR, recebem serviço de controlo de tráfego aéreo.',
        C: 'Classe C: todos os voos recebem serviço ATC. Para o VFR isso significa separação de IFR e informação de tráfego sobre outros VFR.',
        D: 'Classe D: todos os voos recebem serviço ATC. O IFR é separado de IFR; os restantes recebem informação de tráfego.',
        E: 'Classe E: o IFR recebe serviço ATC. O VFR recebe apenas informação de tráfego na medida do possível.',
        F: 'Classe F: o IFR recebe serviço consultivo de tráfego aéreo e serviço de informação de voo. O VFR recebe apenas serviço de informação de voo.',
        G: 'Classe G: todos os voos recebem apenas serviço de informação de voo, a pedido.' }[c];
      case 'clr': return c < 'E' ? all + 'todos os voos estão sujeitos a autorização ATC.'
        : c === 'E' ? 'Classe E: o IFR precisa de autorização ATC. O VFR não.' : all + 'não é necessária autorização ATC. É espaço aéreo não controlado.';
      case 'rad': return c < 'E' ? all + 'o contacto rádio bilateral contínuo é obrigatório para todos os voos.'
        : all + 'o IFR tem de manter contacto rádio bilateral contínuo. O VFR não é obrigado.';
      case 'spd': return c < 'C' ? all + 'não há limite de velocidade para nenhum voo.'
        : c === 'C' ? 'Classe C: 250 kt IAS abaixo de FL100 (10 000 ft AMSL) aplica-se apenas ao VFR. O IFR não tem limite.'
        : all + '250 kt IAS abaixo de FL100 (10 000 ft AMSL) aplica-se a todos os voos.';
      case 'ssr': return c === 'G' ? 'Tabela do curso: o transponder SSR não é obrigatório na classe G.' : 'Tabela do curso: transponder SSR obrigatório na classe ' + c + '.';
    }
    return '';
  },
  x_sep_set: function (v) { return P[v.p] + ': ' + RELW[v.r] + ' ' + cls(v.set) + '.'; },
  x_spd_above: function (v) { return 'A ' + fl(v.fl) + ' o voo não está abaixo de FL100, por isso o limite de 250 kt não se pode aplicar.'; },
  x_spd_slow: function (v) { return v.kt + ' kt não excede 250 kt, por isso não há limite excedido em nenhuma classe.'; },
  x_change: function (v, t) { return 'Para este voo ' + fr(v.t) + ', ' + v.X + ' → ' + v.Y + ' significa: ' + v.all.map(function (k) { return lc(t(k)); }).join('; ') + '.'; },
  x_mystery: function (v) { return 'Só a classe ' + v.c + ' corresponde aos dois factos.'; },
  x_boundary: function (v) { return 'Num nível comum, o voo segue a classe menos restritiva e recebe os serviços dessa classe. A classe ' + v.less + ' é menos restritiva do que a classe ' + v.other + ' (Anexo 11 da ICAO, 2.6).'; },
  /* ---- mnemónicas ---- */
  tip_AB: 'De A para B: a única mudança é a entrada do VFR.',
  tip_ctl: 'De A a E são controladas. F e G não.',
  tip_sep: 'A separação encolhe um passo por classe: B todos, C todos menos VFR–VFR, D e E só IFR–IFR, F consultivo, G nada.',
  tip_svc: 'O serviço ATC acaba com o espaço aéreo controlado: F dá serviço consultivo ao IFR, G dá apenas FIS.',
  tip_clr: 'Autorização: todos de A a D, só o IFR em E, ninguém em F e G.',
  tip_rad: 'O IFR precisa de rádio em todas as classes. O VFR só precisa onde precisa de autorização: B, C e D.',
  tip_spd: 'O limite de 250 kt abrange os voos que o ATC não separa de todos os outros: VFR em C e todos os voos de D para baixo.',
  tip_ssr: 'Esta linha vem da tabela do seu curso. A ICAO não define transponder por classe; são as regras nacionais que o fazem.',
  tip_step_AB: 'A → B: entra o VFR.',
  tip_step_BC: 'B → C: VFR–VFR passa de separação a informação de tráfego, e o VFR ganha o limite de 250 kt.',
  tip_step_CD: 'C → D: IFR–VFR passa de separação a informação de tráfego, e o IFR também ganha o limite de 250 kt.',
  tip_step_DE: 'D → E: o VFR deixa de precisar de autorização e de rádio, por isso a informação de tráfego passa a ser na medida do possível.',
  tip_step_EF: 'E → F: acaba o ATC. O IFR recebe serviço consultivo e ninguém precisa de autorização.',
  tip_step_FG: 'F → G: acaba o serviço consultivo. Só FIS.',
  tip_order: 'A restrição vai de A (a mais restritiva) a G (a menos restritiva).',
  /* ---- etiquetas da cena ---- */
  tag_allowed: 'PERMITIDO', tag_notallowed: 'NÃO PERMITIDO', tag_svc_ATC: 'SERVIÇO ATC', tag_svc_INFOP: 'INFO TRÁFEGO*',
  tag_svc_ADV: 'CONSULTIVO + FIS', tag_svc_FIS: 'SÓ FIS', tag_clr_y: 'AUTORIZAÇÃO', tag_clr_n: 'SEM AUTORIZAÇÃO',
  tag_rad_y: 'RÁDIO', tag_rad_n: 'SEM RÁDIO', tag_spd_bust: 'ACIMA DO LIMITE', tag_spd_free: 'DENTRO DOS LIMITES',
  tag_spd_250: 'MÁX. 250 KT', tag_spd_nolim: 'SEM LIMITE', tag_ssr_y: 'SSR OBRIGATÓRIO', tag_ssr_n: 'SEM SSR',
  /* ---- interface ---- */
  app_name: 'Espaço Aéreo A–G', pitch: 'Domine cada célula da tabela de A a G.', tagline: 'Cenários de tráfego IFR e VFR nas sete classes de espaço aéreo ATS.',
  home_train: 'Treino', home_train_d: '10 cenários escolhidos entre as suas células mais fracas. A regra é explicada depois de cada resposta.',
  home_check: 'Exame', home_check_d: '20 cenários cronometrados com todas as classes e temas. 18 para passar, 20 para um exame perfeito.',
  home_table: 'Tabela de estudo', home_table_d: 'A tabela completa de A a G e o seu domínio de cada célula.',
  mastery: 'Domínio', cells: 'células', ranks: ['Aluno piloto', 'Piloto privado', 'Piloto comercial', 'Comandante de linha aérea', 'Ás do espaço aéreo'],
  best_streak: 'Melhor sequência', best_check: 'Melhor exame', none_yet: 'ainda não realizado',
  tp_perm: 'Tipo de voo', tp_ctl: 'Controlado', tp_sep: 'Separação', tp_svc: 'Serviço', tp_clr: 'Autorização ATC',
  tp_rad: 'Rádio', tp_spd: 'Limite de velocidade', tp_ssr: 'SSR', tp_bonus: 'Bónus',
  ssr_toggle: 'Incluir a linha SSR da tabela do meu curso',
  pts: 'pts', question: 'Pergunta', score: 'Pontos', streak: 'Sequência', next: 'Seguinte', finish: 'Ver resultados', quit: 'Sair',
  correct: 'Correto', wrong: 'Ainda não', timeup: 'Acabou o tempo', memo: 'Para memorizar',
  airspace_class: 'Classe', controlled: 'Controlado', uncontrolled: 'Não controlado', above: 'acima', below: 'abaixo',
  res_train: 'Treino concluído', res_pass: 'Exame aprovado', res_flawless: 'Exame perfeito', res_fail: 'Exame não aprovado',
  res_acc: 'Certas', res_score: 'Pontos', res_gain: 'Dominadas', res_review: 'Reveja as respostas erradas',
  res_none: 'Sem erros. Todas as respostas estavam certas.', your_answer: 'Respondeu', right_answer: 'Resposta certa',
  no_answer: 'sem resposta', again: 'Voar outra vez', home: 'Início',
  tbl_ref: 'Regras', tbl_my: 'O meu domínio', tbl_tap: 'Toque numa célula para ler a regra.',
  lg_SEP: 'separação ATC', lg_INFO: 'informação de tráfego', lg_INFOP: 'informação de tráfego na medida do possível',
  lg_ADV: 'serviço consultivo', lg_NONE: 'sem separação', lg_ATC: 'serviço de controlo de tráfego aéreo', lg_FIS: 'serviço de informação de voo',
  lg_250: '250 kt IAS abaixo de FL100', lg_na: 'sem limite',
  m0: 'Por testar', m1: 'A aprender', m2: 'Dominado', mx: 'Errado',
  about: 'Fontes e notas',
  src: [
    'As regras seguem o Anexo 11 da ICAO (15.ª edição, 2018), Apêndice 4. O Apêndice 4 do SERA (UE) e a tabela do seu curso dão os mesmos valores.',
    'O SSR não é um requisito da ICAO por classe. Essa linha segue a tabela do seu curso: obrigatório de A a F, não em G. São as regras nacionais que o definem. Em Portugal, o AIP GEN 1.5 exige transponder nas classes C e D e para o IFR na classe G.',
    'Rádio em F e G: a ICAO exige contacto rádio bilateral contínuo ao IFR. O SERA (UE) exige apenas que o IFR tenha capacidade de estabelecer contacto, exceto dentro de uma zona de rádio obrigatório.',
    'Limite de velocidade: 250 kt IAS abaixo de 10 000 ft AMSL. Onde a altitude de transição é inferior, usa-se FL100, como neste jogo.',
    'Os Estados podem desviar-se da ICAO. Consulte o AIP do país onde voa.'
  ],
  reset: 'Apagar progresso', reset_q: 'Apagar todo o progresso neste dispositivo?', reset_yes: 'Apagar', cancel: 'Cancelar', close: 'Fechar',
  sound: 'Som', lang: 'English', time: 'Tempo', legend: 'Legenda'
};
root.ASG_I18N = root.ASG_I18N || {}; root.ASG_I18N.pt = L;
if (typeof module !== 'undefined' && module.exports) module.exports = L;
})(typeof window !== 'undefined' ? window : globalThis);
