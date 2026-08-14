/* =========================================================
   焦焦的专属工作台 · 数据全部本地留存(localStorage)
   单文件 HTML 应用逻辑
   ========================================================= */
'use strict';

/* ---------- 存储与日期工具 ---------- */
const store = {
  get(k, def) { try { const v = localStorage.getItem(k); return v == null ? def : JSON.parse(v); } catch (e) { return def; } },
  set(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
};
const pad = n => String(n).padStart(2, '0');
const fmtDate = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const ymd = fmtDate;
const TODAY = fmtDate(new Date());
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/* ---------- 模块定义（桌面 + 11 个功能菜单）---------- */
const MODULES = [
  { id: 'home',     name: '桌面首页', icon: '🏠' },
  { id: 'english',  name: '英语学习', icon: '🔤' },
  { id: 'chinese',  name: '语文课', icon: '📜' },
  { id: 'major',    name: '专业课', icon: '🎓' },
  { id: 'reading',  name: '每日阅读', icon: '📖' },
  { id: 'exercise', name: '锻炼身体', icon: '🏃' },
  { id: 'food',     name: '好好吃饭', icon: '🍱' },
  { id: 'finlearn', name: '理财学习', icon: '💡' },
  { id: 'sleep',    name: '早睡早起', icon: '🌙' },
  { id: 'skincare', name: '护肤打卡', icon: '🧴' },
  { id: 'mood',     name: '心情记录', icon: '💭' },
  { id: 'review',   name: '每日复盘', icon: '📝' },
  { id: 'news',     name: '每日新闻', icon: '📰' },
  { id: 'podcast',  name: '每日播客', icon: '🎙️' },
  { id: 'quotes',   name: '书摘',     icon: '🔖' },
  { id: 'fav',      name: '我的收藏', icon: '⭐' }
];
const MOD_NAME = Object.fromEntries(MODULES.map(m => [m.id, m.name]));

/* 专升本考试目标日（可在考前按当年章程核对调整） */
const EXAM_DATE = '2027-04-05';
function daysToExam() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const ex = new Date(EXAM_DATE + 'T00:00:00');
  return Math.max(0, Math.round((ex - today) / 86400000));
}

/* ---------- 每日激励句（每天更新）---------- */
const QUOTES = [
  { zh: '今天的努力，是幸运的伏笔。', en: 'Today\'s effort is the foreshadowing of luck.' },
  { zh: '你只管努力，剩下的交给时间。', en: 'Just keep working hard, and leave the rest to time.' },
  { zh: '慢慢来，比较快。', en: 'Slow is smooth, and smooth is fast.' },
  { zh: '每一个不曾起舞的日子，都是对生命的辜负。', en: 'Every day that does not dance is a betrayal of life.' },
  { zh: '把平凡的事做好，就是不平凡。', en: 'Doing ordinary things well is extraordinary.' },
  { zh: '乾坤未定，你我皆是黑马。', en: 'The game is not over; we can both be the dark horse.' },
  { zh: '星光不问赶路人，时光不负有心人。', en: 'Stars don\'t ask the traveler, time rewards the earnest.' },
  { zh: '种一棵树最好的时间是十年前，其次是现在。', en: 'The best time to plant a tree was ten years ago; the next best is now.' },
  { zh: '你有多自律，就有多自由。', en: 'How disciplined you are is how free you become.' },
  { zh: '别让未来的你，讨厌现在不努力的自己。', en: 'Don\'t let the future you hate the unworking present you.' },
  { zh: '小步快跑，也能抵达远方。', en: 'Small steps, quick pace, still reach far.' },
  { zh: '保持热爱，奔赴山海。', en: 'Keep the love, and head for the mountains and seas.' },
  { zh: '越努力，越幸运。', en: 'The harder you work, the luckier you get.' },
  { zh: '把焦虑化作行动，把行动变成习惯。', en: 'Turn anxiety into action, and action into habit.' },
  { zh: '今天的汗水，是明天录取通知书的墨水。', en: 'Today\'s sweat is the ink of tomorrow\'s offer letter.' },
  { zh: '不要等待机会，而要创造机会。', en: 'Don\'t wait for opportunity; create it.' },
  { zh: '心之所向，素履以往。', en: 'Go where your heart leads, even in straw sandals.' },
  { zh: '每天进步一点点，顶峰相见。', en: 'Improve a little every day, and meet at the summit.' },
  { zh: '相信积累的力量。', en: 'Believe in the power of accumulation.' },
  { zh: '你坚持的样子，真的很美。', en: 'The way you persist is truly beautiful.' },
  { zh: '前路漫漫亦灿灿。', en: 'The long road ahead is still full of light.' },
  { zh: '行动是治愈焦虑的良药。', en: 'Action is the cure for anxiety.' },
  { zh: '今天的坚持，是明天的底气。', en: 'Today\'s persistence is tomorrow\'s confidence.' },
  { zh: '向着目标，温柔而坚定地走。', en: 'Walk toward your goal, gentle yet firm.' }
];
function dayOfYear(d) {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d - start) / 86400000);
}
const TODAY_QUOTE = QUOTES[dayOfYear(new Date()) % QUOTES.length];

/* ---------- 状态 ---------- */
let current = 'home';
let selMood = null; // 心情选择临时态
let clockTimer = null;

/* 英语学习模块状态 */
let VOCAB = (typeof window !== 'undefined' && window.VOCAB) ? window.VOCAB.slice() : [];
// 合并用户自行导入的词(持久化在本地)
(function () {
  const extra = store.get('wb_vocab_extra', []);
  if (extra && extra.length) VOCAB = VOCAB.concat(extra);
})();
let engView = 'test';       // test=自测 | memo=记单词 | lib=词库 | grammar=长难句·语法 | mine=我的
let engGramView = 'sent';   // sent=长难句 | gram=语法点
let sentView = 'method';    // method=剥洋葱法 | practice=练拆句 | pattern=万能句式 | action=每日行动卡
let sentQueue = [];         // 长难句学习队列
let sentIdx = 0;
let sentReveal = false;
let sentTestMode = false;   // 练拆句·自测模式（只给英文，先写主干再对答案）
let sentTestInput = '';     // 自测模式用户写的主干
let sentTestDone = false;   // 自测模式是否已对答案
let gramCat = '全部';        // 语法点筛选：全部 | 入门 | 基础 | 进阶
let patternFilter = 'all';  // 句式筛选：all | core(必练5句)
let engReveal = false;      // 当前卡片是否翻面
let engLibLevel = '全部';   // 词库级别筛选
let engLibLetter = '全部';  // 词库字母筛选(全部/A-Z)
let engLibPage = 1;         // 词库页码
let engLibSearch = '';      // 词库搜索词
let memoLevel = '全部';      // 记单词级别筛选
let memoQueue = [];         // 记单词浏览队列
let memoIdx = 0;            // 记单词当前下标
let engQueue = [];         // 背单词本轮队列(单词对象)
const PAGE_SIZE = 120;      // 词库每页条数

/* 古诗文默写状态 */
let clQueue = [];
let clReveal = false;
/* 每日阅读子视图 + 管理学原理自测状态 */
let readView = 'books';      // books | culture
let culBook = '全部';
let culQueue = [];
let culReveal = false;
let culCorrect = 0;
let culTotal = 0;
/* 书摘状态 */
let qEra = 'all';     // all | 古 | 今
let qRegion = 'all';  // all | 中 | 外
let qRandom = null;   // 随机一条模式：存一条随机书摘对象；null=列表模式
let homeQuoteRand = null; // 首页书摘小卡：随机抽到的一条；null=当天稳定推荐
/* 推荐书单（按心情本地匹配） */
let bookRecs = null;      // null=显示全部书单；{tags:[], list:[{book,hit:[]}]}
let bookMoodText = '';
let bookLibTag = 'all';   // 全部书单的标签筛选
/* 首页今日待办状态 */
let todoState = null;     // 缓存：{word, sent, read}（null=按当日数据自动算）
/* 真题演练状态（专业课/语文/英语共用一套 runner） */
let quiz = { mod: null, list: [], idx: 0, picks: {}, scored: false };
/* 设置：主题/字号 */
let appFont = 1;
// 锻炼身体模块状态 & 计时器
let exView = 'log';       // log | moves | timer | stretch
let exLeft = 0, exTotal = 0, exTimerId = null;
function fmtTime(s) { s = Math.max(0, s | 0); const m = Math.floor(s / 60); const r = s % 60; return m + ':' + (r < 10 ? '0' : '') + r; }
function startExTimer(secs) { if (exTimerId) clearInterval(exTimerId); exTotal = secs; exLeft = secs; exTimerId = setInterval(() => { exLeft--; if (exLeft <= 0) { exLeft = 0; clearInterval(exTimerId); exTimerId = null; } render(); }, 1000); render(); }
/* 每日理财小知识 */
let finOffset = 0;        // 「换一条看看」的浏览偏移
let finOpen = new Set();  // 理财知识点展开详情的索引集合
let finBookOpen = new Set(); // 理财书摘展开解析的索引集合
let calY = new Date().getFullYear();  // 首页日历当前显示年
let calM = new Date().getMonth();     // 首页日历当前显示月（0-11）
/* 语文课 / 专业课 子视图 */
let chiView = 'test';       // test=自测 | memo=记忆
let chiTestView = 'classic'; // classic=古诗文默写 | lit=文学常识自测
let chiMemoView = 'classic'; // classic=古诗文全篇 | lit=文学常识 | essay=好词好句 | format=作文格式
let litCat = 'all';         // 文学常识分类筛选
let litTestQueue = [];      // 文学常识自测队列
let litTestReveal = false;  // 文学常识自测是否翻转
let clBrowseIdx = 0;        // 古诗文全篇浏览索引
let essayCat = 'w_all';    // 作文好词好句分类筛选（w_=好词, s_=好句）
let majorView = 'test';     // test=自测 | memo=记忆
let majorTestView = 'quiz'; // quiz=题库自测 | concept=核心概念
let majorMemoBook = 'gl';   // gl=管理学原理(邢以群) | ys=马工程管理学
let majorMemoCh = 0;        // 记忆板块当前章节索引
let podCat = '全部';        // 播客分类筛选：全部 | 自我成长 | 女性成长 | 时事热点 | 访谈
let newsOpen = new Set();   // 新闻展开详情的索引集合
/* 全局题库（由 classics.js / culture.js 注入） */
const CLASSICS = (typeof window !== 'undefined' && window.CLASSICS) ? window.CLASSICS.slice() : [];
const CULTURE = (typeof window !== 'undefined' && window.CULTURE) ? window.CULTURE.slice() : [];

/* =========================================================
   渲染入口
   ========================================================= */
const $nav = document.getElementById('nav');
const $top = document.getElementById('topbar');
const $content = document.getElementById('content');

function render() {
  $nav.innerHTML = navHTML();
  $top.innerHTML = topHTML();
  if (current === 'home') {
    $content.innerHTML = homeHTML();
    startClock();
  } else {
    if (clockTimer) { clearInterval(clockTimer); clockTimer = null; }
    $content.innerHTML = moduleHTML(current);
  }
  // 心情临时态在重新渲染后保持高亮
  if (current === 'mood') bindMoodSelection();
}

function navHTML() {
  const items = MODULES.map(m =>
    `<div class="nav-item ${current === m.id ? 'active' : ''}" data-action="nav" data-id="${m.id}">
       <span class="ic">${m.icon}</span><span>${m.name}</span>
     </div>`).join('');
  return `<div class="brand">
      <span class="logo">🌸</span>
      <span><span class="title">焦焦的<br>专属工作台</span><br><span class="sub">专升本 · 吉首大学 · 工商管理</span></span>
    </div>` + items;
}
function topHTML() {
  const d = new Date();
  const t = pad(d.getHours()) + ':' + pad(d.getMinutes());
  return `<div class="mod">${MOD_NAME[current] || '工作台'}</div>
          <div class="clock-mini">🕒 ${TODAY} ${t}</div>`;
}
function startClock() {
  if (clockTimer) clearInterval(clockTimer);
  const tick = () => {
    const d = new Date();
    const el = document.getElementById('clock');
    if (el) el.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    const dm = document.getElementById('date-mini');
    if (dm) dm.textContent = TODAY + ' ' + ['周日','周一','周二','周三','周四','周五','周六'][d.getDay()];
  };
  tick();
  clockTimer = setInterval(tick, 1000);
}

/* =========================================================
   桌面首页
   ========================================================= */
