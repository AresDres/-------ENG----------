// =====================================================
// LinguaFlow — логика приложения
// Разделы: 1) состояние и утилиты  2) навигация
//          3) тренировка  4) мои слова  5) добавление слова
// =====================================================

// ---------- 1. Состояние и утилиты ----------

// Данные по повторению (как в Anki): interval — через сколько дней повторять,
// due — когда слово нужно показать (время в мс), reps — сколько раз его оценивали.
const STORE_KEY = "linguaflow-words";
const DAY = 24 * 60 * 60 * 1000;
const withSrs = (w) => ({ interval: 0, due: 0, reps: 0, ...w });  // добавляет поля, если их нет
const isDue = (w) => w.due <= Date.now();
const statusOf = (w) => (w.interval >= 21 ? "Выучено" : w.reps === 0 ? "Новое" : "Учу");

function loadWords() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY));
    if (Array.isArray(saved)) return saved;
  } catch (err) { /* повреждённые данные — берём демо */ }
  return DEMO_WORDS.map(withSrs);
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state.words)); } catch (err) { /* хранилище недоступно */ }
}

// Всё, что меняется во время работы, хранится в одном объекте.
// Это "единый источник правды": интерфейс просто рисуется из него.
const state = {
  words: loadWords(),       // слова из localStorage или демо-данные
  queue: [],                // очередь id слов для тренировки
  total: 0,                 // сколько слов в тренировке
  learned: 0,               // сколько слов уже пройдено
  flipped: false,           // перевёрнута ли карточка
  session: { again: 0, hard: 0, good: 0 }  // оценки за текущую тренировку
};

// Короткая функция для поиска элемента по id
const $ = (id) => document.getElementById(id);

// Защита от вставки HTML: если пользователь введёт <b>, оно покажется как текст
function esc(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

const findWord = (id) => state.words.find((w) => w.id === id);

// ---------- 2. Навигация ----------

function showPage(name) {
  document.querySelectorAll(".page").forEach((p) => p.classList.toggle("active", p.id === "page-" + name));
  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.page === name));
  if (name === "practice" && state.queue.length === 0 && state.learned === 0) startPractice();
  if (name === "words") renderWordList();
}

document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => showPage(btn.dataset.page));
});

// ---------- 3. Тренировка ----------

const RATES = [["again", "Не знаю"], ["hard", "Сложно"], ["good", "Знаю"]];

// Планировщик повторений (упрощённая версия алгоритма Anki):
// "Не знаю" — слово вернётся через минуту, "Сложно" — интервал растёт слабо,
// "Знаю" — интервал растёт в 2.5 раза: 1 день, 3 дня, 8 дней, 20 дней...
function schedule(w, rate) {
  if (rate === "again") {
    w.interval = 0;
    w.due = Date.now() + 60 * 1000;
  } else {
    if (rate === "hard") w.interval = Math.max(1, Math.round(w.interval * 1.2));
    else w.interval = w.interval < 1 ? 1 : w.interval < 3 ? 3 : Math.round(w.interval * 2.5);
    w.due = Date.now() + w.interval * DAY;
  }
  w.reps++;
}

// Подпись под кнопкой: считаем на копии слова, чтобы ничего не изменить
function intervalLabel(w, rate) {
  const copy = { ...w };
  schedule(copy, rate);
  return rate === "again" ? "< 1 мин" : copy.interval + " дн.";
}

// all = true — пройти вообще все слова, иначе только те, что пора повторить
function startPractice(all = false) {
  const pool = all === true ? state.words : state.words.filter(isDue);
  state.queue = pool.map((w) => w.id);
  state.total = state.queue.length;
  state.learned = 0;
  state.session = { again: 0, hard: 0, good: 0 };
  state.flipped = false;
  $("card").classList.remove("flipped");
  $("flipBtn").hidden = false;
  $("rating").hidden = true;
  $("finish").hidden = true;
  $("practiceBody").hidden = state.total === 0;
  renderCard();
}

