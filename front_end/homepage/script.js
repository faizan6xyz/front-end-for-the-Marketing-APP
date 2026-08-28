async function getUserDetails() {
    const token = localStorage.getItem("authToken");
    if (!token) { window.location.href = "http://127.0.0.1:5501/front_end/login/login.html";
        return false; }
    try { const response = await fetch("backend_user_check_url", {
            method: "GET",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}`  }});
        if (!response.ok) { 
            if (response.status === 401) {  console.error("Token invalid or expired");  }
            localStorage.removeItem("authToken");
            window.location.href = "http://127.0.0.1:5501/front_end/login/login.html";
            return false; }
        const data = await response.json();
        if (data.status) { return true; }
        window.location.href = "http://127.0.0.1:5501/front_end/login/login.html";
        return false;
    } catch (err) { 
        console.error("Request failed:", err);
        window.location.href = "http://127.0.0.1:5501/front_end/login/login.html";
        return false;} }

document.addEventListener("DOMContentLoaded", async () => {
    // const isAuthed = await getUserDetails();
    // if (!isAuthed) return; 
    const navItems = document.querySelectorAll(".nav-item[data-target]");
    const pages = document.querySelectorAll(".page");
    const pageTitle = document.getElementById("page-title");
    const titles = {dashboard: "Dashboard",
        linkedln: "Linkedln",
        instagram: "Instagram",
        whatsapp: "Whatsapp",
        gmail: "Gmail",
        post : "Post",
        campaign : "Campaign",
        settings: "Settings", };

function showPage(target) {
    pages.forEach((page) => {   page.classList.toggle("active", page.id === `page-${target}`);  });
    navItems.forEach((item) => { item.classList.toggle("active", item.dataset.target === target);});
    if (pageTitle && titles[target]) { pageTitle.textContent = titles[target]; }
    history.replaceState(null, "", `#${target}`); }

async function loadInstaPosts(res) {
    const container = document.getElementById('hello_insta');
    container.innerHTML = '<p>Loading posts…</p>';
    try {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const data = await res.json();
        const posts = data.posts || [];
        container.innerHTML = '';
        if (posts.length === 0) { container.innerHTML = '<p>No posts found.</p>';
            return; }
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
                <span><span class="label">💬</span> ${post.comments_count ?? 0}</span>`;
            const toggleRow = document.createElement('div');
            toggleRow.className = 'post-toggle-row';
            toggleRow.innerHTML = `
                <span class="post-toggle-title">Analysis</span>
                <label class="post-toggle">
                    <input type="checkbox" class="post-toggle-input" data-post-id="${post.id}">
                    <span class="post-toggle-slider"></span>
                </label>
                <span class="post-toggle-status">Off</span>`;
            const toggleInput = toggleRow.querySelector('.post-toggle-input');
            const toggleStatus = toggleRow.querySelector('.post-toggle-status');
            toggleInput.addEventListener('change', async (e) => {
                toggleStatus.textContent = e.target.checked ? 'On' : 'Off';
                if (!e.target.checked) return;
                e.target.disabled = true;
                try {
                    const response = await fetch('/posts/watch', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ post_id: post.id }) });
                    if (!response.ok) throw new Error(`Toggle failed: ${response.status}`);}
                catch (err) {
                    console.error('Toggle request failed:', err);
                    e.target.checked = false;
                    toggleStatus.textContent = 'Off'; }
                finally { e.target.disabled = false; }  });
            body.appendChild(caption);
            body.appendChild(stats);
            body.appendChild(toggleRow);
            card.appendChild(img);
            card.appendChild(body);
            container.appendChild(card);    });}
    catch (err) {
        container.innerHTML = `<p style="color:#c0392b;">Failed to load posts: ${err.message}</p>`;
        console.error(err);   }}

async function checkInstagramConnection() {
    const token = localStorage.getItem("authToken");
    const account_id = localStorage.getItem("account_id");
    if (!account_id) { showInstagramConnectPrompt(); 
        return false; }
    try {
        const params = new URLSearchParams({ token: token, account_id: account_id });
        const response = await fetch(`/instagram/posts?${params.toString()}`);
        if (response.status === 400) { window.location.href = "/auth/instagram/login";
            return false; }
        if (!response.ok) { console.error("Instagram check failed:", response.status);
            return false; }
        return response; } 
    catch (error) { console.error("Network error checking Instagram:", error);
        return false; } }

function showInstagramConnectPrompt() {
    const container = document.getElementById("hello_insta");
    if (!container) { console.error("Main content container not found");
        return; }
    container.innerHTML = `
        <div class="ig-connect-box">
            <p>No Instagram account connected</p>
            <button id="ig-connect-btn">Connect Instagram</button>
        </div>`;
    document.getElementById("ig-connect-btn").addEventListener("click", () => {
        window.location.href = "/auth/instagram/login";  }); }

async function loadLinkedinPosts(res) {
    const container = document.getElementById('hello_linkedin');
    container.innerHTML = '<p>Loading posts…</p>';
    try {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const data = await res.json();
        const posts = data.posts || [];
        container.innerHTML = '';
        if (posts.length === 0) { container.innerHTML = '<p>No posts found.</p>';
            return; }
        posts.forEach(post => {
            const card = document.createElement('div');
            card.className = 'linkedin-card';
            const img = document.createElement('img');
            img.src = post.thumbnail_url || post.media_url;
            img.alt = post.caption ? post.caption.slice(0, 60) : 'LinkedIn post';
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
                <span><span class="label">💬</span> ${post.comments_count ?? 0}</span>`;
            const toggleRow = document.createElement('div');
            toggleRow.className = 'post-toggle-row';
            toggleRow.innerHTML = `
                <span class="post-toggle-title">Analysis</span>
                <label class="post-toggle">
                    <input type="checkbox" class="post-toggle-input" data-post-id="${post.id}">
                    <span class="post-toggle-slider"></span>
                </label>
                <span class="post-toggle-status">Off</span>`;
            const toggleInput = toggleRow.querySelector('.post-toggle-input');
            const toggleStatus = toggleRow.querySelector('.post-toggle-status');
            toggleInput.addEventListener('change', async (e) => {
                toggleStatus.textContent = e.target.checked ? 'On' : 'Off';
                if (!e.target.checked) return;
                e.target.disabled = true;
                try {
                    const response = await fetch('/linkedin/posts/toggle', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ post_id: post.id }) });
                    if (!response.ok) throw new Error(`Toggle failed: ${response.status}`); }
                catch (err) {
                    console.error('Toggle request failed:', err);
                    e.target.checked = false;
                    toggleStatus.textContent = 'Off'; }
                finally { e.target.disabled = false; } });
            body.appendChild(caption);
            body.appendChild(stats);
            body.appendChild(toggleRow);
            card.appendChild(img);
            card.appendChild(body);
            container.appendChild(card);    }); }
    catch (err) {  container.innerHTML = `<p style="color:#c0392b;">Failed to load posts: ${err.message}</p>`;
        console.error(err); } }