function greeting() {
  const h = new Date().getHours();
  if (h < 6) return '夜深了';
  if (h < 11) return '早上好';
  if (h < 13) return '中午好';
  if (h < 18) return '下午好';
  return '晚上好';
}
function checkinStreak() {
  let n = 0;
  const d = new Date();
  while (true) {
    const key = 'wb_checkin_' + fmtDate(d);
    if (store.get(key, false)) { n++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return n;
}
function readStreak() {
  let n = 0;
  const d = new Date();
  while (true) {
    const k = 'wb_reading_min_' + fmtDate(d);
    if ((store.get(k, 0) || 0) > 0) { n++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return n;
}
/* 学习进度条（首页三科概览用） */
function progRow(title, sub, done, total, extra) {
  const pct = total ? Math.round(done / total * 100) : 0;
  return `
  <div class="prog">
    <div class="prog-head"><span>${esc(title)}</span><span class="prog-num">${done}/${total} · ${pct}%</span></div>
    <div class="bar"><div class="bar-fill" style="width:${pct}%"></div></div>
    ${extra ? `<div class="muted mt8">${esc(extra)}</div>` : ''}
  </div>`;
}
/* ---------- 首页今日任务 / 完成进度 ---------- */
function taskRowHTML(t, dates) {
  const doneToday = dates.includes(TODAY);
  return `
  <div class="item">
    <div class="main">
      <div class="t">${esc(t.name)}</div>
      <div class="s">${doneToday ? '✅ 今日已完成' : '今日待完成'} · 累计 ${dates.length} 天</div>
    </div>
    <div class="acts">
      ${doneToday
        ? `<button class="btn ghost sm" data-action="task-undo" data-id="${t.id}">撤销</button>`
        : `<button class="btn sm" data-action="task-done" data-id="${t.id}">完成 ✓</button>`}
      <button class="btn danger sm" data-action="task-del" data-id="${t.id}">✕</button>
    </div>
  </div>`;
}
function taskSectionHTML() {
  const tasks = store.get('wb_tasks', []);
  const taskDone = store.get('wb_task_done', {});
  const last7 = [];
  for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); last7.push(fmtDate(d)); }
  const perDay = last7.map(d => tasks.filter(t => (taskDone[t.id] || []).includes(d)).length);
  const totalDone = tasks.reduce((a, t) => a + (taskDone[t.id] || []).length, 0);
  const maxDay = Math.max(1, ...perDay);
  const taskCard = `
  <div class="card">
    <div class="card-title">📋 今日任务</div>
    ${tasks.length ? tasks.map(t => taskRowHTML(t, taskDone[t.id] || [])).join('') : '<div class="empty">还没有任务，下面添加一个吧～</div>'}
    <div class="row mt12" style="align-items:flex-end;gap:8px">
      <div style="flex:1">
        <label class="fld">任务名（可含目标，如「背100个单词」）</label>
        <input id="task-name" placeholder="例如：背100个单词">
      </div>
      <button class="btn" data-action="task-add">添加</button>
    </div>
  </div>`;
  const chartCard = `
  <div class="card">
    <div class="card-title">📈 完成进度</div>
    <div class="row" style="align-items:flex-end;gap:10px;height:130px">
      ${perDay.map((c, i) => `
        <div style="flex:1;text-align:center;display:flex;flex-direction:column;justify-content:flex-end;height:100%">
          <div style="font-size:11px;font-weight:700;color:var(--pink-600);height:14px">${c}</div>
          <div style="height:${c ? Math.max(10, Math.round(c / maxDay * 92)) : 4}px;background:linear-gradient(180deg,var(--pink-400),var(--pink-500));border-radius:8px 8px 4px 4px;margin:2px auto 0;width:62%"></div>
          <div class="muted" style="font-size:10px;margin-top:4px">${last7[i].slice(5).replace('-', '/')}</div>
        </div>`).join('')}
    </div>
    <div class="row mt12">
      <div class="pill"><div class="k">累计完成</div><div class="v">${totalDone}</div></div>
      <div class="pill"><div class="k">今日已完成</div><div class="v">${perDay[6]}</div></div>
      <div class="pill"><div class="k">任务数</div><div class="v">${tasks.length}</div></div>
    </div>
    <div class="muted mt12">每完成一项自动记录，不与「英语学习」进度混在一起；上方柱状图为近 7 天每日完成数。</div>
  </div>`;
  return taskCard + chartCard;
}
/* ---------- 首页备考日历（月份网格 + 每月/每周侧重点）---------- */
function isoWeek(d) {
  const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (dt.getUTCDay() + 6) % 7;
  dt.setUTCDate(dt.getUTCDate() - dayNum + 3);
  const firstThu = new Date(Date.UTC(dt.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((dt - firstThu) / 86400000 - 3 + ((firstThu.getUTCDay() + 6) % 7)) / 7);
}
function monthFocusFallback(yyyymm) {
  const [y, m] = yyyymm.split('-').map(Number);
  const target = 2027 * 12 + 3; // 2027-04
  const diff = target - (y * 12 + (m - 1));
  if (diff <= 0) return { theme: '考试月 · 临门一脚', focus: ['看错题本，不再做新题', '调作息、备证件', '稳住心态，不乱操作'] };
  if (diff <= 2) return { theme: '冲刺期 · 作文与模考', focus: ['全科模考查漏', '作文模板熟背', '理财保持记账 + 定投'] };
  if (diff <= 6) return { theme: '强化期 · 分科突破', focus: ['弱科专项 + 真题训练', '英语长难句拆解', '理财学资产配置'] };
  return { theme: '基础积累期 · 打地基', focus: ['系统背词 + 通读教材', '建立记账与储蓄习惯', '读一本理财入门书'] };
}
function homeCalendarHTML() {
  const plan = window.STUDY_PLAN || { months: {}, weekly: [] };
  const now = new Date();
  const y = calY, m = calM;
  const first = new Date(y, m, 1);
  const startDay = first.getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const isCur = (y === now.getFullYear() && m === now.getMonth());
  const today = now.getDate();
  const ex = new Date(EXAM_DATE + 'T00:00:00');
  const exM = ex.getMonth(), exD = ex.getDate();
  const showExam = (y === ex.getFullYear() && m === exM);
  const monthKey = y + '-' + pad(m + 1);
  const mp = plan.months[monthKey] || monthFocusFallback(monthKey);
  const wk = plan.weekly.length ? plan.weekly[isoWeek(now) % plan.weekly.length] : null;
  const head = ['日', '一', '二', '三', '四', '五', '六'];
  let cells = '';
  for (let i = 0; i < startDay; i++) cells += '<div style="height:30px"></div>';
  for (let d = 1; d <= days; d++) {
    let cls = 'display:flex;align-items:center;justify-content:center;height:30px;border-radius:8px;font-size:13px;';
    let label = d;
    if (isCur && d === today) cls += 'background:linear-gradient(120deg,var(--pink-400),var(--pink-500));color:#fff;font-weight:700;';
    else cls += 'color:var(--ink);';
    if (showExam && d === exD) label = '<span style="display:inline-flex;flex-direction:column;align-items:center;line-height:1.1"><span style="font-size:9px">🎓</span>' + d + '</span>';
    cells += `<div style="${cls}">${label}</div>`;
  }
  return `
  <div class="card">
    <div class="card-title">📅 备考日历</div>
    <div class="row" style="justify-content:space-between;align-items:center">
      <button class="btn sm ghost" data-action="cal-prev">‹</button>
      <div style="font-weight:700">${y} 年 ${m + 1} 月</div>
      <button class="btn sm ghost" data-action="cal-next">›</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-top:10px;text-align:center">
      ${head.map(h => `<div style="font-size:12px;color:#bbb;padding:2px 0">${h}</div>`).join('')}
      ${cells}
    </div>
    <div class="muted mt10">🎓 标注 = 专升本考试日（${EXAM_DATE}）· 距离还有 <b style="color:var(--pink-600)">${daysToExam()}</b> 天</div>
  </div>
  <div class="card">
    <div class="card-title">🎯 本月侧重点 · ${esc(mp.theme)}</div>
    ${(mp.focus || []).map(f => `<div class="item" style="padding:8px 0;border:none"><div class="main"><div class="s" style="line-height:1.6">· ${esc(f)}</div></div></div>`).join('')}
  </div>
  ${wk ? `<div class="card">
    <div class="card-title">🗓 本周侧重点 · ${esc(wk.t)}</div>
    <div class="s" style="line-height:1.7;color:var(--ink)">${esc(wk.d)}</div>
  </div>` : ''}`;
}
function goalCardHTML() {
  return `
  <div class="card goal-card">
    <div class="card-title">🎯 我的目标 · 吉首大学 · 工商管理</div>
    <div class="row" style="gap:10px;flex-wrap:wrap">
      <div class="pill"><div class="k">大学英语</div><div class="v">150分</div></div>
      <div class="pill"><div class="k">大学语文</div><div class="v">150分</div></div>
      <div class="pill"><div class="k">管理学原理</div><div class="v">200分</div></div>
      <div class="pill" style="background:#EAF7F1"><div class="k">总分</div><div class="v">500分</div></div>
    </div>
    <div class="row mt12" style="gap:10px;flex-wrap:wrap">
      <div class="pill" style="background:#FFF6F8"><div class="k">2026招生计划</div><div class="v">74人</div></div>
      <div class="pill" style="background:#FFF6F8"><div class="k">报名人数</div><div class="v">408人</div></div>
      <div class="pill" style="background:#FFF6F8"><div class="k">录取率</div><div class="v">18.14%</div></div>
      <div class="pill" style="background:#FFF6F8"><div class="k">最低录取分</div><div class="v">346</div></div>
    </div>
    <div class="note mt12">📌 建议目标总分 <b>360+</b>（英语105 / 语文110 / 管理学原理145），比2026录取线346留安全余量。考试科目以报考当年招生章程为准。</div>
  </div>`;
}

function homeHTML() {
  const checked = store.get('wb_checkin_' + TODAY, false);
  const streak = checkinStreak();
  // 概览数据
  const eng = store.get('wb_english_today_' + TODAY, 0);
  const readMin = store.get('wb_reading_min_' + TODAY, 0);
  const exList = store.get('wb_exercise_' + TODAY, []);
  const exMin = exList.reduce((a, x) => a + (x.min || 0), 0);
  const foodList = store.get('wb_food_' + TODAY, []);
  const foodCal = foodList.reduce((a, x) => a + (x.cal || 0), 0);
  const mood = store.get('wb_mood_' + TODAY, null);
  const moodIc = mood ? mood.icon : '—';
  const sleepRec = store.get('wb_sleep_' + TODAY, null);
  const sleepDur = sleepRec ? sleepRec.duration : '—';
  // 三科学习进度
  const engKnown = store.get('wb_eng_known', []).length;
  const engTotal = VOCAB.length;
  const engToday = store.get('wb_english_today_' + TODAY, 0);
  const clDone = store.get('wb_cl_done', []).length;
  const clTotal = CLASSICS.length;
  const culDone = store.get('wb_cul_done', []).length;
  const culTotal = CULTURE.length;

  return `
  <div class="hero">
    <div class="hi">${greeting()}，焦焦 🍊</div>
    <h1>距离专升本考试还有 <span id="cd">${daysToExam()}</span> 天</h1>
    <div class="clock" id="clock">--:--:--</div>
    <div class="date" id="date-mini"></div>
    <div class="quote">💬 ${TODAY_QUOTE.zh}<span class="en">"${TODAY_QUOTE.en}"</span></div>
    <div class="checkin ${checked ? 'done' : ''}">
      <button class="btn" data-action="checkin">${checked ? '✅ 今日已打卡' : '☀️ 点击打卡'}</button>
      <span class="streak">🔥 连续打卡 ${streak} 天</span>
      <span class="streak" style="background:linear-gradient(120deg,#C9A8E9,#9C6AD6);color:#fff;border-color:transparent">📖 连续阅读 ${readStreak()} 天</span>
    </div>
  </div>

  <div class="card">
    <div class="card-title">📊 今日概览</div>
    <div class="grid">
      <div class="stat"><div class="ic">🔤</div><div class="k">背单词</div><div class="v">${eng}</div></div>
      <div class="stat"><div class="ic">📖</div><div class="k">阅读(分)</div><div class="v">${readMin}</div></div>
      <div class="stat"><div class="ic">🏃</div><div class="k">运动(分)</div><div class="v">${exMin}</div></div>
      <div class="stat"><div class="ic">🍱</div><div class="k">摄入(千卡)</div><div class="v">${foodCal}</div></div>
      <div class="stat"><div class="ic">💭</div><div class="k">今日心情</div><div class="v">${moodIc}</div></div>
      <div class="stat"><div class="ic">😴</div><div class="k">睡眠时长</div><div class="v">${sleepDur}<span style="font-size:12px;font-weight:500">${sleepDur !== '—' ? ' 小时' : ''}</span></div></div>
    </div>
  </div>

  ${homeTodoHTML()}

  ${homeCalendarHTML()}

  ${goalCardHTML()}

  ${taskSectionHTML()}

  ${homeNewsHTML()}

  ${homePodcastHTML()}

  ${homeQuoteHTML()}

  ${homeDailySentHTML()}

  ${homeSettingsHTML()}

  <div class="card">
    <div class="card-title">📚 三科学习进度</div>
    ${progRow('🔤 大学英语（150分）', '词汇掌握', engKnown, engTotal, '今日已背 ' + engToday + ' 词')}
    ${progRow('📜 大学语文（150分）', '古诗文默写', clDone, clTotal, '文学常识 ' + (store.get('wb_lit_done', []).length) + '/' + (window.LIT || []).length)}
    ${progRow('🎓 管理学原理（200分）', '题库自测', culDone, culTotal, '章节背诵 ' + (store.get('wb_major_memo_done', []).length) + '/' + (((window.MAJOR || {}).gl || []).length + ((window.MAJOR || {}).ys || []).length) + ' 章')}
  </div>

  <div class="card">
    <div class="card-title">🌟 快捷入口</div>
    <div class="row">
      ${MODULES.filter(m => m.id !== 'home').map(m =>
        `<div class="chip" data-action="nav" data-id="${m.id}" style="cursor:pointer">${m.icon} ${m.name}</div>`).join('')}
    </div>
  </div>`;
}

/* 首页：今日待办（自动点亮 + 手动勾选） */
function homeTodoHTML() {
  const eng = store.get('wb_english_today_' + TODAY, 0);
  const readMin = store.get('wb_reading_min_' + TODAY, 0);
  const sentAuto = !!store.get('wb_eng_action_auto_' + TODAY, false);
  const podMin = store.get('wb_podcast_min_' + TODAY, 0);
  const base = { word: eng >= 30, read: readMin >= 20, sent: sentAuto };
  const ov = store.get('wb_todo_' + TODAY, {}) || {};
  const st = Object.assign({}, base, ov);
  const items = [
    { key: 'word', ic: '🔤', label: '背单词 30 个', done: st.word },
    { key: 'sent', ic: '🧅', label: '拆长难句 3 句', done: st.sent },
    { key: 'read', ic: '📖', label: '阅读 20 分钟', done: st.read },
    { key: 'pod', ic: '🎙️', label: `听播客 ${podMin} 分钟`, done: podMin >= 20 }
  ];
  const done = items.filter(i => i.done).length;
  return `
  <div class="card">
    <div class="card-title">✅ 今日待办 <span class="muted" style="font-weight:500">${done}/4</span></div>
    ${items.map(i => `
      <div class="item" style="cursor:pointer" data-action="todo-toggle" data-key="${i.key}">
        <div class="main"><div class="t"><span style="display:inline-block;width:22px">${i.done ? '✅' : '⬜'}</span> ${i.ic} ${esc(i.label)}${i.done ? ' <span class="chip" style="background:#E3F4E1;color:#2E7D32;border-color:transparent;font-size:11px">已完成</span>' : ''}</div></div>
      </div>`).join('')}
    <div class="muted mt8">带 ✓ 的按你当日数据自动点亮（背够30词/读够20分/进过行动卡/听够20分播客）；点一下可手动勾选或取消。</div>
  </div>`;
}

/* 首页：每日一句长难句 */
function pickDailySentence() {
  const arr = window.ENG_SENTENCES || [];
  if (!arr.length) return null;
  const d = new Date();
  const dayIdx = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
  return arr[dayIdx % arr.length];
}
function homeDailySentHTML() {
  const s = pickDailySentence();
  if (!s) return '';
  return `
  <div class="card">
    <div class="card-title">📜 每日一句 · 长难句</div>
    <div class="t" style="font-size:15px;font-weight:700;color:var(--pink-600);line-height:1.7">${esc(s.en)} <button class="spk" data-action="eng-sentspeak" data-line="${esc(s.en)}" title="朗读">🔊</button></div>
    <div class="s mt8" style="line-height:1.7">${esc(s.zh)}</div>
    <div class="row mt8"><span class="muted">每天一句，用剥洋葱法（找主干→剥修饰→调语序）读懂它。</span><span class="chip" data-action="nav" data-id="english" style="cursor:pointer;margin-left:auto">去练习 ›</span></div>
  </div>`;
}

/* 首页：显示设置（字号） */
function homeSettingsHTML() {
  return `
  <div class="card">
    <div class="card-title">🔠 字号设置</div>
    <div class="row mt4" style="align-items:center;gap:10px">
      <span class="muted">字号</span>
      <button class="btn sm ghost" data-action="font-dec">A−</button>
      <span class="chip" style="min-width:56px;text-align:center">${Math.round(appFont * 100)}%</span>
      <button class="btn sm ghost" data-action="font-inc">A＋</button>
    </div>
    <div class="muted mt8">设置自动保存，下次打开仍生效。</div>
  </div>`;
}

/* ---------- 每日新闻（联网抓取+总结，可点开看详情解读）---------- */
function newsHTML() {
  const d = window.DAILY_NEWS;
  if (!d || !d.items || !d.items.length) {
    return `<div class="card">
      <div class="card-title">📰 每日新闻热点</div>
      <div class="empty">今天还没有新闻摘要。在对话框对我说「更新今日新闻」，我会联网抓取并生成；或等每日自动任务在早上自动更新。</div>
    </div>`;
  }
  const catColor = { '国内': '#EC6A92', '国际': '#9C6AD6', '教育': '#3FA796' };
  const items = d.items.map((it, i) => {
    const open = newsOpen.has(i);
    return `
    <div class="item" style="cursor:pointer" data-action="news-toggle" data-idx="${i}">
      <div class="main">
        <div>
          <span class="chip" style="background:${catColor[it.category] || '#FADADD'};color:#fff;border-color:transparent;margin-right:6px">${esc(it.category)}</span>
          <span class="t">${esc(it.title)}</span>
          <span style="margin-left:4px;color:var(--pink-500);font-size:12px">${open ? '▾' : '▸'}</span>
        </div>
        <div class="s mt8">${esc(it.summary)}</div>
        ${open && it.detail ? `<div class="note mt8">${esc(it.detail)}</div>` : ''}
        <div class="muted mt8">来源：${esc(it.source || '未知')}${open ? '' : ' · 点此看详情解读'}</div>
      </div>
    </div>`;
  }).join('');
  return `<div class="card">
    <div class="card-title">📰 每日新闻热点</div>
    <div class="muted mb12">更新于 ${esc(d.date || '未知')} · 联网抓取 + AI 总结 · 点每条标题展开看详情解读</div>
    ${items}
    <div class="muted mt12">${esc(d.note || '')}</div>
  </div>`;
}

/* ---------- 书摘（古今中外，带出处+注释，可按古今/中外筛选）---------- */
function quotesHTML() {
  const all = window.QUOTES || [];
  // 随机一条模式：只显示抽中的那一条
  if (qRandom) {
    return `
    <div class="card">
      <div class="card-title">🎲 随机书摘</div>
      <div class="muted">盲抽一条，说不定就撞见想读的书 ✨</div>
    </div>
    ${quoteItemHTML(qRandom)}
    <div class="card">
      <div class="row" style="gap:8px">
        <button class="btn" data-action="quote-random">🎲 换一条</button>
        <button class="btn ghost" data-action="quote-list">← 返回全部</button>
      </div>
    </div>`;
  }
  const list = all.filter(q =>
    (qEra === 'all' || q.era === qEra) &&
    (qRegion === 'all' || q.region === qRegion));
  const eraBar = [['all', '全部'], ['古', '古代'], ['今', '现代']].map(([v, n]) =>
    `<div class="chip ${qEra === v ? 'on' : ''}" data-action="quote-era" data-v="${v}" style="cursor:pointer">${n}</div>`).join('');
  const regionBar = [['all', '全部'], ['中', '中国'], ['外', '外国']].map(([v, n]) =>
    `<div class="chip ${qRegion === v ? 'on' : ''}" data-action="quote-region" data-v="${v}" style="cursor:pointer">${n}</div>`).join('');
  const cards = list.length ? list.map(quoteItemHTML).join('') : '<div class="empty">没有符合条件的书摘。</div>';
  return `
  <div class="card">
    <div class="card-title">🔖 书摘 · 古今中外</div>
    <div class="row" style="gap:8px;align-items:center">
      <span class="muted">年代</span>${eraBar}
      <span class="chip" data-action="quote-random" style="cursor:pointer;margin-left:auto;background:linear-gradient(120deg,var(--pink-400),var(--pink-500));color:#fff;border-color:transparent">🎲 随机一条</span>
    </div>
    <div class="row mt8" style="gap:8px;align-items:center">
      <span class="muted">国别</span>${regionBar}
    </div>
    <div class="muted mt12">共 ${all.length} 条 · 当前显示 ${list.length} 条 · 每条标注出处，难懂的附注释 · 点「微信读书」可搜原书</div>
  </div>
  ${cards}`;
}

/* 首页新闻头条小卡（只显示今日前 3 条，点跳转到新闻模块看详情） */
function homeNewsHTML() {
  const d = window.DAILY_NEWS;
  if (!d || !d.items || !d.items.length) {
    return `<div class="card">
      <div class="card-title">📰 今日新闻头条</div>
      <div class="empty">今天还没有新闻摘要。点「每日新闻」模块或说「更新今日新闻」即可联网生成。</div>
    </div>`;
  }
  const catColor = { '国内': '#EC6A92', '国际': '#9C6AD6', '教育': '#3FA796' };
  const top = d.items.slice(0, 3).map(it => `
    <div class="item" style="cursor:pointer" data-action="nav" data-id="news">
      <div class="main">
        <div>
          <span class="chip" style="background:${catColor[it.category] || '#FADADD'};color:#fff;border-color:transparent;margin-right:6px">${esc(it.category)}</span>
          <span class="t">${esc(it.title)}</span>
        </div>
        <div class="s mt8">${esc(it.summary)}</div>
      </div>
    </div>`).join('');
  return `<div class="card">
    <div class="card-title">
      📰 今日新闻头条
      <span style="float:right;font-size:12px;font-weight:500;color:var(--pink-500);cursor:pointer" data-action="nav" data-id="news">点开看详情 →</span>
    </div>
    <div class="muted mb12">更新于 ${esc(d.date || '未知')} · 早 8 点自动更新 · 点新闻跳转看详情解读</div>
    ${top}
  </div>`;
}

/* ---------- 每日播客（接小宇宙，每日推荐+记录收听时长）---------- */
function pickDailyPodcast() {
  const arr = window.PODCASTS || [];
  if (!arr.length) return null;
  const dayIdx = Math.floor(Date.now() / 86400000);
  return arr[dayIdx % arr.length];
}
/* 首页播客小卡：今日推荐 + 收听时长记录 */
function homePodcastHTML() {
  const p = pickDailyPodcast();
  const min = store.get('wb_podcast_min_' + TODAY, 0);
  const catColor = { '自我成长': '#9C6AD6', '女性成长': '#EC6A92', '时事热点': '#3FA796', '访谈': '#E89B3C' };
  const rec = p ? `
    <div class="item" style="cursor:pointer">
      <div class="main">
        <div>
          <span class="chip" style="background:${catColor[p.cat] || '#FADADD'};color:#fff;border-color:transparent;margin-right:6px">${esc(p.cat)}</span>
          <span class="t">${esc(p.title)} · ${esc(p.host)}</span>
        </div>
        <div class="s mt8">${esc(p.desc)}</div>
        <div class="muted mt8">建议时长 ${p.dur} 分钟</div>
      </div>
    </div>` : '<div class="empty">暂无推荐播客。</div>';
  return `<div class="card">
    <div class="card-title">
      🎙️ 今日播客推荐
      <span style="float:right;font-size:12px;font-weight:500;color:var(--pink-500);cursor:pointer" data-action="nav" data-id="podcast">全部播客 →</span>
    </div>
    <div class="muted mb12">每天推荐一档 · 点小宇宙图标直接跳 App 收听</div>
    ${rec}
    ${p ? `<a class="btn" href="${esc(p.url)}" target="_blank" rel="noopener" style="display:inline-block;margin-top:10px;text-decoration:none">🎧 去小宇宙收听</a>` : ''}
    <div class="row mt12" style="align-items:center;gap:8px">
      <span class="muted">今日已听</span>
      <button class="btn sm ghost" data-action="pod-min-dec">−</button>
      <span class="chip" style="min-width:60px;text-align:center">${min} 分</span>
      <button class="btn sm ghost" data-action="pod-min-inc">+</button>
      <button class="btn sm" data-action="pod-done" style="margin-left:auto">听完 ✓</button>
    </div>
  </div>`;
}
/* 播客模块：分类筛选 + 列表 + 收听时长汇总 */
function podcastHTML() {
  const all = window.PODCASTS || [];
  const catColor = { '自我成长': '#9C6AD6', '女性成长': '#EC6A92', '时事热点': '#3FA796', '访谈': '#E89B3C' };
  const cats = [['全部', '全部'], ['自我成长', '自我成长'], ['女性成长', '女性成长'], ['时事热点', '时事热点'], ['访谈', '访谈']];
  const bar = cats.map(([v, n]) =>
    `<div class="chip ${podCat === v ? 'on' : ''}" data-action="pod-cat" data-v="${v}" style="cursor:pointer">${n}</div>`).join('');
  const list = all.filter(p => podCat === '全部' || p.cat === podCat);
  const items = list.length ? list.map(p => `
    <div class="item">
      <div class="main">
        <div>
          <span class="chip" style="background:${catColor[p.cat] || '#FADADD'};color:#fff;border-color:transparent;margin-right:6px">${esc(p.cat)}</span>
          <span class="t">${esc(p.title)}</span>
          <span class="muted" style="margin-left:6px;font-size:12px">${esc(p.host)}</span>
        </div>
        <div class="s mt8">${esc(p.desc)}</div>
        <div class="row mt8" style="align-items:center;gap:8px">
          <span class="muted">建议 ${p.dur} 分钟</span>
          <a class="btn sm" href="${esc(p.url)}" target="_blank" rel="noopener" style="text-decoration:none">🎧 小宇宙收听</a>
        </div>
      </div>
    </div>`).join('') : '<div class="empty">没有该分类的播客。</div>';
  // 近7天收听汇总
  const week = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = fmtDate(d);
    week.push({ key, min: store.get('wb_podcast_min_' + key, 0), label: ('日一二三四五六')[d.getDay()] });
  }
  const weekTotal = week.reduce((s, w) => s + w.min, 0);
  const weekMax = Math.max(1, ...week.map(w => w.min));
  const bars = week.map(w => `
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
      <div style="height:${Math.round(w.min / weekMax * 60)}px;width:18px;background:linear-gradient(180deg,var(--pink-400),var(--pink-500));border-radius:4px 4px 0 0;min-height:2px" title="${w.min}分"></div>
      <div class="muted" style="font-size:11px">${w.min}</div>
      <div class="muted" style="font-size:11px">${w.label}</div>
    </div>`).join('');
  return `
  <div class="card">
    <div class="card-title">🎙️ 每日播客</div>
    <div class="muted mb12">每天一档推荐 · ${all.length} 档播客 · 自我成长 / 女性成长 / 时事热点 / 访谈</div>
    <div class="row" style="gap:8px;align-items:center">${bar}</div>
  </div>
  <div class="card">
    <div class="card-title">📊 近 7 天收听时长 <span class="muted" style="font-weight:500">合计 ${weekTotal} 分钟</span></div>
    <div style="display:flex;align-items:flex-end;gap:4px;padding:10px 4px 4px">${bars}</div>
    <div class="muted mt8">点播客右侧「🎧 小宇宙收听」跳转 App；听完回来点「听完 ✓」+ 时长。</div>
  </div>
  ${items}`;
}

/* 每日书摘（首页小卡，按日期稳定轮换一条） */
function pickDailyQuote() {
  const arr = window.QUOTES || [];
  if (!arr.length) return null;
  const dayIdx = Math.floor(Date.now() / 86400000);
  return arr[dayIdx % arr.length];
}
function quoteKey(q) { return (q.author || '') + '|' + (q.source || '') + '|' + (q.text || ''); }
function quoteStatus() { return store.get('wb_quote_status', {}); }
function quoteItemHTML(q) {
  const eraTag = q.era === '古' ? '古' : '今';
  const regionTag = q.region === '中' ? '中' : '外';
  const bm = (q.source || '').match(/《(.+?)》/);
  const kw = bm ? bm[1] : (q.author || '');
  const key = quoteKey(q);
  const st = quoteStatus()[key] || 'none';
  const readOn = st === 'read';
  const wantOn = st === 'want';
  return `
  <div class="item">
    <div class="main">
      <div class="t" style="font-size:15px;line-height:1.7">${esc(q.text)}</div>
      <div class="s mt8" style="color:var(--pink-600)">—— ${esc(q.author)} · ${esc(q.source)}</div>
      <div class="row mt8" style="gap:6px;align-items:center;flex-wrap:wrap">
        <span class="chip" style="background:#FCE9F0;color:#C2185B;border-color:transparent">${eraTag}</span>
        <span class="chip" style="background:#EDE4F7;color:#6A3DA6;border-color:transparent">${regionTag}</span>
        ${readOn ? '<span class="chip" style="background:#E3F4E1;color:#2E7D32;border-color:transparent">✓ 已读</span>' : ''}
        ${wantOn ? '<span class="chip" style="background:#FFF1E0;color:#E08600;border-color:transparent">★ 想读</span>' : ''}
        <a class="btn sm ghost" href="${wereadURL(kw)}" target="_blank" rel="noopener" style="margin-left:auto">📱 微信读书</a>
      </div>
      <div class="row mt8" style="gap:8px">
        <button class="btn sm ${readOn ? 'ghost' : ''}" data-action="quote-read" data-key="${esc(key)}">${readOn ? '✓ 已读' : '标记已读'}</button>
        <button class="btn sm ${wantOn ? 'ghost' : ''}" data-action="quote-want" data-key="${esc(key)}">${wantOn ? '★ 想读' : '想读'}</button>
      </div>
      ${q.note ? `<div class="note mt8">💡 注释：${esc(q.note)}</div>` : ''}
    </div>
  </div>`;
}
function homeQuoteHTML() {
  const q = homeQuoteRand || pickDailyQuote();
  if (!q) {
    return `<div class="card">
      <div class="card-title">📖 今日书摘</div>
      <div class="empty">还没有书摘数据。</div>
    </div>`;
  }
  const isRand = !!homeQuoteRand;
  return `<div class="card">
    <div class="card-title">
      📖 今日书摘
      <span style="float:right;font-size:12px;font-weight:500;color:var(--pink-500);cursor:pointer" data-action="nav" data-id="quotes">查看全部 →</span>
    </div>
    ${quoteItemHTML(q)}
    <div class="row mt12" style="gap:8px">
      ${isRand
        ? `<button class="btn sm" data-action="home-quote-random">🎲 换一条</button><button class="btn sm ghost" data-action="home-quote-daily">← 今天推荐</button>`
        : `<button class="btn sm" data-action="home-quote-random">🎲 随机一条</button>`}
    </div>
    <div class="muted mt8">${isRand ? '随机抽取 · 撞见想读的书 ✨' : '每天自动换一条 · 难懂的已加注释'}</div>
  </div>`;
}

/* =========================================================
   通用模块外壳
   ========================================================= */
function moduleHTML(id) {
  const fns = {
    english: englishHTML, chinese: chineseHTML, major: majorHTML, reading: readingHTML, exercise: exerciseHTML, food: foodHTML,
    finlearn: finlearnHTML, sleep: sleepHTML, skincare: skincareHTML, mood: moodHTML,
    review: reviewHTML, news: newsHTML, podcast: podcastHTML, quotes: quotesHTML, fav: favHTML
  };
  const fn = fns[id];
  return fn ? fn() : '<div class="empty">模块建设中…</div>';
}

/* ---------- 1. 英语学习 ---------- */
function englishHTML() {
  const known = store.get('wb_eng_known', []);
  const today = store.get('wb_english_today_' + TODAY, 0);
  const tabs = [
    { id: 'test', icon: '✅', name: '自测' },
    { id: 'memo', icon: '📖', name: '记单词' },
    { id: 'lib', icon: '📚', name: '词库' },
    { id: 'grammar', icon: '📝', name: '长难句·语法' },
    { id: 'mine', icon: '⭐', name: '我的' }
  ];
  const tabBar = tabs.map(t =>
    `<div class="nav-item ${engView === t.id ? 'active' : ''}" style="flex:1;justify-content:center" data-action="eng-view" data-view="${t.id}">${t.icon} ${t.name}</div>`).join('');
  const sub = engView === 'test' ? engStudyHTML() : engView === 'memo' ? engMemorizeHTML() : engView === 'lib' ? engLibHTML() : engView === 'grammar' ? engGrammarHTML() : engMineHTML();
  return `
  <div class="card">
    <div class="card-title">🔤 英语学习</div>
    <div class="row" style="gap:8px">${tabBar}</div>
    <div class="row mt12">
      <div class="pill"><div class="k">词库总量</div><div class="v">${VOCAB.length}</div></div>
      <div class="pill"><div class="k">已掌握</div><div class="v">${known.length}</div></div>
      <div class="pill"><div class="k">今日背诵</div><div class="v">${today}</div></div>
    </div>
  </div>
  ${sub}`;
}

/* 背单词：闪卡模式 */
function engStudyHTML() {
  if (!engQueue.length) {
    const known = new Set(store.get('wb_eng_known', []));
    const pool = VOCAB.filter(w => !known.has(w.en) && !(store.get('wb_eng_new', []).some(n => n.en === w.en)));
    engQueue = shuffle(pool);
    engReveal = false;
  }
  if (!engQueue.length) {
    return `<div class="card"><div class="card-title">🎴 背单词</div><div class="empty">🎉 太棒了，本轮单词都过完啦！点「重新开始」可换一批练习。</div></div>`;
  }
  const w = engQueue[0];
  return `
  <div class="card">
    <div class="card-title">🎴 背单词 · 本轮剩余 ${engQueue.length} 词</div>
    <div class="flash" data-action="eng-flip" style="cursor:pointer;text-align:center;padding:26px 14px;border-radius:18px;background:linear-gradient(135deg,#FFF0F4,#FDE0EC);border:1.5px solid #F8C8D2">
      <div style="font-size:30px;font-weight:900;color:#C24A77;display:inline-flex;align-items:center;gap:10px;justify-content:center">${esc(w.en)} <button class="spk" data-action="eng-speak" data-spell="${esc(w.en)}" title="朗读发音">🔊</button></div>
      ${engReveal ? `<div class="mt12" style="font-size:17px;color:#5A3A45">${esc(w.zh)}</div>` : `<div class="muted mt12">👆 点击查看释义</div>`}
    </div>
    <div class="row mt16" style="justify-content:center">
      <button class="btn ghost" data-action="eng-unknown">😣 还不认识</button>
      <button class="btn" data-action="eng-know">😎 认识了</button>
    </div>
    <div class="mt12" style="text-align:center"><button class="btn sm danger" data-action="eng-restart">🔄 重新开始本轮</button></div>
  </div>`;
}

/* 记单词：单词 + 词性 + 释义 + 例句 浏览记忆 */
function engMemorizeHTML() {
  const levels = ['全部', '专升本', '四级'];
  const chips = levels.map(l =>
    `<div class="chip ${memoLevel === l ? 'on' : ''}" data-action="memo-level" data-level="${l}" style="cursor:pointer">${l}</div>`).join('');
  if (!memoQueue.length || memoQueue._level !== memoLevel) {
    memoQueue = VOCAB.filter(w => memoLevel === '全部' || w.level === memoLevel);
    memoQueue._level = memoLevel; memoIdx = 0;
  }
  if (!memoQueue.length) return `<div class="card"><div class="card-title">📖 记单词</div><div class="empty">暂无单词，去「词库」或「我的」添加吧</div></div>`;
  if (memoIdx >= memoQueue.length) memoIdx = 0;
  const w = memoQueue[memoIdx];
  const pos = w.pos ? `<span class="chip" style="margin:0 6px">${esc(w.pos)}</span>` : '';
  const exHtml = w.ex
    ? `<div class="mt12" style="background:#FFF7FB;border:1px solid #F6D7E4;border-radius:14px;padding:12px 14px;font-size:15px;color:#5A3A45;line-height:1.6">💡 <b>例句：</b>${esc(w.ex)}</div>`
    : `<div class="muted mt12">（例句学习中…）</div>`;
  const knownSet = new Set(store.get('wb_eng_known', []));
  const isKnown = knownSet.has(w.en);
  return `
  <div class="card">
    <div class="card-title">📖 记单词 · 第 ${memoIdx + 1}/${memoQueue.length} 个</div>
    <div class="row mt12" style="gap:8px">${chips}</div>
    <div class="flash" style="margin-top:12px;text-align:center;padding:24px 14px;border-radius:18px;background:linear-gradient(135deg,#FFF0F4,#FDE0EC);border:1.5px solid #F8C8D2">
      <div style="font-size:30px;font-weight:900;color:#C24A77;display:inline-flex;align-items:center;gap:10px;justify-content:center">${esc(w.en)} <button class="spk" data-action="eng-speak" data-spell="${esc(w.en)}" title="朗读发音">🔊</button></div>
      <div class="mt12" style="font-size:18px;color:#5A3A45">${pos}${esc(w.zh)}</div>
      ${exHtml}
    </div>
    <div class="row mt16" style="justify-content:center;gap:8px;flex-wrap:wrap">
      <button class="btn sm ghost" data-action="memo-prev">‹ 上一个</button>
      <button class="btn sm ${isKnown ? '' : 'ghost'}" data-action="memo-know" data-en="${esc(w.en)}">${isKnown ? '✅ 已掌握' : '标记掌握'}</button>
      <button class="btn sm" data-action="memo-next">下一个 ›</button>
      <button class="btn sm ghost" data-action="memo-rand">🎲 随机</button>
    </div>
  </div>`;
}

/* 词库：搜索 + 级别筛选 + 字母跳转 + 分页 */
function engLibHTML() {
  const levels = ['全部', '专升本', '四级'];
  const chips = levels.map(l =>
    `<div class="chip ${engLibLevel === l ? 'on' : ''}" data-action="eng-liblevel" data-level="${l}" style="cursor:pointer">${l}</div>`).join('');
  const letters = '全部ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const letterBar = letters.map(L =>
    `<div class="letter ${engLibLetter === L ? 'on' : ''}" data-action="eng-letter" data-letter="${L}">${L === '全部' ? '全' : L}</div>`).join('');
  let list = VOCAB.filter(w =>
    (engLibLevel === '全部' || w.level === engLibLevel) &&
    (engLibLetter === '全部' || (w.en || '?')[0].toUpperCase() === engLibLetter));
  const q = (engLibSearch || '').trim().toLowerCase();
  const searching = q !== '';
  if (searching) list = list.filter(w => (w.en + ' ' + w.zh).toLowerCase().includes(q));
  const total = list.length;
  let pageItems;
  if (searching) {
    pageItems = list;
  } else {
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (engLibPage > pages) engLibPage = pages;
    pageItems = list.slice((engLibPage - 1) * PAGE_SIZE, engLibPage * PAGE_SIZE);
  }
  const knownSet = new Set(store.get('wb_eng_known', []));
  const items = pageItems.map(w => {
    const isKnown = knownSet.has(w.en);
    const posTag = w.pos ? `<span class="chip" style="margin:0 6px">${esc(w.pos)}</span>` : '';
    const exLine = w.ex ? `<div class="muted mt6" style="font-size:13px;line-height:1.5">💡 ${esc(w.ex)}</div>` : '';
    return `<div class="lib-item">
       <div style="flex:1;min-width:0">
         <span class="t">${esc(w.en)}</span> ${posTag} <span class="chip" style="margin:0 6px">${w.level}</span>
         <span class="s">${esc(w.zh)}</span>
         ${exLine}
       </div>
       <button class="spk" data-action="eng-speak" data-spell="${esc(w.en)}" title="朗读发音">🔊</button>
       <button class="btn sm ${isKnown ? '' : 'ghost'}" style="margin-left:8px" data-action="eng-libknown" data-en="${esc(w.en)}">${isKnown ? '✅ 已掌握' : '标记掌握'}</button>
     </div>`;
  }).join('') || '<div class="empty">没有匹配的单词</div>';
  const pager = searching ? '' :
    `<div class="pager">
       <button class="btn sm ghost" data-action="eng-page" data-d="-1">‹ 上一页</button>
       <span class="muted">第 ${engLibPage}/${Math.max(1, Math.ceil(total / PAGE_SIZE))} 页 · 共 ${total} 词</span>
       <button class="btn sm ghost" data-action="eng-page" data-d="1">下一页 ›</button>
     </div>`;
  return `
  <div class="card">
    <div class="card-title">📚 词库（${total} 词）</div>
    <input id="eng-search" placeholder="🔍 搜索英文或释义…" value="${esc(engLibSearch)}">
    <div class="row mt12" style="gap:8px">${chips}</div>
    <div class="letterbar mt12">${letterBar}</div>
    <div class="mt12" id="eng-lib-list" style="max-height:460px;overflow:auto">${items}</div>
    ${pager}
  </div>`;
}

/* 我的：手加词 + 生词本 + 已掌握 */
function engMineHTML() {
  const manual = store.get('wb_english_list', []);
  const news = store.get('wb_eng_new', []);
  const known = store.get('wb_eng_known', []);
  const manualItems = manual.length ? manual.map(w => `
    <div class="item">
      <div class="main"><div class="t">${esc(w.en)}</div><div class="s">${esc(w.zh)}</div></div>
      <div class="acts">
        <button class="btn sm ghost" data-action="eng-review" data-id="${w.id}">复习+1</button>
        <button class="btn sm danger" data-action="eng-del" data-id="${w.id}">删</button>
      </div>
    </div>`).join('') : '<div class="empty">还没有自己添加的单词</div>';
  const newItems = news.length ? news.map(w =>
    `<div class="item"><div class="main"><div class="t">${esc(w.en)}</div><div class="s">${esc(w.zh)}</div></div></div>`).join('') : '<div class="empty">还没有生词</div>';
  const knownItems = known.length ? known.map(en =>
    `<div class="lib-item"><span class="t">${esc(en)}</span> <span class="chip" style="margin-left:6px">✅ 已掌握</span>
       <button class="btn sm danger" style="margin-left:auto" data-action="eng-unknown" data-en="${esc(en)}">放回生词</button></div>`).join('')
    : '<div class="empty">还没有已掌握的单词</div>';
  return `
  <div class="card">
    <div class="card-title">➕ 手动添加单词</div>
    <div class="row">
      <div style="flex:1;min-width:140px"><label class="fld">英文</label><input id="en-en" placeholder="例如 apple"></div>
      <div style="flex:1;min-width:140px"><label class="fld">释义</label><input id="en-zh" placeholder="例如 苹果"></div>
      <div style="display:flex;align-items:flex-end"><button class="btn" data-action="eng-add">➕ 添加</button></div>
    </div>
  </div>
  <div class="card"><div class="card-title">⭐ 我的单词本（${manual.length}）</div>${manualItems}</div>
  <div class="card"><div class="card-title">📒 生词本（${news.length}）</div>${newItems}</div>
  <div class="card"><div class="card-title">✅ 已掌握（${known.length}）</div>${knownItems}</div>
  <div class="card">
    <div class="card-title">📥 导入词库（冲到 5000+）</div>
    <div class="muted">每行一个：英文|中文释义（竖线或逗号分隔均可），粘贴后点导入，会合并进词库并本地保存。</div>
    <textarea id="eng-import" placeholder="apple|苹果&#10;banana|香蕉"></textarea>
    <div class="row mt12" style="align-items:center">
      <button class="btn" data-action="eng-importdo">📥 导入</button>
      <span class="muted">当前词库 ${VOCAB.length} 词（含你导入的 ${store.get('wb_vocab_extra', []).length} 个）</span>
    </div>
  </div>`;
}

/* 英语 · 长难句 & 语法（初学者友好） */
function engGrammarHTML() {
  if (quiz.mod === 'english') return quizHTML();
  const topTabs = [
    { id: 'sent', name: '📐 长难句' },
    { id: 'gram', name: '📚 语法点' },
    { id: 'gq', name: '📝 语法自测' }
  ];
  const topBar = topTabs.map(t =>
    `<div class="chip ${engGramView === t.id ? 'on' : ''}" data-action="eng-gramview" data-view="${t.id}" style="cursor:pointer">${t.name}</div>`).join('');
  if (engGramView === 'gq') {
    return `
    <div class="card">
      <div class="card-title">📝 语法自测（选择题）</div>
      <div class="row" style="gap:8px">${topBar}</div>
      <div class="s mt12">10 道选择题，自动判分，帮你检验语法点有没有真懂。</div>
      <button class="btn mt12" data-action="quiz-start" data-mod="english">▶ 开始自测（${(window.ENG_GRAMMAR_QUIZ || []).length} 题）</button>
    </div>`;
  }
  if (engGramView === 'gram') {
    return `
    <div class="card">
      <div class="card-title">📚 语法点（初学者友好）</div>
      <div class="row" style="gap:8px">${topBar}</div>
    </div>
    ${engGramPointHTML()}`;
  }
  const subTabs = [
    { id: 'method', name: '🧅 剥洋葱法' },
    { id: 'practice', name: '📐 练拆句' },
    { id: 'pattern', name: '✍️ 万能句式' },
    { id: 'action', name: '⏱ 每日行动卡' }
  ];
  const subBar = subTabs.map(t =>
    `<div class="chip ${sentView === t.id ? 'on' : ''}" data-action="sent-view" data-view="${t.id}" style="cursor:pointer">${t.name}</div>`).join('');
  const hint = {
    method: '先记 3 步法，照真题示范背结构',
    practice: '一句一句拆：点开看「主干 · 剥修饰 · 中文」',
    pattern: '写作文强制套用，先练熟标★的 5 个必练句',
    action: '每天 5 分钟：拆 3 句 + 用 2 句式，坚持到考前'
  }[sentView];
  const body = sentView === 'method' ? engSentMethodHTML()
    : sentView === 'practice' ? engSentPracticeHTML()
    : sentView === 'pattern' ? engPatternHTML()
    : engActionHTML();
  return `
  <div class="card">
    <div class="card-title">📐 长难句（剥洋葱法 · 真题拆解）</div>
    <div class="row" style="gap:8px">${topBar}</div>
    <div class="row mt8" style="gap:8px">${subBar}</div>
    <div class="muted mt8">${hint}</div>
  </div>
  ${body}`;
}

/* 剥洋葱法：3 步模板 + 真题示范 */
function engSentMethodHTML() {
  return `
  <div class="card">
    <div class="card-title">🧅 剥洋葱法：3 步走</div>
    <div class="item"><div class="main"><div class="t">Step 1 · 找主干</div><div class="s mt6">谁（主语）+ 干了啥/是啥（谓语）。先抓住句子核心，别被修饰带跑。</div></div></div>
    <div class="item"><div class="main"><div class="t">Step 2 · 剥修饰</div><div class="s mt6">从句（which/that/when）、介词短语（of/in/with）、非谓语（doing/done）——一层层剥开，看它们分别修饰谁。</div></div></div>
    <div class="item"><div class="main"><div class="t">Step 3 · 调语序</div><div class="s mt6">把修饰部分按中文习惯，塞回主干的前或后，翻译就顺了。</div></div></div>
  </div>
  <div class="card">
    <div class="card-title">📌 真题示范（直接背这个结构）</div>
    <div class="flash" style="padding:18px 14px;border-radius:16px;background:linear-gradient(135deg,#FFF0F4,#FDE0EC);border:1.5px solid #F8C8D2">
      <div style="font-size:14px;font-weight:700;color:#C24A77;line-height:1.6">The fact that many people are worried about the environment stems from the growing awareness that human activities are causing irreversible damage.</div>
    </div>
    <div class="mt12" style="background:#FFF7FB;border:1px solid #F6D7E4;border-radius:14px;padding:12px 14px;font-size:14px;color:#5A3A45;line-height:1.7">
      <b>🌰 主干：</b>The fact stems from the awareness（事实源于意识）<br>
      <b>🧅 剥修饰：</b>that many people... 解释 fact；that human activities... 解释 awareness<br>
      <b>🀄 中文：</b>许多人担忧环境这一事实，源于一种日益增长的意识——人类活动正在造成不可逆的破坏。
    </div>
    <div class="muted mt8">照这个模板拆 20 句 → 去「📐 练拆句」开练</div>
  </div>`;
}

/* 长难句：练拆句（点开看 主干/剥修饰/中文；可切自测模式先写主干再对答案） */
function engSentPracticeHTML() {
  const all = window.ENG_SENTENCES || [];
  if (!sentQueue.length || sentQueue._src !== 'sent') { sentQueue = all.slice(); sentQueue._src = 'sent'; sentIdx = 0; sentReveal = false; }
  if (!sentQueue.length) return `<div class="card"><div class="card-title">📐 练拆句</div><div class="empty">暂无句子，稍后会补充～</div></div>`;
  if (sentIdx >= sentQueue.length) sentIdx = 0;
  const s = sentQueue[sentIdx];
  const trunkHtml = s.trunk
    ? `<div class="mt12" style="background:#FFF7FB;border:1px solid #F6D7E4;border-radius:14px;padding:12px 14px;font-size:14px;color:#5A3A45;line-height:1.7">🌰 <b>主干：</b>${esc(s.trunk)}</div>` : '';
  const peelHtml = s.peel
    ? `<div class="mt8" style="background:#F4FBF7;border:1px solid #CDEBD6;border-radius:14px;padding:12px 14px;font-size:14px;color:#5A3A45;line-height:1.7">🧅 <b>剥修饰：</b>${esc(s.peel)}</div>` : '';
  const zhHtml = s.zh
    ? `<div class="mt8" style="font-size:15px;color:#C24A77;line-height:1.6"><b>🀄 中文：</b>${esc(s.zh)}</div>` : '';
  // 自测模式开关
  const modeBtn = `<button class="btn sm ${sentTestMode ? 'ghost' : ''}" data-action="eng-sent-test">${sentTestMode ? '👀 退出自测' : '✍️ 自测模式'}</button>`;
  if (sentTestMode) {
    let testArea;
    if (!sentTestDone) {
      testArea = `
        <div class="mt12" style="text-align:left">
          <div class="s" style="color:#C24A77;font-weight:600">✍️ 先写出这句话的「主干」（谁 + 干了啥/是啥）：</div>
          <input id="sent-test-input" value="${esc(sentTestInput)}" placeholder="用英文写主干，例如 The fact stems from the awareness" style="width:100%;margin-top:8px">
          <div class="row mt12" style="justify-content:flex-start"><button class="btn sm" data-action="eng-sent-testcheck">对答案 🔍</button></div>
        </div>`;
    } else {
      const score = sentTestScore(s.trunk, sentTestInput);
      const fb = score >= 0.6 ? '<span style="color:#2E9E5B;font-weight:700">✅ 主干抓得不错！</span>'
        : score >= 0.3 ? '<span style="color:#E0922B;font-weight:700">💡 抓到一部分，再看答案补全</span>'
        : '<span style="color:#C2185B;font-weight:700">💡 再练练，对照答案看看</span>';
      testArea = `
        <div class="mt12" style="text-align:left;background:#FFF7FB;border:1px solid #F6D7E4;border-radius:14px;padding:12px 14px">
          <div class="s" style="color:#5A3A45"><b>你的答案：</b>${sentTestInput ? esc(sentTestInput) : '<span class="muted">（空）</span>'}</div>
          <div class="mt6">${fb}</div>
          ${trunkHtml}${peelHtml}${zhHtml}
        </div>`;
    }
    return `
    <div class="card">
      <div class="card-title">📐 练拆句 · 第 ${sentIdx + 1}/${sentQueue.length} 句</div>
      <div class="flash" style="text-align:center;padding:22px 14px;border-radius:18px;background:linear-gradient(135deg,#FFF0F4,#FDE0EC);border:1.5px solid #F8C8D2">
        <div style="font-size:16px;font-weight:700;color:#C24A77;line-height:1.6;display:inline-flex;align-items:flex-start;gap:8px;justify-content:center;text-align:left">${esc(s.en)} <button class="spk" data-action="eng-sentspeak" data-line="${esc(s.en)}" title="朗读">🔊</button></div>
      </div>
      ${testArea}
      <div class="row mt16" style="justify-content:center;gap:8px;flex-wrap:wrap">
        <button class="btn sm ghost" data-action="eng-sent-prev">‹ 上一句</button>
        <button class="btn sm ghost" data-action="eng-sent-rand">🎲 随机</button>
        <button class="btn sm" data-action="eng-sent-next">下一句 ›</button>
      </div>
      <div class="row mt8" style="justify-content:center">${modeBtn}</div>
    </div>`;
  }
  return `
  <div class="card">
    <div class="card-title">📐 练拆句 · 第 ${sentIdx + 1}/${sentQueue.length} 句</div>
    <div class="flash" data-action="eng-sent-flip" style="cursor:pointer;text-align:center;padding:22px 14px;border-radius:18px;background:linear-gradient(135deg,#FFF0F4,#FDE0EC);border:1.5px solid #F8C8D2">
      <div style="font-size:16px;font-weight:700;color:#C24A77;line-height:1.6;display:inline-flex;align-items:flex-start;gap:8px;justify-content:center;text-align:left">${esc(s.en)} <button class="spk" data-action="eng-sentspeak" data-line="${esc(s.en)}" title="朗读">🔊</button></div>
      ${sentReveal ? '' : `<div class="muted mt12">👆 点击看「主干 · 剥修饰 · 中文」</div>`}
    </div>
    ${sentReveal ? trunkHtml + peelHtml + zhHtml : ''}
    <div class="row mt16" style="justify-content:center;gap:8px;flex-wrap:wrap">
      <button class="btn sm ghost" data-action="eng-sent-prev">‹ 上一句</button>
      <button class="btn sm ghost" data-action="eng-sent-rand">🎲 随机</button>
      <button class="btn sm" data-action="eng-sent-next">下一句 ›</button>
    </div>
    <div class="row mt8" style="justify-content:center">${modeBtn}</div>
  </div>`;
}

/* 自测模式：对比用户主干与正确主干的英文词重合度 */
function sentTestScore(trunk, input) {
  const norm = s => (s || '').toLowerCase().match(/[a-z]{2,}/g) || [];
  const t = norm(trunk), u = norm(input);
  if (!t.length) return 0;
  const set = new Set(u);
  let hit = 0; t.forEach(w => { if (set.has(w)) hit++; });
  return hit / t.length;
}

/* 万能写作句式 */
function engPatternHTML() {
  const all = window.ENG_PATTERNS || [];
  const done = new Set(store.get('wb_eng_pattern_done', []));
  const filters = [['all', '全部'], ['core', '必练5句']];
  const fbar = filters.map(([v, n]) =>
    `<div class="chip ${patternFilter === v ? 'on' : ''}" data-action="eng-pattern-filter" data-f="${v}" style="cursor:pointer">${n}</div>`).join('');
  const list = all.filter(p => patternFilter === 'all' || p.core);
  const cards = list.map(p => {
    const on = done.has(p.id);
    return `<div class="item">
      <div class="main">
        <div class="t" style="font-size:15px">${esc(p.name)} ${p.core ? '<span class="chip" style="background:#FCE9F0;color:#C2185B;border-color:transparent;font-size:11px">必练</span>' : ''}</div>
        <div class="s mt8" style="color:#C24A77;font-weight:600">${esc(p.en)}</div>
        <div class="s mt4" style="color:#5A3A45">${esc(p.cn || '')}</div>
        ${p.note ? `<div class="note mt8">💡 ${esc(p.note)}</div>` : ''}
      </div>
      <div class="acts"><button class="btn sm ${on ? 'ghost' : ''}" data-action="eng-pattern-know" data-id="${esc(p.id)}">${on ? '★ 练熟' : '标★练熟'}</button></div>
    </div>`;
  }).join('');
  return `
  <div class="card">
    <div class="row" style="gap:8px">${fbar}</div>
    <div class="muted mt8">共 ${all.length} 个句式 · 已练熟 ${done.size} 个${patternFilter === 'core' ? '（只看必练5句）' : ''}</div>
    <div class="muted mt4">写作文强制套用，先练熟标★的 5 个就够用。</div>
  </div>
  ${cards}`;
}

/* 每日 5 分钟行动卡（拆句进度每天自动+3，只留打卡） */
function engActionHTML() {
  // 每天进入自动记 3 句进度（只记一次）
  const autoKey = 'wb_eng_action_auto_' + TODAY;
  if (!store.get(autoKey, 0)) {
    store.set('wb_eng_sent_count', (store.get('wb_eng_sent_count', 0) || 0) + 3);
    store.set(autoKey, 1);
  }
  const sentCount = store.get('wb_eng_sent_count', 0);
  const patternDone = (store.get('wb_eng_pattern_done', [])).length;
  const todayDone = store.get('wb_eng_action_' + TODAY, 0);
  const acts = store.get('wb_eng_action_days', {});
  let streak = 0; let d = new Date();
  while (acts[ymd(d)]) { streak++; d.setDate(d.getDate() - 1); }
  return `
  <div class="card">
    <div class="card-title">⏱ 每日 5 分钟行动卡</div>
    <div class="item"><div class="main"><div class="t">① 每天拆 3 个真题句子</div><div class="s mt6">只划主干 + 翻译主干，修饰先不看。</div></div></div>
    <div class="item"><div class="main"><div class="t">② 写作文强制用 2 个句式</div><div class="s mt6">套上面的万能句式，先练熟 5 个必练。</div></div></div>
    <div class="item"><div class="main"><div class="t">③ 坚持到考前</div><div class="s mt6">100 句拆完 + 30 句里挑 5 个练熟 = 阅读提速 + 作文稳过。</div></div></div>
  </div>
  <div class="card">
    <div class="card-title">📊 我的进度</div>
    <div class="row" style="gap:8px;flex-wrap:wrap">
      <div class="pill"><div class="k">拆句进度</div><div class="v">${sentCount}/100</div></div>
      <div class="pill"><div class="k">句式练熟</div><div class="v">${patternDone}/5</div></div>
      <div class="pill"><div class="k">连续打卡</div><div class="v">${streak}天</div></div>
    </div>
    <div class="row mt12" style="gap:8px;flex-wrap:wrap">
      <button class="btn sm ${todayDone ? 'ghost' : ''}" data-action="eng-action-day">${todayDone ? '✅ 今日已打卡' : '📅 今日打卡'}</button>
    </div>
    <div class="muted mt8">拆句进度每天进入自动 +3（每天一次）；「今日打卡」记录连续天数（断一天清零）。</div>
  </div>`;
}

/* 语法点：列表 + 分类筛选 + 标记掌握 */
function engGramPointHTML() {
  const all = window.ENG_GRAMMAR || [];
  const cats = ['全部', '入门', '基础', '进阶'];
  const chips = cats.map(c =>
    `<div class="chip ${gramCat === c ? 'on' : ''}" data-action="eng-gramcat" data-c="${c}" style="cursor:pointer">${c}</div>`).join('');
  const list = all.filter(g => gramCat === '全部' || g.level === gramCat);
  const known = new Set(store.get('wb_eng_gram_known', []));
  const cards = list.length ? list.map(g => {
    const on = known.has(g.id);
    return `<div class="item">
      <div class="main">
        <div class="t" style="font-size:16px">${esc(g.title)} <span class="chip" style="background:#EDE4F7;color:#6A3DA6;border-color:transparent;font-size:11px">${esc(g.level)}</span></div>
        <div class="s mt8" style="color:#5A3A45;line-height:1.6">${esc(g.explain)}</div>
        ${g.example ? `<div class="mt8" style="background:#FFF7FB;border:1px solid #F6D7E4;border-radius:12px;padding:8px 12px;font-size:14px;color:#C24A77">📌 例：${esc(g.example)}</div>` : ''}
        ${g.note ? `<div class="note mt8">💡 ${esc(g.note)}</div>` : ''}
      </div>
      <div class="acts"><button class="btn sm ${on ? 'ghost' : ''}" data-action="eng-gram-know" data-id="${esc(g.id)}">${on ? '★ 已掌握' : '标★掌握'}</button></div>
    </div>`;
  }).join('') : '<div class="empty">没有该分类的语法点。</div>';
  return `
  <div class="card">
    <div class="row" style="gap:8px">${chips}</div>
    <div class="muted mt8">共 ${all.length} 个语法点 · 已掌握 ${known.size} 个</div>
  </div>
  ${cards}`;
}

/* 古诗文默写：显示篇名作者 → 回忆 → 看默写 */
function engClassicHTML() {
  if (!clQueue.length) clQueue = shuffle(CLASSICS);
  if (!clQueue.length) {
    return `<div class="card"><div class="card-title">📜 古诗文默写</div><div class="empty">暂无可背篇目（词库为空）</div></div>`;
  }
  const c = clQueue[0];
  const done = store.get('wb_cl_done', []);
  const isDone = done.includes(c.title);
  const lines = c.lines.map(l =>
    `<div class="cline">${esc(l)} <button class="spk" data-action="eng-clspeak" data-line="${esc(l)}" title="朗读">🔊</button></div>`).join('');
  return `
  <div class="card">
    <div class="card-title">📜 古诗文默写 · 本轮剩余 ${clQueue.length} 篇</div>
    <div class="flash" data-action="eng-classic-flip" style="cursor:pointer;text-align:center;padding:22px 14px;border-radius:18px;background:linear-gradient(135deg,#FFF0F4,#FDE0EC);border:1.5px solid #F8C8D2">
      <div style="font-size:22px;font-weight:900;color:#C24A77">${esc(c.title)}</div>
      <div class="muted mt8">${esc(c.author)} · ${c.type}</div>
      ${clReveal ? `<div class="mt12 clines">${lines}</div>${c.yi ? `<div class="note mt12">📖 译文：${esc(c.yi)}</div>` : ''}${c.note ? `<div class="note mt8">🔍 注释：${esc(c.note)}</div>` : ''}${c.shang ? `<div class="note mt8">🎯 赏析：${esc(c.shang)}</div>` : ''}` : `<div class="muted mt12">👆 点击查看默写内容</div>`}
    </div>
    <div class="row mt16" style="justify-content:center">
      <button class="btn ghost" data-action="eng-classic-unknown">😣 还没背</button>
      <button class="btn" data-action="eng-classic-know">😎 背下来啦</button>
    </div>
    <div class="mt12" style="text-align:center">
      ${isDone ? '<span class="chip on" style="cursor:default">✅ 已背过</span> ' : ''}
      <button class="btn sm danger" data-action="eng-classic-restart">🔄 换一批</button>
    </div>
  </div>`;
}

/* ---------- 2. 每日阅读 ---------- */
function readingHTML() {
  return `<div class="card"><div class="card-title">📖 每日阅读</div></div>${readingBooksHTML()}${bookRecHTML()}`;
}

/* ---------- 语文课（大学语文）---------- */
function chineseHTML() {
  if (quiz.mod === 'chinese') return quizHTML();
  const done = store.get('wb_cl_done', []);
  const total = CLASSICS.length;
  const pct = total ? Math.round(done.length / total * 100) : 0;
  const litTotal = (window.LIT || []).length;
  const intro = `
  <div class="card">
    <div class="card-title">📊 大学语文 · 学习进度</div>
    <div class="row">
      <div class="pill"><div class="k">必背古诗文</div><div class="v">${total}</div></div>
      <div class="pill"><div class="k">已背过</div><div class="v">${done.length}</div></div>
      <div class="pill"><div class="k">完成度</div><div class="v">${pct}%</div></div>
      <div class="pill"><div class="k">文学常识</div><div class="v">${litTotal}</div></div>
    </div>
    <div class="bar mt12"><div class="bar-fill" style="width:${pct}%"></div></div>
    <div class="muted mt12">古诗文含「译文·注释·赏析」；文学常识覆盖先秦至当代；新增作文好词好句与范文模板。</div>
  </div>
  <div class="card">
    <div class="card-title">📝 真题演练（模拟考）</div>
    <div class="s">限时自测、自动判分，错题自动收进「我的收藏」反复练。</div>
    <button class="btn mt12" data-action="quiz-start" data-mod="chinese">▶ 开始一套（${(window.QUIZ_CHINESE || []).length} 题）</button>
  </div>`;
  /* 主标签：自测 | 记忆 */
  const mainTabs = [
    { id: 'test', icon: '✍️', name: '自测' },
    { id: 'memo', icon: '📖', name: '记忆' }
  ];
  const mainBar = mainTabs.map(t =>
    `<div class="nav-item ${chiView === t.id ? 'active' : ''}" style="flex:1;justify-content:center" data-action="chi-view" data-view="${t.id}">${t.icon} ${t.name}</div>`).join('');

  let subBar = '';
  let sub = '';
  if (chiView === 'test') {
    const tabs = [
      { id: 'classic', icon: '📜', name: '古诗文默写' },
      { id: 'lit', icon: '📚', name: '文学常识' }
    ];
    subBar = tabs.map(t =>
      `<div class="nav-item ${chiTestView === t.id ? 'active' : ''}" style="flex:1;justify-content:center" data-action="chi-testview" data-view="${t.id}">${t.icon} ${t.name}</div>`).join('');
    sub = chiTestView === 'classic' ? engClassicHTML() : chiLitTestHTML();
  } else {
    const tabs = [
      { id: 'classic', icon: '📜', name: '古诗文全篇' },
      { id: 'lit', icon: '📚', name: '文学常识' },
      { id: 'essay', icon: '✨', name: '好词好句' },
      { id: 'format', icon: '📝', name: '作文格式' },
      { id: 'tpl', icon: '📄', name: '范文模板' }
    ];
    subBar = tabs.map(t =>
      `<div class="nav-item ${chiMemoView === t.id ? 'active' : ''}" style="flex:1;justify-content:center" data-action="chi-memoview" data-view="${t.id}">${t.icon} ${t.name}</div>`).join('');
    sub = chiMemoView === 'classic' ? chiClassicBrowseHTML()
         : chiMemoView === 'lit' ? litHTML()
         : chiMemoView === 'essay' ? chiEssayHTML()
         : chiMemoView === 'format' ? chiFormatHTML()
         : chiEssayTplHTML();
  }
  return intro + `<div class="card"><div class="card-title">📚 语文课</div><div class="row" style="gap:8px">${mainBar}</div></div>` +
    `<div class="card"><div class="row" style="gap:8px">${subBar}</div></div>` + sub;
}

/* 文学常识自测：闪卡（正面=作家/作品，翻转=要点） */
function chiLitTestHTML() {
  const all = window.LIT || [];
  if (!all.length) return `<div class="card"><div class="empty">文学常识库为空</div></div>`;
  if (!litTestQueue.length) litTestQueue = shuffle(all.slice());
  const item = litTestQueue[0];
  if (!item) return `<div class="card"><div class="empty">本轮已结束 🎉</div><div class="mt12" style="text-align:center"><button class="btn" data-action="lit-testrestart">🔄 再来一轮</button></div></div>`;
  const done = store.get('wb_lit_done', []);
  return `
  <div class="card">
    <div class="card-title">📚 文学常识自测 · 本轮剩余 ${litTestQueue.length} / ${all.length}</div>
    <div class="flash" data-action="lit-testflip" style="cursor:pointer;text-align:center;padding:22px 14px;border-radius:18px;background:linear-gradient(135deg,#F0F4FF,#E0ECFD);border:1.5px solid #B8D0F8">
      <div style="font-size:22px;font-weight:900;color:#2A5CAA">${esc(item.face)}</div>
      <span class="chip" style="background:#E8F0FF;color:#2A5CAA;border-color:transparent;font-size:11px;margin-top:6px;display:inline-block">${esc(item.cat)}</span>
      ${litTestReveal ? `<div class="mt12" style="text-align:left;font-size:15px;line-height:1.8;color:#333;background:#fff;padding:14px;border-radius:12px">${esc(item.back)}</div>` : `<div class="muted mt12">👆 点击翻转看要点</div>`}
    </div>
    <div class="row mt16" style="justify-content:center">
      <button class="btn ghost" data-action="lit-testunknown">😣 没记住</button>
      <button class="btn" data-action="lit-testknow">😎 记住了</button>
    </div>
    <div class="mt12" style="text-align:center">
      ${done.includes(item.face) ? '<span class="chip on" style="cursor:default">✅ 已掌握</span> ' : ''}
      <button class="btn sm danger" data-action="lit-testrestart">🔄 换一批</button>
    </div>
  </div>`;
}

/* 古诗文全篇浏览：逐篇展示全文 + 译文 + 注释 + 赏析 */
function chiClassicBrowseHTML() {
  const all = CLASSICS;
  if (!all.length) return `<div class="card"><div class="empty">古诗文库为空</div></div>`;
  if (clBrowseIdx >= all.length) clBrowseIdx = 0;
  const c = all[clBrowseIdx];
  const lines = c.lines.map(l => `<div class="cline">${esc(l)}</div>`).join('');
  return `
  <div class="card">
    <div class="card-title">📜 古诗文全篇 · 第 ${clBrowseIdx + 1} / ${all.length} 篇</div>
    <div style="text-align:center;padding:18px 14px;border-radius:18px;background:linear-gradient(135deg,#FFF8F0,#FDEFE0);border:1.5px solid #F5D8B8">
      <div style="font-size:22px;font-weight:900;color:#B8651A">${esc(c.title)}</div>
      <div class="muted mt8">${esc(c.author)} · ${c.type}</div>
      <div class="mt12 clines" style="text-align:left">${lines}</div>
      ${c.yi ? `<div class="note mt12">📖 译文：${esc(c.yi)}</div>` : ''}
      ${c.note ? `<div class="note mt8">🔍 注释：${esc(c.note)}</div>` : ''}
      ${c.shang ? `<div class="note mt8">🎯 赏析：${esc(c.shang)}</div>` : ''}
    </div>
    <div class="row mt16" style="justify-content:center;gap:10px">
      <button class="btn ghost" data-action="cl-browse-prev">⬅️ 上一篇</button>
      <button class="btn" data-action="cl-browse-next">下一篇 ➡️</button>
    </div>
    <div class="mt12" style="text-align:center">
      <button class="btn sm" data-action="cl-browse-speak" data-line="${esc(c.lines.join(' '))}">🔊 朗读全篇</button>
    </div>
  </div>`;
}

/* 作文好词好句 */
function chiEssayHTML() {
  const E = window.ESSAY || { words: [], sentences: [] };
  const wCats = ['all'].concat(Array.from(new Set(E.words.map(x => x.cat))));
  const sCats = ['all'].concat(Array.from(new Set(E.sentences.map(x => x.cat))));
  const wChips = wCats.map(c =>
    `<div class="chip ${essayCat === 'w_' + c ? 'on' : ''}" data-action="essay-cat" data-c="w_${c}" style="cursor:pointer">${c === 'all' ? '全部好词' : c}</div>`).join('');
  const sChips = sCats.map(c =>
    `<div class="chip ${essayCat === 's_' + c ? 'on' : ''}" data-action="essay-cat" data-c="s_${c}" style="cursor:pointer">${c === 'all' ? '全部好句' : c}</div>`).join('');
  let list = '';
  if (essayCat.startsWith('w_')) {
    const cat = essayCat.slice(2);
    const items = cat === 'all' ? E.words : E.words.filter(x => x.cat === cat);
    list = items.map(x => `
      <div class="item">
        <div class="main">
          <div class="t">${esc(x.word)} <span class="chip" style="background:#FCE9F0;color:#C2185B;border-color:transparent;font-size:11px">${esc(x.cat)}</span></div>
          <div class="s mt6"><b>释义：</b>${esc(x.meaning)}</div>
          <div class="s mt4"><b>例句：</b>${esc(x.ex)}</div>
        </div>
      </div>`).join('');
  } else if (essayCat.startsWith('s_')) {
    const cat = essayCat.slice(2);
    const items = cat === 'all' ? E.sentences : E.sentences.filter(x => x.cat === cat);
    list = items.map(x => `
      <div class="item">
        <div class="main">
          <div class="t">${esc(x.cat)} · ${esc(x.theme)} <span class="chip" style="background:#E8F0FF;color:#2A5CAA;border-color:transparent;font-size:11px">${esc(x.cat)}</span></div>
          <div class="s mt6">${esc(x.text)}</div>
        </div>
      </div>`).join('');
  } else {
    /* 默认显示好词 */
    list = E.words.map(x => `
      <div class="item">
        <div class="main">
          <div class="t">${esc(x.word)} <span class="chip" style="background:#FCE9F0;color:#C2185B;border-color:transparent;font-size:11px">${esc(x.cat)}</span></div>
          <div class="s mt6"><b>释义：</b>${esc(x.meaning)}</div>
          <div class="s mt4"><b>例句：</b>${esc(x.ex)}</div>
        </div>
      </div>`).join('');
  }
  return `<div class="card"><div class="card-title">✨ 作文好词 · 共 ${E.words.length} 个</div><div class="row" style="gap:6px;flex-wrap:wrap">${wChips}</div></div>
  <div class="card"><div class="card-title">✨ 作文好句 · 共 ${E.sentences.length} 句</div><div class="row" style="gap:6px;flex-wrap:wrap">${sChips}</div></div>
  <div class="card">${list || '<div class="empty">暂无内容</div>'}</div>`;
}

/* 作文格式 */
function chiFormatHTML() {
  const E = window.ESSAY || { formats: [] };
  const list = E.formats.map((f, i) => `
    <div class="item">
      <div class="main">
        <div class="t">${esc(f.title)} <span class="chip" style="background:#F0F8F0;color:#2A8A2A;border-color:transparent;font-size:11px">${esc(f.type)}</span></div>
        <pre class="s mt8" style="white-space:pre-wrap;font-family:inherit;font-size:14px;line-height:1.7;color:#444">${esc(f.content)}</pre>
      </div>
    </div>`).join('');
  return `<div class="card"><div class="card-title">📝 作文格式模板 · 共 ${E.formats.length} 篇</div><div class="muted">议论文 / 记叙文 / 散文 / 应用文（书信·通知·演讲稿·倡议书·读后感）</div></div><div class="card">${list || '<div class="empty">暂无内容</div>'}</div>`;
}

/* 语文·作文范文模板库 */
function chiEssayTplHTML() {
  const T = window.ESSAY_TPL || [];
  if (!T.length) return `<div class="card"><div class="empty">范文模板库为空</div></div>`;
  const cards = T.map(t => `
    <div class="card">
      <div class="card-title">📄 ${esc(t.title)} <span class="chip" style="background:#F0F8F0;color:#2A8A2A;border-color:transparent;font-size:11px">${esc(t.type)}</span></div>
      <div class="row" style="gap:6px;align-items:center"><span class="chip" style="background:#FDE7ED;color:#C24A77;border-color:transparent">结构</span></div>
      <pre class="s mt8" style="white-space:pre-wrap;font-family:inherit;font-size:14px;line-height:1.8;color:#444">${esc(t.structure)}</pre>
      <div class="row mt12" style="gap:6px;align-items:center"><span class="chip" style="background:#FFF1E0;color:#E08600;border-color:transparent">范文片段</span></div>
      <pre class="s mt8" style="white-space:pre-wrap;font-family:inherit;font-size:14px;line-height:1.8;color:#5A3A45">${esc(t.example)}</pre>
      <div class="note mt12">💡 ${esc(t.tips)}</div>
    </div>`).join('');
  return `<div class="card"><div class="card-title">📄 作文范文模板库 · 共 ${T.length} 类</div><div class="muted">按文体给结构骨架 + 范文片段 + 拿分技巧，照着套就能写出完整作文。</div></div>${cards}`;
}

function litHTML() {
  const all = window.LIT || [];
  const cats = ['all'].concat(Array.from(new Set(all.map(x => x.cat))));
  const chips = cats.map(c =>
    `<div class="chip ${litCat === c ? 'on' : ''}" data-action="lit-cat" data-c="${c}" style="cursor:pointer">${c === 'all' ? '全部' : c}</div>`).join('');
  const list = (litCat === 'all' ? all : all.filter(x => x.cat === litCat)).map(x => `
    <div class="item">
      <div class="main">
        <div class="t">${esc(x.face)} <span class="chip" style="background:#FCE9F0;color:#C2185B;border-color:transparent;font-size:11px">${esc(x.cat)}</span></div>
        <div class="s mt8">${esc(x.back)}</div>
      </div>
    </div>`).join('');
  return `<div class="card"><div class="card-title">📚 文学常识 · 共 ${all.length} 条</div><div class="row" style="gap:6px;flex-wrap:wrap">${chips}</div></div><div class="card">${list || '<div class="empty">暂无该类常识</div>'}</div>`;
}

/* ---------- 专业课（管理学原理）---------- */
function majorHTML() {
  if (quiz.mod === 'major') return quizHTML();
  const done = store.get('wb_cul_done', []);
  const total = CULTURE.length;
  const pct = total ? Math.round(done.length / total * 100) : 0;
  const M = window.MAJOR || { gl: [], ys: [] };
  const ptCount = M.gl.reduce((s, c) => s + c.points.length, 0) + M.ys.reduce((s, c) => s + c.points.length, 0);
  const intro = `
  <div class="card">
    <div class="card-title">📊 管理学原理 · 学习进度</div>
    <div class="row">
      <div class="pill"><div class="k">题库总量</div><div class="v">${total}</div></div>
      <div class="pill"><div class="k">已答对</div><div class="v">${done.length}</div></div>
      <div class="pill"><div class="k">完成度</div><div class="v">${pct}%</div></div>
      <div class="pill"><div class="k">考纲重点</div><div class="v">${ptCount}</div></div>
    </div>
    <div class="bar mt12"><div class="bar-fill" style="width:${pct}%"></div></div>
    <div class="muted mt12">教材：邢以群《管理学》（第五版，浙江大学出版社2019）+ 陈传明等《管理学》（马工程重点教材）。「记忆」按教材分章看考纲重点，「自测」刷题库+背名词解释与简答论述。</div>
  </div>
  <div class="card">
    <div class="card-title">📝 真题演练（模拟考）</div>
    <div class="s">限时自测、自动判分，错题自动收进「我的收藏」反复练。</div>
    <button class="btn mt12" data-action="quiz-start" data-mod="major">▶ 开始一套（${(window.QUIZ_MAJOR || []).length} 题）</button>
  </div>`;
  /* 主标签：自测 | 记忆 */
  const mainTabs = [
    { id: 'test', icon: '🎓', name: '自测' },
    { id: 'memo', icon: '📖', name: '记忆' }
  ];
  const mainBar = mainTabs.map(t =>
    `<div class="nav-item ${majorView === t.id ? 'active' : ''}" style="flex:1;justify-content:center" data-action="major-view" data-view="${t.id}">${t.icon} ${t.name}</div>`).join('');

  let subBar = '';
  let sub = '';
  if (majorView === 'test') {
    const tabs = [
      { id: 'quiz', icon: '📝', name: '题库自测' },
      { id: 'concept', icon: '💡', name: '核心概念' }
    ];
    subBar = tabs.map(t =>
      `<div class="nav-item ${majorTestView === t.id ? 'active' : ''}" style="flex:1;justify-content:center" data-action="major-testview" data-view="${t.id}">${t.icon} ${t.name}</div>`).join('');
    sub = majorTestView === 'quiz' ? cultureTestHTML() : conceptHTML();
  } else {
    const tabs = [
      { id: 'gl', icon: '📘', name: '管理学原理（邢以群）' },
      { id: 'ys', icon: '📗', name: '马工程《管理学》' }
    ];
    subBar = tabs.map(t =>
      `<div class="nav-item ${majorMemoBook === t.id ? 'active' : ''}" style="flex:1;justify-content:center" data-action="major-memobook" data-book="${t.id}">${t.icon} ${t.name}</div>`).join('');
    sub = majorMemoHTML();
  }
  return intro + `<div class="card"><div class="card-title">📚 专业课</div><div class="row" style="gap:8px">${mainBar}</div></div>` +
    `<div class="card"><div class="row" style="gap:8px">${subBar}</div></div>` + sub;
}

/* ---------- 真题演练（专业课/语文/英语 通用 runner）---------- */
const QUIZ_LISTS = { major: 'QUIZ_MAJOR', chinese: 'QUIZ_CHINESE', english: 'ENG_GRAMMAR_QUIZ' };
const QUIZ_NAME = { major: '专业课', chinese: '大学语文', english: '英语语法' };
function quizHTML() {
  if (!quiz.mod) return '<div class="card"><div class="empty">未选择试卷</div></div>';
  const src = window[QUIZ_LISTS[quiz.mod]] || [];
  if (!quiz.list.length) quiz.list = src.slice();
  return quiz.scored ? quizResultHTML() : quizRunHTML();
}
function quizRunHTML() {
  const list = quiz.list;
  if (quiz.idx >= list.length) quiz.idx = 0;
  const q = list[quiz.idx];
  const pick = quiz.picks[quiz.idx];
  const opts = q.options.map((o, oi) => `
    <div class="item" data-action="quiz-select" data-i="${oi}" style="cursor:pointer;${pick === oi ? 'background:#FFF0F4;border-color:var(--pink-300)' : ''}">
      <div class="main"><div class="t">${String.fromCharCode(65 + oi)}. ${esc(o)}</div></div>
      <div class="acts" style="color:var(--pink-500);font-weight:700">${pick === oi ? '✔' : ''}</div>
    </div>`).join('');
  const isLast = quiz.idx === list.length - 1;
  return `
  <div class="card">
    <div class="card-title">📝 ${esc(QUIZ_NAME[quiz.mod])}真题演练 · 第 ${quiz.idx + 1}/${list.length} 题</div>
    <div class="s mt8" style="font-size:15px;font-weight:700;line-height:1.7">${esc(q.q)}</div>
    <div class="mt12">${opts}</div>
    <div class="row mt16" style="justify-content:center;gap:8px;flex-wrap:wrap">
      <button class="btn sm ghost" data-action="quiz-prev" ${quiz.idx === 0 ? 'disabled' : ''}>‹ 上一题</button>
      ${isLast ? `<button class="btn sm" data-action="quiz-submit">✅ 交卷</button>` : `<button class="btn sm" data-action="quiz-next">下一题 ›</button>`}
      <button class="btn sm ghost" data-action="quiz-exit">退出</button>
    </div>
  </div>`;
}
function quizResultHTML() {
  const list = quiz.list;
  let right = 0;
  list.forEach((q, i) => { if (quiz.picks[i] === q.answer) right++; });
  const items = list.map((q, i) => {
    const your = quiz.picks[i];
    const ok = your === q.answer;
    return `
    <div class="item">
      <div class="main">
        <div class="t" style="font-size:14px;line-height:1.6">${i + 1}. ${esc(q.q)}</div>
        <div class="s mt6" style="line-height:1.6">你的答案：${your == null ? '未答' : String.fromCharCode(65 + your)} ${ok ? '✅' : ('❌ 正确答案：' + String.fromCharCode(65 + q.answer))}</div>
        <div class="note mt6">💡 ${esc(q.explain)}</div>
      </div>
    </div>`;
  }).join('');
  return `
  <div class="card">
    <div class="card-title">📊 ${esc(QUIZ_NAME[quiz.mod])} · 成绩单</div>
    <div class="row" style="gap:10px">
      <div class="pill"><div class="k">得分</div><div class="v">${right}/${list.length}</div></div>
      <div class="pill"><div class="k">正确率</div><div class="v">${Math.round(right / list.length * 100)}%</div></div>
    </div>
    <div class="muted mt8">错题已收进「我的收藏 → 真题错题」，可反复练。</div>
    <div class="row mt12" style="gap:8px;flex-wrap:wrap">
      <button class="btn sm" data-action="quiz-restart">🔄 重做</button>
      <button class="btn sm ghost" data-action="quiz-exit">返回模块</button>
    </div>
  </div>
  <div class="card"><div class="card-title">📋 逐题解析</div>${items}</div>`;
}

/* ---------- 我的收藏（跨模块聚合）---------- */
function favHTML() {
  const status = quoteStatus();
  const wants = (window.QUOTES || []).filter(q => status[quoteKey(q)] === 'want');
  const finDone = store.get('wb_fin_done', []);
  const fins = finDone.map(i => (window.FIN || [])[i]).filter(Boolean);
  const patDone = new Set(store.get('wb_eng_pattern_done', []));
  const pats = (window.ENG_PATTERNS || []).filter(p => patDone.has(p.id));
  const wrong = store.get('wb_wrong', {});
  const listMap = { major: window.QUIZ_MAJOR, chinese: window.QUIZ_CHINESE, english: window.ENG_GRAMMAR_QUIZ };

  const wantCard = wants.length ? wants.map(q => {
    const m = (q.source || '').match(/《(.+?)》/); const kw = m ? m[1] : (q.author || '');
    return `<div class="item"><div class="main"><div class="t" style="font-size:14px;line-height:1.6">${esc(q.text)}</div>
      <div class="s mt6" style="color:var(--pink-600)">—— ${esc(q.author)} · ${esc(q.source)}</div></div>
      <div class="acts"><a class="btn sm ghost" href="${wereadURL(kw)}" target="_blank" rel="noopener">📱 读</a></div></div>`;
  }).join('') : '<div class="empty">还没有「想读」的书摘，去书摘模块标★吧</div>';

  const finCard = fins.length ? fins.map(x => `<div class="item"><div class="main"><div class="t">${esc(x.title)} <span class="chip" style="background:#EAF6F1;color:#2E8B6F;border-color:transparent;font-size:11px">${esc(x.tag)}</span></div><div class="s mt6">${esc(x.text)}</div></div></div>`).join('') : '<div class="empty">去理财模块学一条，会自动出现在这里</div>';

  const patCard = pats.length ? pats.map(p => `<div class="item"><div class="main"><div class="t">${esc(p.pat)} <span class="chip" style="background:#FFF1E0;color:#E08600;border-color:transparent;font-size:11px">练熟</span></div><div class="s mt6">${esc(p.ex)}</div></div></div>`).join('') : '<div class="empty">在英语模块把句式标★练熟，会汇总到这里</div>';

  let wrongCard = '';
  let wrongCount = 0;
  Object.keys(QUIZ_NAME).forEach(m => {
    const idxs = (wrong[m] || []);
    if (!idxs.length) return;
    const list = listMap[m] || [];
    wrongCount += idxs.length;
    const inner = idxs.map(i => {
      const q = list[i]; if (!q) return '';
      return `<div class="item"><div class="main"><div class="t" style="font-size:14px;line-height:1.7">${esc(q.q)}</div>
        <div class="s mt6" style="line-height:1.7">正确答案：<b style="color:#2E7D32">${String.fromCharCode(65 + q.answer)}. ${esc(q.options[q.answer])}</b></div>
        <div class="note mt6">💡 ${esc(q.explain)}</div></div></div>`;
    }).join('');
    wrongCard += `<div class="card"><div class="card-title">📝 ${esc(QUIZ_NAME[m])}错题（${idxs.length}）</div>${inner}
      <div class="row mt12"><button class="btn sm" data-action="quiz-start" data-mod="${m}">🔄 再练一套</button></div></div>`;
  });
  if (!wrongCount) wrongCard = '<div class="card"><div class="card-title">📝 真题错题</div><div class="empty">还没有错题，去「专业课 / 语文 / 英语」做套真题吧 🎯</div></div>';

  return `
  <div class="card"><div class="card-title">⭐ 我的收藏</div><div class="muted">汇总你在各模块标记 / 做错的内容：想读的书摘、已学的理财点、练熟的句式、真题错题。</div></div>
  <div class="card"><div class="card-title">🔖 想读的书摘（${wants.length}）</div>${wantCard}</div>
  <div class="card"><div class="card-title">💡 已学理财点（${fins.length}）</div>${finCard}</div>
  <div class="card"><div class="card-title">✍️ 练熟句式（${pats.length}）</div>${patCard}</div>
  ${wrongCard}`;
}

/* 专业课·记忆：按书分章浏览考纲重点 */
function majorMemoHTML() {
  const M = window.MAJOR || { gl: [], ys: [] };
  const chapters = M[majorMemoBook] || [];
  if (!chapters.length) return `<div class="card"><div class="empty">该教材的考纲重点还没整理</div></div>`;
  if (majorMemoCh >= chapters.length) majorMemoCh = 0;
  const bookName = majorMemoBook === 'gl' ? '管理学原理（邢以群）' : '马工程《管理学》';
  /* 章节选择 chips */
  const chChips = chapters.map((c, i) =>
    `<div class="chip ${majorMemoCh === i ? 'on' : ''}" data-action="major-memoch" data-i="${i}" style="cursor:pointer">${esc(c.ch.split(' ')[0])}</div>`).join('');
  const cur = chapters[majorMemoCh];
  const lvColor = { '核心': 'background:#FDE0E0;color:#C0392B', '重点': 'background:#FDF0DC;color:#B8651A', '了解': 'background:#EEF1FF;color:#5B6FC9' };
  const EX = window.MAJOR_EXTRA || {};
  const items = cur.points.map(p => {
    const ext = EX[p.t] || {};
    let termsHTML = '';
    if (ext.terms && ext.terms.length) {
      termsHTML = `<div class="mt8" style="background:#F6F8FF;border-radius:10px;padding:10px 12px">
        <div style="font-size:12px;font-weight:600;color:#5B6FC9;margin-bottom:6px">💡 术语解析（看不懂的词看这里）</div>
        ${ext.terms.map(t => `<div class="s" style="line-height:1.7;margin-bottom:4px"><b style="color:#3D4C9E">${esc(t.w)}</b>：${esc(t.d)}</div>`).join('')}
      </div>`;
    }
    let examHTML = '';
    if (ext.exam) {
      examHTML = `<div class="mt8" style="background:#FFF7F0;border-radius:10px;padding:10px 12px">
        <div style="font-size:12px;font-weight:600;color:#C87330;margin-bottom:6px">📝 真题例题 · ${esc(ext.exam.type)}</div>
        <div class="s" style="line-height:1.7;font-weight:600;color:#7A4A1F">${esc(ext.exam.q)}</div>
        <div class="s mt8" style="line-height:1.7">${esc(ext.exam.a)}</div>
      </div>`;
    }
    return `
    <div class="item">
      <div class="main">
        <div class="t">${esc(p.t)} <span class="chip" style="${lvColor[p.level] || ''};border-color:transparent;font-size:11px">${esc(p.level)}</span></div>
        <div class="s mt8" style="line-height:1.8">${esc(p.body)}</div>
        ${termsHTML}
        ${examHTML}
      </div>
    </div>`;
  }).join('');
  const doneKey = 'wb_major_memo_done';
  const memoDone = store.get(doneKey, []);
  const chKey = majorMemoBook + '_' + majorMemoCh;
  const isDone = memoDone.includes(chKey);
  return `
  <div class="card">
    <div class="card-title">📖 ${bookName} · 考纲重点</div>
    <div class="row" style="gap:6px;flex-wrap:wrap">${chChips}</div>
  </div>
  <div class="card">
    <div class="card-title">${esc(cur.ch)} <span class="muted" style="font-weight:400;font-size:13px">共 ${cur.points.length} 个考点</span></div>
    ${items}
    <div class="row mt16" style="justify-content:center;gap:10px">
      <button class="btn ghost" data-action="major-memoprev">⬅️ 上一章</button>
      <button class="btn ${isDone ? 'ghost' : ''}" data-action="major-memodone">${isDone ? '✅ 已背过本章' : '😎 本章背完了'}</button>
      <button class="btn ghost" data-action="major-memonext">下一章 ➡️</button>
    </div>
  </div>`;
}
function conceptHTML() {
  const all = window.CULTURE || [];
  const nouns = all.filter(x => x.type === '名词解释');
  const books = ['概论', '艺术学'];
  const cards = books.map(b => {
    const items = nouns.filter(x => x.book === b).map(x => `
      <div class="item"><div class="main">
        <div class="t">${esc(x.q)}</div>
        <div class="s mt8">${esc(x.a)}</div>
      </div></div>`).join('');
    return `<div class="card"><div class="card-title">💡 ${b} · 核心概念（${nouns.filter(x => x.book === b).length}）</div>${items}</div>`;
  }).join('');
  return cards;
}

/* 书架：原每日阅读内容 */
function readingBooksHTML() {
  const books = store.get('wb_book_list', []);
  const today = store.get('wb_reading_min_' + TODAY, 0);
  const items = books.map(b => `
    <div class="item">
      <div class="main">
        <div class="t">${esc(b.title)} <span class="muted">· ${esc(b.author || '未知')}</span></div>
        <div class="s">进度 ${b.progress}/${b.pages} 页</div>
        <div class="bar mt8"><div class="bar-fill" style="width:${b.pages ? Math.min(100, Math.round(b.progress / b.pages * 100)) : 0}%"></div></div>
      </div>
      <div class="acts">
        <a class="btn sm ghost" href="https://weread.qq.com/web/search/books?keyword=${encodeURIComponent(b.title)}" target="_blank" rel="noopener" style="text-decoration:none">📱 去读</a>
        <button class="btn sm ghost" data-action="book-10" data-id="${b.id}">+10页</button>
        <button class="btn sm danger" data-action="book-del" data-id="${b.id}">删</button>
      </div>
    </div>`).join('') || '<div class="empty">书架空空，添加一本想读的书～</div>';
  return `
  <div class="card">
    <div class="card-title">📖 我的书架</div>
    <div class="row">
      <div class="pill"><div class="k">在读书籍</div><div class="v">${books.length}</div></div>
      <div class="pill"><div class="k">今日阅读(分)</div><div class="v">${today}</div></div>
    </div>
    <div class="mt16 row">
      <div style="flex:2;min-width:160px"><label class="fld">书名</label><input id="bk-title" placeholder="例如 人类简史"></div>
      <div style="flex:1;min-width:120px"><label class="fld">作者</label><input id="bk-author" placeholder="作者"></div>
    </div>
    <div class="row mt8">
      <div style="flex:1;min-width:120px"><label class="fld">总页数</label><input id="bk-pages" type="number" placeholder="300"></div>
      <div style="flex:1;min-width:120px"><label class="fld">已读页数</label><input id="bk-prog" type="number" placeholder="0"></div>
      <div style="display:flex;align-items:flex-end"><button class="btn" data-action="book-add">➕ 添加</button></div>
    </div>
    <div class="mt16 row" style="align-items:center">
      <span class="muted">记录今日阅读时长：</span>
      <button class="btn sm ghost" data-action="read-add" data-min="15">+15分</button>
      <button class="btn sm ghost" data-action="read-add" data-min="30">+30分</button>
      <button class="btn sm ghost" data-action="read-add" data-min="60">+60分</button>
    </div>
  </div>
  <div class="card"><div class="card-title">📚 书架</div>${items}</div>`;
}

/* ---------- 推荐书单（输入心情→本地匹配）---------- */
function matchBooks(text) {
  const syn = window.BOOK_SYN || {};
  const matched = new Set();
  for (const key in syn) { if (text.indexOf(key) >= 0) matched.add(syn[key]); }
  const books = window.BOOKS || [];
  if (!matched.size) {
    const fb = books.filter(b => b.tags.indexOf('治愈') >= 0 || b.tags.indexOf('平静') >= 0);
    const list = (fb.length ? fb : books.slice()).slice(0, 5).map(b => ({ book: b, hit: [] }));
    return { tags: [], list };
  }
  const scored = books
    .map(b => ({ book: b, hit: b.tags.filter(t => matched.has(t)) }))
    .filter(x => x.hit.length)
    .sort((a, b) => b.hit.length - a.hit.length);
  return { tags: [...matched], list: scored.slice(0, 6) };
}
/* 微信读书直达链接：按书名跳到微信读书搜索页（手机上会提示打开 App） */
function wereadURL(title) {
  return 'https://weread.qq.com/web/search/books?keyword=' + encodeURIComponent(title);
}
function bookRecItemHTML(b, hit) {
  return `
  <div class="item">
    <div class="main">
      <div class="t">${esc(b.title)} <span class="muted">· ${esc(b.author)}</span></div>
      <div class="s mt8">${esc(b.note || '')}</div>
      <div class="row mt8" style="gap:6px;flex-wrap:wrap;align-items:center">
        ${b.tags.map(t => { const c = { '小众': ['#E8F5E9', '#2E7D32'], '历史': ['#FFF3E0', '#E65100'], '心理': ['#E3F2FD', '#1565C0'], '女性': ['#FCE4EC', '#C2185B'] }[t] || ['#EEF1FF', '#5B6FC9']; return `<span class="chip" style="background:${c[0]};color:${c[1]};border-color:transparent">${esc(t)}</span>`; }).join('')}
        ${hit && hit.length ? `<span class="chip" style="background:linear-gradient(120deg,var(--pink-400),var(--pink-500));color:#fff;border-color:transparent">★ 匹配 ${esc(hit.join('/'))}</span>` : ''}
        <a class="chip" href="${wereadURL(b.title)}" target="_blank" rel="noopener" style="background:#E7F3FF;color:#1976D2;border-color:transparent;text-decoration:none;cursor:pointer">📱 微信读书 ›</a>
      </div>
    </div>
  </div>`;
}
function bookRecHTML() {
  const all = window.BOOKS || [];
  const recs = bookRecs;
  const tagChips = recs && recs.tags.length
    ? recs.tags.map(t => `<span class="chip" style="background:#FCE9F0;color:#C2185B;border-color:transparent">${esc(t)}</span>`).join('')
    : '';
  const input = `
  <div class="card">
    <div class="card-title">🔮 今天读什么？说说你的心情</div>
    <textarea id="mood-text" rows="3" placeholder="例如：今天有点孤独，又有点迷茫，不知道以后怎么办…"
      style="width:100%;border:1px solid var(--pink-200);border-radius:12px;padding:10px;font-family:inherit;resize:vertical;box-sizing:border-box">${esc(bookMoodText)}</textarea>
    <div class="row mt8" style="align-items:center">
      <button class="btn" data-action="book-rec">✨ 帮我推荐</button>
      ${recs ? `<button class="btn ghost sm" data-action="book-rec-reset">看全部书单</button>` : ''}
    </div>
    ${recs ? `<div class="muted mt8">匹配到心情主题：${tagChips || '（没命中关键词，已为你挑几本适合静心读的）'}</div>` : '<div class="muted mt8">输入当下的心情/想法，本地智能匹配一本适合读的书（离线可用，无需联网）。</div>'}
  </div>`;
  let listHTML, filterHTML = '';
  if (recs) {
    listHTML = recs.list.length
      ? recs.list.map(r => bookRecItemHTML(r.book, r.hit)).join('')
      : '<div class="empty">没匹配到，换个说法试试～</div>';
  } else {
    const tags = ['all'].concat(Array.from(new Set(all.reduce((a, b) => a.concat(b.tags), []))));
    filterHTML = `<div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:8px">${tags.map(t =>
      `<div class="chip ${bookLibTag === t ? 'on' : ''}" data-action="book-tag" data-tag="${t}" style="cursor:pointer">${t === 'all' ? '全部' : t}</div>`).join('')}</div>`;
    const shown = bookLibTag === 'all' ? all : all.filter(b => b.tags.indexOf(bookLibTag) >= 0);
    listHTML = shown.map(b => bookRecItemHTML(b, [])).join('');
  }
  const title = recs ? '📚 为你推荐' : `📚 推荐书单 · 共 ${all.length} 本`;
  return input + `<div class="card"><div class="card-title">${title}</div>${filterHTML}${listHTML || '<div class="empty">书单为空</div>'}</div>`;
}

/* 抽题：按书均匀覆盖四种题型 */
function buildCulQueue(book) {
  let pool = CULTURE.slice();
  if (book !== '全部') pool = pool.filter(x => x.book === book);
  const types = ['选择', '名词解释', '简答', '论述', '材料分析'];
  const per = 2;
  let q = [];
  types.forEach(t => { takeRandom(pool.filter(x => x.type === t), per).forEach(x => q.push(x)); });
  return shuffle(q);
}

/* 管理学原理自测（校考200分） */
function cultureTestHTML() {
  if (!culQueue.length) { culQueue = buildCulQueue(culBook); culTotal = culQueue.length; }
  const books = ['全部'];
  const chips = books.map(b =>
    `<div class="chip ${culBook === b ? 'on' : ''}" data-action="culture-book" data-book="${b}" style="cursor:pointer">${b}</div>`).join('');
  const finished = culQueue.length === 0;
  let body;
  if (finished) {
    body = `<div class="card"><div class="card-title">🎓 管理学原理自测</div><div class="empty">🎉 本轮已刷完！点「换一批」再来一组。</div></div>`;
  } else {
    const it = culQueue[0];
    body = `
    <div class="card">
      <div class="card-title">🎓 管理学原理自测 · 剩余 ${culQueue.length} 题</div>
      <div class="between"><span class="tag" style="background:var(--pink-50);color:var(--pink-600);border:1px solid var(--pink-200);border-radius:999px;padding:3px 12px;font-size:12px;font-weight:700">${it.type}</span><span class="muted">${it.book}</span></div>
      <div class="qbox">${esc(it.q)}</div>
      ${culReveal ? `<div class="abox">${esc(it.a)}</div>` : `<div class="muted mt12">👆 点「看答案」回忆要点</div>`}
      <div class="row mt16" style="justify-content:center">
        <button class="btn ghost" data-action="culture-flip">👀 看答案</button>
        <button class="btn ghost" data-action="culture-wrong">✗ 答错</button>
        <button class="btn" data-action="culture-correct">✓ 答对</button>
      </div>
    </div>`;
  }
  return `
  <div class="card">
    <div class="card-title">🎓 管理学原理 · 校考 200 分</div>
    <div class="row" style="gap:8px">${chips}</div>
    <div class="pill mt12" style="display:inline-block"><div class="k">已答对</div><div class="v">${culCorrect}/${culTotal}</div></div>
  </div>
  ${body}
  <div class="card" style="text-align:center"><button class="btn sm danger" data-action="culture-restart">🔄 换一批</button></div>`;
}

/* ---------- 3. 锻炼身体 ---------- */
function exerciseHTML() {
  const list = store.get('wb_exercise_' + TODAY, []);
  const totMin = list.reduce((a, x) => a + (x.min || 0), 0);
  const totCal = list.reduce((a, x) => a + (x.cal || 0), 0);
  const tabs = [['log', '📋 打卡'], ['moves', '🏋️ 动作库'], ['timer', '⏱ 计时'], ['stretch', '🧘 拉伸']];
  const tabBar = `<div class="mt12">` + tabs.map(([v, label]) => `<span class="chip ${exView === v ? 'on' : ''}" data-action="ex-view" data-view="${v}" style="cursor:pointer;margin-right:6px">${label}</span>`).join('') + `</div>`;
  let body = '';
  if (exView === 'moves') body = exMovesHTML();
  else if (exView === 'timer') body = exTimerHTML();
  else if (exView === 'stretch') body = exStretchHTML();
  else body = exLogHTML(totMin, totCal, list);
  return `<div class="card"><div class="card-title">🏃 锻炼身体</div>${tabBar}</div>${body}`;
}

function exLogHTML(totMin, totCal, list) {
  const items = list.map(x => `
    <div class="item">
      <div class="main"><div class="t">${esc(x.name)}</div><div class="s">${x.min} 分钟 · ${x.cal} 千卡</div></div>
      <div class="acts"><button class="btn sm danger" data-action="ex-del" data-id="${x.id}">删</button></div>
    </div>`).join('') || '<div class="empty">今天还没动起来，去运动一下吧 🏃</div>';
  return `
  <div class="card">
    <div class="row">
      <div class="pill"><div class="k">今日时长</div><div class="v">${totMin}分</div></div>
      <div class="pill"><div class="k">消耗</div><div class="v">${totCal}千卡</div></div>
    </div>
    <div class="mt16 row">
      <div style="flex:2;min-width:160px"><label class="fld">运动项目</label><input id="ex-name" placeholder="例如 慢跑/瑜伽"></div>
      <div style="flex:1;min-width:100px"><label class="fld">分钟</label><input id="ex-min" type="number" placeholder="30"></div>
      <div style="flex:1;min-width:100px"><label class="fld">千卡</label><input id="ex-cal" type="number" placeholder="200"></div>
      <div style="display:flex;align-items:flex-end"><button class="btn" data-action="ex-add">➕ 记录</button></div>
    </div>
  </div>
  <div class="card"><div class="card-title">📋 今日记录</div>${items}</div>`;
}

function exMovesHTML() {
  const COACH = {
    '安娜':     { c: 'linear-gradient(120deg,#7C5CFC,#9D7BFF)', t: '#fff' },
    '欧阳春晓': { c: 'linear-gradient(120deg,#FF8FB1,#FF6F91)', t: '#fff' },
    '帕梅拉':   { c: 'linear-gradient(120deg,#5BC8B8,#3FAE9C)', t: '#fff' },
    '徒手':     { c: 'rgba(120,120,140,.14)', t: 'var(--ink)' },
    '体态':     { c: 'linear-gradient(120deg,#F0A24B,#E0883A)', t: '#fff' }
  };
  const cb = (co) => { const s = COACH[co] || COACH['徒手']; return `<span class="chip" style="background:${s.c};color:${s.t};border-color:transparent;font-size:11px;margin-left:6px">${esc(co)}</span>`; };
  const MOVES = [
    // 有氧
    { part: '有氧', coach: '安娜', name: '安娜全身塑形', tip: '安娜跟练的全身燃脂塑形操，零器械，约 20–30 分钟，跟着音乐节奏做即可。', set: '跟练 1 次' },
    { part: '有氧', coach: '帕梅拉', name: '帕梅拉三部曲', tip: '经典三部曲：腹部 10min + 臀腿 10min + 全身 10min，共 30 分钟高效跟练。', set: '跟练 1 次' },
    { part: '有氧', coach: '徒手', name: '开合跳', tip: '跳起手脚张开、再跳回并拢，热身燃脂两不误。', set: '3 组 × 30 秒' },
    { part: '有氧', coach: '徒手', name: '高抬腿', tip: '原地跑动，膝盖抬至腰高，加快心率。', set: '3 组 × 30 秒' },
    { part: '有氧', coach: '徒手', name: '原地慢跑', tip: '轻松原地跑，备考间隙活动全身、醒脑。', set: '10 分钟' },
    // 胸
    { part: '胸', coach: '帕梅拉', name: '帕梅拉·胸臂训练', tip: '帕梅拉跟练，针对胸大肌与手臂，多结合推举与夹胸动作。', set: '跟练 1 次' },
    { part: '胸', coach: '安娜', name: '安娜·上半身塑形', tip: '安娜上半身跟练，胸臂肩一起练，改善含胸、练出挺拔线条。', set: '跟练 1 次' },
    { part: '胸', coach: '徒手', name: '俯卧撑', tip: '双手略宽于肩，身体成一条直线，下放时胸贴近地面，推起时呼气。', set: '3 组 × 12 次' },
    { part: '胸', coach: '徒手', name: '上斜俯卧撑', tip: '手撑椅子或床沿、脚在地面，身体斜向下，侧重上胸。', set: '3 组 × 12 次' },
    // 背
    { part: '背', coach: '欧阳春晓', name: '欧阳春晓·薄背挺姿', tip: '欧阳春晓背部跟练，改善圆肩含胸、练出薄薄的后背线条。', set: '跟练 1 次' },
    { part: '背', coach: '帕梅拉', name: '帕梅拉·背部', tip: '帕梅拉背部训练，俯身划船+超人式，收紧背肌改善驼背。', set: '跟练 1 次' },
    { part: '背', coach: '徒手', name: '反向划船', tip: '躺桌下双手抓桌沿，脚着地身体后仰，拉胸靠桌、夹背。', set: '3 组 × 10 次' },
    { part: '背', coach: '徒手', name: '俯卧超人', tip: '俯卧抬起双手双脚，像超人飞翔，挤压背部，慢放。', set: '3 组 × 15 次' },
    // 腿·臀
    { part: '腿·臀', coach: '安娜', name: '安娜·蜜桃臀', tip: '安娜臀腿跟练，深蹲+臀桥+后踢组合，在家练出翘臀。', set: '跟练 1 次' },
    { part: '腿·臀', coach: '帕梅拉', name: '帕梅拉·臀腿', tip: '帕梅拉臀腿训练，侧卧抬腿+深蹲+臀桥，紧致臀腿。', set: '跟练 1 次' },
    { part: '腿·臀', coach: '欧阳春晓', name: '欧阳春晓·漫画腿', tip: '欧阳春晓瘦腿跟练，拉伸+局部紧致，改善腿型。', set: '跟练 1 次' },
    { part: '腿·臀', coach: '徒手', name: '深蹲', tip: '双脚与肩同宽，臀部后坐下蹲至大腿平行，膝盖朝脚尖不内扣。', set: '3 组 × 15 次' },
    { part: '腿·臀', coach: '徒手', name: '保加利亚分腿蹲', tip: '一脚踩凳，前腿下蹲再站起，练臀腿，左右各做。', set: '每侧 3 组 × 10 次' },
    { part: '腿·臀', coach: '徒手', name: '臀桥', tip: '仰卧屈膝，抬臀至肩膝成一线，顶峰夹臀，慢放。', set: '3 组 × 15 次' },
    // 肩
    { part: '肩', coach: '欧阳春晓', name: '欧阳春晓·直角肩', tip: '欧阳春晓直角肩跟练，开肩沉肩，改善溜肩练出直角肩。', set: '跟练 1 次' },
    { part: '肩', coach: '帕梅拉', name: '帕梅拉·肩臂', tip: '帕梅拉肩臂训练，侧平举+推举，练出挺拔肩线。', set: '跟练 1 次' },
    { part: '肩', coach: '安娜', name: '安娜·肩臂线条', tip: '安娜肩臂跟练，改善圆肩、收紧拜拜肉，练出线条感。', set: '跟练 1 次' },
    { part: '肩', coach: '徒手', name: '派克俯卧撑', tip: '臀部抬高成倒 V，屈肘让头顶下探，练肩前束。', set: '3 组 × 10 次' },
    { part: '肩', coach: '徒手', name: '水瓶侧平举', tip: '双手各持一瓶水，侧平举至肩高，控制慢放。', set: '3 组 × 12 次' },
    // 手臂
    { part: '手臂', coach: '安娜', name: '安娜·纤臂', tip: '安娜手臂跟练，针对拜拜肉，紧致上肢线条。', set: '跟练 1 次' },
    { part: '手臂', coach: '欧阳春晓', name: '欧阳春晓·天鹅臂', tip: '欧阳春晓天鹅臂，舒展手臂线条、改善副乳与拜拜肉。', set: '跟练 1 次' },
    { part: '手臂', coach: '帕梅拉', name: '帕梅拉·手臂', tip: '帕梅拉手臂训练，弯举+臂屈伸组合，紧实肱二头三头。', set: '跟练 1 次' },
    { part: '手臂', coach: '徒手', name: '水瓶二头弯举', tip: '大臂贴身，弯举至胸前再慢放，练肱二头。', set: '3 组 × 12 次' },
    { part: '手臂', coach: '徒手', name: '椅子臂屈伸', tip: '背对椅子双手撑边，屈肘下蹲再撑起，练肱三头。', set: '3 组 × 10 次' },
    // 核心
    { part: '核心', coach: '帕梅拉', name: '帕梅拉·腹肌', tip: '帕梅拉经典腹肌训练，卷腹+抬腿组合，练出马甲线。', set: '跟练 1 次' },
    { part: '核心', coach: '安娜', name: '安娜·马甲线', tip: '安娜腹部跟练，居家高效燃脂收腹。', set: '跟练 1 次' },
    { part: '核心', coach: '欧阳春晓', name: '欧阳春晓·瘦腰', tip: '欧阳春晓腰腹跟练，侧腰收紧、改善小肚腩。', set: '跟练 1 次' },
    { part: '核心', coach: '徒手', name: '平板支撑', tip: '前臂撑地，身体成直线，收紧腹臀不塌腰，匀速呼吸。', set: '3 组 × 45 秒' },
    { part: '核心', coach: '徒手', name: '卷腹', tip: '仰卧屈膝，上腹卷起肩胛离地，下背始终贴地。', set: '3 组 × 20 次' },
    { part: '核心', coach: '徒手', name: '俄罗斯转体', tip: '坐姿后仰，持物或空手左右转体，练腹斜肌。', set: '3 组 × 20 次' },
    // 体态调整
    { part: '体态调整', coach: '体态', name: '9090 呼吸', tip: '仰卧屈膝、脚掌相对、双膝外展成 90/90，手放腹部；吸气鼓腹、呼气收腹，激活深层核心与盆底肌。', set: '5–10 分钟' },
    { part: '体态调整', coach: '体态', name: '体态大师', tip: '靠墙站立，后脑/肩胛/臀/小腿/脚跟贴墙，收腹沉肩，每天站一站改善圆肩驼背。', set: '每天 5 分钟' },
    { part: '体态调整', coach: '体态', name: '靠墙天使', tip: '背贴墙、双臂贴墙上下滑动如天使翅膀，打开胸腔、纠正圆肩。', set: '3 组 × 10 次' },
    { part: '体态调整', coach: '体态', name: '死虫式', tip: '仰卧举臂举腿，对侧手脚慢放再收回，练核心稳定、改善骨盆前倾。', set: '3 组 × 12 次' },
    { part: '体态调整', coach: '体态', name: '收下巴训练', tip: '食指抵下巴向后推，做出双下巴感，改善头前伸（探颈）。', set: '3 组 × 10 次' },
    { part: '体态调整', coach: '体态', name: '站姿骨盆中立', tip: '微屈膝、收腹提肛，让骨盆回到中立位，放松腰椎，改善骨盆前/后倾。', set: '保持 1–2 分钟' }
  ];
  const parts = []; MOVES.forEach(m => { if (!parts.includes(m.part)) parts.push(m.part); });
  const secs = parts.map(p => {
    const ls = MOVES.filter(m => m.part === p).map(m => `
      <div class="item">
        <div class="main">
          <div class="t">${esc(m.name)}${cb(m.coach)}</div>
          <div class="s mt8">${esc(m.tip)}</div>
          <div class="s mt4" style="color:var(--pink-500);font-weight:600">建议：${esc(m.set)}</div>
        </div>
        <div class="acts"><button class="btn sm ghost" data-action="ex-move-done" data-name="${esc(m.name)}">记录本次</button></div>
      </div>`).join('');
    const icon = p === '体态调整' ? '🦴' : '💪';
    return `<div class="card"><div class="card-title">${icon} ${esc(p)}</div>${ls}</div>`;
  }).join('');
  const legend = `<div class="muted" style="margin:2px 2px 10px">教练：安娜 · 欧阳春晓 · 帕梅拉 · 徒手基础 · 体态专项。点「记录本次」可计入今日打卡。</div>`;
  return legend + secs + '<div class="empty" style="border:none">动作要点仅供参考，量力而行；如有伤痛或不适请停止并咨询医生。</div>';
}

function exTimerHTML() {
  const presets = [[60, '平板支撑'], [20, 'HIIT 一组'], [60, '组间休息'], [300, '冥想/眼保健']];
  const presetBtns = presets.map(([s, t]) => `<span class="chip" data-action="ex-timer-preset" data-secs="${s}" style="cursor:pointer">${t} ${fmtTime(s)}</span>`).join(' ');
  return `
  <div class="card" style="text-align:center">
    <div class="card-title">⏱ 计时训练</div>
    <div style="font-size:54px;font-weight:800;letter-spacing:2px;margin:14px 0;color:var(--pink-500)">${fmtTime(exLeft || exTotal || 0)}</div>
    <div class="muted">${exTimerId ? '计时中…' : (exTotal ? '已暂停 / 就绪' : '选一个预设或自定义秒数')}</div>
    <div class="mt16 row" style="justify-content:center;gap:8px;flex-wrap:wrap">${presetBtns}</div>
    <div class="mt16 row" style="justify-content:center;gap:8px;align-items:flex-end">
      <div style="min-width:120px"><label class="fld">自定义秒数</label><input id="ex-secs" type="number" placeholder="如 45"></div>
      <button class="btn" data-action="ex-timer-start">开始</button>
      <button class="btn ghost" data-action="ex-timer-pause">暂停</button>
      <button class="btn ghost" data-action="ex-timer-reset">重置</button>
    </div>
  </div>`;
}

function exStretchHTML() {
  const ST = [
    { name: '颈部侧拉伸', dur: 20, tip: '单手轻扶头侧，向同侧慢拉，感受对侧颈肩延展，左右各做。' },
    { name: '肩部环绕', dur: 20, tip: '双肩由前向后画大圈，放松肩颈，做约 10 次。' },
    { name: '靠墙胸肌拉伸', dur: 20, tip: '手臂贴墙屈肘 90°，身体慢转向外，打开胸腔。' },
    { name: '猫牛式', dur: 30, tip: '四足跪姿，吸气塌腰抬头、呼气拱背低头，活动整条脊柱。' },
    { name: '婴儿式', dur: 30, tip: '跪坐臀部坐脚跟，双臂前伸额头触地，放松腰背。' },
    { name: '仰卧单膝抱', dur: 20, tip: '仰卧抱单膝贴胸，放松下背与髋部，左右各做。' },
    { name: '站姿大腿前侧拉伸', dur: 20, tip: '单手扶墙，另一手抓同侧脚踝拉向臀部，左右各做。' },
    { name: '推墙小腿拉伸', dur: 20, tip: '弓步推墙，后腿伸直脚跟踩地，拉伸小腿，左右各做。' },
    { name: '坐姿体前屈', dur: 30, tip: '坐姿腿伸直，慢向前俯身手够脚尖，拉伸腿后侧。' }
  ];
  const items = ST.map(s => `
    <div class="item">
      <div class="main">
        <div class="t">${esc(s.name)}</div>
        <div class="s mt8">${esc(s.tip)}</div>
        <div class="s mt4" style="color:var(--pink-500);font-weight:600">建议 ${s.dur} 秒 / 侧</div>
      </div>
      <div class="acts"><button class="btn sm ghost" data-action="ex-stretch-go" data-dur="${s.dur}">⏱ 计时</button></div>
    </div>`).join('');
  return `<div class="card"><div class="card-title">🧘 拉伸放松（久坐必备）</div>${items}</div><div class="empty" style="border:none">每个动作保持自然呼吸，有拉伸感但不疼痛；左右对称的部位记得两边都做。</div>`;
}

/* ---------- 4. 好好吃饭 ---------- */
function foodHTML() {
  const list = store.get('wb_food_' + TODAY, []);
  const total = list.reduce((a, x) => a + (x.cal || 0), 0);
  const types = ['早餐', '午餐', '晚餐', '加餐'];
  const items = list.map(x => `
    <div class="item">
      <div class="main"><div class="t">${esc(x.name)}</div><div class="s">${x.type} · ${x.cal} 千卡</div></div>
      <div class="acts"><button class="btn sm danger" data-action="food-del" data-id="${x.id}">删</button></div>
    </div>`).join('') || '<div class="empty">记得好好吃饭呀 🍱</div>';
  return `
  <div class="card">
    <div class="card-title">🍱 好好吃饭 · 今日饮食</div>
    <div class="row">
      <div class="pill"><div class="k">今日总摄入</div><div class="v">${total}千卡</div></div>
      <div class="pill"><div class="k">记录条数</div><div class="v">${list.length}</div></div>
    </div>
    <div class="mt16 row">
      <div style="flex:1;min-width:120px"><label class="fld">餐别</label>
        <select id="food-type">${types.map(t => `<option>${t}</option>`).join('')}</select></div>
      <div style="flex:2;min-width:160px"><label class="fld">食物</label><input id="food-name" placeholder="例如 鸡胸肉沙拉"></div>
      <div style="flex:1;min-width:100px"><label class="fld">千卡</label><input id="food-cal" type="number" placeholder="350"></div>
      <div style="display:flex;align-items:flex-end"><button class="btn" data-action="food-add">➕ 记录</button></div>
    </div>
  </div>
  <div class="card"><div class="card-title">📋 今日记录</div>${items}</div>`;
}

/* ---------- 5. 理财学习 ---------- */
function finDailyIdx() {
  const a = window.FIN || [];
  if (!a.length) return -1;
  const base = Math.floor(Date.now() / 86400000) % a.length;
  return (base + finOffset) % a.length;
}
function finDailyHTML() {
  const a = window.FIN || [];
  const done = store.get('wb_fin_done', []);
  const doneSet = new Set(done);
  const total = a.length;
  const idx = finDailyIdx();
  const q = idx >= 0 ? a[idx] : null;
  const open = finOpen.has(idx);
  const lesson = q ? `
    <div class="lesson">
      <div class="row" style="gap:8px;align-items:center">
        <span class="chip" style="background:#EAF6F1;color:#2E8B6F;border-color:transparent">${esc(q.tag)}</span>
        <span class="muted">第 ${idx + 1} / ${total} 条 · 每天一篇</span>
      </div>
      <div class="t" style="font-size:16px;font-weight:700;margin-top:8px;cursor:pointer" data-action="fin-open" data-idx="${idx}">${esc(q.title)} ${q.detail ? '<span class="chip" style="background:#FFF0F4;color:#C24A77;border-color:transparent;font-size:11px">点开看详解 ›</span>' : ''}</div>
      <div class="s mt8" style="line-height:1.85;color:var(--ink)">${esc(q.text)}</div>
      ${open && q.detail ? `<div class="mt12" style="background:#FFF7FB;border:1px solid #F6D7E4;border-radius:14px;padding:12px 14px;font-size:14px;color:#5A3A45;line-height:1.8"><b>🔍 小白详解：</b>${esc(q.detail)}</div>` : ''}
      <div class="mt12">
        ${doneSet.has(idx)
          ? '<span class="chip" style="background:linear-gradient(120deg,var(--pink-400),var(--pink-500));color:#fff;border-color:transparent">✓ 今天学过啦</span>'
          : `<button class="btn sm" data-action="fin-done" data-idx="${idx}">✓ 标记已学</button>`}
        <button class="btn ghost sm" data-action="fin-next">换一条看看</button>
      </div>
    </div>` : '<div class="empty">还没有理财知识点。</div>';
  const allList = a.map((x, i) => {
    const o = finOpen.has(i);
    return `
    <div class="item" style="cursor:pointer" data-action="fin-open" data-idx="${i}">
      <div class="main">
        <div class="t">${esc(x.title)} <span class="chip" style="background:#EAF6F1;color:#2E8B6F;border-color:transparent;font-size:11px">${esc(x.tag)}</span>${x.detail ? '<span class="chip" style="background:#FFF0F4;color:#C24A77;border-color:transparent;font-size:11px">详解 ›</span>' : ''}</div>
        <div class="s mt8">${esc(x.text)}</div>
        ${o && x.detail ? `<div class="mt8" style="background:#FFF7FB;border:1px solid #F6D7E4;border-radius:12px;padding:10px 12px;font-size:13px;color:#5A3A45;line-height:1.75">🔍 ${esc(x.detail)}</div>` : ''}
      </div>
      <div class="acts">
        ${doneSet.has(i) ? '<span class="muted">✓ 已学</span>' : `<button class="btn sm ghost" data-action="fin-done" data-idx="${i}">学</button>`}
      </div>
    </div>`;
  }).join('');
  return `
  <div class="card">
    <div class="card-title">📅 每日理财小知识</div>
    ${lesson}
    <div class="row mt12">
      <div class="pill"><div class="k">已学</div><div class="v">${doneSet.size}</div></div>
      <div class="pill"><div class="k">共</div><div class="v">${total}</div></div>
    </div>
  </div>
  <div class="card"><div class="card-title">📚 全部理财知识点（点任一条看小白详解）</div>${allList}</div>`;
}

/* 理财书摘：摘抄 + 可点开解析 */
function finBooksHTML() {
  const list = window.FIN_BOOKS || [];
  if (!list.length) return '';
  const cards = list.map((b, i) => {
    const o = finBookOpen.has(i);
    const bm = b.title;
    return `
    <div class="item" style="cursor:pointer" data-action="finbook-open" data-idx="${i}">
      <div class="main">
        <div class="t" style="font-size:15px">${esc(b.title)} <span class="chip" style="background:#EAF6F1;color:#2E8B6F;border-color:transparent;font-size:11px">${esc(b.tag)}</span></div>
        <div class="s mt4" style="color:#8a6d3b">${esc(b.author)}</div>
        <div class="s mt8" style="font-style:italic;color:#C24A77;line-height:1.7">“${esc(b.excerpt)}”</div>
        ${o ? `<div class="mt8" style="background:#F4FBF7;border:1px solid #CDEBD6;border-radius:12px;padding:10px 12px;font-size:13px;color:#3a5a4a;line-height:1.75"><b>📖 解析：</b>${esc(b.analysis)}</div>` : ''}
      </div>
      <div class="acts" style="flex-direction:column;gap:6px;align-items:flex-end">
        <span class="chip" style="background:#FFF0F4;color:#C24A77;border-color:transparent;font-size:11px">解析 ›</span>
        <a class="btn sm ghost" href="${wereadURL(bm)}" target="_blank" rel="noopener">📱 微信读书</a>
      </div>
    </div>`;
  }).join('');
  return `<div class="card"><div class="card-title">📚 理财书摘 · 摘抄 + 解析（点任一条看解析）</div>${cards}</div>`;
}

function finlearnHTML() {
  const list = store.get('wb_finlearn_list', []);
  const today = store.get('wb_finlearn_list', []).filter(x => x.date === TODAY).length;
  const items = list.slice().reverse().map(n => `
    <div class="item">
      <div class="main"><div class="t">${esc(n.topic)}</div><div class="s">${esc(n.note)} · ${n.date}</div></div>
      <div class="acts"><button class="btn sm danger" data-action="fl-del" data-id="${n.id}">删</button></div>
    </div>`).join('') || '<div class="empty">记录你学到的理财知识吧 💡</div>';
  return finDailyHTML() + finBooksHTML() + `
  <div class="card">
    <div class="card-title">💡 理财学习 · 学习笔记</div>
    <div class="row">
      <div class="pill"><div class="k">累计笔记</div><div class="v">${list.length}</div></div>
      <div class="pill"><div class="k">今日新增</div><div class="v">${today}</div></div>
    </div>
    <div class="mt16">
      <label class="fld">主题</label><input id="fl-topic" placeholder="例如 复利">
      <label class="fld">笔记内容</label><textarea id="fl-note" placeholder="记录要点…"></textarea>
      <div class="mt12"><button class="btn" data-action="fl-add">➕ 保存笔记</button></div>
    </div>
  </div>
  <div class="card"><div class="card-title">📚 笔记列表</div>${items}</div>` + finChecklistHTML();
}

/* 理财 · 新手实操清单 */
function finChecklistHTML() {
  const CK = window.FIN_CHECKLIST || [];
  const done = new Set(store.get('wb_fin_checklist', []));
  const items = CK.map((c, i) => `
    <div class="item" style="cursor:pointer" data-action="fincheck-toggle" data-i="${i}">
      <div class="main">
        <div class="t"><span style="display:inline-block;width:22px">${done.has(i) ? '✅' : '⬜'}</span> ${esc(c.step)}</div>
        <div class="s mt6" style="line-height:1.6">${esc(c.detail)}</div>
      </div>
    </div>`).join('');
  return `<div class="card"><div class="card-title">✅ 新手实操清单（${done.size}/${CK.length}）</div><div class="muted">按顺序做，每完成一步点一下打勾，攒出你的理财基本功。</div></div><div class="card">${items}</div>`;
}

/* ---------- 6. 早睡早起 ---------- */
function sleepHTML() {
  const rec = store.get('wb_sleep_' + TODAY, null);
  const history = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const r = store.get('wb_sleep_' + fmtDate(d), null);
    if (r) history.push({ date: fmtDate(d), ...r });
  }
  const histHTML = history.length ? history.map(h =>
    `<div class="item"><div class="main"><div class="t">${h.date}</div><div class="s">${h.bed} → ${h.wake} · 睡了 ${h.duration}h</div></div></div>`).join('')
    : '<div class="empty">还没有作息记录</div>';
  return `
  <div class="card">
    <div class="card-title">🌙 早睡早起 · 今日作息</div>
    <div class="row">
      <div style="flex:1;min-width:140px"><label class="fld">昨晚入睡</label><input id="sleep-bed" type="time" value="${rec ? rec.bed : '23:00'}"></div>
      <div style="flex:1;min-width:140px"><label class="fld">今早起床</label><input id="sleep-wake" type="time" value="${rec ? rec.wake : '07:00'}"></div>
      <div style="display:flex;align-items:flex-end"><button class="btn" data-action="sleep-save">💾 保存</button></div>
    </div>
    ${rec ? `<div class="mt12 chip">😴 昨日睡眠时长：${rec.duration} 小时</div>` : ''}
  </div>
  <div class="card"><div class="card-title">📅 近 7 天记录</div>${histHTML}</div>`;
}

