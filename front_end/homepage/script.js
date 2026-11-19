  const API_BASE = "https://rental-background-painted-governmental.trycloudflare.com";
  const LOGIN_URL = "http://127.0.0.1:5001/front_end/login/login.html";
  const ERROR_COLOR = "#c0392b";
  const PAGE_TITLES = {
    dashboard: "Dashboard",
    instagram: "Instagram",
    whatsapp: "Whatsapp",
    gmail: "Gmail",
    youtube: "Youtube",
    pinterest: "Pinterest",
    x: "X",
    threads: "Threads",
    post: "Post",
    campaign: "Campaign",
    settings: "Settings",
    complaint: "Issue",
  };
  const ACCOUNT_KEYS = ["instagram", "gmail", "whatsapp", "drive", "x", "threads", "youtube", "pinterest"];
  const SETTINGS_CATEGORIES = [
    { key: "threads", label: "Threads" },
    { key: "pinterest", label: "Pinterest" },
    { key: "x", label: "X" },
    { key: "youtube", label: "Youtube" },
    { key: "instagram", label: "Instagram" },
    { key: "whatsapp", label: "WhatsApp" },
    { key: "gmail", label: "Gmail" },
    { key: "drive", label: "Drive" },
  ];
  const POST_TYPES = {
    instagram: [
      { value: "video", label: "Video" },
      { value: "photo", label: "Photo" },
      { value: "carousel", label: "Carousel" },
      { value: "story", label: "Story" },
      { value: "reel", label: "Reel" },
    ],
    youtube: [{ value: "short", label: "Short" }],
    x: [
      { value: "text", label: "Text Post" },
      { value: "photo", label: "Photo" },
      { value: "video", label: "Video" },
    ],
    pinterest: [
      { value: "image", label: "Image Pin" },
      { value: "video", label: "Video Pin" },
      { value: "carousel", label: "Carousel Pin" },
    ],
    threads: [
      { value: "text", label: "Text Post" },
      { value: "image", label: "Image Post" },
      { value: "video", label: "Video Post" },
      { value: "carousel", label: "Carousel" },
    ],
  };

  const PLATFORMS = {
    instagram: {
      label: "Instagram",
      containerId: "hello_insta",
      endpoint: "/instagram/posts/",
      render: (res) => loadPostCards(res, { containerId: "hello_insta", cardClass: "insta-card", toggleEndpoint: "/posts/watch" }),
    },
    gmail: {
      label: "Gmail",
      containerId: "hello_gmail",
      endpoint: "/gmail/sent/",
      render: (res) => loadMessageCards(res, { containerId: "hello_gmail", cardClass: "gmail-card", toField: "to" }),
    },
    whatsapp: {
      label: "WhatsApp",
      containerId: "hello_whatsapp",
      endpoint: "/whatsapp/sent/",
      render: (res) => loadMessageCards(res, { containerId: "hello_whatsapp", cardClass: "whatsapp-card", toField: "recipient" }),
    },
    x: {
      label: "X",
      containerId: "hello_x",
      endpoint: "/x/posts/",
      render: (res) => loadPostCards(res, { containerId: "hello_x", cardClass: "x-card" }),
    },
    pinterest: {
      label: "Pinterest",
      containerId: "hello_pinterest",
      endpoint: "/pinterest/pins/",
      render: (res) => loadPostCards(res, { containerId: "hello_pinterest", cardClass: "pinterest-card" }),
    },
    youtube: {
      label: "YouTube",
      containerId: "hello_youtube",
      endpoint: "/youtube/shorts/",
      render: (res) => loadPostCards(res, { containerId: "hello_youtube", cardClass: "youtube-card" }),
    },
    threads: {
      label: "Threads",
      containerId: "hello_threads",
      endpoint: "/threads/posts/",
      render: (res) => loadPostCards(res, { containerId: "hello_threads", cardClass: "threads-card" }),
    },
  };

  let accountsReady = Promise.resolve();

  function getCookie(name) {
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
    if (!match) return null;
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }

  function clearAuthCookie() {
    document.cookie = "authToken=; Max-Age=0; path=/";
    document.cookie = "access_token=; Max-Age=0; path=/";
  }

  function clearSavedAccounts() {
    ACCOUNT_KEYS.forEach((k) => {
      localStorage.removeItem(`${k}_account_id`);
      localStorage.removeItem(`${k}_account`);
    });
  }

  function redirectToLogin() {
    window.location.href = LOGIN_URL;
    return false;
  }

  async function apiPost(path, payload = {}, { query, ensure = true, withToken = true } = {}) {
    if (ensure && !(await ensureAuthToken())) return null;
    const token = withToken ? getCookie("authToken") : null;
    const headers = {"Request-ID": crypto.randomUUID()};
    let body;
    if (payload instanceof FormData) {
      if (token && !payload.has("token")) payload.append("token", token);
      body = payload;
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(withToken ? { token, ...payload } : payload);
    }
    const qs = query ? `?${new URLSearchParams(query)}` : "";
    return fetch(`${API_BASE}${path}${qs}`, {
      method: "POST",
      credentials: "include",
      headers,
      body,
    });
  }

  async function ensureAuthToken() {
    if (getCookie("authToken")) return true;
    try {
      const res = await apiPost("/refresh", {}, { ensure: false, withToken: false });
      if (res.ok) return true;
      console.error("Refresh failed:", res.status);
    } catch (err) {
      console.error("Refresh request failed:", err);
    }
    return redirectToLogin();
  }

  async function getUserDetails() {
    if (!(await ensureAuthToken())) return false;
    if (!getCookie("authToken")) return redirectToLogin();
    try {
      const res = await apiPost("/check", {}, { ensure: false });
      if (!res.ok) {
        if (res.status === 401) console.error("Token invalid or expired");
        clearAuthCookie();
        return redirectToLogin();
      }
      const data = await res.json();
      return data.status ? true : redirectToLogin();
    } catch (err) {
      console.error("Request failed:", err);
      return redirectToLogin();
    }
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function showError(container, message) {
    const p = el("p", "", message);
    p.style.color = ERROR_COLOR;
    container.replaceChildren(p);
  }

  function accountId(a) {
    return a && typeof a === "object" ? (a.account_id ?? a.id) : a;
  }

  function accountLabel(a) {
    return a && typeof a === "object" ? (a.username || a.name || a.id || a.account_id) : a;
  }

  function fieldValue(id) {
    return document.getElementById(id)?.value.trim() ?? "";
  }

  function splitList(raw) {
    return raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : [];
  }

  function getSavedAccount(key) {
    try {
      return JSON.parse(localStorage.getItem(`${key}_account`)) || null;
    } catch {
      return null;
    }
  }

  async function loginRequest(loginRoute, label = "Account") {
    try {
      const res = await apiPost(loginRoute);
      if (!res) return;
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
      const isJson = (res.headers.get("content-type") || "").includes("application/json");
      const data = isJson ? await res.json() : null;
      const url = data?.redirect_url || data?.auth_url || data?.url;
      if (url) {
        window.location.href = url;
        return;
      }
      console.log(data ?? (await res.text()));
    } catch (err) {
      console.error(`${label} login error:`, err);
    }
  }

  function buildConnectButton({ label, loginRoute, text, extraClass = "" }) {
    const button = el("button", `connect-btn ${extraClass}`.trim(), text);
    button.type = "button";
    button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        await loginRequest(loginRoute, label);
      } finally {
        button.disabled = false;
      }
    });
    return button;
  }

  function buildConnectBox(label, loginRoute) {
    const box = el("div", "ig-connect-box");
    box.append(
      el("p", "", `No ${label} account connected`),
      buildConnectButton({ label, loginRoute, text: `Connect ${label}` })
    );
    return box;
  }

  function showConnectPrompt({ containerId, label, loginRoute }) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error("Container not found:", containerId);
      return;
    }
    container.replaceChildren(buildConnectBox(label, loginRoute));
  }

  function makeConnectionChecker({ storageKey, endpoint }) {
    return async function () {
        await accountsReady;
        const accountIdValue = localStorage.getItem(storageKey);
      if (!accountIdValue) return null;
        try {
            const res = await apiPost(endpoint, {username: accountIdValue});
            console.log(res)
            if (!res) return false;
            if (!res.ok) {
                console.error(`${storageKey} check failed:`,res.status);
                return false; }
            return res;
        } catch (err) {
            console.error(`Network error checking ${storageKey}:`,err);
            return false;
        }};}

  function buildToggleRow(post, toggleEndpoint) {
    const row = el("div", "post-toggle-row");
    const switchLabel = el("label", "post-toggle");
    const input = el("input", "post-toggle-input");
    input.type = "checkbox";
    input.dataset.postId = post.id;
    switchLabel.append(input, el("span", "post-toggle-slider"));
    const status = el("span", "post-toggle-status", "Off");
    row.append(el("span", "post-toggle-title", "Analysis"), switchLabel, status);
  input.addEventListener("change", async () => {
      status.textContent = input.checked ? "On" : "Off";
      if (!input.checked) return;
      input.disabled = true;
      try {
        const res = await apiPost(toggleEndpoint, { post_id: post.id });
        if (!res?.ok) throw new Error(`Toggle failed: ${res ? res.status : "not authenticated"}`);
      } catch (err) {
        console.error("Toggle request failed:", err);
        input.checked = false;
        status.textContent = "Off";
      } finally {
        input.disabled = false;
      }
    });
    return row;
  }

  function buildSocialCard(post, { cardClass, toggleEndpoint }) {
    const card = el("div", cardClass);
    const src = post.thumbnail_url || post.media_url;
    if (src) {
      const img = document.createElement("img");
      img.src = src;
      img.alt = post.caption ? post.caption.slice(0, 60) : "Post";
      img.loading = "lazy";
      card.appendChild(img);
    }
    const body = el("div", "body");
    body.appendChild(el("p", "caption", post.caption || ""));
    const stats = el("div", "stats");
    [["♥", post.like_count], ["💬", post.comments_count]].forEach(([icon, count]) => {
      const stat = el("span");
      stat.append(el("span", "label", icon), ` ${count ?? 0}`);
      stats.appendChild(stat);
    });
    body.appendChild(stats);
    if (toggleEndpoint) body.appendChild(buildToggleRow(post, toggleEndpoint));
    card.appendChild(body);
    return card;
  }

  function buildMessageCard(msg, { cardClass, toField }) {
    const card = el("div", cardClass);
    const header = el("div", "header");
    header.append(
      el("span", "to", `To: ${msg[toField] || "Unknown"}`),
      el("span", "date", msg.sent_at ? new Date(msg.sent_at).toLocaleString() : "")
    );
    const bodyText = el(
      "p",
      msg.subject !== undefined ? "subject" : "body",
      msg.subject || msg.text || "(no content)"
    );
    const stats = el("div", "stats");
    const status = el("span");
    status.append(el("span", "label", "Status:"), ` ${msg.status || "sent"}`);
    stats.appendChild(status);
    card.append(header, bodyText);
    if (msg.snippet) card.appendChild(el("p", "snippet", msg.snippet));
    card.appendChild(stats);
    return card;
  }

  async function loadCards(res, { containerId, loadingText, emptyText, listKey, build }) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error("Container not found:", containerId);
      return;
    }
    container.replaceChildren(el("p", "", loadingText));
    try {
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json();
      const items = data[listKey] || [];
      if (items.length === 0) {
        container.replaceChildren(el("p", "", emptyText));
        return;
      }
      container.replaceChildren(...items.map(build));
    } catch (err) {
      showError(container, `Failed to load: ${err.message}`);
      console.error(err);
    }
  }

  const loadPostCards = (res, opts) =>
    loadCards(res, {
      containerId: opts.containerId,
      loadingText: "Loading posts…",
      emptyText: "No posts found.",
      listKey: "posts",
      build: (post) => buildSocialCard(post, opts),
    });

  const loadMessageCards = (res, opts) =>
    loadCards(res, {
      containerId: opts.containerId,
      loadingText: "Loading messages…",
      emptyText: "No sent messages found.",
      listKey: "messages",
      build: (msg) => buildMessageCard(msg, opts),
    });