function renderFinish() {
  const s = state.session;
  $("practiceBody").hidden = true;
  $("finish").hidden = false;
  if (state.total === 0) {
    $("finishTitle").textContent = state.words.length ? "На сегодня всё" : "Пока нет слов";
    $("finishText").textContent = state.words.length
      ? "Слов для повторения нет. Загляните позже или повторите всё сейчас."
      : "Добавьте первое слово на странице «Добавить слово».";
  } else {
    $("finishTitle").textContent = "Тренировка завершена";
    $("finishText").textContent = `Не знал: ${s.again}, сложно: ${s.hard}, знал: ${s.good}.`;
  }
  $("restartBtn").hidden = state.words.length === 0;
}

function renderCard() {
  const progress = state.total ? (state.learned / state.total) * 100 : 0;
  $("progressBar").style.width = progress + "%";
  $("progressText").textContent = `${state.learned} из ${state.total}`;

  if (state.queue.length === 0) { renderFinish(); return; }

  const w = findWord(state.queue[0]);       // текущее слово — первое в очереди
  $("frontPos").textContent = POS_LABELS[w.pos];
  $("frontWord").textContent = w.word;
  $("frontIpa").textContent = w.transcription;
  $("backTranslation").textContent = w.translation;
  $("backExplanation").textContent = w.explanation;
  $("backExample").textContent = w.example;
  $("backExampleRu").textContent = w.exampleRu;
  // Кнопки оценки с подсказкой, когда слово появится снова
  $("rating").innerHTML = RATES.map(([key, label], i) => `
    <button class="btn ${key === "good" ? "btn-primary" : ""}" data-rate="${key}">
      <span>${label}</span><small>${intervalLabel(w, key)}</small><kbd>${i + 1}</kbd>
    </button>`).join("");
}

function flipCard() {
  if (state.queue.length === 0) return;
  state.flipped = !state.flipped;
  $("card").classList.toggle("flipped", state.flipped);
  // После переворота вместо кнопки "Показать перевод" появляются кнопки оценки
  $("flipBtn").hidden = state.flipped;
  $("rating").hidden = !state.flipped;
  document.activeElement.blur();            // чтобы пробел не нажимал кнопку повторно
}

function rateWord(rate) {
  const id = state.queue.shift();           // забираем текущее слово из начала очереди
  schedule(findWord(id), rate);             // пересчитываем, когда показать его снова
  save();
  state.session[rate]++;
  if (rate === "again") state.queue.push(id); // "Не знаю" — слово вернётся в конец
  else state.learned++;                     // "Сложно" и "Знаю" — слово пройдено

  // Сначала переворачиваем карточку лицом, и только потом меняем текст,
  // чтобы перевод следующего слова не мелькнул во время анимации
  state.flipped = false;
  $("card").classList.remove("flipped");
  $("flipBtn").hidden = false;
  $("rating").hidden = true;
  setTimeout(renderCard, 250);
}

$("card").addEventListener("click", flipCard);
$("flipBtn").addEventListener("click", flipCard);
$("rating").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-rate]");  // closest — клик мог попасть в <small> или <kbd>
  if (btn) rateWord(btn.dataset.rate);
});
$("restartBtn").addEventListener("click", () => startPractice(true));

// Горячие клавиши: пробел — перевернуть, 1 / 2 / 3 — оценка
document.addEventListener("keydown", (e) => {
  if (!$("page-practice").classList.contains("active") || modal.open) return;
  if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
  if (e.code === "Space") {
    e.preventDefault();
    if (!state.flipped) flipCard();
  } else if (state.flipped && ["1", "2", "3"].includes(e.key)) {
    rateWord(RATES[Number(e.key) - 1][0]);
  }
});

// ---------- 4. Мои слова ----------

// Заполняем выпадающие списки фильтров
$("filterLevel").innerHTML = `<option value="">Любой уровень</option>` +
  LEVELS.map((l) => `<option>${l}</option>`).join("");
$("filterPos").innerHTML = `<option value="">Любая часть речи</option>` +
  Object.entries(POS_LABELS).map(([key, label]) => `<option value="${key}">${label}</option>`).join("");