/* ---------- 7. 护肤打卡 ---------- */
const SKIN_AM = ['洁面', '爽肤水', '精华', '眼霜', '面霜', '防晒'];
const SKIN_PM = ['卸妆', '洁面', '爽肤水', '精华', '面霜'];
function skincareHTML() {
  const rec = store.get('wb_skincare_' + TODAY, { am: {}, pm: {} });
  const amDone = SKIN_AM.filter(s => rec.am[s]).length;
  const pmDone = SKIN_PM.filter(s => rec.pm[s]).length;
  const am = SKIN_AM.map(s =>
    `<div class="dot ${rec.am[s] ? 'on' : ''}" data-action="skin-toggle" data-part="am" data-step="${s}">${rec.am[s] ? '✓' : s[0]}</div>`).join('');
  const pm = SKIN_PM.map(s =>
    `<div class="dot ${rec.pm[s] ? 'on' : ''}" data-action="skin-toggle" data-part="pm" data-step="${s}">${rec.pm[s] ? '✓' : s[0]}</div>`).join('');
  return `
  <div class="card">
    <div class="card-title">🧴 护肤打卡</div>
    <div class="between"><b>🌞 早间护肤</b><span class="muted">${amDone}/${SKIN_AM.length}</span></div>
    <div class="track mt8">${am}</div>
    <div class="between mt16"><b>🌜 晚间护肤</b><span class="muted">${pmDone}/${SKIN_PM.length}</span></div>
    <div class="track mt8">${pm}</div>
  </div>`;
}

