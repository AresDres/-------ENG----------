// =====================================================
// library.js — готовая библиотека слов по уровням и темам
// =====================================================
const lib = { level: "A1", topic: "" };   // выбранные вкладки

function renderLibrary() {
  const topics = [...new Set(LIBRARY.map((w) => w.topic))];
  const tab = (active, attr, value, label) =>
    `<button class="tab ${active ? "active" : ""}" ${attr}="${value}">${label}</button>`;
  // Запоминаем номер слова в общем массиве, чтобы потом его найти по кнопке
  const list = LIBRARY.map((w, i) => ({ ...w, i }))
    .filter((w) => w.level === lib.level && (!lib.topic || w.topic === lib.topic));

  $("library").innerHTML = `
    <h1 class="page-title">Библиотека</h1>
    <div class="tabs">${LEVELS.map((l) => tab(l === lib.level, "data-level", l, l)).join("")}</div>
    <div class="tabs">${tab(!lib.topic, "data-topic", "", "Все темы")}${topics.map((t) => tab(t === lib.topic, "data-topic", t, t)).join("")}</div>
    <ul class="word-list">${list.length ? list.map((w) => {
      const added = state.words.some((x) => x.word === w.word);
      return `<li class="word-item static">
        <strong>${esc(w.word)}</strong><span class="tr">${esc(w.translation)}</span>
        <span class="muted status">${esc(w.topic)}</span>
        ${added ? `<span class="muted status">Добавлено</span>` : `<button class="btn" data-add="${w.i}">Добавить</button>`}
      </li>`;
    }).join("") : `<li class="word-item static empty">По этому фильтру слов пока нет. Библиотека будет пополняться.</li>`}</ul>`;
}

$("library").addEventListener("click", (e) => {
  const level = e.target.closest("[data-level]");
  const topic = e.target.closest("[data-topic]");
  const add = e.target.closest("[data-add]");
  if (level) lib.level = level.dataset.level;
  if (topic) lib.topic = topic.dataset.topic;
  if (add) {
    const { topic: collection, ...card } = LIBRARY[Number(add.dataset.add)];   // тема становится коллекцией
    state.words.unshift(withSrs({ id: Date.now(), collection, ...card }));
    save();
    showToast("Слово добавлено в ваш словарь");
  }
  renderLibrary();
});

RENDER.library = renderLibrary;
