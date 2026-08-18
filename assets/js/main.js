(function () {
    "use strict";
    const STORAGE_KEY = "bhavya-theme";
    const root = document.documentElement;
    const btn = document.getElementById("themeBtn");

    function getStored() {
        try {
            return localStorage.getItem(STORAGE_KEY);
        } catch (e) {
            return null;
        }
    }

    function setStored(theme) {
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch (e) {
            
        }
    }

    function applyTheme(theme) {
        root.setAttribute("data-theme", theme);
        setStored(theme);
    }

    const initial = getStored() ||
        (window.matchMedia &&
         window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light");
    applyTheme(initial);

    if (btn) {
        btn.addEventListener("click", function () {
            const current = root.getAttribute("data-theme") || "light";
            applyTheme(current === "dark" ? "light" : "dark");
        });
    }

    // ----CLOCK-----
    // Updates every 30-sec
    const clockEl = document.getElementById("clock");
    if (clockEl) {
        const fmt = new Intl.DateTimeFormat("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
            timeZone: "Asia/Kolkata",
        });

        function tick() {
            // time
            const parts = fmt.formatToParts(new Date());
            let h = "", m = "", ap = "";
            for (const p of parts) {
                if (p.type === "hour")   h = p.value;
                if (p.type === "minute") m = p.value;
                if (p.type === "dayPeriod") ap = p.value;
            }
            clockEl.textContent = `${h}:${m} ${ap} IST`;
        }

        tick();
        setInterval(tick, 30 * 1000);
    }

    // -- smooth scrool
    document.addEventListener("click", function (e) {
        const a = e.target.closest('a[href^="#"]');
        if (!a) return;
        const id = a.getAttribute("href").slice(1);
        const target = document.getElementById(id);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    });
})();
