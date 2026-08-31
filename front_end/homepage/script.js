async function getUserDetails() {
  const token = localStorage.getItem("authToken");
  if (!token) {
    window.location.href = "front_end/login/login.html";
    return false;
  }
  try {
    const response = await fetch("backend_user_check_url", { method: "POST", headers: { "Content-Type": "application/json", "Request-ID": crypto.randomUUID() }, body: JSON.stringify({ token: token }) });
    if (!response.ok) {
      if (response.status === 401) { console.error("Token invalid or expired"); }
      localStorage.removeItem("authToken");
      window.location.href = "front_end/login/login.html";
      return false;
    }
    const data = await response.json();
    if (data.status) { return true; }
    window.location.href = "front_end/login/login.html";
    return false;
  } catch (err) {
    console.error("Request failed:", err);
    window.location.href = "front_end/login/login.html";
    return false;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  // const isAuthed = await getUserDetails();
  // if (!isAuthed) return; 
  const navItems = document.querySelectorAll(".nav-item[data-target]");
  const pages = document.querySelectorAll(".page");
  const pageTitle = document.getElementById("page-title");
  const titles = {
    dashboard: "Dashboard",
    linkedln: "Linkedln",
    instagram: "Instagram",
    whatsapp: "Whatsapp",
    gmail: "Gmail",
    post: "Post",
    campaign: "Campaign",
    settings: "Settings",
  };

  function showPage(target) {
    pages.forEach((page) => { page.classList.toggle("active", page.id === `page-${target}`); });
    navItems.forEach((item) => { item.classList.toggle("active", item.dataset.target === target); });
    if (pageTitle && titles[target]) { pageTitle.textContent = titles[target]; }
    history.replaceState(null, "", `#${target}`);
  }

  function makeConnectionChecker({ storageKey, endpoint, loginRoute }) {
    return async function () {
      const token = localStorage.getItem("authToken");
      const accountId = localStorage.getItem(storageKey);
      if (!accountId) return null;
      try {
        const params = new URLSearchParams({ account_id: accountId });
        const response = await fetch(`${endpoint}?${params}`, { method: "POST", headers: { "Content-Type": "application/json", "Request-ID": crypto.randomUUID() }, body: JSON.stringify({ token: token }) });
        if (response.status === 400) { window.location.href = loginRoute; return false; }
        if (!response.ok) { console.error(`${storageKey} check failed:`, response.status); return false; }
        return response;
      } catch (err) {
        console.error(`Network error checking ${storageKey}:`, err);
        return false;
      }
    };
  }

  function showConnectPrompt({ containerId, label, loginRoute }) {
    const container = document.getElementById(containerId);
    if (!container) { console.error("Container not found:", containerId); return; }
    container.innerHTML = `
    <div class="ig-connect-box">
      <p>No ${label} account connected</p>
      <button class="connect-btn">Connect ${label}</button>
    </div>`;
    container.querySelector(".connect-btn").addEventListener("click", () => {
      window.location.href = loginRoute;
    });
  }

  function buildSocialCard(post, { cardClass, toggleEndpoint }) {
    const card = document.createElement('div');
    card.className = cardClass;
    const img = document.createElement('img');
    img.src = post.thumbnail_url || post.media_url;
    img.alt = post.caption ? post.caption.slice(0, 60) : 'Post';
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
        const response = await fetch(toggleEndpoint, {
          method: 'POST', headers: { 'Content-Type': 'application/json', "Request-ID": crypto.randomUUID() }, body: JSON.stringify({ post_id: post.id })
        });
        if (!response.ok) throw new Error(`Toggle failed: ${response.status}`);
      } catch (err) {
        console.error('Toggle request failed:', err);
        e.target.checked = false;
        toggleStatus.textContent = 'Off';
      } finally {
        e.target.disabled = false;
      }
    });
    body.appendChild(caption);
    body.appendChild(stats);
    body.appendChild(toggleRow);
    card.appendChild(img);
    card.appendChild(body);
    return card;
  }

  async function loadPostCards(res, { containerId, cardClass, toggleEndpoint }) {
    const container = document.getElementById(containerId);
    container.innerHTML = '<p>Loading posts…</p>';
    try {
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json();
      const posts = data.posts || [];
      container.innerHTML = '';
      if (posts.length === 0) { container.innerHTML = '<p>No posts found.</p>'; return; }
      posts.forEach(post => container.appendChild(buildSocialCard(post, { cardClass, toggleEndpoint })));
    } catch (err) {
      container.innerHTML = `<p style="color:#c0392b;">Failed to load posts: ${err.message}</p>`;
      console.error(err);
    }
  }

  function buildMessageCard(msg, { cardClass, toField }) {
    const card = document.createElement('div');
    card.className = cardClass;

    const header = document.createElement('div');
    header.className = 'header';
    header.innerHTML = `
    <span class="to">To: ${msg[toField] || 'Unknown'}</span>
    <span class="date">${msg.sent_at ? new Date(msg.sent_at).toLocaleString() : ''}</span>`;

    const bodyText = document.createElement('p');
    bodyText.className = msg.subject !== undefined ? 'subject' : 'body';
    bodyText.textContent = msg.subject || msg.text || '(no content)';

    const stats = document.createElement('div');
    stats.className = 'stats';
    stats.innerHTML = `<span><span class="label">Status:</span> ${msg.status || 'sent'}</span>`;

    card.appendChild(header);
    card.appendChild(bodyText);
    if (msg.snippet) {
      const snippet = document.createElement('p');
      snippet.className = 'snippet';
      snippet.textContent = msg.snippet;
      card.appendChild(snippet);
    }
    card.appendChild(stats);
    return card;
  }

  async function loadMessageCards(res, { containerId, cardClass, toField }) {
    const container = document.getElementById(containerId);
    container.innerHTML = '<p>Loading messages…</p>';
    try {
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json();
      const messages = data.messages || [];
      container.innerHTML = '';
      if (messages.length === 0) { container.innerHTML = '<p>No sent messages found.</p>'; return; }
      messages.forEach(msg => container.appendChild(buildMessageCard(msg, { cardClass, toField })));
    } catch (err) {
      container.innerHTML = `<p style="color:#c0392b;">Failed to load messages: ${err.message}</p>`;
      console.error(err);
    }
  }

  async function checkSettingsConnection() {
    const token = localStorage.getItem("authToken");
    try {
      const response = await fetch(`http://127.0.0.1:5000/vrify`, {
        method: "POST", headers: { "Content-Type": "application/json", "Request-ID": crypto.randomUUID() }, body: JSON.stringify({ token })
      });
      if (response.status === 401) { window.location.href = "/login"; return false; }
      if (!response.ok) { console.error("Settings check failed:", response.status); return false; }
      return response;
    } catch (error) {
      console.error("Network error checking settings:", error);
      return false;
    }
  }

  async function loadSettingsAccounts(res) {
    const container = document.getElementById("settings-accounts");
    if (!container) {
      console.error("Settings container not found");
      return;
    }
    container.innerHTML = "<p>Loading accounts…</p>";
    try {
      const body = await res.json();
      if (!body.status) throw new Error(body.reason || "Failed to load accounts");
      const data = body.data;
      const categories = {
        instagram: { label: "Instagram", loginRoute: "/auth/instagram/login" },
        whatsapp: { label: "WhatsApp", loginRoute: "/auth/whatsapp/login" },
        gmail: { label: "Gmail", loginRoute: "/auth/gmail/login" },
        drive: { label: "Drive", loginRoute: "/auth/drive/login" },
        linkedin: { label: "LinkedIn", loginRoute: "/auth/linkedin/login" },
      };
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
          section.appendChild(empty);
        }
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
            list.appendChild(row);
          });
          const addMore = document.createElement("button");
          addMore.className = "connect-btn add-more";
          addMore.dataset.route = loginRoute;
          addMore.textContent = `+ Add another ${label} account`;
          list.appendChild(addMore);
          section.appendChild(list);
        }
        container.appendChild(section);
      });
      container.querySelectorAll(".connect-btn").forEach((btn) => {
        btn.addEventListener("click", () => { window.location.href = btn.dataset.route; });
      });
    }
    catch (err) {
      container.innerHTML = `<p style="color:#c0392b;">Failed to load accounts: ${err.message}</p>`;
      console.error(err);
    }
  }

  const checkInstagramConnection = makeConnectionChecker({ storageKey: "account_id", endpoint: "/instagram/posts", loginRoute: "/auth/instagram/login" });
  const checkLinkedinConnection = makeConnectionChecker({ storageKey: "linkedin_account_id", endpoint: "/linkedin/posts", loginRoute: "/auth/linkedin/login" });
  const checkGmailConnection = makeConnectionChecker({ storageKey: "gmail_account_id", endpoint: "/gmail/sent", loginRoute: "/auth/gmail/login" });
  const checkWhatsappConnection = makeConnectionChecker({ storageKey: "whatsapp_account_id", endpoint: "/whatsapp/sent", loginRoute: "/auth/whatsapp/login" });

  navItems.forEach((item) => {
    item.addEventListener("click", async () => {
      const target = item.dataset.target;
      if (target === "settings") {
        const res = await checkSettingsConnection();
        if (!res) return;
        showPage(target);
        loadSettingsAccounts(res);
        return;
      }
      if (target === "instagram") {
        const res = await checkInstagramConnection();
        if (res === null) {
          showPage(target);
          showConnectPrompt({ containerId: "hello_insta", label: "Instagram", loginRoute: "/auth/instagram/login" });
          return;
        }
        if (!res) return;
        showPage(target);
        loadPostCards(res, { containerId: "hello_insta", cardClass: "insta-card", toggleEndpoint: "/posts/watch" });
        return;
      }
      if (target === "linkedln") {
        const res = await checkLinkedinConnection();
        if (res === null) {
          showPage(target);
          showConnectPrompt({ containerId: "hello_linkedin", label: "LinkedIn", loginRoute: "/auth/linkedin/login" });
          return;
        }
        if (!res) return;
        showPage(target);
        loadPostCards(res, { containerId: "hello_linkedin", cardClass: "linkedin-card", toggleEndpoint: "/linkedin/posts/toggle" });
        return;
      }
      if (target === "gmail") {
        const res = await checkGmailConnection();
        if (res === null) {
          showPage(target);
          showConnectPrompt({ containerId: "hello_gmail", label: "Gmail", loginRoute: "/auth/gmail/login" });
          return;
        }
        if (!res) return;
        showPage(target);
        loadMessageCards(res, { containerId: "hello_gmail", cardClass: "gmail-card", toField: "to" });
        return;
      }
      if (target === "whatsapp") {
        const res = await checkWhatsappConnection();
        if (res === null) {
          showPage(target);
          showConnectPrompt({ containerId: "hello_whatsapp", label: "WhatsApp", loginRoute: "/auth/whatsapp/login" });
          return;
        }
        if (!res) return;
        showPage(target);
        loadMessageCards(res, { containerId: "hello_whatsapp", cardClass: "whatsapp-card", toField: "recipient" });
        return;
      }
      showPage(target);
    });
  });

  const initial = window.location.hash.replace("#", "");
  if (initial && titles[initial]) { showPage(initial); }
  const reloginBtn = document.getElementById("relogin-btn");
  if (reloginBtn) { reloginBtn.addEventListener("click", () => showPage("dashboard")); }
  const rangeSelectEl = document.getElementById("rangeSelect");
  document.getElementById("logout").addEventListener("click", () => {
    localStorage.removeItem("authToken");
    window.location.href = "/login.html";
  });
  document.querySelectorAll(".multi-select").forEach((rangeSelectEl) => {
    const trigger = rangeSelectEl.querySelector(".multi-select-trigger");
    const optionsBox = rangeSelectEl.querySelector(".multi-select-options");
    const label = rangeSelectEl.querySelector(".multi-select-label");
    const checkboxes = rangeSelectEl.querySelectorAll('input[type="checkbox"]');
    trigger.addEventListener("click", () => { optionsBox.classList.toggle("open"); });
    document.addEventListener("click", (e) => { if (!rangeSelectEl.contains(e.target)) optionsBox.classList.remove("open"); });
    checkboxes.forEach((cb) => {
      cb.addEventListener("change", () => {
        const selected = Array.from(checkboxes)
          .filter((c) => c.checked)
          .map((c) => c.value);
        label.textContent = selected.length ? selected.join(", ") : "Select metrics";
      });
    });
  });

