/* ===== Оформление заказа на сайте «Оффер» ===== */
(function () {
  "use strict";

  var BOT = (window.OFFER_BOT || "OfferCareerBot");
  var TG = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;
  function inTelegram() { return !!(TG && TG.initData && TG.initData.length > 0); }
  var SITE = "https://yarik002.github.io/offer-site";
  var OWNER = "usernaaamer";
  var CARD = { bank: "МТБ", number: "4649 9012 2111 2160", holder: "Кирдун Ярослав" };
  var ERIP = { account: "BY90MTBK30140008999902269467", bank: "МТБ", holder: "Кирдун Ярослав" };

  var PLANS = {
    free: { title: "Бесплатный аудит", byn: 0, stars: 0, desc: "10 правок резюме, 5 вакансий, 1 письмо · 24 часа" },
    base: { title: "Базовый", byn: 39, stars: 250, desc: "20 живых вакансий, 2 версии резюме, 3 письма · 2 дня" },
    pro: { title: "Про", byn: 79, stars: 450, desc: "40 живых вакансий + 30 откликов, подготовка к интервью · 3–4 дня" },
    vip: { title: "VIP", byn: 149, stars: 800, desc: "60 живых вакансий + 2 недели сопровождения · 14 дней" }
  };

  var state = {
    step: 1,
    plan: "base",
    pay: "card",
    name: "",
    contact: "",
    role: "",
    exp: "",
    comment: "",
    order: null
  };

  function $(sel) { return document.querySelector(sel); }
  function $all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function money(n) { return String(n) + " BYN"; }
  function pad(n) { return (n < 10 ? "0" : "") + n; }

  function newOrderId() {
    var d = new Date();
    var rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
    return "OF-" + pad(d.getDate()) + pad(d.getMonth() + 1) + "-" + pad(d.getHours()) + pad(d.getMinutes()) + "-" + rnd;
  }

  function save() {
    try { localStorage.setItem("offer_order_draft", JSON.stringify(state)); } catch (e) {}
  }
  function load() {
    try {
      var raw = localStorage.getItem("offer_order_draft");
      if (!raw) return;
      var s = JSON.parse(raw);
      if (s && s.plan) { state = Object.assign(state, s); state.order = null; }
    } catch (e) {}
  }

  function renderPlans() {
    $all(".plan-option").forEach(function (el) {
      el.classList.toggle("selected", el.dataset.plan === state.plan);
      var radio = el.querySelector("input");
      if (radio) radio.checked = el.dataset.plan === state.plan;
    });
    var p = PLANS[state.plan];
    $("#sumPlan").textContent = p.title;
    $("#sumPrice").textContent = p.byn === 0 ? "бесплатно" : money(p.byn);
    $("#sumStars").textContent = p.stars ? p.stars + " ⭐" : "—";
    $("#sumDesc").textContent = p.desc;
    var total = $("#sumTotal");
    if (total) total.textContent = p.byn === 0 ? "0 BYN" : money(p.byn);
    var starsOption = document.querySelector('.pay-method[data-pay="stars"]');
    if (starsOption) starsOption.style.display = p.byn === 0 ? "none" : "";
    if (p.byn === 0 && state.pay === "stars") state.pay = "card";
    renderPayMethods();
  }

  function renderPayMethods() {
    $all(".pay-method").forEach(function (el) {
      el.classList.toggle("selected", el.dataset.pay === state.pay);
      var radio = el.querySelector("input");
      if (radio) radio.checked = el.dataset.pay === state.pay;
    });
    renderPayDetails();
  }

  function renderPayDetails() {
    var box = $("#payDetails");
    if (!box) return;
    var p = PLANS[state.plan];
    var html = "";
    if (p.byn === 0 && state.pay !== "stars") {
      html = '<h3>Бесплатный разбор — оплата не нужна</h3>' +
        '<div class="steps-mini">Оставь заявку — я разберу резюме и пришлю отчёт в течение 24 часов. ' +
        'Резюме можно приложить в Telegram после отправки заявки.</div>';
    } else if (state.pay === "card") {
      html = '<h3>💳 Реквизиты для перевода</h3>' +
        row("Банк", CARD.bank, false) +
        row("Номер карты", CARD.number, true) +
        row("Получатель", CARD.holder, false) +
        row("Сумма", money(p.byn), false) +
        row("Комментарий", "ОФФЕР-" + (state.order ? state.order.id : "…"), true) +
        '<div class="steps-mini">Нажми «Копировать» у номера карты. Переведи <b>ровно ' + p.byn + ' BYN одним платежом</b> и укажи комментарий. ' +
        'После оплаты пришли скриншот в Telegram.</div>';
    } else if (state.pay === "erip") {
      html = '<h3>🧾 Оплата через ЕРИП</h3>' +
        row("Счёт ЕРИП", ERIP.account, true) +
        row("Банк", ERIP.bank, false) +
        row("Получатель", ERIP.holder, false) +
        row("Сумма", money(p.byn), false) +
        row("Комментарий", "ОФФЕР-" + (state.order ? state.order.id : "…"), true) +
        '<div class="steps-mini">1) Приложение банка → Платежи → Система расчётов (ЕРИП). 2) Вставь счёт. ' +
        '3) Сумма ровно ' + p.byn + ' BYN. 4) Пришли скриншот в Telegram.</div>';
    } else {
      html = '<h3>⭐ Оплата Telegram Stars</h3>' +
        '<div class="steps-mini">Оплата проходит прямо в Telegram за пару секунд: ' +
        '<b>' + p.stars + ' ⭐</b>. После оплаты бот автоматически пришлёт отчёт (1–3 минуты). ' +
        'Нажми кнопку ниже — откроется бот со счётом.</div>';
    }
    box.innerHTML = html;
    box.classList.add("show");
    bindCopy();
    updateSummaryComment();
  }

  function row(label, value, copy) {
    return '<div class="detail-row"><span>' + label + '</span><span class="val">' + value +
      (copy ? ' <button class="copy-btn" data-copy="' + value.replace(/"/g, "&quot;") + '">Копировать</button>' : '') +
      '</span></div>';
  }

  function bindCopy() {
    $all("[data-copy]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var text = btn.getAttribute("data-copy");
        copyText(text, btn);
      });
    });
  }

  function copyText(text, btn) {
    function done() {
      if (btn) { var old = btn.textContent; btn.textContent = "✅ Скопировано"; setTimeout(function () { btn.textContent = old; }, 1600); }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () { fallback(text, done); });
    } else { fallback(text, done); }
  }
  function fallback(text, done) {
    var ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); done(); } catch (e) { alert("Скопируй вручную: " + text); }
    document.body.removeChild(ta);
  }

  function updateSummaryComment() {
    var el = $("#sumComment");
    if (!el) return;
    el.textContent = state.order ? state.order.id : "создастся при отправке";
  }

  function applyStateToForm() {
    $("#fName").value = state.name || "";
    $("#fContact").value = state.contact || "";
    $("#fRole").value = state.role || "";
    $("#fExp").value = state.exp || "";
    $("#fComment").value = state.comment || "";
  }

  function readForm() {
    state.name = $("#fName").value.trim();
    state.contact = $("#fContact").value.trim();
    state.role = $("#fRole").value.trim();
    state.exp = $("#fExp").value;
    state.comment = $("#fComment").value.trim();
  }

  function validateStep2() {
    readForm();
    if (state.name.length < 2) { alert("Напиши имя (минимум 2 символа)"); return false; }
    if (state.contact.length < 4) { alert("Оставь контакт: Telegram, телефон или email"); return false; }
    if (state.role.length < 2) { alert("Напиши, какую роль ищешь (например: Junior Python Backend)"); return false; }
    return true;
  }

  function go(step) {
    if (step === 2 && state.step === 1) { /* ok */ }
    state.step = step;
    save();
    $all(".step-panel").forEach(function (el, i) {
      el.classList.toggle("active", i + 1 === step);
    });
    $all(".progress .pstep").forEach(function (el, i) {
      el.classList.toggle("active", i + 1 === step);
      el.classList.toggle("done", i + 1 < step);
    });
    if (step === 3) {
      renderPayMethods();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function buildOrderText() {
    var p = PLANS[state.plan];
    var id = state.order ? state.order.id : "—";
    var lines = [
      "ЗАЯВКА НА СЕРВИС «ОФФЕР»",
      "Номер: " + id,
      "Пакет: " + p.title + " (" + (p.byn === 0 ? "бесплатно" : p.byn + " BYN") + ")",
      "Оплата: " + (state.pay === "card" ? "Карта МТБ" : state.pay === "erip" ? "ЕРИП" : "Telegram Stars"),
      "Имя: " + state.name,
      "Контакт: " + state.contact,
      "Цель: " + state.role,
      "Опыт: " + (state.exp || "—"),
      "Комментарий: " + (state.comment || "—"),
      "",
      "Резюме пришлю следом в Telegram.",
      "Сайт: " + SITE,
      "Бот: https://t.me/" + BOT
    ];
    return lines.join("\n");
  }

  function submitOrder() {
    readForm();
    if (state.step === 2 && !validateStep2()) return;
    if (!state.order) {
      state.order = { id: newOrderId(), createdAt: new Date().toISOString() };
    }
    save();
    var p = PLANS[state.plan];
    $("#orderIdLabel").textContent = state.order.id;
    $("#successText").innerHTML = "Заявка <span class='order-id'>" + state.order.id + "</span> создана. " +
      "Пакет: <b>" + p.title + "</b>, сумма: <b>" + (p.byn === 0 ? "0 BYN" : money(p.byn)) + "</b>.";
    if (state.pay === "stars" && p.stars > 0) {
      $("#starsWrap").style.display = "block";
      $("#starsBtn").href = "https://t.me/" + BOT + "?start=site_" + state.order.id;
    } else {
      $("#starsWrap").style.display = "none";
    }
    renderSuccessPayment();
    var mailBtn = $("#emailOrderBtn");
    if (mailBtn) mailBtn.href = "mailto:erder101@gmail.com?subject=" + encodeURIComponent("Заявка " + state.order.id + " — Оффер") + "&body=" + encodeURIComponent(buildOrderText());
    var botBtn = $("#openBotBtn");
    if (botBtn) botBtn.href = "https://t.me/" + BOT + "?start=site_" + state.order.id;
    if (inTelegram()) {
      try {
        TG.sendData(JSON.stringify({
          order_id: state.order.id,
          plan: state.plan,
          pay: state.pay,
          name: state.name,
          contact: state.contact,
          role: state.role,
          exp: document.getElementById("fExp") ? document.getElementById("fExp").value : "",
          comment: state.comment
        }));
        $("#successText").innerHTML = "Заявка <span class='order-id'>" + state.order.id + "</span> отправлена в бота ✅ " +
          "Вернись в чат — бот попросит резюме и продолжит оформление.";
        var tgHint = $("#tgHint"); if (tgHint) tgHint.style.display = "none";
        setTimeout(function () { try { TG.close(); } catch (e) {} }, 2800);
      } catch (e) {}
    }
    $("#successPanel").classList.add("show");
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  function renderSuccessPayment() {
    var box = document.getElementById("successPay");
    if (!box) return;
    var p = PLANS[state.plan];
    var html = "";
    if (p.byn === 0) {
      html = '<div class="success-pay-title">🎁 Бесплатный разбор</div>' +
        '<div class="hint">Оплата не нужна. Отправь заявку на email или в Telegram — я свяжусь и попрошу резюме.</div>';
    } else if (state.pay === "card") {
      html = '<div class="success-pay-title">💳 Оплата на сайте — реквизиты</div>' +
        row("Банк", CARD.bank, false) +
        row("Номер карты", CARD.number, true) +
        row("Сумма", money(p.byn), false) +
        row("Комментарий", "ОФФЕР-" + (state.order ? state.order.id : "…"), true) +
        '<div class="hint">Переведи <b>ровно ' + p.byn + ' BYN одним платежом</b>. После оплаты отправь заявку на email — я проверю поступление и начну работу.</div>';
    } else if (state.pay === "erip") {
      html = '<div class="success-pay-title">🧾 Оплата через ЕРИП — реквизиты</div>' +
        row("Счёт ЕРИП", ERIP.account, true) +
        row("Банк", ERIP.bank, false) +
        row("Получатель", ERIP.holder, false) +
        row("Сумма", money(p.byn), false) +
        row("Комментарий", "ОФФЕР-" + (state.order ? state.order.id : "…"), true) +
        '<div class="hint">Оплати ровно ' + p.byn + ' BYN и отправь заявку на email.</div>';
    } else {
      html = '<div class="success-pay-title">⭐ Telegram Stars</div>' +
        '<div class="hint">Stars доступны в боте: нажми «Оплатить Stars» — после оплаты отчёт придёт автоматически.</div>';
    }
    box.innerHTML = html;
    box.classList.add("show");
    bindCopy();
  }

  function notifyByEmail() {
    try {
      var p = PLANS[state.plan];
      var payload = {
        _subject: "Новая заявка " + (state.order ? state.order.id : "") + " — Оффер",
        _template: "table",
        _captcha: "false",
        "Номер заявки": state.order ? state.order.id : "",
        "Пакет": p.title,
        "Сумма": (p.byn === 0 ? "0 BYN" : p.byn + " BYN"),
        "Способ оплаты": state.pay === "card" ? "Карта МТБ" : state.pay === "erip" ? "ЕРИП" : "Telegram Stars",
        "Имя": state.name,
        "Контакт": state.contact,
        "Цель": state.role,
        "Опыт": state.exp || "",
        "Комментарий": state.comment || ""
      };
      fetch("https://formsubmit.co/ajax/erder101@gmail.com", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload)
      }).catch(function () {});
    } catch (e) {}
  }

  function openTelegram() {
    var text = buildOrderText();
    var share = "https://t.me/share/url?url=" + encodeURIComponent(SITE + "/order.html") + "&text=" + encodeURIComponent(text);
    window.open(share, "_blank", "noopener");
  }
  function copyOrder() {
    copyText(buildOrderText(), $("#copyOrderBtn"));
  }
  function downloadOrder() {
    var blob = new Blob([buildOrderText()], { type: "text/plain;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "offer-order-" + (state.order ? state.order.id : "draft") + ".txt";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }

  function emailSubject() {
    var id = state.order ? state.order.id : "draft";
    return "Заявка " + id + " — сервис «Оффер»";
  }
  function buildEmailText() {
    var base = buildOrderText();
    if (state.emailMode === "paid") {
      var p = PLANS[state.plan];
      return "ПОДТВЕРЖДЕНИЕ ОПЛАТЫ\n\n" + base + "\n\nОПЛАТА: " +
        (p.byn === 0 ? "бесплатно" : p.byn + " BYN") + " — переведено на карту/ЕРИП.\n" +
        "Реквизиты/номер операции: (добавь при необходимости)";
    }
    return base;
  }
  function openEmailModal(mode) {
    state.emailMode = mode || "order";
    var modal = document.getElementById("emailModal");
    if (!modal) return;
    var subject = state.emailMode === "paid"
      ? "Подтверждение оплаты " + (state.order ? state.order.id : "") + " — Оффер"
      : emailSubject();
    var body = buildEmailText();
    var title = document.getElementById("emailTitle");
    if (title) title.textContent = state.emailMode === "paid"
      ? "✅ Отправить подтверждение оплаты" : "📧 Отправить заявку на email";
    var num = document.getElementById("emailOrderNum");
    if (num) num.textContent = state.order ? state.order.id : "черновик";
    var gmail = document.getElementById("emailGmail");
    if (gmail) gmail.href = "https://mail.google.com/mail/?view=cm&fs=1&to=erder101@gmail.com&su=" +
      encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeEmailModal() {
    var modal = document.getElementById("emailModal");
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
  function bindEmailModal() {
    var modal = document.getElementById("emailModal");
    if (!modal) return;
    var close = document.getElementById("emailClose");
    if (close) close.addEventListener("click", closeEmailModal);
    modal.addEventListener("click", function (e) { if (e.target === modal) closeEmailModal(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeEmailModal(); });
    var copy = document.getElementById("emailCopy");
    if (copy) copy.addEventListener("click", function () { copyText(buildEmailText(), copy); });
  }

  function bind() {
    $all(".plan-option").forEach(function (el) {
      el.addEventListener("click", function () {
        state.plan = el.dataset.plan;
        if (state.plan === "free" && state.pay === "stars") state.pay = "card";
        renderPlans();
        save();
      });
    });
    $all(".pay-method").forEach(function (el) {
      el.addEventListener("click", function () {
        state.pay = el.dataset.pay;
        renderPayMethods();
        save();
      });
    });
    var next1 = $("#next1"), next2 = $("#next2");
    if (next1) next1.addEventListener("click", function () { go(2); });
    if (next2) next2.addEventListener("click", function () { if (validateStep2()) go(3); });
    $all("[data-back]").forEach(function (b) {
      b.addEventListener("click", function () { go(parseInt(b.dataset.back, 10)); });
    });
    var submit = $("#submitOrder");
    if (submit) submit.addEventListener("click", submitOrder);
    var copyBtn = $("#copyOrderBtn");
    if (copyBtn) copyBtn.addEventListener("click", copyOrder);
    var tgBtn = $("#sendTgBtn");
    if (tgBtn) tgBtn.addEventListener("click", function () {
      if (inTelegram()) {
        if (!state.order) { alert("Сначала оформи заявку"); return; }
        try {
          TG.sendData(JSON.stringify({
            order_id: state.order.id, plan: state.plan, pay: state.pay,
            name: state.name, contact: state.contact, role: state.role,
            exp: document.getElementById("fExp") ? document.getElementById("fExp").value : "",
            comment: state.comment
          }));
          $("#successText").textContent = "Заявка отправлена в бота ✅ Вернись в чат.";
          $("#successPanel").classList.add("show");
        } catch (e) {}
      } else { openTelegram(); }
    });
    var emailBtn = $("#emailOrderBtn");
    if (emailBtn) emailBtn.addEventListener("click", function (e) {
      e.preventDefault();
      openEmailModal("order");
    });
    var paidEmailBtn = $("#paidEmailBtn");
    if (paidEmailBtn) paidEmailBtn.addEventListener("click", function (e) {
      e.preventDefault();
      openEmailModal("paid");
    });
    bindEmailModal();
    var dlBtn = $("#downloadOrderBtn");
    if (dlBtn) dlBtn.addEventListener("click", downloadOrder);
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (inTelegram()) {
      try { TG.ready(); TG.expand(); } catch (e) {}
      var tgHint2 = $("#tgHint"); if (tgHint2) tgHint2.style.display = "none";
      var sendBtn = $("#sendTgBtn"); if (sendBtn) sendBtn.textContent = "📤 Отправить заявку в бота";
    }
    load();
    renderPlans();
    applyStateToForm();
    bind();
    updateSummaryComment();
    // если пришли с параметром plan=... или pay=...
    try {
      var params = new URLSearchParams(location.search);
      if (params.get("plan") && PLANS[params.get("plan")]) { state.plan = params.get("plan"); }
      if (params.get("pay") === "stars") state.pay = "stars";
      renderPlans(); renderPayMethods();
    } catch (e) {}
  });
})();