function renderStats() {
  const count = { "Новое": 0, "Учу": 0, "Выучено": 0 };
  state.words.forEach((w) => count[statusOf(w)]++);
  $("stats").textContent = `Всего: ${state.words.length}, новых: ${count["Новое"]}, ` +
    `в изучении: ${count["Учу"]}, выучено: ${count["Выучено"]}, к повторению: ${state.words.filter(isDue).length}`;
}

function renderWordList() {
  renderStats();
  const query = $("search").value.trim().toLowerCase();
  const level = $("filterLevel").value;
  const pos = $("filterPos").value;

  // filter оставляет только те слова, для которых функция вернула true
  const result = state.words.filter((w) =>
    (w.word.toLowerCase().includes(query) || w.translation.toLowerCase().includes(query)) &&
    (!level || w.level === level) &&
    (!pos || w.pos === pos)
  );

  $("wordList").innerHTML = result.length
    ? result.map((w) => `
        <li class="word-item" data-id="${w.id}" tabindex="0">
          <strong>${esc(w.word)}</strong>
          <span class="tr">${esc(w.translation)}</span>
          <span class="muted status">${statusOf(w)}</span>
          <span class="tag">${w.level}</span>
        </li>`).join("")
    : `<li class="word-item empty">Ничего не найдено. Измените запрос или фильтры.</li>`;
}

["input", "change"].forEach((evt) => {
  $("search").addEventListener(evt, renderWordList);
  $("filterLevel").addEventListener(evt, renderWordList);
  $("filterPos").addEventListener(evt, renderWordList);
});

// Один обработчик на весь список (делегирование событий)
function openFromList(e) {
  const item = e.target.closest(".word-item[data-id]");
  if (item && (e.type === "click" || e.key === "Enter")) openDetails(Number(item.dataset.id));
}
$("wordList").addEventListener("click", openFromList);
$("wordList").addEventListener("keydown", openFromList);

// --- Окно с подробностями ---
const modal = $("modal");

function openDetails(id) {
  const w = findWord(id);
  modal.innerHTML = `
    <div class="detail">
      <span class="tag">${POS_LABELS[w.pos]} · ${w.level}</span>
      <h2>${esc(w.word)}</h2>
      <p class="muted">${esc(w.transcription)}</p>
      <dl>
        <div><dt>Перевод</dt><dd>${esc(w.translation)}</dd></div>
        <div><dt>Объяснение</dt><dd>${esc(w.explanation)}</dd></div>
        <div><dt>Пример</dt><dd>${esc(w.example)}<br><span class="muted">${esc(w.exampleRu)}</span></dd></div>
      </dl>
      <div class="detail-actions">
        <button class="btn btn-danger" id="deleteBtn">Удалить</button>
        <button class="btn" id="editBtn">Редактировать</button>
        <button class="btn btn-primary" id="closeBtn">Закрыть</button>
      </div>
    </div>`;
  $("closeBtn").onclick = () => modal.close();
  $("editBtn").onclick = () => openEdit(id);
  $("deleteBtn").onclick = () => {
    if (!confirm(`Удалить слово «${w.word}»?`)) return;
    state.words = state.words.filter((x) => x.id !== id);
    state.queue = state.queue.filter((x) => x !== id);
    save();
    modal.close();
    renderWordList();
    showToast("Слово удалено");
  };
  if (!modal.open) modal.showModal();
}

function openEdit(id) {
  const form = buildForm(findWord(id), "Сохранить изменения", (data) => {
    Object.assign(findWord(id), data);     // обновляем поля слова новыми значениями
    save();
    modal.close();
    renderWordList();
    showToast("Изменения сохранены");
  }, () => openDetails(id));
  modal.innerHTML = "";
  modal.append(form);
}

// Клик по тёмному фону вокруг окна закрывает его
modal.addEventListener("click", (e) => { if (e.target === modal) modal.close(); });

// ---------- 5. Добавление слова ----------