function initDropzoneUploader({ dropZoneId, fileInputId, formId, fileListId, textId, endpoint, buildFormData }) {
  const dropZone = document.getElementById(dropZoneId);
  const fileInput = document.getElementById(fileInputId);
  const form = document.getElementById(formId);
  const fileListEl = document.getElementById(fileListId);
  const textForFile = document.getElementById(textId);
  if (!dropZone || !fileInput || !form || !fileListEl || !textForFile) {
    console.warn('Uploader init skipped, missing element for:', dropZoneId);
    return;
  }
  let selectedFiles = [];
  function syncInputFiles() {
    const dataTransfer = new DataTransfer();
    selectedFiles.forEach(file => dataTransfer.items.add(file));
    fileInput.files = dataTransfer.files;
  }
  function renderFileList() {
    fileListEl.innerHTML = '';
    selectedFiles.forEach((file, index) => {
      const li = document.createElement('li');
      const label = document.createElement('span');
      label.textContent = `${index + 1}. ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
      const removeBtn = document.createElement('button');
      removeBtn.textContent = '✕';
      removeBtn.type = 'button';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedFiles.splice(index, 1);
        syncInputFiles();
        renderFileList();
        updateBoxText();
      });
      li.appendChild(label);
      li.appendChild(removeBtn);
      fileListEl.appendChild(li);
    });
  }
  function updateBoxText() {
    textForFile.textContent = selectedFiles.length
      ? `${selectedFiles.length} file(s) selected`
      : 'Drag & drop media for the upload';
  } 
  function addFiles(newFiles) {
    Array.from(newFiles).forEach(file => {
      const exists = selectedFiles.some(f => f.name === file.name && f.size === file.size);
      if (!exists) selectedFiles.push(file);
    });
    syncInputFiles();
    renderFileList();
    updateBoxText();
  }
  dropZone.addEventListener('click', (e) => {
    if (e.target.closest(`#${fileListId}`)) return;
    fileInput.click();
  });
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    addFiles(e.dataTransfer.files);
  });
  fileInput.addEventListener('change', () => { addFiles(fileInput.files); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    // files are optional for a campaign (media is optional), so don't block submit if empty
    const formData = buildFormData
      ? buildFormData(selectedFiles)
      : (() => {
          const fd = new FormData();
          selectedFiles.forEach(file => fd.append('file', file));
          return fd;
        })();
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { "Request-ID": crypto.randomUUID() }, // no Content-Type — browser sets multipart boundary
        body: formData
      });
      const data = await res.json();
      if (res.ok) alert('Campaign sent: ' + (data.count ?? 0) + ' recipient(s) processed');
      else alert('Error: ' + (data.error || 'unknown error'));
    } catch (err) {
      alert('Upload failed: ' + err.message);
    }
  });
}