/* ---------- 8. 心情记录 ---------- */
const MOODS = [
  { icon: '😊', label: '开心' }, { icon: '😌', label: '平静' }, { icon: '😐', label: '一般' },
  { icon: '😟', label: '焦虑' }, { icon: '😴', label: '疲惫' }, { icon: '🥳', label: '兴奋' }
];
function moodHTML() {
  const rec = store.get('wb_mood_' + TODAY, null);
  if (!selMood && rec) selMood = rec.icon;
  const grid = MOODS.map(m =>
    `<div class="mood ${selMood === m.icon ? 'on' : ''}" data-action="mood-pick" data-mood="${m.icon}">${m.icon}<span class="l">${m.label}</span></div>`).join('');
  const history = [];
  for (let i = 1; i < 7; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const r = store.get('wb_mood_' + fmtDate(d), null);
    if (r) history.push(`<div class="item"><div class="main"><div class="t">${r.icon} ${r.note || ''}</div><div class="s">${fmtDate(d)}</div></div></div>`);
  }
  return `
  <div class="card">
    <div class="card-title">💭 心情记录 · 今天感觉如何？</div>
    <div class="mood-grid">${grid}</div>
    <label class="fld">想说点什么（可选）</label>
    <textarea id="mood-note" placeholder="记录此刻的心情…">${rec ? esc(rec.note || '') : ''}</textarea>
    <div class="mt12"><button class="btn" data-action="mood-save">💾 保存今日心情</button></div>
  </div>
  <div class="card"><div class="card-title">📅 近 6 天心情</div>${history.join('') || '<div class="empty">还没有历史记录</div>'}</div>`;
}