function syncAccountIdsToStorage(data) {
  ACCOUNT_KEYS.forEach((key) => {
    const first = Array.isArray(data[key]) ? data[key][0] : null;
    const id = first ? accountId(first) : null;

    if (id !== null && id !== undefined) {
      localStorage.setItem(`${key}_account_id`, String(id));
      localStorage.setItem(
        `${key}_account`,
        JSON.stringify({ name: accountLabel(first), account_id: String(id) })
      );
    } else {
      localStorage.removeItem(`${key}_account_id`);
      localStorage.removeItem(`${key}_account`);
    }
  });
}

  async function fetchAccounts() {
    try {
      const res = await apiPost("/vrify");
      if (!res?.ok) {
        console.error("fetchAccounts failed:", res?.status);
        return {};
      }
      const json = await res.json();
      const data = json.data || {};
      syncAccountIdsToStorage(data);
      return data;
    } catch (err) {
      console.error("Network error fetching accounts:", err);
      return {};
    }
  }

  async function checkSettingsConnection() {
    try {
      const res = await apiPost("/vrify");
      if (!res) return false;
      if (res.status === 401) return redirectToLogin();
      if (!res.ok) {
        console.error("Settings check failed:", res.status);
        return false;
      }
      return res;
    } catch (err) {
      console.error("Network error checking settings:", err);
      return false;
    }
  }

  async function loadSettingsAccounts(res) {
    const container = document.getElementById("settings-accounts");
    if (!container) {
      console.error("Settings container not found");
      return;
    }
    container.replaceChildren(el("p", "", "Loading accounts…"));
    try {
      const body = await res.json();
      if (!body.status) throw new Error(body.reason || "Failed to load accounts");
      const data = body.data || {};
      const sections = SETTINGS_CATEGORIES.map(({ key, label }) => {
        const loginRoute = `/${key}/auth/login`;
        const accounts = data[key] || [];
        const section = el("div", "settings-category");
        section.appendChild(el("h3", "", label));
        if (accounts.length === 0) {
          section.appendChild(buildConnectBox(label, loginRoute));
          return section;
        }
        const list = el("div", "settings-account-list");
        accounts.forEach((acct, i) => {
          const row = el("label", "settings-account-row");
          const input = document.createElement("input");
          input.type = "checkbox";
          input.id = `${key}-${i}`;
          input.name = key;
          input.value = accountId(acct);
          input.checked = true;
          row.append(input, el("span", "", accountLabel(acct)));
          list.appendChild(row);
        });
        list.appendChild(
          buildConnectButton({ label, loginRoute, text: `+ Add another ${label} account`, extraClass: "add-more" })
        );
        section.appendChild(list);
        return section;
      });
      container.replaceChildren(...sections);
    } catch (err) {
      showError(container, `Failed to load accounts: ${err.message}`);
      console.error(err);
    }
  }

  function buildCampaignFormData(selectedFiles) {
    const fd = new FormData();
    fd.append("platform", fieldValue("platform-campaign"));
    fd.append("campaign_name", fieldValue("captt-campaign-cname"));
    fd.append("body", fieldValue("captt-campaign-text"));
    fd.append("target", JSON.stringify(splitList(fieldValue("captt-campaign-to"))));
    fd.append("name", JSON.stringify(splitList(fieldValue("captt-campaign-name"))));
    selectedFiles.forEach((file) => fd.append("file", file));
    return fd;
  }

  function buildPostFormData(selectedFiles) {
    const platform = fieldValue("platform-post");
    const saved = getSavedAccount(platform);
  if (!saved?.account_id) {
      alert(`No ${platform || "platform"} account connected`);
      return null;
    }
  const fd = new FormData();
    fd.append("platform", platform);
    fd.append("post_type", fieldValue("postType"));
    fd.append("username", saved.account_id);
    selectedFiles.forEach((file) => fd.append("file", file));
    return fd;
  }

  function buildPostEndpoint() {
    return `/${fieldValue("platform-post")}/upload/${fieldValue("postType")}`;
  }

  function initDropzoneUploader({ dropZoneId, fileInputId, formId, fileListId, textId, endpoint, buildFormData, successMessage }) {
    const dropZone = document.getElementById(dropZoneId);
    const fileInput = document.getElementById(fileInputId);
    const form = document.getElementById(formId);
    const fileListEl = document.getElementById(fileListId);
    const textForFile = document.getElementById(textId);
    if (!dropZone || !fileInput || !form || !fileListEl || !textForFile) {
      console.warn("Uploader init skipped, missing element for:", dropZoneId);
      return;
    }
    let selectedFiles = [];
  function syncInputFiles() {
      const dataTransfer = new DataTransfer();
      selectedFiles.forEach((file) => dataTransfer.items.add(file));
      fileInput.files = dataTransfer.files;
    }
  function updateBoxText() {
      textForFile.textContent = selectedFiles.length
        ? `${selectedFiles.length} file(s) selected`
        : "Drag & drop media for the upload";
    }
  function renderFileList() {
      fileListEl.replaceChildren(
        ...selectedFiles.map((file, index) => {
          const li = document.createElement("li");
          const removeBtn = el("button", "", "✕");
          removeBtn.type = "button";
          removeBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            selectedFiles.splice(index, 1);
            refresh();
          });
          li.append(el("span", "", `${index + 1}. ${file.name} (${(file.size / 1024).toFixed(1)} KB)`), removeBtn);
          return li;
        })
      );
    }
  function refresh() {
      syncInputFiles();
      renderFileList();
      updateBoxText();
    }
  function addFiles(newFiles) {
      Array.from(newFiles).forEach((file) => {
        const exists = selectedFiles.some((f) => f.name === file.name && f.size === file.size);
        if (!exists) selectedFiles.push(file);
      });
      refresh();
    }
  dropZone.addEventListener("click", (e) => {
      if (e.target.closest(`#${fileListId}`)) return;
      fileInput.click();
    });
    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.classList.add("dragover");
    });
    dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));
    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.classList.remove("dragover");
      addFiles(e.dataTransfer.files);
    });
    fileInput.addEventListener("change", () => addFiles(fileInput.files));
  form.addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        const path = typeof endpoint === "function" ? endpoint() : endpoint;
        const fd = buildFormData(selectedFiles);
        if (!fd) return;
        const res = await apiPost(path, fd);
        if (!res) return;
        const data = await res.json().catch(() => ({}));
        if (res.ok) alert(`${successMessage}: ${data.count ?? 0} recipient(s) processed`);
        else alert("Error: " + (data.error || "unknown error"));
      } catch (err) {
        alert("Upload failed: " + err.message);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    if (!(await getUserDetails())) return;
  const navItems = document.querySelectorAll(".nav-item[data-target]");
    const pages = document.querySelectorAll(".page");
    const pageTitle = document.getElementById("page-title");
  function showPage(target) {
      pages.forEach((page) => page.classList.toggle("active", page.id === `page-${target}`));
      navItems.forEach((item) => item.classList.toggle("active", item.dataset.target === target));
      if (pageTitle && PAGE_TITLES[target]) pageTitle.textContent = PAGE_TITLES[target];
      history.replaceState(null, "", `#${target}`);
    }
  const platformSelect = document.getElementById("platform-post");
    const postTypeSelect = document.getElementById("postType");
    const accountSelect = document.getElementById("accounts");
    let accountsData = {};
  function updatePostTypes() {
      if (!platformSelect || !postTypeSelect) return;
      const options = POST_TYPES[platformSelect.value] || [];
      postTypeSelect.replaceChildren(
        ...options.map((opt) => {
          const o = el("option", "", opt.label);
          o.value = opt.value;
          return o;
        })
      );
    }
  function updateAccountOptions() {
      if (!platformSelect || !accountSelect) return;
      const accounts = accountsData[platformSelect.value] || [];
      accountSelect.replaceChildren(
        ...accounts.map((acc) => {
          const o = el("option", "", accountLabel(acc));
          o.value = accountId(acc);
          return o;
        })
      );
    }
  accountsReady = fetchAccounts().then((data) => {
      accountsData = data;
      updateAccountOptions();
    });
    updatePostTypes();
    platformSelect?.addEventListener("change", () => {
      updatePostTypes();
      updateAccountOptions();
    });
  const checkers = Object.fromEntries(
      Object.entries(PLATFORMS).map(([key, cfg]) => [
        key,
        makeConnectionChecker({ storageKey: `${key}_account_id`, endpoint: cfg.endpoint }),
      ])
    );
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
      const platform = PLATFORMS[target];
        if (!platform) {
          showPage(target);
          return;
        }
      const res = await checkers[target]();
        if (res === null) {
          showPage(target);
          showConnectPrompt({
            containerId: platform.containerId,
            label: platform.label,
            loginRoute: `/${target}/auth/login`,
          });
          return;
        }
        if (!res) return;
        showPage(target);
        platform.render(res);
      });
    });
  const initial = window.location.hash.replace("#", "");
    if (initial && PAGE_TITLES[initial]) showPage(initial);
  document.getElementById("relogin-btn")?.addEventListener("click", () => showPage("dashboard"));
    document.querySelector(".support-btn")?.addEventListener("click", () => showPage("complaint"));
    document.getElementById("logout")?.addEventListener("click", () => {
      clearSavedAccounts();
      clearAuthCookie();
      redirectToLogin();
    });
  document.querySelectorAll(".multi-select").forEach((root) => {
      const trigger = root.querySelector(".multi-select-trigger");
      const optionsBox = root.querySelector(".multi-select-options");
      const label = root.querySelector(".multi-select-label");
      const checkboxes = root.querySelectorAll('input[type="checkbox"]');
    trigger?.addEventListener("click", () => optionsBox?.classList.toggle("open"));
      document.addEventListener("click", (e) => {
        if (!root.contains(e.target)) optionsBox?.classList.remove("open");
      });
      checkboxes.forEach((cb) => {
        cb.addEventListener("change", () => {
          const selected = Array.from(checkboxes).filter((c) => c.checked).map((c) => c.value);
          if (label) label.textContent = selected.length ? selected.join(", ") : "Select metrics";
        });
      });
    });
  initDropzoneUploader({
      dropZoneId: "dropZone-campaign",
      fileInputId: "fileInput-campaign",
      formId: "uploadForm-campaign",
      fileListId: "fileList-campaign",
      textId: "textforfile-campaign",
      endpoint: "/campaign",
      buildFormData: buildCampaignFormData,
      successMessage: "Campaign sent",
    });
  initDropzoneUploader({
      dropZoneId: "dropZone-post",
      fileInputId: "fileInput-post",
      formId: "uploadForm-post",
      fileListId: "fileList-post",
      textId: "textforfile-post",
      endpoint: buildPostEndpoint,
      buildFormData: buildPostFormData,
      successMessage: "Post submitted",
    });
  const complaintForm = document.getElementById("complaintForm");
    const complaintStatus = document.getElementById("complaint-status");
  complaintForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const bodyEl = document.getElementById("complaint-body");
      const text = bodyEl.value.trim();
      if (!text) return;
    complaintStatus.textContent = "Submitting…";
      try {
        const res = await apiPost("/complaint", { body: text });
        if (!res) return;
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
        complaintStatus.textContent = "Thanks, your issue has been submitted.";
        bodyEl.value = "";
      } catch (err) {
        complaintStatus.textContent = "Failed to submit: " + err.message;
        console.error(err);
      }
    });
  });