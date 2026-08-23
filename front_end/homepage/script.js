// async function getUserDetails() {
//     const token = localStorage.getItem("authToken");
//     if (!token) {
//         window.location.href = "http://127.0.0.1:5501/front_end/login/login.html";
//         return false;
//     }
//     try {
//         const response = await fetch("backend_user_check_url", {
//             method: "GET",
//             headers: {
//                 "Content-Type": "application/json",
//                 "Authorization": `Bearer ${token}`
//             }
//         });
//         if (!response.ok) {
//             if (response.status === 401) {
//                 console.error("Token invalid or expired");
//             }
//             localStorage.removeItem("authToken");
//             window.location.href = "http://127.0.0.1:5501/front_end/login/login.html";
//             return false;
//         }
//         const data = await response.json();
//         if (data.status) {
//             return true;
//         }

//         window.location.href = "http://127.0.0.1:5501/front_end/login/login.html";
//         return false;
//     } catch (err) {
//         console.error("Request failed:", err);
//         window.location.href = "http://127.0.0.1:5501/front_end/login/login.html";
//         return false;
//     }
// }

document.addEventListener("DOMContentLoaded", async () => {
    // const isAuthed = await getUserDetails();
    // if (!isAuthed) return; 

    const navItems = document.querySelectorAll(".nav-item[data-target]");
    const pages = document.querySelectorAll(".page");
    const pageTitle = document.getElementById("page-title");
    const titles = {
        dashboard: "Dashboard",
        campaign: "Campaign",
        instagram: "Instagram",
        whatsapp: "Whatsapp",
        gmail: "Gmail",
        create: "Create", settings: "Settings",
        logout: "Log-out",
    };

    function showPage(target) {
        pages.forEach((page) => {
            page.classList.toggle("active", page.id === `page-${target}`);
        }); 

        navItems.forEach((item) => {
            item.classList.toggle("active", item.dataset.target === target);
        }); 

        if (pageTitle && titles[target]) {
            pageTitle.textContent = titles[target];
        } 

        history.replaceState(null, "", `#${target}`); 
    }
    // async function checkInstagramConnection() {
    //     const token = localStorage.getItem("authToken");
    //     const account_id = localStorage.getItem("account_id");
    //     try {
    //         const accountId = window.currentAccountId || "";
    //         const params = new URLSearchParams({
    //             token: token, account_id: account_id
    //         });

    //         const response = await fetch(`/instagram/posts?${params.toString()}`);

    //         if (response.status === 400) {
    //             window.location.href = "/auth/instagram/login";
    //             return false;
    //         }
    //         if (!response.ok) {
    //             console.error("Instagram check failed:", response.status);
    //             return false;
    //         }
    //         return true;
    //     } catch (error) {
    //         console.error("Network error checking Instagram:", error);
    //         return false;
    //     }
    // }

    navItems.forEach((item) => {
        item.addEventListener("click", async () => {
            const target = item.dataset.target;

            // if (target === "instagram") {
            //     const ok = await checkInstagramConnection();
            //     if (!ok) return; 
            // }
            showPage(target);
        });
    });

    const initial = window.location.hash.replace("#", "");
    if (initial && titles[initial]) {
        showPage(initial); 
    }

    const reloginBtn = document.getElementById("relogin-btn");
    if (reloginBtn) {
        reloginBtn.addEventListener("click", () => showPage("dashboard"));
    }

    const container = document.getElementById("rangeSelect");
    if (container) {
        const trigger = container.querySelector(".multi-select-trigger");
        const optionsBox = container.querySelector(".multi-select-options");
        const label = container.querySelector(".multi-select-label");
        const checkboxes = container.querySelectorAll('input[type="checkbox"]');

        trigger.addEventListener("click", () => {
            optionsBox.classList.toggle("open");
        });

        document.addEventListener("click", (e) => {
            if (!container.contains(e.target)) optionsBox.classList.remove("open");
        });

        checkboxes.forEach((cb) => {
            cb.addEventListener("change", () => {
                const selected = Array.from(checkboxes)
                    .filter((c) => c.checked)
                    .map((c) => c.value);
                label.textContent = selected.length
                    ? selected.join(", ")
                    : "Select metrics";
            });
        });
    }
});



async function loadInstaPosts() {
  const container = document.getElementById('hello_insta');
  container.innerHTML = '<p>Loading posts…</p>';

  try {
    const res = await fetch('/api/instagram/media');
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    const posts = await res.json();
    container.innerHTML = '';
    posts.forEach(post => {
      const card = document.createElement('div');
      card.className = 'insta-card';

      const img = document.createElement('img');
      img.src = post.thumbnail_url || post.media_url;
      img.alt = post.caption ? post.caption.slice(0, 60) : 'Instagram post';
      img.loading = 'lazy';

      const body = document.createElement('div');
      body.className = 'body';

      const caption = document.createElement('p');
      caption.className = 'caption';
      caption.textContent = post.caption || '';

      const stats = document.createElement('div');
      stats.className = 'stats';
      stats.innerHTML = `
        <span><span class="label">♥</span> ${post.like_count ?? 0}</span>
        <span><span class="label">💬</span> ${post.comments_count ?? 0}</span>
      `;
      body.appendChild(caption);
      body.appendChild(stats);
      card.appendChild(img);
      card.appendChild(body);
      container.appendChild(card);
    });
    if (posts.length === 0) {
      container.innerHTML = '<p>No posts found.</p>';
    }
  } catch (err) {
    container.innerHTML = `<p style="color:#c0392b;">Failed to load posts: ${err.message}</p>`;
    console.error(err);
  }
}
loadInstaPosts();





// // <button data-endpoint="/api/data1" data-id="btn1">Data 1</button>
// // <button data-endpoint="/api/data2" data-id="btn2">Data 2</button>
// // <button data-endpoint="/api/data3" data-id="btn3">Data 3</button>
// // <button data-endpoint="/api/data4" data-id="btn4">Data 4</button>

// // <div id="output"></div>

// const CACHE_DURATION = 60 * 1000; // 1 minute in ms
// // Store cache + last fetch time per button
// const cache = {
//   btn1: { data: null, lastFetched: 0 },
//   btn2: { data: null, lastFetched: 0 },
//   btn3: { data: null, lastFetched: 0 },
//   btn4: { data: null, lastFetched: 0 },
// };

// async function handleButtonClick(btnId, endpoint) {
//   const now = Date.now();
//   const entry = cache[btnId];
//   const container = document.getElementById('output');
//   const isFresh = entry.data && (now - entry.lastFetched < CACHE_DURATION);
//   if (isFresh) {
//     console.log(`${btnId}: using cached data`);
//     displayData(entry.data);
//     return; }
//   container.innerHTML = '<p>Loading...</p>';
//   try {
//     const response = await fetch(endpoint);
//     if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
//     const data = await response.json();
//     // Update this button's cache
//     entry.data = data;
//     entry.lastFetched = now;
//     displayData(data);
//   } catch (error) {
//     console.error(`Failed to fetch ${btnId}:`, error);
//     container.innerHTML = '<p>Failed to load data.</p>';
//   }}
// function displayData(data) {
//   const container = document.getElementById('output');
//   container.innerHTML = '';
//   data.forEach(item => {
//     const el = document.createElement('div');
//     el.innerHTML = `<h3>${item.title}</h3><p>${item.description}</p>`;
//     container.appendChild(el);
//   });}
// // Wire up all buttons automatically
// document.querySelectorAll('[data-endpoint]').forEach(btn => {
//   btn.addEventListener('click', () => {
//     handleButtonClick(btn.dataset.id, btn.dataset.endpoint);
//   });
// });