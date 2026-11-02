// =====================================================
// assistant.js — визуальный интерфейс чата (ИИ пока не подключён)
// =====================================================
const chat = [{ from: "ai", text: "Привет! Я помогу разобраться с английским. Задайте вопрос или выберите пример." }];
const EXAMPLES = [
  "В чём разница между make и do?",
  "Объясни Present Perfect простыми словами",
  "Как запомнить неправильные глаголы?",
  "Проверь моё предложение"
];

function renderAssistant() {
  $("assistant").innerHTML = `
    <h1 class="page-title">ИИ-помощник</h1>
    <div class="chips">${EXAMPLES.map((q) => `<button class="tab" data-q="${esc(q)}">${esc(q)}</button>`).join("")}</div>
    <div class="panel chat" id="chatLog">${chat.map((m) => `<div class="msg ${m.from}">${esc(m.text)}</div>`).join("")}</div>
    <form class="chat-input" id="chatForm">
      <input type="text" id="chatText" placeholder="Напишите вопрос" autocomplete="off">
      <button class="btn btn-primary">Отправить</button>
    </form>`;
  const log = $("chatLog");
  log.scrollTop = log.scrollHeight;    // прокручиваем к последнему сообщению
}

function sendMessage(text) {
  if (!text.trim()) return;
  chat.push({ from: "user", text });
  renderAssistant();
  $("chatText").focus();
  // Имитация ответа. Здесь позже появится запрос к настоящему ИИ.
  setTimeout(() => {
    chat.push({ from: "ai", text: "Это демо-интерфейс: ИИ пока не подключён. Позже здесь появится развёрнутое объяснение." });
    renderAssistant();
  }, 700);
}

$("assistant").addEventListener("submit", (e) => {
  e.preventDefault();
  sendMessage($("chatText").value);
});
$("assistant").addEventListener("click", (e) => {
  const chip = e.target.closest("[data-q]");
  if (chip) sendMessage(chip.dataset.q);
});

RENDER.assistant = renderAssistant;