function buildCampaignFormData(selectedFiles) {
  const fd = new FormData();
  const platform = document.getElementById('platform-campaign').value;
  const campaignName = document.getElementById('captt-campaign-cname').value.trim();
  const body = document.getElementById('captt-campaign-text').value.trim();
  const toRaw = document.getElementById('captt-campaign-to').value.trim();
  const namesRaw = document.getElementById('captt-campaign-name').value.trim();
  const target = toRaw ? toRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
  const names = namesRaw ? namesRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
  fd.append('token', token);
  fd.append('platform', platform);
  fd.append('campaign_name', campaignName);
  fd.append('body', body);
  fd.append('target', JSON.stringify(target));
  fd.append('name', JSON.stringify(names));
  selectedFiles.forEach(file => fd.append('file', file));
  return fd;
}

initDropzoneUploader({  dropZoneId: 'dropZone-campaign',  fileInputId: 'fileInput-campaign', formId: 'uploadForm-campaign',  fileListId: 'fileList-campaign', textId: 'textforfile-campaign', endpoint: '/campaign', buildFormData: buildCampaignFormData });

  const platformSelect = document.getElementById('platform');
  const postTypeSelect = document.getElementById('postType');
  const Idselect = document.getElementById('accounts');
  const postTypes = {
    instagram: [{ value: 'video', label: 'Video' },
    { value: 'photo', label: 'Photo' },
    { value: 'carousel', label: 'Carousel' },
    { value: 'story', label: 'Story' },
    { value: 'reel', label: 'Reel' },],
    linkedin: [{ value: 'text', label: 'Text-Only Post' },
    { value: 'single-image', label: 'Single Image Post' },
    { value: 'multi-image', label: 'Multi-Image Post' },
    { value: 'document', label: 'Document Post' },
    { value: 'video-post', label: 'Video Post' },
    { value: 'article', label: 'Article' },
    { value: 'poll', label: 'Poll' },
    { value: 'live', label: 'LinkedIn Live' },
    { value: 'newsletter', label: 'Newsletter' },],
  };
  let accountsData = { instagram: [], linkedin: [], whatsapp: [], drive: [], gmail: [] };
  function updatePostTypes() {
    const platform = platformSelect.value;
    const options = postTypes[platform] || [];
    postTypeSelect.innerHTML = '';
    options.forEach(opt => {
      const el = document.createElement('option');
      el.value = opt.value;
      el.textContent = opt.label;
      postTypeSelect.appendChild(el);
    });
  }
  function updateAccountOptions() {
    const platform = platformSelect.value;
    const accounts = accountsData[platform] || [];
    Idselect.innerHTML = '';
    accounts.forEach(acc => {
      const el = document.createElement('option');
      el.value = acc.id;
      el.textContent = acc.username || acc.name;
      Idselect.appendChild(el);
    });
  }
  async function fetchAccounts() {
    const token = localStorage.getItem("authToken");
    try {
      const response = await fetch(`http://127.0.0.1:5000/vrify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Request-ID": crypto.randomUUID() },
        body: JSON.stringify({ token })
      });
      if (!response.ok) { console.error("fetchAccounts failed:", response.status); return; }
      const json = await response.json();
      const data = json.data || {};
      accountsData.instagram = data.instagram || [];
      accountsData.linkedin = data.linkedin || [];
      accountsData.whatsapp = data.whatsapp || [];
      accountsData.drive = data.drive || [];
      accountsData.gmail = data.gmail || [];
      updateAccountOptions();
    } catch (err) {
      console.error("Network error fetching accounts:", err);
    }
  }
  fetchAccounts();
  updatePostTypes();
  platformSelect.addEventListener('change', () => {
    updatePostTypes();
    updateAccountOptions();
  });

})


// add the username metrics from the plotform selection in post , ids will come from the api
// make the args parameter go in the json ones  