// =====================================================
// vocabulary.js — личный словарь: список, фильтры, коллекции, окна
// =====================================================

// Заполняем выпадающие списки фильтров
$("filterLevel").innerHTML = `<option value="">Любой уровень</option>` +
  LEVELS.map((l) => `<option>${l}</option>`).join("");
$("filterPos").innerHTML = `<option value="">Любая часть речи</option>` +
  Object.entries(POS_LABELS).map(([key, label]) => `<option value="${key}">${label}</option>`).join("");

// Коллекции — это просто текстовое поле collection у слова
const collectionNames = () => [...new Set(state.words.map((w) => w.collection).filter(Boolean))];

function fillCollections() {
  const select = $("filterCol");
  const current = select.value;
  const names = collectionNames();
  select.innerHTML = `<option value="">Все коллекции</option>` +
    names.map((n) => `<option>${esc(n)}</option>`).join("");
  select.value = names.includes(current) ? current : "";   // не сбрасываем выбранный фильтр
}

function renderStats() {
  const count = { "Новое": 0, "Учу": 0, "Выучено": 0 };
  state.words.forEach((w) => count[statusOf(w)]++);
  $("stats").textContent = `Всего: ${state.words.length}, новых: ${count["Новое"]}, ` +
    `в изучении: ${count["Учу"]}, выучено: ${count["Выучено"]}, к повторению: ${state.words.filter(isDue).length}`;
}

function renderWordList() {
  renderStats();
  fillCollections();
  const query = $("search").value.trim().toLowerCase();
  const level = $("filterLevel").value;
  const pos = $("filterPos").value;
  const col = $("filterCol").value;

  // filter оставляет только те слова, для которых функция вернула true
  const result = state.words.filter((w) =>
    (w.word.toLowerCase().includes(query) || w.translation.toLowerCase().includes(query)) &&
    (!level || w.level === level) &&
    (!pos || w.pos === pos) &&
    (!col || w.collection === col)
  );

  $("wordList").innerHTML = result.length
    ? result.map((w) => `
        <li class="word-item" data-id="${w.id}" tabindex="0">
          <strong>${esc(w.word)}</strong>
          <span class="tr">${esc(w.translation)}</span>
          <span class="muted status">${esc(w.collection || "")}</span>
          <span class="muted status">${statusOf(w)}</span>
          <span class="tag">${w.level}</span>
        </li>`).join("")
    : `<li class="word-item empty">Ничего не найдено. Измените запрос или фильтры.</li>`;
}

["input", "change"].forEach((evt) => {
  $("search").addEventListener(evt, renderWordList);
  $("filterLevel").addEventListener(evt, renderWordList);
  $("filterPos").addEventListener(evt, renderWordList);
  $("filterCol").addEventListener(evt, renderWordList);
});

// Один обработчик на весь список (делегирование событий)
function openFromList(e) {
  const item = e.target.closest(".word-item[data-id]");
  if (item && (e.type === "click" || e.key === "Enter")) openDetails(Number(item.dataset.id));
}
$("wordList").addEventListener("click", openFromList);
$("wordList").addEventListener("keydown", openFromList);

// --- Окно с подробностями ---

function openDetails(id) {
  const w = findWord(id);
  modal.innerHTML = `
    <div class="detail">
      <span class="tag">${POS_LABELS[w.pos]} · ${w.level}</span>
      <h2>${esc(w.word)}</h2>
      <p class="muted">${esc(w.transcription)}</p>
      <dl>
        <div><dt>Коллекция</dt><dd>${esc(w.collection || "—")}</dd></div>
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

// ---------- Добавление слова (в окне) ----------

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
    <label class="full">Коллекция <input type="text" name="collection" list="colList" value="${esc(word.collection || "")}">
      <datalist id="colList">${collectionNames().map((n) => `<option value="${esc(n)}">`).join("")}</datalist></label>
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

function openAdd() {
  modal.innerHTML = `
    <div class="detail">
      <h2>Новое слово</h2>
      <p class="muted">Введите слово или выражение. Карточка заполнится автоматически: пока это имитация, позже здесь будет ИИ.</p>
      <div class="add-row">
        <input type="text" id="newWord" placeholder="Например, take for granted">
        <button class="btn btn-primary" id="generateBtn">Создать карточку</button>
      </div>
      <ul class="steps" id="steps" hidden></ul>
      <div id="formHolder"></div>
    </div>`;
  $("generateBtn").onclick = generateCard;
  $("newWord").onkeydown = (e) => { if (e.key === "Enter") generateCard(); };
  if (!modal.open) modal.showModal();
}

function generateCard() {
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

  // Имитация работы ИИ: каждые 600 мс следующий шаг становится активным
  let i = 0;
  items[0].classList.add("active");
  const timer = setInterval(() => {
    if (!modal.open) { clearInterval(timer); return; }   // окно закрыли — останавливаемся
    items[i].classList.replace("active", "done");
    i++;
    if (i < items.length) { items[i].classList.add("active"); return; }
    clearInterval(timer);
    showGeneratedForm(word);
  }, 600);
}

function showGeneratedForm(word) {
  // Пока ИИ нет — подставляем заготовку, которую пользователь дополнит сам
  const draft = {
    word, transcription: "", pos: "noun", level: "B1", collection: "", translation: "",
    explanation: "", example: `I want to learn the word "${word}".`, exampleRu: ""
  };
  const form = buildForm(draft, "Сохранить в словарь", (data) => {
    state.words.unshift(withSrs({ id: Date.now(), ...data }));   // новое слово — в начало списка
    save();
    state.queue = []; state.learned = 0;                         // тренировка пересоберётся
    modal.close();
    renderWordList();
    showToast("Слово добавлено");
  }, () => modal.close());
  $("formHolder").append(form);
}

// Любая кнопка с data-action="add" открывает окно добавления
document.addEventListener("click", (e) => {
  if (!e.target.closest('[data-action="add"]')) return;
  showPage("words");
  openAdd();
});

$("resetBtn").addEventListener("click", () => {
  if (!confirm("Вернуть демо-слова и сбросить весь прогресс?")) return;
  state.words = DEMO_WORDS.map(withSrs);
  state.reviewedToday = 0;
  save();
  startPractice();
  renderWordList();
  showToast("Данные сброшены");
});

RENDER.words = renderWordList;
