const main = document.querySelector("#main");
const nav = document.querySelector("#nav");
const menu = document.querySelector("#menu");
const sidebar = document.querySelector("#sidebar");
const practice = [
  { id: "choose", title: "Какую формулу взять?" },
  { id: "trainer", title: "Тренажёр" },
  { id: "sheet", title: "Шпаргалка" }
];
const pages = [{ id: "home", title: "Карта темы" }, ...lessons, ...practice];

function link(page) {
  return `<a href="#/${page.id}" data-route="${page.id}">${page.title}</a>`;
}
nav.innerHTML = link(pages[0])
  + '<div class="nav-group">Теория</div>' + lessons.map(link).join("")
  + '<div class="nav-group">Практика</div>' + practice.map(link).join("");

function heading(title, label, intro = "") {
  return `<span class="eyebrow">${label}</span><h1 tabindex="-1">${title}</h1>${intro ? `<p class="lead">${intro}</p>` : ""}`;
}

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

function fraction(n, d) {
  const factor = gcd(n, d);
  return d === factor ? String(n / factor) : `${n / factor}/${d / factor}`;
}

function readAnswer(raw) {
  let value = raw.trim().replace(",", ".");
  const percent = value.endsWith("%");
  if (percent) value = value.slice(0, -1).trim();
  const parts = value.split("/").map(part => part.trim());
  if (parts.length > 2 || parts.some(part => !/^\d+(\.\d+)?$|^\.\d+$/.test(part))) return NaN;
  const [n, d = 1] = parts.map(Number);
  return n / d / (percent ? 100 : 1);
}

function taskView([level, question, n, d, solution]) {
  return `<article class="task"><p><span class="level">${level}</span>${question}</p>
    <form data-n="${n}" data-d="${d}"><label>Ответ <input name="answer" placeholder="Дробь или число" autocomplete="off" required></label>
    <button class="primary">Проверить</button></form>
    <p class="status" role="status"></p>
    <details><summary>Решение</summary><p>${solution}</p></details></article>`;
}

function home() {
  main.innerHTML = heading("Вероятность, которую видно", "10 класс · раздел 10.1С",
    "Выберите ветви дерева, сравните выбор с возвратом и без него и посмотрите, как условие меняет набор возможных исходов.")
    + '<div id="demo" class="demo"></div><h2>Карта темы</h2><div class="grid">'
    + [...lessons, ...practice].map(page => `<a class="card" href="#/${page.id}"><h3>${page.title}</h3>${page.ktp ? `<p>${page.ktp}</p>` : ""}</a>`).join("")
    + '</div><p class="hint" style="margin-top:16px">Эти же цели возвращаются в экзаменационном повторении на уроках 183–187.</p>';
  treeDemo();
}

function lesson(page) {
  main.innerHTML = heading(page.title, page.ktp, page.lead)
    + `<p class="formula">${page.formula}</p><div id="demo" class="demo"></div>
    <div class="grid"><article class="card def"><h3>Как работает формула</h3><p>${page.theory}</p></article>
    <article class="card"><h3>Пример</h3><p>${page.example}</p></article></div>
    <div class="mistake"><h3>Типичная ошибка</h3><p>${page.mistake}</p></div>
    <h2>Задачи</h2><p class="hint">Вводите обычную дробь, десятичное число или проценты.</p>`
    + page.tasks.map(taskView).join("");
  if (page.id === "multiplication") treeDemo();
  else diceDemo(page.id === "conditional");
}

function diceDemo(conditional) {
  const root = document.querySelector("#demo");
  const modes = conditional
    ? ["Все грани", "Число чётное", "Число больше 4"]
    : ["Чётные", "Больше 4", "Чётные или больше 4", "Общие исходы"];
  root.innerHTML = `<h3>${conditional ? "Как меняется знаменатель" : "Что попадает в объединение"}</h3>
    <p>${conditional ? "Меняйте условие и наблюдайте, как меняется вероятность выпадения числа больше 3." : "Переключайте события на честном кубике. Обратите внимание, где появляется число 6."}</p>
    <div class="controls">${modes.map((mode, index) => `<button data-mode="${index}" aria-pressed="false">${mode}</button>`).join("")}</div>
    <div class="outcomes" aria-hidden="true"></div><p class="status" role="status"></p>`;
  const buttons = [...root.querySelectorAll("button")];
  const faces = [1, 2, 3, 4, 5, 6];
  function paint(index) {
    const even = face => face % 2 === 0;
    const high = face => face > 4;
    const base = conditional ? faces.filter([() => true, even, high][index]) : faces;
    const hits = base.filter(conditional ? face => face > 3 : [even, high, face => even(face) || high(face), face => even(face) && high(face)][index]);
    buttons.forEach((button, i) => button.setAttribute("aria-pressed", String(i === index)));
    root.querySelector(".outcomes").innerHTML = faces.map(face => `<span class="die ${hits.includes(face) ? "hit" : base.includes(face) ? "base" : "dim"}">${face}</span>`).join("");
    root.querySelector(".status").textContent =
      `Подходят ${hits.join(", ")}. Допустимые исходы — ${base.join(", ")}. P = ${hits.length}/${base.length} = ${fraction(hits.length, base.length)}.`;
  }
  buttons.forEach((button, index) => button.addEventListener("click", () => paint(index)));
  paint(0);
}

