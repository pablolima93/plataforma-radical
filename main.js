// Plataforma Radical: comportamento da landing page.
document.documentElement.classList.add("js");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Barra do topo: assume a cor do capítulo que está embaixo dela. */
(() => {
  const bar = document.querySelector("[data-bar]");
  const themes = {
    burgundy: ["#3b0a12", "#f4ebe6"],
    paper: ["#f4ebe6", "#3b0a12"],
    red: ["#c8162a", "#f4ebe6"],
    ink: ["#160507", "#f4ebe6"],
  };
  const chapters = [...document.querySelectorAll("[data-chapter]")];
  const update = () => {
    const line = bar.offsetHeight / 2;
    let current = chapters[0];
    for (const c of chapters) {
      const r = c.getBoundingClientRect();
      if (r.top <= line && r.bottom > line) { current = c; break; }
    }
    // No hero, a barra fica sobre a faixa de cima (bordô).
    const [bg, ink] = themes[current.dataset.chapter] || themes.burgundy;
    bar.style.setProperty("--bar-bg", bg);
    bar.style.setProperty("--bar-ink", ink);
  };
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) { requestAnimationFrame(() => { update(); ticking = false; }); ticking = true; }
  }, { passive: true });
  update();
})();

/* Entradas: cada parte de uma seção sobe em sequência quando a seção aparece. */
(() => {
  const items = document.querySelectorAll(".reveal");
  const groups = new Map();
  items.forEach((el) => {
    const section = el.closest("section, footer") || document.body;
    const n = groups.get(section) || 0;
    el.style.setProperty("--i", Math.min(n, 6));
    groups.set(section, n + 1);
  });
  if (!("IntersectionObserver" in window) || reduceMotion) {
    items.forEach((el) => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
  items.forEach((el) => io.observe(el));
  // Garantia: nada fica escondido se o observador falhar.
  setTimeout(() => items.forEach((el) => el.classList.add("in")), 6000);
})();

/* Imagem do hero sobe devagar com a rolagem. */
(() => {
  const shot = document.querySelector("[data-parallax]");
  if (!shot || reduceMotion) return;
  const onScroll = () => {
    const y = Math.min(window.scrollY, window.innerHeight * 1.6);
    shot.style.transform = `translate3d(0, ${-y * 0.12}px, 0)`;
  };
  window.addEventListener("scroll", () => requestAnimationFrame(onScroll), { passive: true });
  onScroll();
})();

/* Simulador de check-in (dados fictícios). */
(() => {
  const input = document.getElementById("ticket");
  const box = document.querySelector("[data-result]");
  if (!input || !box) return;
  const field = (f) => box.querySelector(`[data-f="${f}"]`);
  const tickets = {
    OMJJYIXI: { name: "Lívia Andrade", type: "Acampante", group: "Grupo Vermelho, quarto 12", pay: "Pago no Pix", verdict: "Check-in liberado", state: "ok" },
    K7Q2PZ0B: { name: "Tiago Moreira", type: "Acampante", group: "Grupo Azul, quarto 4", pay: "Aguardando pagamento", verdict: "Pagamento pendente: encaminhe ao caixa", state: "warn" },
    EQP4471C: { name: "Helena Prado", type: "Equipante", group: "Cozinha, Grupo Verde", pay: "Pago no cartão em 3x", verdict: "Check-in liberado, retire o crachá", state: "ok" },
    R9TT31AX: { name: "Samuel Duarte", type: "Acampante", group: "Grupo Amarelo, quarto 7", pay: "Pago no cartão", verdict: "Check-in já feito hoje às 18:42", state: "done" },
  };
  const empty = { name: "—", type: "—", group: "—", pay: "—", verdict: "Código não encontrado. Confira as letras ou busque pelo nome.", state: "none" };
  const buttons = document.querySelectorAll(".ticket-examples button");

  const render = () => {
    const code = input.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (input.value !== code) input.value = code;
    const t = tickets[code] || (code.length < 8 ? { ...empty, verdict: "Digite os 8 caracteres do código." } : empty);
    field("name").textContent = t.name;
    field("type").textContent = t.type;
    field("group").textContent = t.group;
    field("pay").textContent = t.pay;
    const v = field("verdict");
    v.textContent = t.verdict;
    v.dataset.state = t.state;
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.code === code)));
    if (!reduceMotion) { box.classList.remove("flash"); void box.offsetWidth; box.classList.add("flash"); }
  };
  input.addEventListener("input", render);
  buttons.forEach((b) => b.addEventListener("click", () => { input.value = b.dataset.code; render(); }));
  render();
})();

/* Interruptores das organizações. */
document.querySelectorAll(".band .switch").forEach((sw) => {
  sw.addEventListener("click", () => {
    const on = sw.getAttribute("aria-checked") !== "true";
    sw.setAttribute("aria-checked", String(on));
    sw.closest(".band").dataset.on = String(on);
  });
});

/* Módulos do painel: vira abas (lista à esquerda, tela à direita). */
(() => {
  const root = document.querySelector("[data-modules]");
  if (!root) return;
  const list = root.querySelector(".mod-list");
  const panels = [...root.querySelectorAll(".mod")];
  const tabs = panels.map((p, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "mod-tab";
    b.role = "tab";
    b.id = `tab-${p.id}`;
    b.textContent = p.dataset.name;
    b.setAttribute("aria-controls", p.id);
    p.setAttribute("role", "tabpanel");
    p.setAttribute("aria-labelledby", b.id);
    p.tabIndex = 0;
    b.addEventListener("click", () => select(i, false));
    list.appendChild(b);
    return b;
  });
  const select = (i, focus) => {
    tabs.forEach((t, j) => {
      const on = i === j;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      panels[j].classList.toggle("is-active", on);
    });
    if (focus) tabs[i].focus();
    // No celular a lista rola de lado: mantém a aba ativa à vista.
    tabs[i].scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
  };
  list.addEventListener("keydown", (e) => {
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    const next = { ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    select((next + tabs.length) % tabs.length, true);
  });
  root.classList.add("is-tabs");
  tabs.forEach((t) => t.setAttribute("aria-selected", "false"));
  panels[0].classList.add("is-active");
  tabs[0].setAttribute("aria-selected", "true");
  tabs.slice(1).forEach((t) => (t.tabIndex = -1));
  // Imagens dos outros módulos carregam depois, sem pesar na abertura.
  panels.forEach((p) => p.querySelectorAll("img").forEach((img) => (img.loading = "lazy")));
})();
