// =====================================================
// test.js — режим «Тест»: грамматика и лексика (выбор ответа и пропуски)
// =====================================================
const TEST_KEY = "linguaflow-last-test";
const TEST_LENGTH = 10;
state.lastTest = loadJSON(TEST_KEY, null);   // результат последнего теста

// Банк вопросов. answer — строка или массив допустимых ответов.
// Если есть options — это выбор ответа, иначе нужно вписать слово (пропуск).
const BANK = [
  { part: "Грамматика", q: "We ____ the bug yesterday.", options: ["fixed", "have fixed", "fix", "were fix"], answer: "fixed", why: "Слово yesterday требует Past Simple." },
  { part: "Грамматика", q: "I ____ on this project since March.", options: ["work", "am working", "have been working", "worked"], answer: "have been working", why: "С since обычно используется Present Perfect Continuous." },
  { part: "Грамматика", q: "If the tests ____, we will deploy today.", options: ["pass", "will pass", "passed", "would pass"], answer: "pass", why: "В условии первого типа после if стоит Present Simple." },
  { part: "Грамматика", q: "The report ____ by the QA team right now.", options: ["writes", "is written", "is being written", "was written"], answer: "is being written", why: "Действие идёт прямо сейчас, и оно в пассиве: Present Continuous Passive." },
  { part: "Грамматика", q: "Could you tell me where ____?", options: ["is the server", "the server is", "does the server", "the server does"], answer: "the server is", why: "В косвенном вопросе порядок слов прямой, как в утверждении." },
  { part: "Грамматика", q: "She asked me ____ the pull request.", options: ["to review", "reviewing", "review", "that review"], answer: "to review", why: "После ask someone используется to + глагол." },
  { part: "Грамматика", q: "Our team ____ (not / finish) the task yet.", answer: ["hasn't finished", "has not finished"], why: "Слово yet — признак Present Perfect: has not finished." },
  { part: "Грамматика", q: "By next Friday we ____ (release) the new version.", answer: ["will have released"], why: "Действие завершится к моменту в будущем: Future Perfect." },
  { part: "Лексика", q: "The service was down for two hours because of an ____.", options: ["outage", "output", "outlook", "outfit"], answer: "outage", why: "Outage — это сбой или простой сервиса." },
  { part: "Лексика", q: "Please ____ me in the loop about the deadline.", options: ["keep", "hold", "put", "make"], answer: "keep", why: "Keep someone in the loop — держать в курсе." },
  { part: "Лексика", q: "The team will ____ the new feature next week.", options: ["deploy", "employ", "destroy", "display"], answer: "deploy", why: "Deploy — выкладывать обновление на сервер." },
  { part: "Лексика", q: "We need to ____ the bug before we can fix it.", options: ["reproduce", "produce", "introduce", "reduce"], answer: "reproduce", why: "Reproduce a bug — воспроизвести ошибку." }
];

const test = { questions: [], index: 0, results: [], answered: false };
const shuffle = (list) => [...list].sort(() => Math.random() - 0.5);
// Сравниваем ответы без учёта регистра, лишних пробелов и типа апострофа
const norm = (s) => String(s).trim().toLowerCase().replace(/\s+/g, " ").replace(/’/g, "'");

// Часть вопросов собираем автоматически из слов пользователя
function wordQuestions(count) {
  if (state.words.length < 4) return [];
  return shuffle(state.words).slice(0, count).map((w) => {
    const others = shuffle(state.words.filter((x) => x.id !== w.id)).slice(0, 3).map((x) => x.translation);
    return { part: "Лексика", q: `Что значит «${w.word}»?`, options: shuffle([w.translation, ...others]), answer: w.translation, why: w.explanation };
  });
}

function startTest() {
  const fromWords = wordQuestions(3);
  const fromBank = shuffle(BANK).slice(0, TEST_LENGTH - fromWords.length);
  test.questions = shuffle([...fromBank, ...fromWords]);
  test.index = 0;
  test.results = [];
  test.answered = false;
  renderTest();
}

