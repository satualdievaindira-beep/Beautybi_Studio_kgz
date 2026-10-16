(function () {
  "use strict";

  var S = window.SALON;
  var $ = function (id) { return document.getElementById(id); };

  var tabsEl = $("tabs");
  var panelEl = $("pricePanel");
  var catSel = $("category");
  var svcSel = $("service");
  var dateEl = $("date");
  var slotsEl = $("slots");
  var nameEl = $("name");
  var commentEl = $("comment");
  var summaryEl = $("summary");

  var state = { catId: S.categories[0].id, time: "" };

  /* ---------- Время по Бишкеку ---------- */
  function bishkekNow() {
    var d = new Date();
    var date = d.toLocaleDateString("en-CA", { timeZone: S.timeZone });
    var parts = d.toLocaleTimeString("en-GB", { timeZone: S.timeZone, hour: "2-digit", minute: "2-digit", hour12: false }).split(":");
    return { date: date, minutes: parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10) };
  }

  function updateStatus() {
    var now = bishkekNow();
    var dot = $("statusDot");
    var text = $("statusText");
    var openMin = S.open * 60;
    var closeMin = S.close * 60;
    if (now.minutes >= openMin && now.minutes < closeMin) {
      dot.className = "dot is-open";
      text.textContent = "Сейчас открыто, работаем до " + S.close + ":00";
    } else {
      dot.className = "dot is-closed";
      text.textContent = "Сейчас закрыто, откроемся в " + S.open + ":00";
    }
  }

  /* ---------- Цены ---------- */
  function getCategory(id) {
    for (var i = 0; i < S.categories.length; i++) {
      if (S.categories[i].id === id) return S.categories[i];
    }
    return S.categories[0];
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function renderTabs() {
    tabsEl.innerHTML = "";
    S.categories.forEach(function (c) {
      var b = el("button", "tab", c.title);
      b.type = "button";
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", String(c.id === state.catId));
      b.addEventListener("click", function () {
        state.catId = c.id;
        renderTabs();
        renderPrices();
      });
      tabsEl.appendChild(b);
    });
  }

  function renderPrices() {
    var cat = getCategory(state.catId);
    panelEl.innerHTML = "";
    cat.groups.forEach(function (g) {
      var box = el("div", "group");
      box.appendChild(el("h3", "", g.name));
      if (g.note) box.appendChild(el("p", "group-note", g.note));
      var ul = el("ul", "price-list");
      g.items.forEach(function (it) {
        var li = document.createElement("li");
        var row = el("button", "price-row");
        row.type = "button";
        row.title = "Выбрать для записи";
        row.appendChild(el("span", "nm", it[0]));
        row.appendChild(el("span", "pr", it[1]));
        if (svcSel.value === it[0] && catSel.value === cat.id) row.classList.add("is-picked");
        row.addEventListener("click", function () { pickService(cat.id, it[0]); });
        li.appendChild(row);
        ul.appendChild(li);
      });
      box.appendChild(ul);
      panelEl.appendChild(box);
    });
  }

  function pickService(catId, serviceName) {
    catSel.value = catId;
    fillServices();
    svcSel.value = serviceName;
    clearError("service");
    renderPrices();
    updateSummary();
    $("booking").scrollIntoView({ behavior: "smooth" });
  }

  /* ---------- Форма: категории и услуги ---------- */
  function fillCategories() {
    S.categories.forEach(function (c) {
      var o = document.createElement("option");
      o.value = c.id;
      o.textContent = c.title;
      catSel.appendChild(o);
    });
  }

  function fillServices() {
    var cat = getCategory(catSel.value);
    svcSel.innerHTML = "";
    var ph = document.createElement("option");
    ph.value = "";
    ph.textContent = "Выберите услугу";
    svcSel.appendChild(ph);
    cat.groups.forEach(function (g) {
      var og = document.createElement("optgroup");
      og.label = g.name;
      g.items.forEach(function (it) {
        var o = document.createElement("option");
        o.value = it[0];
        o.textContent = it[0] + " — " + it[1];
        og.appendChild(o);
      });
      svcSel.appendChild(og);
    });
  }

  function findPrice(catId, serviceName) {
    var cat = getCategory(catId);
    for (var i = 0; i < cat.groups.length; i++) {
      var items = cat.groups[i].items;
      for (var j = 0; j < items.length; j++) {
        if (items[j][0] === serviceName) return items[j][1];
      }
    }
    return "";
  }

  /* ---------- Дата и время ---------- */
  function setupDate() {
    var today = bishkekNow().date;
    dateEl.min = today;
    dateEl.value = today;
  }

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  function renderSlots() {
    var now = bishkekNow();
    var isToday = dateEl.value === now.date;
    slotsEl.innerHTML = "";
    var firstFree = "";
    for (var m = S.open * 60; m <= S.lastStart * 60; m += S.slotMinutes) {
      var label = pad(Math.floor(m / 60)) + ":" + pad(m % 60);
      var past = isToday && m <= now.minutes;
      var wrap = el("label", "slot");
      var input = document.createElement("input");
      input.type = "radio";
      input.name = "time";
      input.value = label;
      input.disabled = past;
      if (!past && !firstFree) firstFree = label;
      if (state.time === label && !past) input.checked = true;
      input.addEventListener("change", function (e) {
        state.time = e.target.value;
        clearError("time");
        updateSummary();
      });
      wrap.appendChild(input);
      wrap.appendChild(el("span", "", label));
      slotsEl.appendChild(wrap);
    }
    if (state.time) {
      var still = slotsEl.querySelector('input[value="' + state.time + '"]');
      if (!still || still.disabled) state.time = "";
    }
  }

  function formatDate(iso) {
    var p = iso.split("-");
    var d = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric", weekday: "long" });
  }

  /* ---------- Ошибки и проверка ---------- */
  function setError(key, msg) {
    var map = { name: "errName", service: "errService", date: "errDate", time: "errTime" };
    var box = $(map[key]);
    box.textContent = msg;
    var field = box.closest(".field");
    if (field) field.classList.add("has-error");
  }

  function clearError(key) {
    var map = { name: "errName", service: "errService", date: "errDate", time: "errTime" };
    var box = $(map[key]);
    box.textContent = "";
    var field = box.closest(".field");
    if (field) field.classList.remove("has-error");
  }

  function validate() {
    var ok = true;
    ["name", "service", "date", "time"].forEach(clearError);
    var now = bishkekNow();

    if (nameEl.value.trim().length < 2) { setError("name", "Напишите, как к вам обращаться."); ok = false; }
    if (!svcSel.value) { setError("service", "Выберите услугу из списка."); ok = false; }
    if (!dateEl.value) { setError("date", "Выберите дату."); ok = false; }
    else if (dateEl.value < now.date) { setError("date", "Эта дата уже прошла. Выберите другую."); ok = false; }
    if (!state.time) { setError("time", "Выберите удобное время."); ok = false; }
    return ok;
  }

  /* ---------- Сообщение и итог ---------- */
  function buildMessage() {
    var price = findPrice(catSel.value, svcSel.value);
    var cat = getCategory(catSel.value);
    var lines = [
      "Здравствуйте! Хочу записаться в " + S.name + ".",
      "",
      "Имя: " + nameEl.value.trim(),
      "Категория: " + cat.title,
      "Услуга: " + svcSel.value + (price ? " (" + price + ")" : ""),
      "Дата: " + formatDate(dateEl.value),
      "Время: " + state.time
    ];
    var c = commentEl.value.trim();
    if (c) lines.push("Комментарий: " + c);
    lines.push("", "Подтвердите, пожалуйста, запись. Спасибо!");
    return lines.join("\n");
  }

  function updateSummary() {
    if (svcSel.value && dateEl.value && state.time) {
      var price = findPrice(catSel.value, svcSel.value);
      summaryEl.classList.add("is-ready");
      summaryEl.innerHTML = "";
      var b = el("b", "", svcSel.value);
      summaryEl.appendChild(b);
      summaryEl.appendChild(document.createTextNode(
        (price ? ", " + price : "") + ". " + formatDate(dateEl.value) + " в " + state.time + "."
      ));
    } else {
      summaryEl.classList.remove("is-ready");
      summaryEl.textContent = "Выберите услугу, дату и время.";
    }
  }

  function submit() {
    if (!validate()) {
      var firstErr = document.querySelector(".has-error");
      if (firstErr) firstErr.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    var url = "https://wa.me/" + S.phone + "?text=" + encodeURIComponent(buildMessage());
    var win = window.open(url, "_blank", "noopener");
    if (!win) window.location.href = url; // если браузер заблокировал новое окно
  }

  /* ---------- Запуск ---------- */
  function init() {
    fillCategories();
    fillServices();
    setupDate();
    renderTabs();
    renderPrices();
    renderSlots();
    updateStatus();
    updateSummary();
    $("year").textContent = new Date().getFullYear();

    catSel.addEventListener("change", function () {
      fillServices();
      clearError("service");
      updateSummary();
      renderPrices();
    });
    svcSel.addEventListener("change", function () {
      clearError("service");
      updateSummary();
      renderPrices();
    });
    dateEl.addEventListener("change", function () {
      clearError("date");
      renderSlots();
      updateSummary();
    });
    nameEl.addEventListener("input", function () { clearError("name"); });
    $("submitBtn").addEventListener("click", submit);

    setInterval(updateStatus, 60000);
  }

  init();
})();