// Форма используется и при добавлении, и при редактировании
function buildForm(word, submitLabel, onSubmit, onCancel) {
  const form = document.createElement("form");
  form.className = "form";
  const posOptions = Object.entries(POS_LABELS)
    .map(([k, label]) => `<option value="${k}" ${k === word.pos ? "selected" : ""}>${label}</option>`).join("");
  const levelOptions = LEVELS
    .map((l) => `<option ${l === word.level ? "selected" : ""}>${l}</option>`).join("");

  form.innerHTML = `
    <label>Слово или выражение <input type="text" name="word" required value="${esc(word.word)}"></label>
    <label>Транскрипция <input type="text" name="transcription" value="${esc(word.transcription)}"></label>
    <label>Часть речи <select name="pos">${posOptions}</select></label>
    <label>Уровень <select name="level">${levelOptions}</select></label>
    <label class="full">Перевод <input type="text" name="translation" required value="${esc(word.translation)}"></label>
    <label class="full">Объяснение <textarea name="explanation">${esc(word.explanation)}</textarea></label>
    <label class="full">Пример <textarea name="example">${esc(word.example)}</textarea></label>
    <label class="full">Перевод примера <textarea name="exampleRu">${esc(word.exampleRu)}</textarea></label>
    <div class="form-actions">
      <button type="button" class="btn" data-cancel>Отмена</button>
      <button type="submit" class="btn btn-primary">${submitLabel}</button>
    </div>`;

  form.addEventListener("submit", (e) => {
    e.preventDefault();                          // не перезагружать страницу
    onSubmit(Object.fromEntries(new FormData(form))); // поля формы -> обычный объект
  });
  form.querySelector("[data-cancel]").addEventListener("click", onCancel);
  return form;
}

const STEPS = ["Определяем значение", "Готовим перевод и объяснение", "Добавляем транскрипцию", "Подбираем пример"];

$("generateBtn").addEventListener("click", () => {
  const word = $("newWord").value.trim();
  if (!word) { $("newWord").focus(); return; }

  if (state.words.some((w) => w.word.toLowerCase() === word.toLowerCase())) {
    showToast("Такое слово уже есть в словаре");
    return;
  }
  $("generateBtn").disabled = true;
  $("formHolder").innerHTML = "";
  const steps = $("steps");
  steps.hidden = false;
  steps.innerHTML = STEPS.map((s) => `<li>${s}</li>`).join("");
  const items = [...steps.children];

  // Имитация работы ИИ: каждые 700 мс следующий шаг становится активным
  let i = 0;
  items[0].classList.add("active");
  const timer = setInterval(() => {
    items[i].classList.replace("active", "done");
    i++;
    if (i < items.length) { items[i].classList.add("active"); return; }
    clearInterval(timer);
    $("generateBtn").disabled = false;
    showGeneratedForm(word);
  }, 700);
});

function showGeneratedForm(word) {
  // Пока ИИ нет — подставляем заготовку, которую пользователь дополнит сам
  const draft = {
    word, transcription: "", pos: "noun", level: "B1", translation: "",
    explanation: "", example: `I want to learn the word "${word}".`, exampleRu: ""
  };
  const form = buildForm(draft, "Сохранить в словарь", (data) => {
    state.words.unshift(withSrs({ id: Date.now(), ...data }));   // новое слово — в начало списка
    save();
    $("newWord").value = "";
    $("steps").hidden = true;
    $("formHolder").innerHTML = "";
    state.queue = []; state.learned = 0;                // тренировка пересоберётся
    showPage("words");
    showToast("Слово добавлено");
  }, () => { $("formHolder").innerHTML = ""; $("steps").hidden = true; });
  $("formHolder").append(form);
}

$("newWord").addEventListener("keydown", (e) => { if (e.key === "Enter") $("generateBtn").click(); });

$("resetBtn").addEventListener("click", () => {
  if (!confirm("Вернуть демо-слова и сбросить весь прогресс?")) return;
  state.words = DEMO_WORDS.map(withSrs);
  save();
  startPractice();
  renderWordList();
  showToast("Данные сброшены");
});

// ---------- Запуск ----------
startPractice();
