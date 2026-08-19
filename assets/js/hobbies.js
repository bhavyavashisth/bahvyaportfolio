(function () {
    "use strict";

    const bars = document.querySelectorAll(".filter-bar");
    if (!bars.length) return;

    bars.forEach((bar) => {
        const section = bar.closest(".hobby-section");
        if (!section) return;

        const chips = bar.querySelectorAll(".filter-chip");
        const cards = section.querySelectorAll(".game-card");
        const empty = section.querySelector(".empty-state");
        if (!chips.length || !cards.length) return;

        function applyFilter(filter) {
            let shown = 0;

            cards.forEach((card) => {
                // data-tags 
                const tags = (card.dataset.tags || "").split(/\s+/);
                const match = filter === "all" || tags.includes(filter);

                if (match) {
                    card.classList.remove("is-hidden");
                    shown++;
                } else {
                    card.classList.add("is-hidden");
                }
            });

            if (empty) empty.hidden = shown > 0;
        }

        function setActive(target) {
            chips.forEach((c) => c.classList.remove("is-active"));
            target.classList.add("is-active");
        }

        chips.forEach((chip) => {
            chip.addEventListener("click", () => {
                const filter = chip.dataset.filter || "all";
                setActive(chip);
                applyFilter(filter);
            });
        });
    });
})();
