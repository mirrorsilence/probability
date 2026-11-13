const main = document.querySelector("#main");
const nav = document.querySelector("#nav");
const menu = document.querySelector("#menu");
const sidebar = document.querySelector("#sidebar");
const practice = [
  { id: "lab", title: "Анимации опытов" },
  { id: "errors", title: "Частые ошибки" },
  { id: "challenge", title: "Сложные задачи" },
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

const renderers = { home, choose: chooser, trainer, sheet, lab, errors, challenge };
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

function ballOutcomes() {
  const colors = ["🟡", "🔵"];
  const counts = [3, 2];
  return counts.flatMap((first, i) => counts.map((second, j) => ({
    icons: [colors[i], colors[j]],
    hits: Number(i === 1) + Number(j === 1),
    weight: first * (second - Number(i === j)) / 20
  })));
}

function diceOutcomes() {
  return Array.from({ length: 36 }, (_, index) => {
    const first = Math.floor(index / 6) + 1;
    const second = index % 6 + 1;
    return { icons: ["⚀⚁⚂⚃⚄⚅"[first - 1], "⚀⚁⚂⚃⚄⚅"[second - 1]], hits: Number(first === 6) + Number(second === 6), weight: 1 / 36 };
  });
}

const experiments = [
  {
    title: "Стрелки", unit: "попадание", plural: "попаданий", denominator: 100,
    setup: "Два стрелка независимо делают по одному выстрелу по спортивной мишени. Вероятности попадания 0,8 и 0,6. ◎ означает попадание, × означает промах.",
    outcomes: [true, false].flatMap(a => [true, false].map(b => ({
      icons: [a ? "◎" : "×", b ? "◎" : "×"], hits: Number(a) + Number(b), weight: (a ? 0.8 : 0.2) * (b ? 0.6 : 0.4)
    })))
  },
  {
    title: "Мячи", unit: "синий мяч", plural: "синих мячей", denominator: 20,
    setup: "В корзине 3 жёлтых и 2 синих мяча. Вытягивают два по очереди, без возврата.",
    outcomes: ballOutcomes()
  },
  {
    title: "Игральные кости", unit: "шестёрка", plural: "шестёрок", denominator: 36,
    setup: "Бросают две честные игральные кости. У каждой кости 6 граней, поэтому у пары 36 равновероятных упорядоченных исходов.",
    outcomes: diceOutcomes()
  }
];

function lab() {
  main.innerHTML = heading("Анимации опытов", "Практика", "Сначала выберите событие и вычислите его вероятность. Затем повторите опыт и сравните расчёт с частотой.")
    + `<div class="controls" id="experiment-tabs">${experiments.map((item, i) => `<button data-index="${i}" aria-pressed="${i === 0}">${item.title}</button>`).join("")}</div><section class="demo" id="experiment"></section>`;
  const buttons = [...main.querySelectorAll("#experiment-tabs button")];
  buttons.forEach((button, i) => button.addEventListener("click", () => {
    buttons.forEach((item, j) => item.setAttribute("aria-pressed", String(i === j)));
    showExperiment(experiments[i]);
  }));
  showExperiment(experiments[0]);
}

function showExperiment(item) {
  const root = main.querySelector("#experiment");
  root.innerHTML = `<h3>${item.title}</h3><p>${item.setup}</p>
    <div class="controls"><label>Событие <select><option value="at-least">Хотя бы один исход: ${item.unit}</option><option value="exactly">Ровно один исход: ${item.unit}</option><option value="none">Ноль ${item.plural}</option></select></label></div>
    <div id="calculation"></div>
    <div class="outcomes" style="grid-template-columns:repeat(2,minmax(0,1fr));max-width:220px" aria-hidden="true"><span class="die">?</span><span class="die">?</span></div>
    <div class="controls"><button class="primary" data-repeat="1">Провести опыт</button><button data-repeat="100">Повторить 100 раз</button><button data-repeat="0">Сбросить</button></div>
    <p class="status" role="status">Опытов пока нет.</p>`;
  const selector = root.querySelector("select");
  const numbers = root.querySelector(".outcomes");
  const status = root.querySelector(".status");
  const tally = [0, 0, 0];
  let last;
  const matches = hits => selector.value === "none" ? hits === 0 : selector.value === "exactly" ? hits === 1 : hits >= 1;
  const total = count => Math.round(item.outcomes.filter(outcome => outcome.hits === count).reduce((sum, outcome) => sum + outcome.weight, 0) * item.denominator);
  const p0 = fraction(total(0), item.denominator);
  const p1 = fraction(total(1), item.denominator);
  const p2 = fraction(total(2), item.denominator);
  function refresh() {
    const d = item.denominator;
    const formula = selector.value === "at-least"
      ? `P(хотя бы один) = 1 − P(ноль) = 1 − ${p0} = ${fraction(d - total(0), d)}`
      : selector.value === "exactly" ? `P(ровно один) = ${p1}` : `P(ноль) = ${p0}`;
    root.querySelector("#calculation").innerHTML = `<p class="formula">${formula}</p><p>Распределение: ноль — ${p0}, один — ${p1}, два — ${p2}.</p>`;
    const n = tally.reduce((sum, value) => sum + value, 0);
    const count = tally.reduce((sum, value, hits) => sum + (matches(hits) ? value : 0), 0);
    status.textContent = n
      ? `Последний опыт: ${last.icons.join(" и ")}. Событие ${matches(last.hits) ? "произошло" : "не произошло"}. Частота: ${count} из ${n} (${(100 * count / n).toLocaleString("ru", {maximumFractionDigits: 1})}%).`
      : "Опытов пока нет.";
  }
  root.querySelectorAll("[data-repeat]").forEach(button => button.addEventListener("click", () => {
    const repetitions = Number(button.dataset.repeat);
    if (!repetitions) {
      tally.fill(0);
      last = undefined;
    }
    for (let i = 0; i < repetitions; i++) {
      let draw = Math.random();
      last = item.outcomes.find(outcome => (draw -= outcome.weight) < 0) ?? item.outcomes.at(-1);
      tally[last.hits]++;
    }
    numbers.innerHTML = (last?.icons ?? ["?", "?"]).map(icon => `<span class="die ${last ? "hit" : ""}" style="font-size:2rem">${icon}</span>`).join("");
    refresh();
  }));
  selector.addEventListener("change", refresh);
  refresh();
}

function errors() {
  const items = [
    ["Как вычитать из единицы", "Для «хотя бы один» противоположное событие — «ни одного». У двух стрелков из опыта P(оба промахнулись) = 0,2 × 0,4 = 0,08. Значит P(хотя бы один попал) = 1 − 0,08 = 0,92."],
    ["«Ровно один» и «хотя бы один»", "«Ровно один» включает два пути: первый попал, второй промахнулся, или наоборот. Получаем 0,8 × 0,4 + 0,2 × 0,6 = 0,44. «Хотя бы один» включает также два попадания."],
    ["Противоположное событие должно включать все оставшиеся исходы", "Противоположность «ровно один попал» — «ноль или два попадания». Поэтому здесь можно вычесть из 1 сразу обе вероятности: 1 − 0,08 − 0,48 = 0,44."],
    ["Двойной подсчёт пересечения", "Для двух кубиков событие «шестёрка на первом или на втором» включает пару (6, 6) только один раз. Из суммы 1/6 + 1/6 вычитаем 1/36, получаем 11/36."],
    ["После выбора без возврата знаменатель меняется", "Из корзины с 3 жёлтыми и 2 синими мячами вероятность двух синих равна 2/5 × 1/4. После первого синего остаются один синий и четыре мяча всего."],
    ["Условие определяет знаменатель", "Если на двух кубиках выпала сумма 8, остаются пять пар. Среди них только (2, 6) и (6, 2) содержат шестёрку. Ответ 2/5."],
    ["У двух кубиков суммы имеют разные вероятности", "Сумма 2 получается одной парой (1, 1), а сумма 7 шестью парами. Равновероятны упорядоченные пары, поэтому знаменатель без дополнительных условий равен 36."]
  ];
  main.innerHTML = heading("Частые ошибки", "Разбор") + '<div class="grid">'
    + items.map(([title, explanation]) => `<article class="card"><h3>${title}</h3><p>${explanation}</p></article>`).join("") + '</div>';
}

function challenge() {
  const problems = [
    ["C", "Три стрелка независимо попадают с вероятностями 0,5, 0,6 и 0,8. Найдите вероятность хотя бы двух попаданий.", 7, 10, "Ровно два: 0,5 × 0,6 × 0,2 + 0,5 × 0,4 × 0,8 + 0,5 × 0,6 × 0,8 = 0,46. Все три: 0,5 × 0,6 × 0,8 = 0,24. Сумма 0,70."],
    ["C", "Два стрелка независимо попадают с вероятностями 0,8 и 0,6. Известно, что произошло хотя бы одно попадание. Какова вероятность, что попали оба?", 12, 23, "P(оба) = 0,48. P(хотя бы один) = 1 − 0,2 × 0,4 = 0,92. Оба попадания входят в условие. Делим 0,48 на 0,92, получаем 12/23."],
    ["C", "Стрелок делает три независимых выстрела с одинаковой вероятностью попадания. Вероятность хотя бы одного попадания равна 0,936. Найдите вероятность попадания за один выстрел.", 3, 5, "Все три промаха имеют вероятность 1 − 0,936 = 0,064. Вероятность одного промаха — кубический корень из 0,064, то есть 0,4. Вероятность попадания равна 0,6."],
    ["C", "В корзине 4 красных и 3 синих мяча. Три мяча выбирают без возврата. Известно, что есть хотя бы один синий. Какова вероятность, что синий ровно один?", 18, 31, "Всего 35 троек, из них 4 полностью красные. Условию отвечают 31 тройка. Ровно один синий: 3 способа выбрать синий и 6 способов выбрать пару красных, итого 18. Ответ 18/31."],
    ["C", "В корзине 5 красных и 4 синих мяча. Выбирают три без возврата. Какова вероятность получить мячи обоих цветов?", 5, 6, "Исключаем все одноцветные тройки. Из 84 троек 10 полностью красных и 4 полностью синих. Искомая вероятность равна 1 − (10 + 4)/84 = 5/6."],
    ["C", "Бросили две честные кости. Известно, что выпала хотя бы одна шестёрка. Какова вероятность, что сумма не меньше 10?", 5, 11, "С шестёркой возможны 11 пар. Подходят (6, 4), (6, 5), (6, 6), (4, 6), (5, 6). Значит вероятность равна 5/11."],
    ["C", "Две честные кости бросили два раза. Какова вероятность, что сумма 7 выпадет хотя бы в одной из двух попыток?", 11, 36, "В одной попытке у суммы 7 шесть исходов из 36. Вероятность дважды не получить сумму 7 равна (5/6)² = 25/36. Вычитаем из единицы и получаем 11/36."]
  ];
  main.innerHTML = heading("Сложные задачи", "Практика", "В этих задачах нужно сочетать несколько правил. Ответ можно ввести дробью, десятичным числом или процентами.")
    + '<div style="margin-top:20px">' + problems.map(taskView).join("") + '</div>';
}

navigate();
