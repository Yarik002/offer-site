/* ===== Оффер — интерактив =====
   ВАЖНО: поменяй BOT_USERNAME на юзернейм своего бота (без @).
   Тогда все кнопки на сайте сразу начнут вести в твой бот. */
const BOT_USERNAME = "OfferCareerBot";
window.OFFER_BOT = BOT_USERNAME;
const BOT_URL = "https://t.me/" + BOT_USERNAME;

document.querySelectorAll("[data-bot]").forEach(function (el) {
  var href = el.getAttribute("href") || "";
  if (href.indexOf("?start=") === -1) el.setAttribute("href", BOT_URL);
  el.setAttribute("target", "_blank");
  el.setAttribute("rel", "noopener");
});

/* мобильное меню */
var burger = document.getElementById("burger");
var mobileMenu = document.getElementById("mobileMenu");
if (burger && mobileMenu) {
  burger.addEventListener("click", function () {
    mobileMenu.classList.toggle("open");
    burger.textContent = mobileMenu.classList.contains("open") ? "✕" : "☰";
  });
  mobileMenu.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () {
      mobileMenu.classList.remove("open");
      burger.textContent = "☰";
    });
  });
}

/* переключатель валюты: BYN / Telegram Stars */
var currency = "byn";
document.querySelectorAll(".pricing-toggle button").forEach(function (btn) {
  btn.addEventListener("click", function () {
    document.querySelectorAll(".pricing-toggle button").forEach(function (b) {
      b.classList.remove("active");
    });
    btn.classList.add("active");
    currency = btn.dataset.currency;
    document.querySelectorAll(".plan").forEach(function (plan) {
      var priceEl = plan.querySelector("[data-byn]");
      var curEl = plan.querySelector("[data-cur]");
      if (priceEl) {
        priceEl.textContent = currency === "byn" ? priceEl.dataset.byn : priceEl.dataset.stars;
      } else {
        var zero = plan.querySelector("[data-price]");
        if (zero) zero.textContent = "0";
      }
      if (curEl) curEl.textContent = currency === "byn" ? "BYN" : "⭐";
    });
  });
});

/* плавное появление блоков */
if ("IntersectionObserver" in window) {
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach(function (el) { observer.observe(el); });
} else {
  document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
}

/* скролл к якорю с учётом шапки */
document.querySelectorAll('a[href^="#"]').forEach(function (a) {
  a.addEventListener("click", function (e) {
    var id = a.getAttribute("href");
    if (id.length < 2) return;
    var target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    var top = target.getBoundingClientRect().top + window.pageYOffset - 80;
    window.scrollTo({ top: top, behavior: "smooth" });
  });
});

/* ===== Статус бота ===== */
(function () {
  var el = document.getElementById("botStatus");
  if (!el) return;
  var URL = "https://gist.githubusercontent.com/Yarik002/85c4a3ec47e008982cb1cb5d15206caf/raw/offer-status.json";
  function upd() {
    fetch(URL + "?t=" + Date.now(), { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("http"); return r.json(); })
      .then(function (d) {
        if (d.online) {
          el.textContent = "🟢 Бот в облаке Telegram";
          el.className = "bot-status online";
        } else {
          el.textContent = "🟡 Бот на профилактике — сайт работает";
          el.className = "bot-status offline";
        }
      })
      .catch(function () {
        el.textContent = "🤖 Бот в облаке Telegram — сайт работает";
        el.className = "bot-status online";
      });
  }
  upd();
  setInterval(upd, 60000);
})();

/* ===== «Выбрать» тариф → где оформить: Telegram или сайт ===== */
(function () {
  var sheet = document.getElementById("chooseSheet");
  if (!sheet) return;
  var PLANS = { start: ["Старт", "15 BYN"], base: ["Базовый", "39 BYN"], pro: ["Про", "79 BYN"], vip: ["VIP", "149 BYN"] };
  var lastFocus = null;
  function open(plan) {
    var p = PLANS[plan] || PLANS.base;
    document.getElementById("sheetPlan").textContent = "Пакет «" + p[0] + "» · " + p[1];
    document.getElementById("sheetTg").href = BOT_URL + "?start=buy_" + plan;
    document.getElementById("sheetSite").href = "order.html?plan=" + plan;
    lastFocus = document.activeElement;
    sheet.classList.add("open");
    sheet.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    setTimeout(function () { try { document.getElementById("sheetTg").focus(); } catch (e) {} }, 50);
  }
  function close() {
    sheet.classList.remove("open");
    sheet.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocus) { try { lastFocus.focus(); } catch (e) {} }
  }
  document.querySelectorAll("[data-choose]").forEach(function (btn) {
    btn.addEventListener("click", function (e) { e.preventDefault(); open(btn.getAttribute("data-choose")); });
  });
  sheet.addEventListener("click", function (e) { if (e.target === sheet || e.target.closest("[data-sheet-close]")) close(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && sheet.classList.contains("open")) close(); });
  sheet.querySelectorAll(".sheet-option").forEach(function (a) { a.addEventListener("click", function () { setTimeout(close, 80); }); });
})();