function treeDemo() {
  const root = document.querySelector("#demo");
  root.innerHTML = `<h3>Дерево вероятностей</h3>
    <p>В мешке 3 жёлтых и 2 синих шара. Выберите ветви для события «шары разных цветов» и переключите возврат.</p>
    <div class="controls"><label>После первого выбора <select><option value="no">Без возврата</option><option value="yes">С возвратом</option></select></label>
    <button data-clear>Сбросить выбор</button></div>
    <div class="tree"></div><p class="status" role="status"></p>`;
  const select = root.querySelector("select");
  const tree = root.querySelector(".tree");
  const colors = ["Жёлтый", "Синий"];
  const initial = [3, 2];
  const selected = new Set();
  function branchValues(first, second) {
    const replacement = select.value === "yes";
    return [initial[first], initial[second] - Number(!replacement && first === second), replacement ? 5 : 4];
  }
  tree.innerHTML = colors.map((color, first) => `<div class="branch"><strong>1-й шар: ${color.toLowerCase()} · ${initial[first]}/5</strong>
    ${colors.map((_, second) => `<button data-branch="${first * 2 + second}" aria-pressed="false"></button>`).join("")}</div>`).join("");
  const buttons = [...tree.querySelectorAll("button")];
  function paint() {
    let numerator = 0;
    const denominator = select.value === "yes" ? 25 : 20;
    const terms = [];
    buttons.forEach((button, index) => {
      const [a, b, d] = branchValues(Math.floor(index / 2), index % 2);
      const term = `${a}/5 × ${b}/${d}`;
      button.textContent = `2-й шар: ${colors[index % 2].toLowerCase()} · ${term}`;
      button.setAttribute("aria-pressed", String(selected.has(index)));
      if (selected.has(index)) {
        numerator += a * b;
        terms.push(`(${term})`);
      }
    });
    root.querySelector(".status").textContent = terms.length
      ? `P выбранных путей = ${terms.join(" + ")} = ${fraction(numerator, denominator)}.`
      : "Выберите один или несколько путей. Вероятности выбранных путей складываются.";
  }
  buttons.forEach((button, index) => button.addEventListener("click", () => {
    if (selected.has(index)) selected.delete(index);
    else selected.add(index);
    paint();
  }));
  select.addEventListener("change", paint);
  root.querySelector("[data-clear]").addEventListener("click", () => {
    selected.clear();
    paint();
  });
  paint();
}

function chooser() {
  main.innerHTML = heading("Какую формулу взять?", "Помощник",
    "Определите, о чём спрашивает задача, и проверьте условия применения формулы.")
    + `<section class="demo"><h3>Что нужно найти?</h3><div class="controls">
    ${["Хотя бы одно событие", "Оба события", "Событие при известном условии"].map((label, index) => `<button data-choice="${index}" aria-pressed="false">${label}</button>`).join("")}
    </div><div id="choice-result" aria-live="polite"></div></section>`;
  const guidance = [
    "Есть общие исходы? Вычтите вероятность пересечения. Если события несовместны, достаточно сложить их вероятности.",
    "Изменилось ли распределение после первого события? В общем случае умножьте P(A) на P(B | A). Если события независимы, второй множитель равен P(B).",
    "Поставьте вероятность известного события в знаменатель. В числителе должна быть вероятность пересечения. Проверьте, что знаменатель положительный."
  ];
  const buttons = [...main.querySelectorAll("[data-choice]")];
  buttons.forEach((button, index) => button.addEventListener("click", () => {
    buttons.forEach((item, i) => item.setAttribute("aria-pressed", String(i === index)));
    const page = lessons[index];
    main.querySelector("#choice-result").innerHTML =
      `<p><strong>${page.formula}</strong></p><p>${guidance[index]}</p><p><a href="#/${page.id}">Перейти к теме</a></p>`;
  }));
}

function sheet() {
  main.innerHTML = heading("Шпаргалка", "Формулы и условия")
    + '<div class="grid">'
    + lessons.map(page => `<article class="card"><h3><a href="#/${page.id}">${page.title}</a></h3><p><strong>${page.formula}</strong></p><p>${page.theory}</p></article>`).join("")
    + '<article class="card"><h3>Противоположное событие</h3><p><strong>P(не A) = 1 − P(A)</strong></p><p>Для «хотя бы одного» часто проще посчитать вероятность «ни одного» и вычесть её из 1.</p></article></div>';
}

