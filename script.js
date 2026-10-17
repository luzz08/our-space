const knopka = document.querySelector(".login");
const imena = document.querySelector(".imena");
knopka.addEventListener("click", function () {
  imena.innerHTML =
    '<button class="name">Луиза</button><button class="name">Люся</button>';
  imena.style.display = "flex";
});