async function checkLinkedinConnection() {
    const token = localStorage.getItem("authToken");
    const linkedin_account_id = localStorage.getItem("linkedin_account_id");
    if (!linkedin_account_id) { showLinkedinConnectPrompt();
        return false; }
    try {
        const params = new URLSearchParams({ token: token, account_id: linkedin_account_id });
        const response = await fetch(`/linkedin/posts?${params.toString()}`);
        if (response.status === 400) { window.location.href = "/auth/linkedin/login";
            return false; }
        if (!response.ok) { console.error("LinkedIn check failed:", response.status);
            return false; }
        return response; }
    catch (error) { console.error("Network error checking LinkedIn:", error);
        return false; } }

function showLinkedinConnectPrompt() {
    const container = document.getElementById("hello_linkedin");
    if (!container) { console.error("Main content container not found");
        return; }
    container.innerHTML = `
        <div class="ig-connect-box">
            <p>No LinkedIn account connected</p>
            <button id="linkedin-connect-btn">Connect LinkedIn</button>
        </div>`;
    document.getElementById("linkedin-connect-btn").addEventListener("click", () => {   window.location.href = "/auth/linkedin/login"; }); }

async function loadGmailMessages(res) {
    const container = document.getElementById('hello_gmail');
    container.innerHTML = '<p>Loading messages…</p>';
    try {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const data = await res.json();
        const messages = data.messages || [];
        container.innerHTML = '';
        if (messages.length === 0) { container.innerHTML = '<p>No sent messages found.</p>';
            return;   }
        messages.forEach(msg => {
            const card = document.createElement('div');
            card.className = 'gmail-card';
            const header = document.createElement('div');
            header.className = 'header';
            header.innerHTML = `
                <span class="to">To: ${msg.to || 'Unknown'}</span>
                <span class="date">${msg.sent_at ? new Date(msg.sent_at).toLocaleString() : ''}</span>`;
            const subject = document.createElement('p');
            subject.className = 'subject';
            subject.textContent = msg.subject || '(no subject)';
            const snippet = document.createElement('p');
            snippet.className = 'snippet';
            snippet.textContent = msg.snippet || '';
            const stats = document.createElement('div');
            stats.className = 'stats';
            stats.innerHTML = `
                <span><span class="label">Status:</span> ${msg.status || 'sent'}</span>`;
            card.appendChild(header);
            card.appendChild(subject);
            card.appendChild(snippet);
            card.appendChild(stats);
            container.appendChild(card); }); }
    catch (err) {container.innerHTML = `<p style="color:#c0392b;">Failed to load messages: ${err.message}</p>`;
        console.error(err); } }

