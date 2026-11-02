// =====================================================
// dashboard.js — главная: статистика, цель, последние слова, график
// =====================================================
const DAILY_GOAL = 10;
// Демо-активность за неделю: [день, сколько карточек]
const ACTIVITY = [["Пн", 6], ["Вт", 9], ["Ср", 4], ["Чт", 12], ["Пт", 8], ["Сб", 0], ["Вс", 5]];

function renderDashboard() {
  const hour = new Date().getHours();
  const hello = hour < 12 ? "Доброе утро" : hour < 18 ? "Добрый день" : "Добрый вечер";
  const due = state.words.filter(isDue).length;
  const learned = state.words.filter((w) => statusOf(w) === "Выучено").length;
  const goalPercent = Math.min(100, (state.reviewedToday / DAILY_GOAL) * 100);
  const max = Math.max(...ACTIVITY.map((day) => day[1]), 1);
  const stat = (number, label) => `<div class="panel"><div class="big">${number}</div><p class="muted">${label}</p></div>`;

  $("dashboard").innerHTML = `
    <div class="page-head">
      <div><h1 class="page-title">${hello}!</h1><p class="muted">Вот как идёт ваше обучение.</p></div>
      <button class="btn" data-action="add">Добавить слово</button>
    </div>
    <div class="dash">
      ${examPanel()}
      ${stat(state.words.length, "слов в словаре")}
      ${stat(learned, "выучено")}
      ${stat(due, "к повторению")}
      <div class="panel span2">
        <h3>Цель на сегодня</h3>
        <div class="progress"><div class="progress-bar" style="width:${goalPercent}%"></div></div>
        <p class="muted">${state.reviewedToday} из ${DAILY_GOAL} карточек</p>
      </div>
      <div class="panel">
        <h3>Тренировка</h3>
        <p class="muted">${due ? `Слов к повторению: ${due}.` : "Всё повторено, отличная работа."}</p>
        <button class="btn btn-primary" data-go="practice">Начать</button>
      </div>
      <div class="panel span2">
        <h3>Последние слова</h3>
        <ul class="mini">${state.words.slice(0, 4).map((w) =>
          `<li><strong>${esc(w.word)}</strong><span class="muted">${esc(w.translation)}</span></li>`).join("")}</ul>
      </div>
      <div class="panel">
        <h3>Неделя</h3>
        <div class="chart">${ACTIVITY.map(([day, count], i) =>
          `<div class="${i === ACTIVITY.length - 1 ? "today" : ""}"><i style="height:${Math.max(4, (count / max) * 80)}px"></i>${day}</div>`).join("")}</div>
      </div>
    </div>`;
}

// ---------- Проверка по английскому: дата и готовность по частям ----------
const DATE_KEY = "linguaflow-test-date";
// [название части, уже есть в приложении?]
const EXAM_PARTS = [["Грамматика", true], ["Лексика", true], ["Письмо", false], ["Разговор", false], ["Аудирование", false]];

function examPanel() {
  const date = loadJSON(DATE_KEY, "");
  const today = new Date().setHours(0, 0, 0, 0);
  const days = date ? Math.round((new Date(date + "T00:00:00") - today) / DAY) : null;
  const countdown = days === null ? "—" : days < 0 ? "Прошла" : days;
  const hint = days === null ? "укажите дату проверки" : days < 0 ? "дата уже прошла" : "дн. до проверки";

  const rows = EXAM_PARTS.map(([name, ready]) => {
    const part = state.lastTest && state.lastTest.byPart[name];
    const percent = part ? Math.round((part.ok / part.total) * 100) : null;
    const label = !ready ? "скоро" : percent === null ? "нет данных" : percent + "%";
    return `<li><span>${name}</span><div class="progress"><div class="progress-bar" style="width:${percent || 0}%"></div></div><span class="muted">${label}</span></li>`;
  }).join("");

  return `<div class="panel span3 exam">
    <div>
      <h3>Проверка по английскому</h3>
      <div class="big">${countdown}</div>
      <p class="muted">${hint}</p>
      <input type="date" id="testDate" value="${esc(date)}" aria-label="Дата проверки">
    </div>
    <div>
      <h3>Готовность по частям</h3>
      <ul class="readiness">${rows}</ul>
      <button class="btn btn-primary" data-action="test">Пройти пробный тест</button>
    </div>
  </div>`;
}

// При смене даты сохраняем её и перерисовываем главную
$("dashboard").addEventListener("change", (e) => {
  if (e.target.id !== "testDate") return;
  saveJSON(DATE_KEY, e.target.value);
  renderDashboard();
});

RENDER.dashboard = renderDashboard;