/* ---------- 9. 理财知识 ---------- */
function finknowHTML() {
  const list = store.get('wb_finknow_list', []);
  const cats = {};
  list.forEach(k => { cats[k.cat] = (cats[k.cat] || 0) + 1; });
  const items = list.slice().reverse().map(k => `
    <div class="item">
      <div class="main"><div class="t">${esc(k.title)} <span class="chip" style="margin-left:6px">${esc(k.cat)}</span></div><div class="s">${esc(k.content)}</div></div>
      <div class="acts"><button class="btn sm danger" data-action="fk-del" data-id="${k.id}">删</button></div>
    </div>`).join('') || '<div class="empty">收集你的理财知识卡片 📊</div>';
  return `
  <div class="card">
    <div class="card-title">📊 理财知识 · 知识库</div>
    <div class="row">
      <div style="flex:1;min-width:120px"><label class="fld">分类</label><input id="fk-cat" placeholder="例如 基金/保险"></div>
      <div style="flex:2;min-width:160px"><label class="fld">标题</label><input id="fk-title" placeholder="例如 定投微笑曲线"></div>
    </div>
    <label class="fld">内容</label><textarea id="fk-content" placeholder="知识点说明…"></textarea>
    <div class="mt12"><button class="btn" data-action="fk-add">➕ 添加知识卡</button></div>
  </div>
  <div class="card"><div class="card-title">🗂️ 知识卡片（${list.length}）</div>${items}</div>`;
}

