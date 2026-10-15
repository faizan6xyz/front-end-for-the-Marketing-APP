document.addEventListener("DOMContentLoaded", async () => {
    // Each nav item is now a real <a href="..."> to its own page, so the
    // browser handles navigation on click. No more show/hide-section JS.
    // The "active" class on the current nav item is set per-page in the HTML.

    const reloginBtn = document.getElementById("relogin-btn");
    if (reloginBtn) {
        reloginBtn.addEventListener("click", () => {
            window.location.href = "dashboard.html";
        });
    }

    // ---- Multi-select dropdowns (Linkedln / Instagram / Whatsapp / Gmail) ----
    document.querySelectorAll(".multi-select").forEach((container) => {
        const trigger = container.querySelector(".multi-select-trigger");
        const label = container.querySelector(".multi-select-label");
        const rangeDropdown = document.querySelector(".contentType");

        function wireBox(optionsBox) {
            if (!optionsBox) return;
            const checkboxes = optionsBox.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach((cb) => {
                cb.addEventListener("change", () => {
                    const selected = Array.from(checkboxes)
                        .filter((c) => c.checked)
                        .map((c) => c.value);
                    label.textContent = selected.length ? selected.join(", ") : "Select metrics";
                });
            });
        }

        if (rangeDropdown) {
            // Instagram page: two option sets, switched by the Post/Story select
            const storyBox = container.querySelector(".multi-select-options");
            const postBox = container.querySelector(".multi-select-options1");

            rangeDropdown.addEventListener("change", () => {
                [storyBox, postBox].forEach((box) => {
                    if (!box) return;
                    box.querySelectorAll('input[type="checkbox"]').forEach((cb) => (cb.checked = false));
                    box.classList.remove("open");
                });
                label.textContent = "Select metrics";
            });

            trigger.addEventListener("click", () => {
                const activeBox = rangeDropdown.value === "story" ? storyBox : postBox;
                activeBox.classList.toggle("open");
            });
            document.addEventListener("click", (e) => {
                if (!container.contains(e.target)) {
                    [storyBox, postBox].forEach((box) => box && box.classList.remove("open"));
                }
            });

            wireBox(storyBox);
            wireBox(postBox);
        } else {
            // Linkedln / Whatsapp / Gmail pages: single option set
            const optionsBox = container.querySelector(".multi-select-options");
            trigger.addEventListener("click", () => {
                optionsBox.classList.toggle("open");
            });
            document.addEventListener("click", (e) => {
                if (!container.contains(e.target)) optionsBox.classList.remove("open");
            });
            wireBox(optionsBox);
        }
    });

    // ---- Live-data hooks (wire these up once the backend routes are ready) ----
    // Each page below has its own container to render into:
    //   instagram.html -> #hello_insta
    //   whatsapp.html   -> #hello_whatsapp
    //   gmail.html      -> #hello_gmail
    // Example for instagram.html:
    //
    // async function checkInstagramConnection() {
    //     const token = localStorage.getItem("authToken");
    //     const account_id = localStorage.getItem("account_id");
    //     if (!account_id) { showInstagramConnectPrompt(); return false; }
    //     const params = new URLSearchParams({ token, account_id });
    //     const res = await fetch(`/instagram/posts?${params.toString()}`);
    //     if (!res.ok) return false;
    //     return res;
    // }
    // if (document.getElementById("hello_insta")) {
    //     checkInstagramConnection().then((res) => res && loadInstaPosts(res));
    // }
});
