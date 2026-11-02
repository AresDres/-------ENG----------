// =====================================================
// practice.js — тренировка карточками
// =====================================================

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
  state.reviewedToday++;
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
  if (!$("page-practice").classList.contains("active") || $("cardsMode").hidden || modal.open) return;
  if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
  if (e.code === "Space") {
    e.preventDefault();
    if (!state.flipped) flipCard();
  } else if (state.flipped && ["1", "2", "3"].includes(e.key)) {
    rateWord(RATES[Number(e.key) - 1][0]);
  }
});


RENDER.practice = () => {
  if (state.queue.length === 0 && state.learned === 0) startPractice();
};