async function checkGmailConnection() {
    const token = localStorage.getItem("authToken");
    const gmail_account_id = localStorage.getItem("gmail_account_id");
    if (!gmail_account_id) { showGmailConnectPrompt();
        return false; }
    try {
        const params = new URLSearchParams({ token: token, account_id: gmail_account_id });
        const response = await fetch(`/gmail/sent?${params.toString()}`);
        if (response.status === 400) { window.location.href = "/auth/gmail/login";
            return false; }
        if (!response.ok) { console.error("Gmail check failed:", response.status);
            return false;    }
        return response; }
    catch (error) { console.error("Network error checking Gmail:", error);
        return false; } }

function showGmailConnectPrompt() {
    const container = document.getElementById("hello_gmail");
    if (!container) { console.error("Main content container not found");
        return; }
    container.innerHTML = `
        <div class="ig-connect-box">
            <p>No Gmail account connected</p>
            <button id="gmail-connect-btn">Connect Gmail</button>
        </div>`;
    document.getElementById("gmail-connect-btn").addEventListener("click", () => {  window.location.href = "/auth/gmail/login";    }); }

async function loadWhatsappMessages(res) {
    const container = document.getElementById('hello_whatsapp');
    container.innerHTML = '<p>Loading messages…</p>';
    try {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const data = await res.json();
        const messages = data.messages || [];
        container.innerHTML = '';
        if (messages.length === 0) { container.innerHTML = '<p>No sent messages found.</p>';
            return;    }
        messages.forEach(msg => {
            const card = document.createElement('div');
            card.className = 'whatsapp-card';
            const header = document.createElement('div');
            header.className = 'header';
            header.innerHTML = `
                <span class="to">To: ${msg.recipient || 'Unknown'}</span>
                <span class="date">${msg.sent_at ? new Date(msg.sent_at).toLocaleString() : ''}</span>`;
            const body = document.createElement('p');
            body.className = 'body';
            body.textContent = msg.text || '';
            const stats = document.createElement('div');
            stats.className = 'stats';
            stats.innerHTML = `
                <span><span class="label">Status:</span> ${msg.status || 'sent'}</span>`;
            card.appendChild(header);
            card.appendChild(body);
            card.appendChild(stats);
            container.appendChild(card);    });}
    catch (err) { container.innerHTML = `<p style="color:#c0392b;">Failed to load messages: ${err.message}</p>`;
        console.error(err);    } }

