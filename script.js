(function () {
  window.__rv = true; // сигнал для <head>: скрипт загрузился, анимации работают
  var root = document.documentElement;

  // меню на телефоне
  var hdr = document.querySelector('.hdr');
  var burger = document.querySelector('.burger');
  if (hdr && burger) {
    burger.addEventListener('click', function () {
      var open = hdr.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    hdr.querySelectorAll('.nav a').forEach(function (a) {
      a.addEventListener('click', function () { hdr.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); });
    });
  }

  // кнопка «Скопировать» у промокода (и в полоске внизу экрана)
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    var html = btn.innerHTML;
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      var done = function () {
        btn.textContent = 'Скопировано';
        setTimeout(function () { btn.innerHTML = html; }, 1500);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () {});
      }
    });
  });

  // кнопка внизу экрана на телефоне: появляется после первого экрана, прячется у самого низа (чтобы не закрывать подвал)
  var sticky = document.getElementById('sticky-cta');
  if (sticky) {
    var ticking = false;
    var update = function () {
      ticking = false;
      var y = window.pageYOffset || 0;
      var end = y + window.innerHeight > document.documentElement.scrollHeight - 160;
      sticky.classList.toggle('show', y > window.innerHeight * 0.6 && !end);
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  // цель Метрики «клик в казино»: страница и место кнопки уходят параметрами цели
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href^="go.html"]') : null;
    if (!a || !window.ym || !window.__ymId) return;
    var q = new URL(a.href).searchParams;
    try { window.ym(window.__ymId, 'reachGoal', 'go_casino', { page: q.get('p') || '', pos: q.get('b') || '' }); } catch (err) {}
  });

  // плавное появление блоков при прокрутке (список блоков совпадает со style.css)
  var SEL = '.ph-text>*,.hero-in>div>*,.answer,.sec-head,.grid>.card,.steps>li,.tbl-wrap,.faq>details,' +
    '.prose>:not(.tbl-wrap):not(.flags),.flags>li,.rg,.calc,.pc>div,.offer,.bento>div,.wrap>.btns,.wrap>.small,.nf .wrap>*,.ph-art,.hero-art';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!('IntersectionObserver' in window) || reduce) {
    root.classList.add('rv-off');
  } else {
    var finish = function (el) { el.classList.add('rv-done'); el.style.transitionDelay = ''; };
    var io = new IntersectionObserver(function (entries) {
      var shown = entries.filter(function (e) { return e.isIntersecting; }).map(function (e) { return e.target; });
      // по порядку на странице — так соседние блоки появляются «лесенкой»
      shown.sort(function (a, b) { return (a.compareDocumentPosition(b) & 4) ? -1 : 1; });
      shown.forEach(function (el, i) {
        io.unobserve(el);
        var step = Math.min(i, 7) * 0.08;
        el.style.transitionDelay = step + 's';
        el.classList.add('in');
        var t = setTimeout(function () { finish(el); }, 1500 + step * 1000);
        el.addEventListener('transitionend', function h(ev) {
          if (ev.target !== el || ev.propertyName !== 'transform') return;
          clearTimeout(t);
          el.removeEventListener('transitionend', h);
          finish(el);
        });
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });
    document.querySelectorAll(SEL).forEach(function (el) { io.observe(el); });
  }

  // калькулятор вейджера (только на странице бонусов)
  var form = document.getElementById('calc-form');
  if (!form) return;
  function $(id) { return document.getElementById(id); }
  function num(id) {
    var v = parseFloat(String($(id).value).replace(',', '.'));
    return isFinite(v) && v > 0 ? v : 0;
  }
  function rub(n) {
    return (n < -0.5 ? '−' : '') + Math.round(Math.abs(n)).toLocaleString('ru-RU') + ' ₽';
  }
  function run() {
    var bonus = num('c-bonus'), dep = num('c-dep'), wager = num('c-wager');
    var rtp = Math.min(num('c-rtp'), 100) / 100;
    var base = $('c-base').value === 'bd' ? bonus + dep : bonus;
    var turn = base * wager, loss = turn * (1 - rtp), net = bonus - loss;
    $('r-turn').textContent = rub(turn);
    $('r-loss').textContent = rub(loss);
    $('r-net').textContent = rub(net);
    $('r-net').className = net >= 0 ? 'pos' : 'neg';
    var v = $('r-verdict');
    if (!bonus) v.textContent = 'Введите сумму бонуса.';
    else if (!rtp) v.textContent = 'Введите RTP игр, например 96.';
    else if (net >= bonus * 0.5) v.textContent = 'Хорошие условия: в среднем большая часть бонуса остаётся у вас.';
    else if (net >= 0) v.textContent = 'Средние условия: заметную часть бонуса в среднем съест отыгрыш.';
    else v.textContent = 'В среднем отыгрыш съедает весь бонус и часть депозита — выгоднее играть без бонуса.';
  }
  form.addEventListener('input', run);
  form.addEventListener('change', run);
  run();
})();
