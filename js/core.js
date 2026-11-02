// =====================================================
// core.js — общее для всех разделов: данные, состояние, навигация
// Как добавить новый раздел: 1) <section class="page" id="page-имя"> в index.html,
// 2) кнопка с data-go="имя" в меню, 3) свой файл js/имя.js,
// 4) в нём строка RENDER.имя = функцияОтрисовки.
// =====================================================

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
  session: { again: 0, hard: 0, good: 0 },  // оценки за текущую тренировку
  reviewedToday: 0          // карточек за сегодня (в демо сбрасывается при перезагрузке)
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


// ---------- Навигация ----------
const RENDER = {};   // сюда каждый раздел регистрирует свою функцию отрисовки
const modal = $("modal");

function showPage(name) {
  document.querySelectorAll(".page").forEach((p) => p.classList.toggle("active", p.id === "page-" + name));
  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.go === name));
  if (RENDER[name]) RENDER[name]();   // при каждом открытии раздел перерисовывается
  window.scrollTo(0, 0);
}

// Любой элемент с data-go="раздел" открывает этот раздел
document.addEventListener("click", (e) => {
  const target = e.target.closest("[data-go]");
  if (target) showPage(target.dataset.go);
});

// ---------- Хранилище для небольших данных (дата теста, результаты) ----------
function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch (err) { return fallback; }
}
function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (err) { /* хранилище недоступно */ }
}