async function checkWhatsappConnection() {
    const token = localStorage.getItem("authToken");
    const whatsapp_account_id = localStorage.getItem("whatsapp_account_id");
    if (!whatsapp_account_id) { showWhatsappConnectPrompt();
        return false;  }
    try {
        const params = new URLSearchParams({ token: token, account_id: whatsapp_account_id });
        const response = await fetch(`/whatsapp/sent?${params.toString()}`);
        if (response.status === 400) { window.location.href = "/auth/whatsapp/login";
            return false;    }
        if (!response.ok) { console.error("WhatsApp check failed:", response.status);
            return false;    }
        return response; }
    catch (error) { console.error("Network error checking WhatsApp:", error);
        return false;    } }

function showWhatsappConnectPrompt() {
    const container = document.getElementById("hello_whatsapp");
    if (!container) { console.error("Main content container not found");
        return; }
    container.innerHTML = `
        <div class="ig-connect-box">
            <p>No WhatsApp account connected</p>
            <button id="whatsapp-connect-btn">Connect WhatsApp</button>
        </div>`;
    document.getElementById("whatsapp-connect-btn").addEventListener("click", () => {    window.location.href = "/auth/whatsapp/login";    });}

async function checkSettingsConnection() {
    const token = localStorage.getItem("authToken");
    try {
        const params = new URLSearchParams({ token });
        const response = await fetch(`/vrify?${params.toString()}`);
        if (response.status === 401) {    window.location.href = "/login";
            return false; }
        if (!response.ok) { console.error("Settings check failed:", response.status);
            return false; }
        return response; }
    catch (error) { console.error("Network error checking settings:", error);
        return false;  }  }

async function loadSettingsAccounts(res) {
    const container = document.getElementById("settings-accounts");
    if (!container) { console.error("Settings container not found");
        return; }
    container.innerHTML = "<p>Loading accounts…</p>";
    try {
        const body = await res.json();
        if (!body.status) throw new Error(body.reason || "Failed to load accounts");
        const data = body.data;
        const categories = { instagram_account_ids: { label: "Instagram", loginRoute: "/auth/instagram/login" },
            whatsapp_account_ids: { label: "WhatsApp", loginRoute: "/auth/whatsapp/login" },
            gmail_emails: { label: "Gmail", loginRoute: "/auth/gmail/login" },
            drive_emails: { label: "Drive", loginRoute: "/auth/drive/login" },
            linkedin_account_ids: { label: "LinkedIn", loginRoute: "/auth/linkedin/login" },  };
        container.innerHTML = "";
        Object.entries(categories).forEach(([key, { label, loginRoute }]) => {
            const values = data[key] || [];
            const section = document.createElement("div");
            section.className = "settings-category";
            const heading = document.createElement("h3");
            heading.textContent = label;
            section.appendChild(heading);
            if (values.length === 0) {
                const empty = document.createElement("div");
                empty.className = "ig-connect-box";
                empty.innerHTML = `
                    <p>No ${label} account connected</p>
                    <button class="connect-btn" data-route="${loginRoute}">Connect ${label}</button>`;
                section.appendChild(empty);  } 
            else {
                const list = document.createElement("div");
                list.className = "settings-account-list";
                values.forEach((value, i) => {
                    const row = document.createElement("label");
                    row.className = "settings-account-row";
                    const checkboxId = `${key}-${i}`;
                    row.innerHTML = `
                        <input type="checkbox" id="${checkboxId}" name="${key}" value="${value}" checked>
                        <span>${value}</span>`;
                    list.appendChild(row); });
                const addMore = document.createElement("button");
                addMore.className = "connect-btn add-more";
                addMore.dataset.route = loginRoute;
                addMore.textContent = `+ Add another ${label} account`;
                list.appendChild(addMore);
                section.appendChild(list); }
            container.appendChild(section);   });
        container.querySelectorAll(".connect-btn").forEach((btn) => {
            btn.addEventListener("click", () => {window.location.href = btn.dataset.route;    });   });  }
    catch (err) {
        container.innerHTML = `<p style="color:#c0392b;">Failed to load accounts: ${err.message}</p>`;
        console.error(err);   }}


