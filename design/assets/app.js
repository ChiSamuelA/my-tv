document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".app-header");
  const updateHeader = () => header?.classList.toggle("scrolled", window.scrollY > 12);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  document.querySelectorAll("[data-rail]").forEach((rail) => {
    const wrap = rail.closest(".rail-wrap");
    wrap?.querySelector("[data-next]")?.addEventListener("click", () => {
      rail.scrollBy({ left: rail.clientWidth * 0.82, behavior: "smooth" });
    });
    wrap?.querySelector("[data-prev]")?.addEventListener("click", () => {
      rail.scrollBy({ left: -rail.clientWidth * 0.82, behavior: "smooth" });
    });
    rail.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      const items = [...rail.querySelectorAll(".channel-card")];
      const current = items.indexOf(document.activeElement);
      if (current < 0) return;
      const next = event.key === "ArrowRight" ? current + 1 : current - 1;
      if (items[next]) {
        event.preventDefault();
        items[next].focus();
        items[next].scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" });
      }
    });
  });

  document.querySelectorAll("[data-chip-group]").forEach((group) => {
    group.addEventListener("click", (event) => {
      const chip = event.target.closest(".chip, .category-pill");
      if (!chip) return;
      group.querySelectorAll(".active").forEach((item) => item.classList.remove("active"));
      chip.classList.add("active");
    });
  });

  document.querySelectorAll("[data-clear-filters]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-chip-group]").forEach((group) => {
        group.querySelectorAll(".active").forEach((item) => item.classList.remove("active"));
        group.querySelector(".chip, .category-pill")?.classList.add("active");
      });
    });
  });

  document.querySelectorAll("[data-source]").forEach((source) => {
    source.addEventListener("click", () => {
      document.querySelectorAll("[data-source]").forEach((item) => item.classList.remove("active"));
      source.classList.add("active");
    });
  });

  document.querySelectorAll("[data-clear-input]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = button.closest(".search-box")?.querySelector("input");
      if (input) { input.value = ""; input.focus(); }
    });
  });
});