/* ---------- 11. 每日复盘 ---------- */
function reviewHTML() {
  const rec = store.get('wb_review_' + TODAY, { win: '', imp: '', plan: '' });
  return `
  <div class="card">
    <div class="card-title">📝 每日复盘 · ${TODAY}</div>
    <label class="fld">✅ 今天做得好的</label>
    <textarea id="rv-win" placeholder="记录今天的成就感…">${esc(rec.win)}</textarea>
    <label class="fld">🔧 待改进的</label>
    <textarea id="rv-imp" placeholder="哪里可以更好…">${esc(rec.imp)}</textarea>
    <label class="fld">🎯 明天的计划</label>
    <textarea id="rv-plan" placeholder="明天要做的三件事…">${esc(rec.plan)}</textarea>
    <div class="mt12"><button class="btn" data-action="review-save">💾 保存复盘</button></div>
  </div>`;
}

/* =========================================================
   动作处理
   ========================================================= */
const actions = {
  nav(el, id) { current = id; selMood = null; render(); window.scrollTo(0, 0); },
  checkin() {
    const k = 'wb_checkin_' + TODAY;
    store.set(k, !store.get(k, false));
    render();
  },
  // 首页今日待办
  'todo-toggle'(el) {
    const key = el.dataset.key;
    const ov = store.get('wb_todo_' + TODAY, {}) || {};
    ov[key] = !ov[key];
    store.set('wb_todo_' + TODAY, ov);
    render();
  },
  // 新闻展开详情
  'news-toggle'(el) {
    const i = +el.dataset.idx;
    if (newsOpen.has(i)) newsOpen.delete(i); else newsOpen.add(i);
    render();
  },
  // 播客
  'pod-cat'(el) { podCat = el.dataset.v; render(); },
  'pod-min-inc'() {
    const k = 'wb_podcast_min_' + TODAY;
    store.set(k, store.get(k, 0) + 10); render();
  },
  'pod-min-dec'() {
    const k = 'wb_podcast_min_' + TODAY;
    store.set(k, Math.max(0, store.get(k, 0) - 10)); render();
  },
  'pod-done'() {
    const k = 'wb_podcast_min_' + TODAY;
    const cur = store.get(k, 0);
    if (cur < 20) store.set(k, 20);
    render();
  },
  // 字号设置
  'font-inc'() {
    appFont = Math.min(1.4, +(appFont + 0.1).toFixed(2));
    applyFont(); store.set('wb_font', appFont); render();
  },
  'font-dec'() {
    appFont = Math.max(0.8, +(appFont - 0.1).toFixed(2));
    applyFont(); store.set('wb_font', appFont); render();
  },
  // 真题演练
  'quiz-start'(el) {
    const mod = el.dataset.mod;
    const src = window[QUIZ_LISTS[mod]] || [];
    quiz = { mod, list: src.slice(), idx: 0, picks: {}, scored: false };
    current = mod;
    if (mod === 'english') engView = 'gram';
    render();
  },
  'quiz-select'(el) {
    if (quiz.scored) return;
    quiz.picks[quiz.idx] = parseInt(el.dataset.i, 10);
    render();
  },
  'quiz-next'() { if (quiz.idx < quiz.list.length - 1) { quiz.idx++; render(); } },
  'quiz-prev'() { if (quiz.idx > 0) { quiz.idx--; render(); } },
  'quiz-submit'() {
    const wrong = store.get('wb_wrong', {});
    const wl = new Set(wrong[quiz.mod] || []);
    quiz.list.forEach((q, i) => { if (quiz.picks[i] !== q.answer) wl.add(i); });
    wrong[quiz.mod] = [...wl];
    store.set('wb_wrong', wrong);
    quiz.scored = true;
    render();
  },
  'quiz-restart'() {
    quiz = { mod: quiz.mod, list: quiz.list.slice(), idx: 0, picks: {}, scored: false };
    render();
  },
  'quiz-exit'() { quiz.mod = null; render(); },
  // 理财实操清单
  'fincheck-toggle'(el) {
    const i = parseInt(el.dataset.i, 10);
    const s = new Set(store.get('wb_fin_checklist', []));
    if (s.has(i)) s.delete(i); else s.add(i);
    store.set('wb_fin_checklist', [...s]);
    render();
  },
  // 首页今日任务（独立于英语学习进度）
  'task-add'() {
    const name = val('task-name'); if (!name.trim()) return alert('请填写任务名');
    const list = store.get('wb_tasks', []);
    list.push({ id: uid(), name: name.trim() });
    store.set('wb_tasks', list); render();
  },
  'task-done'(el, id) {
    const done = store.get('wb_task_done', {});
    const arr = done[id] || [];
    if (!arr.includes(TODAY)) arr.push(TODAY);
    done[id] = arr; store.set('wb_task_done', done); render();
  },
  'task-undo'(el, id) {
    const done = store.get('wb_task_done', {});
    done[id] = (done[id] || []).filter(d => d !== TODAY);
    store.set('wb_task_done', done); render();
  },
  'task-del'(el, id) {
    store.set('wb_tasks', store.get('wb_tasks', []).filter(t => t.id !== id));
    const done = store.get('wb_task_done', {}); delete done[id]; store.set('wb_task_done', done);
    render();
  },
  // 书摘筛选
  'quote-era'(el) { qEra = el.dataset.v; render(); },
  'quote-region'(el) { qRegion = el.dataset.v; render(); },
  'quote-random'() {
    const all = window.QUOTES || [];
    qRandom = all.length ? all[Math.floor(Math.random() * all.length)] : null;
    render();
  },
  'quote-list'() { qRandom = null; render(); },
  'quote-read'(el) {
    const key = el.dataset.key; const m = quoteStatus(); const cur = m[key] || 'none';
    m[key] = (cur === 'read') ? 'none' : 'read'; store.set('wb_quote_status', m); render();
  },
  'quote-want'(el) {
    const key = el.dataset.key; const m = quoteStatus(); const cur = m[key] || 'none';
    m[key] = (cur === 'want') ? 'none' : 'want'; store.set('wb_quote_status', m); render();
  },
  // 首页书摘小卡随机
  'home-quote-random'() {
    const arr = window.QUOTES || [];
    if (!arr.length) return;
    const cur = homeQuoteRand || pickDailyQuote();
    let nq;
    do { nq = arr[Math.floor(Math.random() * arr.length)]; } while (arr.length > 1 && nq === cur);
    homeQuoteRand = nq; render();
  },
  'home-quote-daily'() { homeQuoteRand = null; render(); },
  // 语文课 子视图切换
  'chi-view'(el) { chiView = el.dataset.view; render(); },
  'chi-testview'(el) { chiTestView = el.dataset.view; litTestReveal = false; render(); },
  'chi-memoview'(el) { chiMemoView = el.dataset.view; render(); },
  'lit-cat'(el) { litCat = el.dataset.c; render(); },
  'essay-cat'(el) { essayCat = el.dataset.c; render(); },
  // 文学常识自测
  'lit-testflip'() { litTestReveal = !litTestReveal; render(); },
  'lit-testknow'() {
    if (litTestQueue.length) {
      const item = litTestQueue[0];
      const done = store.get('wb_lit_done', []);
      if (!done.includes(item.face)) { done.push(item.face); store.set('wb_lit_done', done); }
      litTestQueue.shift();
    }
    litTestReveal = false; render();
  },
  'lit-testunknown'() { if (litTestQueue.length) litTestQueue.push(litTestQueue.shift()); litTestReveal = false; render(); },
  'lit-testrestart'() { litTestQueue = shuffle((window.LIT || []).slice()); litTestReveal = false; render(); },
  // 古诗文全篇浏览
  'cl-browse-prev'() { clBrowseIdx = (clBrowseIdx - 1 + CLASSICS.length) % CLASSICS.length; render(); },
  'cl-browse-next'() { clBrowseIdx = (clBrowseIdx + 1) % CLASSICS.length; render(); },
  'cl-browse-speak'(el) { speak(el.dataset.line); },
  'major-view'(el) { majorView = el.dataset.view; render(); },
  'major-testview'(el) { majorTestView = el.dataset.view; render(); },
  'major-memobook'(el) { majorMemoBook = el.dataset.book; majorMemoCh = 0; render(); },
  'major-memoch'(el) { majorMemoCh = parseInt(el.dataset.i) || 0; render(); },
  'major-memoprev'() {
    const chs = (window.MAJOR || {})[majorMemoBook] || [];
    if (chs.length) majorMemoCh = (majorMemoCh - 1 + chs.length) % chs.length;
    render();
  },
  'major-memonext'() {
    const chs = (window.MAJOR || {})[majorMemoBook] || [];
    if (chs.length) majorMemoCh = (majorMemoCh + 1) % chs.length;
    render();
  },
  'major-memodone'() {
    const key = 'wb_major_memo_done';
    const done = store.get(key, []);
    const chKey = majorMemoBook + '_' + majorMemoCh;
    if (done.includes(chKey)) store.set(key, done.filter(x => x !== chKey));
    else { done.push(chKey); store.set(key, done); }
    render();
  },
  // 英语
  'eng-add'() {
    const en = val('en-en'), zh = val('en-zh');
    if (!en.trim()) return alert('请填写英文');
    const list = store.get('wb_english_list', []);
    list.push({ id: uid(), en: en.trim(), zh: (zh || '').trim() });
    store.set('wb_english_list', list); render();
  },
  'eng-review'(el, id) {
    const k = 'wb_english_today_' + TODAY; store.set(k, store.get(k, 0) + 1); render();
  },
  'eng-del'(el, id) {
    store.set('wb_english_list', store.get('wb_english_list', []).filter(w => w.id !== id)); render();
  },
  // 英语子视图切换
  'eng-view'(el) { engView = el.dataset.view; engReveal = false; if (engView !== 'test') engQueue = []; render(); },
  // 英语 · 长难句 & 语法
  'eng-gramview'(el) { engGramView = el.dataset.view; render(); },
  'eng-sent-flip'() { sentReveal = !sentReveal; render(); },
  'eng-sent-prev'() { if (sentQueue.length) { sentIdx = (sentIdx - 1 + sentQueue.length) % sentQueue.length; sentReveal = false; sentTestDone = false; sentTestInput = ''; } render(); },
  'eng-sent-next'() { if (sentQueue.length) { sentIdx = (sentIdx + 1) % sentQueue.length; sentReveal = false; sentTestDone = false; sentTestInput = ''; } render(); },
  'eng-sent-rand'() { if (sentQueue.length) { let n; do { n = Math.floor(Math.random() * sentQueue.length); } while (sentQueue.length > 1 && n === sentIdx); sentIdx = n; sentReveal = false; sentTestDone = false; sentTestInput = ''; } render(); },
  'eng-sent-test'() { sentTestMode = !sentTestMode; sentTestDone = false; sentTestInput = ''; render(); },
  'eng-sent-testcheck'() {
    const el = document.getElementById('sent-test-input');
    sentTestInput = el ? el.value : '';
    sentTestDone = true; render();
  },
  'eng-sentspeak'(el) { speak(el.dataset.line, 'en-US'); },
  'eng-gramcat'(el) { gramCat = el.dataset.c; render(); },
  'eng-gram-know'(el) {
    const id = el.dataset.id; const k = new Set(store.get('wb_eng_gram_known', []));
    if (k.has(id)) k.delete(id); else k.add(id);
    store.set('wb_eng_gram_known', [...k]); render();
  },
  // 长难句二级子视图 & 句式 & 行动卡
  'sent-view'(el) { sentView = el.dataset.view; render(); },
  'eng-pattern-filter'(el) { patternFilter = el.dataset.f; render(); },
  'eng-pattern-know'(el) {
    const id = el.dataset.id; const k = new Set(store.get('wb_eng_pattern_done', []));
    if (k.has(id)) k.delete(id); else k.add(id);
    store.set('wb_eng_pattern_done', [...k]); render();
  },
  'eng-action-day'() {
    store.set('wb_eng_action_' + TODAY, 1);
    const days = store.get('wb_eng_action_days', {}); days[TODAY] = 1;
    store.set('wb_eng_action_days', days); render();
  },
  'eng-flip'() { engReveal = !engReveal; render(); },
  'eng-classic-flip'() { clReveal = !clReveal; render(); },
  'eng-classic-know'() {
    const c = clQueue[0]; if (!c) return;
    const done = store.get('wb_cl_done', []);
    if (!done.includes(c.title)) done.push(c.title);
    store.set('wb_cl_done', done);
    clQueue.shift(); clReveal = false; render();
  },
  'eng-classic-unknown'() { clQueue.shift(); clReveal = false; render(); },
  'eng-classic-restart'() { clQueue = shuffle(CLASSICS); clReveal = false; render(); },
  'eng-clspeak'(el) { speak(el.dataset.line, 'zh-CN'); },
  'eng-know'() {
    const w = engQueue[0]; if (!w) return;
    const known = store.get('wb_eng_known', []);
    if (!known.includes(w.en)) known.push(w.en);
    store.set('wb_eng_known', known);
    store.set('wb_eng_new', store.get('wb_eng_new', []).filter(n => n.en !== w.en));
    bumpToday(); engQueue.shift(); engReveal = false; render();
  },
  'eng-unknown'(el) {
    const enWord = el.dataset.en;
    if (enWord) { // 从已掌握放回生词
      store.set('wb_eng_known', store.get('wb_eng_known', []).filter(x => x !== enWord));
      const w = VOCAB.find(v => v.en === enWord);
      if (w) { const news = store.get('wb_eng_new', []); if (!news.some(n => n.en === enWord)) news.push({ en: w.en, zh: w.zh }); store.set('wb_eng_new', news); }
      render(); return;
    }
    const w = engQueue[0]; if (!w) return;
    const news = store.get('wb_eng_new', []);
    if (!news.some(n => n.en === w.en)) news.push({ en: w.en, zh: w.zh });
    store.set('wb_eng_new', news);
    bumpToday(); engQueue.shift(); engReveal = false; render();
  },
  'eng-restart'() {
    const known = new Set(store.get('wb_eng_known', []));
    engQueue = shuffle(VOCAB.filter(w => !known.has(w.en)));
    engReveal = false; render();
  },
  'eng-liblevel'(el) { engLibLevel = el.dataset.level; engLibPage = 1; render(); },
  'eng-letter'(el) { engLibLetter = el.dataset.letter; engLibPage = 1; render(); },
  'eng-page'(el) { engLibPage = Math.max(1, engLibPage + parseInt(el.dataset.d)); render(); },
  'eng-speak'(el) { speak(el.dataset.spell); },
  'eng-libknown'(el) {
    const en = el.dataset.en;
    const known = store.get('wb_eng_known', []);
    if (known.includes(en)) {
      store.set('wb_eng_known', known.filter(x => x !== en));
    } else {
      known.push(en);
      store.set('wb_eng_known', known);
      store.set('wb_eng_new', store.get('wb_eng_new', []).filter(n => n.en !== en));
    }
    render();
  },
  // 记单词：浏览记忆
  'memo-level'(el) { memoLevel = el.dataset.level; memoQueue = []; render(); },
  'memo-next'() { memoIdx++; if (memoQueue.length && memoIdx >= memoQueue.length) memoIdx = 0; render(); },
  'memo-prev'() { if (memoQueue.length) memoIdx = (memoIdx - 1 + memoQueue.length) % memoQueue.length; render(); },
  'memo-rand'() { if (memoQueue.length) memoIdx = Math.floor(Math.random() * memoQueue.length); render(); },
  'memo-know'(el) {
    const en = el.dataset.en;
    const known = store.get('wb_eng_known', []);
    if (en && !known.includes(en)) { known.push(en); store.set('wb_eng_known', known); }
    memoIdx++; if (memoQueue.length && memoIdx >= memoQueue.length) memoIdx = 0; render();
  },
  'eng-importdo'() {
    const raw = val('eng-import');
    if (!raw.trim()) return alert('请先粘贴词表');
    const lines = raw.split('\n').map(s => s.trim()).filter(Boolean);
    const exist = new Set(VOCAB.map(w => w.en.toLowerCase()));
    const added = [];
    lines.forEach(line => {
      const sep = line.includes('|') ? '|' : (line.includes(',') ? ',' : null);
      if (!sep) return;
      const i = line.indexOf(sep);
      const en = line.slice(0, i).trim();
      const zh = line.slice(i + 1).trim();
      if (en && !exist.has(en.toLowerCase())) { added.push({ en, zh, level: '四级' }); exist.add(en.toLowerCase()); }
    });
    if (!added.length) return alert('没有可导入的新单词（可能都已存在）');
    const extra = store.get('wb_vocab_extra', []).concat(added);
    store.set('wb_vocab_extra', extra);
    VOCAB = VOCAB.concat(added);
    alert('成功导入 ' + added.length + ' 个单词！当前词库 ' + VOCAB.length + ' 词');
    render();
  },
  // 阅读
  'book-add'() {
    const title = val('bk-title'); if (!title.trim()) return alert('请填写书名');
    const books = store.get('wb_book_list', []);
    books.push({ id: uid(), title: title.trim(), author: val('bk-author').trim(),
      pages: parseInt(val('bk-pages')) || 0, progress: parseInt(val('bk-prog')) || 0 });
    store.set('wb_book_list', books); render();
  },
  'book-10'(el, id) {
    const books = store.get('wb_book_list', []);
    const b = books.find(x => x.id === id); if (b) b.progress += 10;
    store.set('wb_book_list', books); render();
  },
  'book-del'(el, id) {
    store.set('wb_book_list', store.get('wb_book_list', []).filter(b => b.id !== id)); render();
  },
  'read-add'(el) {
    const min = el.dataset.min;
    const k = 'wb_reading_min_' + TODAY; store.set(k, store.get(k, 0) + parseInt(min)); render();
  },
  'read-view'(el, view) { readView = view; render(); },
  // 推荐书单（按心情本地匹配）
  'book-rec'() {
    bookMoodText = (val('mood-text') || '').trim();
    bookRecs = matchBooks(bookMoodText);
    render();
  },
  'book-rec-reset'() { bookRecs = null; render(); },
  'book-tag'(el) { bookLibTag = el.dataset.tag; render(); },
  'culture-book'(el) { culBook = el.dataset.book; culQueue = buildCulQueue(culBook); culReveal = false; culCorrect = 0; culTotal = culQueue.length; render(); },
  'culture-restart'() { culQueue = buildCulQueue(culBook); culReveal = false; culCorrect = 0; culTotal = culQueue.length; render(); },
  'culture-flip'() { culReveal = !culReveal; render(); },
  'culture-correct'() {
    const it = culQueue[0];
    if (it) {
      const done = store.get('wb_cul_done', []);
      if (!done.includes(it.q)) { done.push(it.q); store.set('wb_cul_done', done); }
    }
    culCorrect++; culQueue.shift(); culReveal = false; render();
  },
  'culture-wrong'() { culQueue.shift(); culReveal = false; render(); },
  // 运动
  'ex-add'() {
    const name = val('ex-name'); if (!name.trim()) return alert('请填写运动项目');
    const list = store.get('wb_exercise_' + TODAY, []);
    list.push({ id: uid(), name: name.trim(), min: parseInt(val('ex-min')) || 0, cal: parseInt(val('ex-cal')) || 0 });
    store.set('wb_exercise_' + TODAY, list); render();
  },
  'ex-del'(el, id) {
    store.set('wb_exercise_' + TODAY, store.get('wb_exercise_' + TODAY, []).filter(x => x.id !== id)); render();
  },
  // 锻炼扩展
  'ex-view'(el) { exView = el.dataset.view; render(); },
  'ex-move-done'(el) {
    const list = store.get('wb_exercise_' + TODAY, []);
    list.push({ id: uid(), name: el.dataset.name + '（动作库）', min: 0, cal: 0 });
    store.set('wb_exercise_' + TODAY, list); render();
  },
  'ex-timer-preset'(el) { exView = 'timer'; startExTimer(parseInt(el.dataset.secs) || 0); },
  'ex-timer-start'() {
    const s = parseInt(val('ex-secs')) || 0; if (s <= 0) return alert('请输入有效的秒数');
    exView = 'timer'; startExTimer(s);
  },
  'ex-timer-pause'() { if (exTimerId) { clearInterval(exTimerId); exTimerId = null; } render(); },
  'ex-timer-reset'() { if (exTimerId) { clearInterval(exTimerId); exTimerId = null; } exLeft = exTotal; render(); },
  'ex-stretch-go'(el) { exView = 'timer'; startExTimer(parseInt(el.dataset.dur) || 20); },
  // 饮食
  'food-add'() {
    const name = val('food-name'); if (!name.trim()) return alert('请填写食物');
    const list = store.get('wb_food_' + TODAY, []);
    list.push({ id: uid(), type: val('food-type'), name: name.trim(), cal: parseInt(val('food-cal')) || 0 });
    store.set('wb_food_' + TODAY, list); render();
  },
  'food-del'(el, id) {
    store.set('wb_food_' + TODAY, store.get('wb_food_' + TODAY, []).filter(x => x.id !== id)); render();
  },
  // 理财学习
  'fl-add'() {
    const topic = val('fl-topic'); if (!topic.trim()) return alert('请填写主题');
    const list = store.get('wb_finlearn_list', []);
    list.push({ id: uid(), topic: topic.trim(), note: val('fl-note').trim(), date: TODAY });
    store.set('wb_finlearn_list', list); render();
  },
  'fl-del'(el, id) {
    store.set('wb_finlearn_list', store.get('wb_finlearn_list', []).filter(n => n.id !== id)); render();
  },
  // 每日理财小知识
  'fin-done'(el) {
    const idx = +el.dataset.idx;
    const done = store.get('wb_fin_done', []);
    if (!done.includes(idx)) { done.push(idx); store.set('wb_fin_done', done); }
    render();
  },
  'fin-next'() { finOffset++; render(); },
  'fin-open'(el) {
    const idx = +el.dataset.idx;
    if (finOpen.has(idx)) finOpen.delete(idx); else finOpen.add(idx);
    render();
  },
  'finbook-open'(el) {
    const idx = +el.dataset.idx;
    if (finBookOpen.has(idx)) finBookOpen.delete(idx); else finBookOpen.add(idx);
    render();
  },
  // 首页日历
  'cal-prev'() { calM--; if (calM < 0) { calM = 11; calY--; } render(); },
  'cal-next'() { calM++; if (calM > 11) { calM = 0; calY++; } render(); },
  // 作息
  'sleep-save'() {
    const bed = val('sleep-bed'), wake = val('sleep-wake');
    const dur = sleepHours(bed, wake);
    store.set('wb_sleep_' + TODAY, { bed, wake, duration: dur }); render();
  },
  // 护肤
  'skin-toggle'(el) {
    const part = el.dataset.part, step = el.dataset.step;
    const rec = store.get('wb_skincare_' + TODAY, { am: {}, pm: {} });
    rec[part] = rec[part] || {};
    rec[part][step] = !rec[part][step];
    store.set('wb_skincare_' + TODAY, rec); render();
  },
  // 心情
  'mood-pick'(el, icon) { selMood = icon; render(); },
  'mood-save'() {
    if (!selMood) return alert('请先选择一个心情');
    store.set('wb_mood_' + TODAY, { icon: selMood, note: val('mood-note').trim() }); render();
  },
  // 理财知识
  'fk-add'() {
    const title = val('fk-title'); if (!title.trim()) return alert('请填写标题');
    const list = store.get('wb_finknow_list', []);
    list.push({ id: uid(), cat: val('fk-cat').trim() || '未分类', title: title.trim(), content: val('fk-content').trim() });
    store.set('wb_finknow_list', list); render();
  },
  'fk-del'(el, id) {
    store.set('wb_finknow_list', store.get('wb_finknow_list', []).filter(k => k.id !== id)); render();
  },
  // 复盘
  'review-save'() {
    store.set('wb_review_' + TODAY, { win: val('rv-win').trim(), imp: val('rv-imp').trim(), plan: val('rv-plan').trim() });
    alert('已保存今日复盘 💾'); render();
  }
};

