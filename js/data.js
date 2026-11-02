// Демо-данные. Каждое слово — это объект с одинаковым набором полей.
// pos — часть речи, level — уровень сложности (A1 легко ... C2 сложно).
const DEMO_WORDS = [
  { id: 1, collection: "Повседневное", word: "resilient", transcription: "/rɪˈzɪliənt/", pos: "adjective", level: "B2",
    translation: "устойчивый, жизнестойкий",
    explanation: "Able to recover quickly after difficulties.",
    example: "She is resilient and always bounces back from setbacks.",
    exampleRu: "Она жизнестойкая и всегда быстро оправляется от неудач." },
  { id: 2, collection: "Повседневное", word: "reluctant", transcription: "/rɪˈlʌktənt/", pos: "adjective", level: "B2",
    translation: "неохотный",
    explanation: "Not willing to do something, so you hesitate.",
    example: "He was reluctant to share his plans.",
    exampleRu: "Он неохотно делился своими планами." },
  { id: 3, collection: "Работа", word: "thrive", transcription: "/θraɪv/", pos: "verb", level: "B2",
    translation: "процветать",
    explanation: "To grow, develop and be successful.",
    example: "Plants thrive in bright light.",
    exampleRu: "Растения хорошо растут при ярком свете." },
  { id: 4, collection: "Повседневное", word: "look forward to", transcription: "/lʊk ˈfɔːwəd tuː/", pos: "phrase", level: "B1",
    translation: "ждать с нетерпением",
    explanation: "To feel happy about something that will happen.",
    example: "I look forward to seeing you next week.",
    exampleRu: "Жду не дождусь встречи на следующей неделе." },
  { id: 5, collection: "Работа", word: "cutting-edge", transcription: "/ˌkʌtɪŋ ˈedʒ/", pos: "adjective", level: "C1",
    translation: "передовой",
    explanation: "Using the newest ideas and methods.",
    example: "The lab uses cutting-edge technology.",
    exampleRu: "Лаборатория использует передовые технологии." },
  { id: 6, collection: "Работа", word: "deadline", transcription: "/ˈdedlaɪn/", pos: "noun", level: "A2",
    translation: "крайний срок",
    explanation: "The last time or date by which something must be done.",
    example: "The deadline for the report is Friday.",
    exampleRu: "Крайний срок сдачи отчёта — пятница." },
  { id: 7, collection: "Повседневное", word: "gradually", transcription: "/ˈɡrædʒuəli/", pos: "adverb", level: "B1",
    translation: "постепенно",
    explanation: "Slowly, over a period of time.",
    example: "Her English gradually improved.",
    exampleRu: "Её английский постепенно улучшался." },
  { id: 8, collection: "Повседневное", word: "figure out", transcription: "/ˈfɪɡər aʊt/", pos: "phrase", level: "B1",
    translation: "разобраться, понять",
    explanation: "To understand something or find the answer.",
    example: "I can't figure out how this app works.",
    exampleRu: "Не могу понять, как работает это приложение." }
];

// Справочники для фильтров и форм: значение -> подпись на русском
const POS_LABELS = {
  noun: "существительное", verb: "глагол", adjective: "прилагательное",
  adverb: "наречие", phrase: "выражение"
};
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

// Библиотека: готовые IT-слова по уровням и темам. Позже сюда можно подключить базу данных.
const LIBRARY = [
  { word: "bug", transcription: "/bʌɡ/", pos: "noun", level: "A1", topic: "Баги и сбои", translation: "ошибка в коде", explanation: "A mistake in a program.", example: "I found a bug on the login page.", exampleRu: "Я нашёл ошибку на странице входа." },
  { word: "meeting", transcription: "/ˈmiːtɪŋ/", pos: "noun", level: "A1", topic: "Митинги", translation: "встреча, совещание", explanation: "An event where people discuss work.", example: "We have a meeting at ten.", exampleRu: "У нас совещание в десять." },
  { word: "release", transcription: "/rɪˈliːs/", pos: "noun", level: "A2", topic: "Деплой", translation: "релиз", explanation: "A new version of software for users.", example: "The release is planned for Friday.", exampleRu: "Релиз запланирован на пятницу." },
  { word: "feedback", transcription: "/ˈfiːdbæk/", pos: "noun", level: "A2", topic: "Переписка", translation: "обратная связь", explanation: "Comments about how well something works.", example: "Thanks for your feedback.", exampleRu: "Спасибо за обратную связь." },
  { word: "deploy", transcription: "/dɪˈplɔɪ/", pos: "verb", level: "B1", topic: "Деплой", translation: "выкладывать, развёртывать", explanation: "To put software into use on a server.", example: "We deploy every Thursday.", exampleRu: "Мы выкладываем обновления по четвергам." },
  { word: "estimate", transcription: "/ˈestɪmeɪt/", pos: "verb", level: "B1", topic: "Митинги", translation: "оценивать (сроки)", explanation: "To guess how long or how much.", example: "Can you estimate this task?", exampleRu: "Можешь оценить эту задачу?" },
  { word: "review", transcription: "/rɪˈvjuː/", pos: "verb", level: "B2", topic: "Код и ревью", translation: "проверять, делать ревью", explanation: "To read and check someone's work.", example: "Could you review my pull request?", exampleRu: "Посмотришь мой пулл-реквест?" },
  { word: "outage", transcription: "/ˈaʊtɪdʒ/", pos: "noun", level: "B2", topic: "Баги и сбои", translation: "сбой, простой сервиса", explanation: "A period when a service does not work.", example: "The outage lasted two hours.", exampleRu: "Сбой длился два часа." },
  { word: "mitigate", transcription: "/ˈmɪtɪɡeɪt/", pos: "verb", level: "C1", topic: "Баги и сбои", translation: "смягчать последствия", explanation: "To make a problem less serious.", example: "We mitigated the risk with a rollback.", exampleRu: "Мы снизили риск откатом версии." },
  { word: "stakeholder", transcription: "/ˈsteɪkhəʊldə/", pos: "noun", level: "C1", topic: "Переписка", translation: "заинтересованная сторона", explanation: "A person affected by a project.", example: "Please update the stakeholders.", exampleRu: "Пожалуйста, сообщите заинтересованным сторонам." },
  { word: "idempotent", transcription: "/ˌaɪdemˈpəʊtənt/", pos: "adjective", level: "C2", topic: "Код и ревью", translation: "идемпотентный", explanation: "Giving the same result if repeated.", example: "The request must be idempotent.", exampleRu: "Запрос должен быть идемпотентным." },
  { word: "deprecate", transcription: "/ˈdeprəkeɪt/", pos: "verb", level: "C2", topic: "Код и ревью", translation: "признавать устаревшим", explanation: "To mark a feature as outdated.", example: "The old API will be deprecated.", exampleRu: "Старый API признают устаревшим." }
];