function renderTest() {
  const box = $("testMode");
  if (test.questions.length === 0) {                 // стартовый экран
    box.innerHTML = `<div class="panel quiz">
      <h2 class="quiz-q">Пробный тест: грамматика и лексика</h2>
      <p class="muted">${TEST_LENGTH} вопросов в формате проверки: выбор ответа и пропуски. Вопросы по IT-темам, часть из них составлена из ваших слов.</p>
      <div><button class="btn btn-primary" data-test="start">Начать тест</button></div></div>`;
    return;
  }
  if (test.index >= test.questions.length) { renderResult(); return; }

  const q = test.questions[test.index];
  const answerBlock = q.options
    ? `<div class="options">${q.options.map((o) => `<button class="btn option" data-option="${esc(o)}">${esc(o)}</button>`).join("")}</div>`
    : `<form class="add-row" id="gapForm"><input type="text" id="gapInput" autocomplete="off" placeholder="Впишите ответ"><button class="btn btn-primary">Проверить</button></form>`;
  box.innerHTML = `
    <div class="progress-row">
      <div class="progress"><div class="progress-bar" style="width:${(test.index / test.questions.length) * 100}%"></div></div>
      <span class="progress-text">${test.index + 1} из ${test.questions.length}</span>
    </div>
    <div class="panel quiz">
      <span class="tag">${q.part}</span>
      <h2 class="quiz-q">${esc(q.q)}</h2>
      ${answerBlock}
      <div id="feedback"></div>
    </div>`;
  if ($("gapInput")) $("gapInput").focus();
}

function answerQuestion(given) {
  if (test.answered) return;
  test.answered = true;
  const q = test.questions[test.index];
  const accepted = [].concat(q.answer).map(norm);
  const ok = accepted.includes(norm(given));
  test.results.push({ part: q.part, ok });

  document.querySelectorAll(".option").forEach((b) => {         // подсвечиваем варианты
    b.disabled = true;
    if (accepted.includes(norm(b.dataset.option))) b.classList.add("right");
    else if (b.dataset.option === given) b.classList.add("wrong");
  });
  if ($("gapForm")) $("gapForm").querySelectorAll("input, button").forEach((el) => (el.disabled = true));

  const isLast = test.index === test.questions.length - 1;
  $("feedback").innerHTML = `
    <p class="${ok ? "ok" : "bad"}">${ok ? "Верно" : "Неверно. Правильный ответ: " + esc([].concat(q.answer)[0])}</p>
    <p class="muted">${esc(q.why)}</p>
    <button class="btn btn-primary" data-test="next">${isLast ? "Показать результат" : "Дальше"}</button>`;
}

function renderResult() {
  const byPart = {};
  test.results.forEach((r) => {
    byPart[r.part] = byPart[r.part] || { ok: 0, total: 0 };
    byPart[r.part].total++;
    if (r.ok) byPart[r.part].ok++;
  });
  const score = test.results.filter((r) => r.ok).length;
  state.lastTest = { date: Date.now(), score, total: test.results.length, byPart };
  saveJSON(TEST_KEY, state.lastTest);

  $("testMode").innerHTML = `<div class="panel quiz">
    <h2 class="quiz-q">Результат</h2>
    <div class="big">${score} из ${test.results.length}</div>
    <ul class="readiness">${Object.entries(byPart).map(([name, p]) => `<li><span>${name}</span>
      <div class="progress"><div class="progress-bar" style="width:${(p.ok / p.total) * 100}%"></div></div>
      <span class="muted">${p.ok} из ${p.total}</span></li>`).join("")}</ul>
    <div class="actions"><button class="btn btn-primary" data-test="start">Пройти ещё раз</button>
      <button class="btn" data-go="dashboard">На главную</button></div></div>`;
}

// Переключатель «Карточки / Тест» на странице тренировки
function setMode(mode) {
  $("cardsMode").hidden = mode !== "cards";
  $("testMode").hidden = mode !== "test";
  document.querySelectorAll("[data-mode]").forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));
  if (mode === "test") renderTest();
}

document.addEventListener("click", (e) => {
  const mode = e.target.closest("[data-mode]");
  if (mode) setMode(mode.dataset.mode);
  if (e.target.closest('[data-action="test"]')) { showPage("practice"); setMode("test"); }  // кнопка с главной
});

$("testMode").addEventListener("click", (e) => {
  const option = e.target.closest("[data-option]");
  const action = e.target.closest("[data-test]");
  if (option) answerQuestion(option.dataset.option);
  if (!action) return;
  if (action.dataset.test === "start") startTest();
  if (action.dataset.test === "next") { test.index++; test.answered = false; renderTest(); }
});
$("testMode").addEventListener("submit", (e) => {
  e.preventDefault();
  if ($("gapInput").value.trim()) answerQuestion($("gapInput").value);
});