function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function generatedTask(kind) {
  if (kind === "addition") {
    const total = randomInt(8, 40);
    const [twos, threes, both] = [2, 3, 6].map(divisor => Math.floor(total / divisor));
    const n = twos + threes - both;
    return ["B", `Из карточек с номерами от 1 до ${total} равновероятно выбирают одну. Какова вероятность, что номер делится на 2 или 3?`,
      n, total, `Кратных 2 — ${twos}, кратных 3 — ${threes}, кратных 6 — ${both}. Поэтому P = ${n}/${total} = ${fraction(n, total)}.`];
  }
  if (kind === "multiplication") {
    const yellow = randomInt(2, 8);
    const blue = randomInt(2, 8);
    const total = yellow + blue;
    const replacement = Math.random() < 0.5;
    const next = total - Number(!replacement);
    const n = 2 * yellow * blue;
    return ["C", `В мешке ${yellow} жёлтых и ${blue} синих шаров. Выбирают два шара ${replacement ? "с возвратом первого" : "без возврата"}. Какова вероятность, что они разных цветов?`,
      n, total * next, `Складываем две ветви: ${yellow}/${total} × ${blue}/${next} + ${blue}/${total} × ${yellow}/${next} = ${fraction(n, total * next)}.`];
  }
  const first = randomInt(10, 24);
  const both = randomInt(2, 9);
  const second = randomInt(both + 1, 24);
  const total = first + second - both + randomInt(2, 8);
  return ["B", `Из ${total} учеников ${first} занимаются шахматами, ${second} робототехникой, ${both} ходят в оба кружка. Случайно выбранный ученик занимается шахматами. Какова вероятность, что он также занимается робототехникой?`,
    both, first, `Рассматриваем ${first} шахматистов. Из них ${both} посещают второй кружок. Ответ ${fraction(both, first)}.`];
}

function trainer() {
  main.innerHTML = heading("Тренажёр", "Практика", "В смешанном режиме сначала определите, какая формула подходит к условию.")
    + `<div class="controls"><label>Тема <select id="topic"><option value="mixed">Все темы</option>
    ${lessons.map(page => `<option value="${page.id}">${page.title}</option>`).join("")}</select></label>
    <button id="next" type="button">Новая задача</button></div><p class="hint">Можно вводить дроби, десятичные числа и проценты.</p><div id="exercise"></div>`;
  const topic = main.querySelector("#topic");
  const exercise = main.querySelector("#exercise");
  let previous = "";
  function next() {
    let task;
    do {
      const kind = topic.value === "mixed" ? lessons[randomInt(0, lessons.length - 1)].id : topic.value;
      task = generatedTask(kind);
    } while (task[1] === previous);
    previous = task[1];
    exercise.innerHTML = taskView(task);
  }
  main.querySelector("#next").addEventListener("click", next);
  topic.addEventListener("change", next);
  next();
}

main.addEventListener("submit", event => {
  event.preventDefault();
  const form = event.target;
  const input = form.elements.answer;
  const response = readAnswer(input.value);
  const expected = Number(form.dataset.n) / Number(form.dataset.d);
  const status = form.nextElementSibling;
  const valid = Number.isFinite(response) && response >= 0 && response <= 1;
  const correct = valid && Math.abs(response - expected) < 0.00005;
  status.className = correct ? "status good" : "status bad";
  status.textContent = correct ? "Верно!" : valid
    ? "Пока неверно. Проверьте вычисления или откройте решение."
    : "Введите вероятность от 0 до 1. Например, 1/4, 0,25 или 25%.";
});

const renderers = { home, choose: chooser, trainer, sheet };
function navigate(focusHeading = false) {
  const route = location.hash.slice(2);
  const page = pages.find(item => item.id === route) || pages[0];
  nav.querySelectorAll("a").forEach(anchor => {
    if (anchor.dataset.route === page.id) anchor.setAttribute("aria-current", "page");
    else anchor.removeAttribute("aria-current");
  });
  (renderers[page.id] || lesson)(page);
  document.title = `${page.title} · Вероятность · 10 класс`;
  sidebar.classList.remove("open");
  menu.setAttribute("aria-expanded", "false");
  if (focusHeading) main.querySelector("h1").focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

menu.addEventListener("click", () => {
  menu.setAttribute("aria-expanded", String(sidebar.classList.toggle("open")));
});
nav.addEventListener("click", event => {
  if (event.target.closest("a")?.hash === location.hash) navigate(true);
});
window.addEventListener("hashchange", () => navigate(true));
navigate();
