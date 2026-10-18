(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const STORAGE_KEY = "ourSpacePrototypeV1";

  const categories = {
    mood: {
      title: "Настроение",
      options: ["🥰 Счастливое", "🥺 Грустно", "😴 Хочу спать", "😌 Спокойное", "✨ Воодушевлённое", "😟 Тревожно", "😤 Раздражён(а)", "🫥 Не понимаю свои чувства", "🪫 Нет сил", "🫠 Перегружен(а)", "🔋 Полон(а) энергии"]
    },
    feelings: {
      title: "Чувства",
      options: ["💗 Любовь", "🥹 Скучаю по тебе", "🙏 Благодарность", "🦋 Предвкушение", "🤔 Сомнение", "💞 Нежность", "💜 Ревность", "🌙 Ностальгия"]
    },
    emotions: {
      title: "Эмоции",
      options: ["🥰 Радость", "🥺 Грусть", "😌 Умиротворение", "😰 Тревога", "😤 Раздражение", "🤩 Восхищение", "🫶 Воодушевление", "🫥 Растерянность"]
    },
    closeness: {
      title: "Близость",
      options: ["🫂 Обниматься", "🤝 Держаться за руки", "🛋️ Лежать в обнимку", "💋 Целоваться", "🕯️ Устроить свидание", "🌙 Побыть наедине", "😉 Флиртовать", "💞 Чувственные прикосновения", "❤️‍🔥 Интимная близость"]
    },
    energy: {
      title: "Энергия",
      options: ["🔋 Много сил", "🌤️ Нормально", "🪫 Мало сил", "😴 Хочу отдохнуть", "🫠 Перегружен(а)"]
    },
    support: {
      title: "Поддержка",
      options: ["👂 Выслушай меня", "🫂 Обними меня", "💌 Хочу внимания", "🤍 Просто побудь рядом", "🌿 Дай немного пространства", "🎉 Порадуйся со мной"]
    }
  };

  const defaults = {
    person: "Луиза",
    partnerName: "Люся",
    avatars: { "Луиза": "🌷", "Люся": "🪻" },
    status: {
      mood: ["😌 Спокойное"],
      feelings: ["💗 Любовь"],
      emotions: ["💞 Нежность"],
      closeness: ["🫂 Обнимашки"],
      energy: ["🔋 Много сил"],
      support: ["👂 Выслушай меня"]
    },
    notes: {},
    wishlist: [
      { id: 1, text: "Устроить уютный вечер вместе", done: false },
      { id: 2, text: "Сделать друг другу маленький сюрприз", done: false }
    ],
    pet: { emoji: "🐱", name: "Плюша", hunger: 72, happiness: 78, energy: 65 },
    theme: "dark"
  };

  let state = loadState();
  let activeCategory = "mood";
  let selectedOptions = new Set();
  let toastTimer;

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return structuredCloneSafe(defaults);
      const parsed = JSON.parse(saved);
      return {
        ...structuredCloneSafe(defaults),
        ...parsed,
        avatars: { ...defaults.avatars, ...(parsed.avatars || {}) },
        status: { ...defaults.status, ...(parsed.status || {}) },
        notes: parsed.notes || {},
        wishlist: Array.isArray(parsed.wishlist) ? parsed.wishlist : structuredCloneSafe(defaults.wishlist),
        pet: { ...defaults.pet, ...(parsed.pet || {}) }
      };
    } catch {
      return structuredCloneSafe(defaults);
    }
  }

  function structuredCloneSafe(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2300);
  }

  function otherPerson(person) {
    return person === "Луиза" ? "Люся" : "Луиза";
  }

  function enterApp(person) {
    state.person = person;
    state.partnerName = otherPerson(person);
    saveState();
    $("#loginScreen").hidden = true;
    $("#appScreen").hidden = false;
    $("#topName").textContent = state.person;
    $("#topAvatar").textContent = state.avatars[state.person] || "💗";
    $("#profileName").textContent = state.person;
    $("#profileAvatar").textContent = state.avatars[state.person] || "💗";
    $("#partnerTitle").innerHTML = `${escapeHtml(state.partnerName)} <span class="title-heart">♡</span>`;
    $("#partnerAvatar").textContent = state.avatars[state.partnerName] || "💗";
    $("#partnerSubtitle").textContent = `Вот как ${state.partnerName} себя чувствует`;
    renderStatus();
    renderWishlist();
    renderPet();
    showPage("partner");
    try {
      const tg = window.Telegram?.WebApp;
      if (tg) { tg.ready(); tg.expand(); }
    } catch {}
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[char]));
  }

  function showPage(page) {
    $$(".tab-page").forEach(section => {
      const active = section.dataset.page === page;
      section.hidden = !active;
      section.classList.toggle("active", active);
    });
    $$(".nav-item").forEach(button => button.classList.toggle("active", button.dataset.tab === page));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function shortStatus(category) {
    const values = state.status[category] || [];
    return values.length ? values.join(" · ") : "Пока не выбрано";
  }

  function renderStatus() {
    const mappings = {
      mood: ["summary-mood", "detail-mood"],
      feelings: ["summary-feelings", "detail-feelings"],
      emotions: ["summary-emotions", "detail-emotions"],
      closeness: ["summary-closeness", "detail-closeness"],
      support: ["summary-support", "detail-support"]
    };
    Object.entries(mappings).forEach(([category, ids]) => {
      const values = state.status[category] || [];
      const summary = $( "#" + ids[0] );
      const detail = $( "#" + ids[1] );
      if (summary) summary.textContent = values[0] || "Пока не выбрано";
      if (detail) detail.textContent = values.slice(1).join(" · ") || state.notes[category] || "Нажми, чтобы посмотреть";
    });
    const energyValues = state.status.energy || [];
    $("#summary-energy").textContent = energyValues[0] || "Нормально";
    const energyPercent = /мало|нет сил|отдохнуть/i.test(energyValues.join(" ")) ? 25 :
      /много сил|полон|заряж/i.test(energyValues.join(" ")) ? 95 : 65;
    $("#energyFill").style.width = energyPercent + "%";
  }

  function openStatusModal(category) {
    activeCategory = category;
    const data = categories[category];
    if (!data) return;
    selectedOptions = new Set(state.status[category] || []);
    $("#modalTitle").textContent = data.title;
    $("#statusNote").value = state.notes[category] || "";
    $("#statusOptions").innerHTML = data.options.map(option => {
      const selected = selectedOptions.has(option);
      return `<button type="button" class="option-chip ${selected ? "selected" : ""}" aria-pressed="${selected}" data-option="${escapeHtml(option)}">${escapeHtml(option)}</button>`;
    }).join("");
    $("#statusModal").hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeStatusModal() {
    $("#statusModal").hidden = true;
    document.body.style.overflow = "";
  }

  function saveStatus() {
    state.status[activeCategory] = [...selectedOptions];
    state.notes[activeCategory] = $("#statusNote").value.trim();
    saveState();
    renderStatus();
    closeStatusModal();
    showToast("Состояние сохранено 💗");
  }

  function renderWishlist() {
    const container = $("#wishlistItems");
    const count = state.wishlist.length;
    $("#wishCount").textContent = `${count} ${count === 1 ? "желание" : count >= 2 && count <= 4 ? "желания" : "желаний"}`;
    if (!count) {
      container.innerHTML = '<div class="empty-state"><span>💌</span>Здесь пока пусто.<br>Добавьте первое желание, которое хочется исполнить вместе.</div>';
      return;
    }
    container.innerHTML = state.wishlist.map(item => `
      <div class="wish-item ${item.done ? "done" : ""}" data-id="${item.id}">
        <input class="wish-check" type="checkbox" aria-label="Отметить исполненным" ${item.done ? "checked" : ""}>
        <span class="wish-text">${escapeHtml(item.text)}</span>
        <button class="wish-delete" type="button" aria-label="Удалить желание">×</button>
      </div>`).join("");
  }

  function addWish(text) {
    const clean = text.trim();
    if (!clean) { showToast("Напиши желание сначала ✨"); return; }
    state.wishlist.unshift({ id: Date.now(), text: clean, done: false });
    saveState();
    renderWishlist();
    $("#wishlistInput").value = "";
    showToast("Добавлено в ваш вишлист 💌");
  }

  function renderPet() {
    $("#petEmoji").textContent = state.pet.emoji;
    $("#petName").textContent = state.pet.name;
    $("#hungerMeter").style.width = state.pet.hunger + "%";
    $("#happyMeter").style.width = state.pet.happiness + "%";
    $("#petEnergyMeter").style.width = state.pet.energy + "%";
    $("#petCaption").textContent = state.pet.happiness > 80 ? `${state.pet.name} очень счастлива` : `${state.pet.name} рада, что вы рядом`;
  }

  function petAction(action) {
    const pet = state.pet;
    if (action === "feed") {
      pet.hunger = Math.min(100, pet.hunger + 22);
      pet.happiness = Math.min(100, pet.happiness + 5);
      $("#petFeedback").textContent = `${pet.name} с удовольствием съела угощение 🍓`;
    } else if (action === "play") {
      pet.happiness = Math.min(100, pet.happiness + 15);
      pet.energy = Math.max(10, pet.energy - 8);
      pet.hunger = Math.max(10, pet.hunger - 5);
      $("#petFeedback").textContent = `${pet.name} весело поиграла с вами 🎾`;
    } else {
      pet.happiness = Math.min(100, pet.happiness + 10);
      $("#petFeedback").textContent = `${pet.name} мурлычет от объятий 💗`;
    }
    saveState();
    renderPet();
  }

  function changeAvatar() {
    const avatars = ["🌷", "🪻", "🐈", "🦋", "🌙", "🍓", "🩷", "🐻", "⭐", "🪷"];
    const current = state.avatars[state.person] || "🌷";
    const next = avatars[(avatars.indexOf(current) + 1) % avatars.length];
    state.avatars[state.person] = next;
    saveState();
    $("#topAvatar").textContent = next;
    $("#profileAvatar").textContent = next;
    showToast("Аватар обновлён ✨");
  }

  function changePartnerName() {
    const current = state.partnerName;
    const next = window.prompt("Как ты хочешь называть партнёра?", current);
    if (next === null) return;
    const clean = next.trim().slice(0, 32);
    if (!clean) { showToast("Имя не может быть пустым"); return; }
    state.partnerName = clean;
    saveState();
    $("#partnerTitle").innerHTML = `${escapeHtml(clean)} <span class="title-heart">♡</span>`;
    $("#partnerSubtitle").textContent = `Вот как ${clean} себя чувствует`;
    $("#partnerAvatar").textContent = state.avatars[clean] || "💗";
    showToast("Имя обновлено 💗");
  }

  function switchPerson() {
    $("#appScreen").hidden = true;
    $("#loginScreen").hidden = false;
    $("#namePicker").classList.add("open");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  $("#loginButton").addEventListener("click", () => {
    $("#namePicker").classList.toggle("open");
  });

  $$(".name-button").forEach(button => {
    button.addEventListener("click", () => enterApp(button.dataset.person));
  });

  $$(".nav-item").forEach(button => {
    button.addEventListener("click", () => showPage(button.dataset.tab));
  });

  $("#topProfileButton").addEventListener("click", () => showPage("profile"));
  $$(".stat-card").forEach(card => card.addEventListener("click", () => openStatusModal(card.dataset.category)));
  $("#editPartnerStatus").addEventListener("click", () => openStatusModal("mood"));
  $("#closeModal").addEventListener("click", closeStatusModal);
  $("#statusModal").addEventListener("click", event => {
    if (event.target === $("#statusModal")) closeStatusModal();
  });
  $("#statusOptions").addEventListener("click", event => {
    const button = event.target.closest("[data-option]");
    if (!button) return;
    const option = button.dataset.option;
    if (selectedOptions.has(option)) selectedOptions.delete(option);
    else selectedOptions.add(option);
    button.classList.toggle("selected", selectedOptions.has(option));
    button.setAttribute("aria-pressed", String(selectedOptions.has(option)));
  });
  $("#saveStatus").addEventListener("click", saveStatus);

  $("#addWishlist").addEventListener("click", () => addWish($("#wishlistInput").value));
  $("#wishlistInput").addEventListener("keydown", event => {
    if (event.key === "Enter") addWish($("#wishlistInput").value);
  });
  $$(".quick-tags button").forEach(button => button.addEventListener("click", () => addWish(button.dataset.wish)));
  $("#wishlistItems").addEventListener("change", event => {
    if (!event.target.matches(".wish-check")) return;
    const item = state.wishlist.find(wish => wish.id === Number(event.target.closest(".wish-item").dataset.id));
    if (item) { item.done = event.target.checked; saveState(); renderWishlist(); }
  });
  $("#wishlistItems").addEventListener("click", event => {
    const button = event.target.closest(".wish-delete");
    if (!button) return;
    const id = Number(button.closest(".wish-item").dataset.id);
    state.wishlist = state.wishlist.filter(item => item.id !== id);
    saveState(); renderWishlist(); showToast("Желание удалено");
  });

  $("#feedPet").addEventListener("click", () => petAction("feed"));
  $("#playPet").addEventListener("click", () => petAction("play"));
  $("#petButton").addEventListener("click", () => petAction("hug"));
  $("#changeAvatar").addEventListener("click", changeAvatar);
  $("#partnerNameButton").addEventListener("click", changePartnerName);
  $("#myStatusButton").addEventListener("click", () => {
    showPage("partner");
    openStatusModal("mood");
    showToast("В прототипе состояние отображается на этом устройстве");
  });
  $("#themeButton").addEventListener("click", () => showToast("Розово-фиолетовая тема уже включена ✨"));
  $("#switchPerson").addEventListener("click", switchPerson);

  // Initial setup. The welcome screen remains until a name is selected.
  renderWishlist();
  renderPet();
})();