/* ---------- 工具函数 ---------- */
function val(id) { const el = document.getElementById(id); return el ? el.value : ''; }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function takeRandom(arr, k) {
  const a = arr.slice(), r = [];
  while (a.length && r.length < k) r.push(a.splice(Math.floor(Math.random() * a.length), 1)[0]);
  return r;
}
function sleepHours(bed, wake) {
  const [bh, bm] = bed.split(':').map(Number);
  const [wh, wm] = wake.split(':').map(Number);
  let mins = (wh * 60 + wm) - (bh * 60 + bm);
  if (mins <= 0) mins += 24 * 60;
  return Math.round(mins / 60 * 10) / 10;
}
function bumpToday() {
  const k = 'wb_english_today_' + TODAY;
  store.set(k, store.get(k, 0) + 1);
}
function bindMoodSelection() { /* 选中态在 render 时已处理 */ }

/* 单词发音（浏览器 TTS） */
function speak(text, lang) {
  if (!('speechSynthesis' in window)) { alert('当前浏览器不支持发音朗读'); return; }
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang || 'en-US'; u.rate = 0.9;
    window.speechSynthesis.speak(u);
  } catch (e) { /* 忽略 */ }
}

/* ---------- 事件委托 ---------- */
/* 绑定到 document：左侧导航(#nav) 与 内容区(#content) 都在其内，
   委托查找 data-action 祖先，点击空白处自动忽略。 */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const a = el.dataset.action;
  const id = el.dataset.id;
  if (actions[a]) actions[a](el, id, el.dataset.step, el.dataset.min);
});
$content.addEventListener('input', e => {
  if (e.target.id === 'eng-search') {
    engLibSearch = e.target.value;
    render();
    const s = document.getElementById('eng-search');
    if (s) { s.focus(); const v = s.value; s.value = ''; s.value = v; }
  }
});

/* ---------- 显示设置：字号 ---------- */
function applyFont() {
  const app = document.querySelector('.app');
  if (app) app.style.zoom = appFont;
}

/* ---------- 启动 ---------- */
(function init() {
  const f = parseFloat(store.get('wb_font', '1'));
  if (!isNaN(f)) appFont = f;
})();
render();
applyFont();
