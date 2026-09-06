/* ------------------------------------------------------------------
   The script's own words, in the board's other language.

   The board is bilingual and the script reads both halves (column
   headers, page counters, weekdays — see lists.js and topic.js). What
   it *says* — Reply, First unread, Releases, Show all 300 names — was
   English on both. On the Russian interface that put a row of English
   controls over a Russian page. These are those words, once each, with
   the Russian beside them; the settings panel stays in English.

   `t("Open all {n} spoilers", { n })` looks the key up when the page is
   Russian and fills the braces either way. A Russian entry may be a
   function of the variables, because Russian counts in three forms:
   1 спойлер, 3 спойлера, 5 спойлеров.
   ------------------------------------------------------------------ */

/** Russian plural: one / few / many, by the last digits. */
function ruPlural(n, one, few, many) {
    const value = Math.abs(Number(n)) || 0;
    const tens = value % 100;
    const ones = value % 10;
    if (tens >= 11 && tens <= 14) return many;
    if (ones === 1) return one;
    if (ones >= 2 && ones <= 4) return few;
    return many;
}

const RU_WORDS = {
    // The topic bar
    "Reply": "Ответить",
    "New topic": "Новая тема",
    "Open all {n} spoilers": ({ n }) => "Раскрыть все " + n + " " + ruPlural(n, "спойлер", "спойлера", "спойлеров"),
    "First unread": "Первое непрочитанное",
    "Jump to the first post you have not read": "К первому непрочитанному сообщению",
    "Page {a} of {b}": "Страница {a} из {b}",
    "Page": "Страница",
    "of {n}": "из {n}",
    "First page": "Первая страница",
    "Previous page": "Предыдущая страница",
    "Next page": "Следующая страница",
    "Last page": "Последняя страница",
    "Go to page": "Перейти к странице",
    "Previous": "Назад",
    "Next": "Вперёд",
    "Pages of this topic": "Страницы темы",
    "Could not work out that page": "Не удалось определить страницу",
    "Previous topic": "Предыдущая тема",
    "Next topic": "Следующая тема",
    "Print view": "Версия для печати",

    // Posts
    "Copy link to this post": "Скопировать ссылку на сообщение",
    "Copy as a quote": "Скопировать как цитату",
    "Show signature": "Показать подпись",
    "Hide signature": "Скрыть подпись",
    "Show ": "Показать ",
    "Hide ": "Скрыть ",
    "Show": "Показать",
    "the original post": "исходное сообщение",
    "the full Steam description": "полное описание Steam",
    "this category": "этот раздел",
    "Close all {n} spoilers": ({ n }) => "Скрыть все " + n + " " + ruPlural(n, "спойлер", "спойлера", "спойлеров"),
    "Close the image": "Закрыть изображение",
    "Image": "Изображение",
    "Leave the forum for this address?": "Перейти с форума по этому адресу?",
    "Only posts with links": "Только сообщения со ссылками",
    "{n} posts shown": ({ n }) => "Показано " + n + " " + ruPlural(n, "сообщение", "сообщения", "сообщений"),
    "All posts shown": "Показаны все сообщения",
    "Post by {name} is hidden": "Сообщение {name} скрыто",
    "Show posts by {name}": "Показать сообщения {name}",
    "Hide posts by {name}": "Скрыть сообщения {name}",
    "Hide posts by this member": "Скрыть сообщения этого участника",

    // Listings
    "{n} on this page": "{n} на этой странице",
    "{a} of {b} on this page": "{a} из {b} на этой странице",
    "Filter this page by title": "Фильтр по названию",
    "Filter topics on this page": "Фильтр тем на этой странице",
    "Show only {x}": "Показать только {x}",
    "Bookmark this topic": "В закладки",
    "{n} topics": ({ n }) => n + " " + ruPlural(n, "тема", "темы", "тем"),
    "Fold this section": "Свернуть раздел",
    "Show this section": "Показать раздел",
    "Subforums": "Подфорумы",

    // The search box
    "This topic": "Эта тема",
    "This forum": "Этот форум",
    "Whole board": "Весь форум",
    "Where": "Где",
    "Look in": "Искать в",
    "Titles": "Названия",
    "First post": "Первое сообщение",
    "All posts": "Все сообщения",
    "Where to search": "Где искать",
    "What to search": "Что искать",
    "Search options": "Параметры поиска",
    "Search this topic": "Поиск в теме",
    "Search this forum": "Поиск в форуме",
    "Search the whole board": "Поиск по всему форуму",

    // Who is online
    "{n} online": "{n} онлайн",
    "{n} browsing": "{n} просматривают",
    "{n} registered": "{n} зарегистрированных",
    "{n} hidden": "{n} скрытых",
    "{n} guests": ({ n }) => n + " " + ruPlural(n, "гость", "гостя", "гостей"),
    "Show all {n} names": ({ n }) => "Показать все " + n + " " + ruPlural(n, "имя", "имени", "имён"),
    "Hide the list": "Скрыть список",

    // The Releases panel
    "Releases": "Релизы",
    "Fold the Releases panel": "Свернуть панель релизов",
    "Open the Releases panel": "Открыть панель релизов",
    "{n} release": "{n} релиз",
    "{n} releases": ({ n }) => n + " " + ruPlural(n, "релиз", "релиза", "релизов"),
    " on this page": " на этой странице",
    "This page": "Эта страница",
    "All {n} page": "Вся тема ({n} страница)",
    "All {n} pages": ({ n }) => "Все " + n + " " + ruPlural(n, "страница", "страницы", "страниц"),
    "Filter by kind": "Фильтр по типу",
    "Reading {a} of {b}…": "Читаю {a} из {b}…",
    "Could not read the whole topic": "Не удалось прочитать всю тему",
    "Stopped reading the topic": "Чтение темы остановлено",
    "Reading a whole topic is switched off in the settings": "Чтение всей темы отключено в настройках",
    "This topic is one page — you are looking at all of it": "В теме одна страница — вы видите её целиком",
    "No version given in this post": "Версия в сообщении не указана",
    "No version given": "Версия не указана",
    "Steam build {n}, which is not a version number": "Сборка Steam {n} — это не номер версии",
    "build": "сборка",
    "p.": "с.",
    "{n} link": "{n} ссылка",
    "{n} links": ({ n }) => n + " " + ruPlural(n, "ссылка", "ссылки", "ссылок"),
    "Read it again": "Прочитать заново",
    "1 page read": "Прочитана 1 страница",
    "{n} pages read": ({ n }) => "Прочитано " + n + " " + ruPlural(n, "страница", "страницы", "страниц"),
    "the oldest {n} pages were not read": ({ n }) => "Первые " + n + " " + ruPlural(n, "страница", "страницы", "страниц") + " не прочитаны",
    "oldest {n} skipped": "первые {n} пропущены",
    "stopped early": "остановлено раньше",
    "the board was busy, so this was read slowly": "форум был занят, поэтому чтение шло медленно",
    "The board was answering slowly, so this was read one page at a time": "Форум отвечал медленно, поэтому страницы читались по одной",
    "read gently": "читалось бережно",
    "read {ago}": "прочитано {ago}",
    "{n} new since": ({ n }) => n + " " + ruPlural(n, "новое", "новых", "новых") + " с тех пор",
    "1 newer post since": "1 новое сообщение с тех пор",
    "{n} newer posts since": ({ n }) => n + " " + ruPlural(n, "новое сообщение", "новых сообщения", "новых сообщений") + " с тех пор",
    "just now": "только что",
    "{n} minutes ago": ({ n }) => n + " " + ruPlural(n, "минуту", "минуты", "минут") + " назад",
    "1 hour ago": "1 час назад",
    "{n} hours ago": ({ n }) => n + " " + ruPlural(n, "час", "часа", "часов") + " назад",
    "{n} days ago": ({ n }) => n + " " + ruPlural(n, "день", "дня", "дней") + " назад",
    "Latest posted: version {v}": "Последняя версия в теме: {v}",
    "Latest posted: v{v}": "Последняя: v{v}",
    "Clean Steam files": "Чистые файлы Steam",
    "Repack": "Репак",
    "Crack": "Кряк",
    "Hypervisor": "Гипервизор",
    "Online fix": "Онлайн-фикс",
    "Update": "Обновление",
    "Reupload": "Перезалив",
    "Trainer": "Трейнер",
    "Language": "Локализация",
    "Tool": "Утилита",

    // The quick reply
    "Write a reply": "Написать ответ",
    "Finish your reply": "Закончить ответ",
    "Loading the reply form…": "Загрузка формы…",
    "Post reply": "Отправить",
    "Open the full editor": "Открыть полный редактор",
    "Preview, attachments and the full toolbar": "Предпросмотр, вложения и полная панель",
    "Could not load the reply form. Opening the full editor instead.": "Не удалось загрузить форму. Открываю полный редактор.",
    "Added to your reply": "Добавлено в ответ",
    "Formatting": "Форматирование",
    "Bold": "Жирный",
    "Italic": "Курсив",
    "Underline": "Подчёркнутый",
    "Quote": "Цитата",
    "Code": "Код",
    "Link": "Ссылка",
    "Spoiler": "Спойлер",

    // The top bar
    "More": "Ещё",
    "Less": "Свернуть",
    "Unread": "Новое",
    "Password": "Пароль",
    "Copy the password": "Скопировать пароль",
    "Password copied": "Пароль скопирован",
    "Copy every link in this post": "Скопировать все ссылки этого сообщения",
    "Copy this list": "Скопировать список",
    "Previous image": "Предыдущее изображение",
    "Next image": "Следующее изображение",
    "New since your last visit": "Новое с вашего последнего визита",
    "New since {when}": "Новое с {when}",
    "Back to page {n}": "Назад к странице {n}",
    "You were reading page {n} of this topic": "Вы читали страницу {n} этой темы",
    "{n} link copied": "{n} ссылка скопирована",
    "{n} links copied": "{n} ссылок скопировано",
    "{n} lines copied": "{n} строк скопировано",
    "Show only the topics with unread posts": "Показать только темы с новыми сообщениями",
    "Mark everything on this page": "Отметить всё на этой странице",
    "More board links": "Ещё ссылки",
    "Board links": "Ссылки форума",
    "Search or jump to": "Поиск или переход",
    "Search and jump (Ctrl+K)": "Поиск и переход (Ctrl+K)",
    "Private messages": "Личные сообщения",
    "Private messages — {n} unread": "Личные сообщения — {n} непрочитанных",
    "Your account": "Ваш профиль",
    "Log in": "Вход",
    "RIN Reforged settings": "Настройки RIN Reforged",
    "Skip to content": "К содержимому",

    // The command palette
    "Boards": "Разделы",
    "Recent": "Недавние",
    "Actions": "Действия",
    "Search the forum, or jump to a board": "Поиск по форуму или переход в раздел",
    "Search the forum for {q}": "Искать на форуме: {q}",
    "Search this board for {q}": "Искать в этом разделе: {q}",
    "Search {forum} for {q}": "Искать в «{forum}»: {q}",
    "Releases in this topic": "Релизы в этой теме",
    "How much to look at": "Сколько смотреть",
    "Search": "Поиск",
    "Nothing matches that": "Ничего не найдено",
    "topic": "тема",
    "board": "раздел",
};

/**
 * The word for the page's language, with `{name}` slots filled.
 * `currentLanguage()` (navbar.js) reads <html lang>; anything but
 * Russian gets the English key as written.
 */
function t(key, vars) {
    let text = key;
    if (currentLanguage() === "ru" && Object.prototype.hasOwnProperty.call(RU_WORDS, key)) {
        text = RU_WORDS[key];
        if (typeof text === "function") text = text(vars || {});
    }
    if (vars) {
        for (const [name, value] of Object.entries(vars)) {
            text = text.split("{" + name + "}").join(String(value));
        }
    }
    return text;
}