navItems.forEach((item) => {
    item.addEventListener("click", async () => {
        const target = item.dataset.target;
        //  if (target === "settings") {
        //     const res = await checkSettingsConnection();
        //     if (!res) return;
        //     showPage(target);
        //     loadSettingsAccounts(res);
        //     return;  }
        // if (target === "instagram") {
        //     const res = await checkInstagramConnection();
        //     if (!res) return;
        //     showPage(target);
        //     loadInstaPosts(res);
        //     return;        }
        // if (target === "linkedln") {
        //     const res = await checkLinkedinConnection();
        //     if (!res) return;
        //     showPage(target);
        //     loadLinkedinPosts(res);
        //     return; }
        // if (target === "gmail") {
        //     const res = await checkGmailConnection();
        //     if (!res) return;
        //     showPage(target);
        //     loadGmailMessages(res);
        //     return;  }
        // if (target === "whatsapp") {
        //     const res = await checkWhatsappConnection();
        //     if (!res) return;
        //     showPage(target);
        //     loadWhatsappMessages(res);
        //     return; }
        showPage(target);  }); });

const initial = window.location.hash.replace("#", "");
if (initial && titles[initial]) {showPage(initial);}
const reloginBtn = document.getElementById("relogin-btn");
if (reloginBtn) { reloginBtn.addEventListener("click", () => showPage("dashboard")); }
const container = document.getElementById("rangeSelect");
document.getElementById("logout").addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "/login.html"; });
document.querySelectorAll(".multi-select").forEach((container) => {
    const trigger = container.querySelector(".multi-select-trigger");
    const optionsBox = container.querySelector(".multi-select-options");
    const label = container.querySelector(".multi-select-label");
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    trigger.addEventListener("click", () => {  optionsBox.classList.toggle("open");    });
    document.addEventListener("click", (e) => {  if (!container.contains(e.target)) optionsBox.classList.remove("open");    });
    checkboxes.forEach((cb) => {
        cb.addEventListener("change", () => {
            const selected = Array.from(checkboxes)
                .filter((c) => c.checked)
                .map((c) => c.value);
            label.textContent = selected.length ? selected.join(", ") : "Select metrics";    }); }); });
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const form = document.getElementById('uploadForm');
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  fileInput.files = e.dataTransfer.files;
  dropZone.querySelector('p').textContent = fileInput.files[0].name; });
fileInput.addEventListener('change', () => {
  if (fileInput.files.length) { dropZone.querySelector('p').textContent = fileInput.files[0].name;}});
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!fileInput.files.length) return alert('Choose a file first');
  const formData = new FormData();
  formData.append('file', fileInput.files[0]);
  try {
    const res = await fetch('/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (res.ok) alert('Uploaded: ' + data.filename);
    else alert('Error: ' + data.error);}
  catch (err) {
    alert('Upload failed: ' + err.message); }});
const platformSelect = document.getElementById('platform');
const postTypeSelect = document.getElementById('postType');
const postTypes = {
  instagram: [ { value: 'video', label: 'Video' }, 
                { value: 'photo', label: 'Photo' },
                { value: 'carousel', label: 'Carousel' },
                { value: 'story', label: 'Story' },
                { value: 'reel', label: 'Reel' },  ],
  linkedin: [ { value: 'text', label: 'Text-Only Post' },
            { value: 'single-image', label: 'Single Image Post' },
            { value: 'multi-image', label: 'Multi-Image Post' },
            { value: 'document', label: 'Document Post' },
            { value: 'video-post', label: 'Video Post' },
            { value: 'article', label: 'Article' },
            { value: 'poll', label: 'Poll' },
            { value: 'live', label: 'LinkedIn Live' },
            { value: 'newsletter', label: 'Newsletter' },  ], };
function updatePostTypes() {
  const platform = platformSelect.value;
  const options = postTypes[platform] || [];
  postTypeSelect.innerHTML = ''; 
  options.forEach(opt => {
    const el = document.createElement('option');
    el.value = opt.value;
    el.textContent = opt.label;
    postTypeSelect.appendChild(el);  });}
updatePostTypes();  
platformSelect.addEventListener('change', updatePostTypes);

})

    
    // now add the configrations of the accont in a section so the user can delete and add account