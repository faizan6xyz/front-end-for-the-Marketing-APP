"use strict";
const API_BASE = "https://influenced-leone-reproduce-advisory.trycloudflare.com".trim().replace(/\/+$/, "");
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
const ACCOUNT_KEYS = SETTINGS_CATEGORIES.map((c) => c.key);
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
  instagram: { label: "Instagram", containerId: "hello_insta", endpoint: "/instagram/posts/", kind: "posts", cardClass: "insta-card" },
  gmail: { label: "Gmail", containerId: "hello_gmail", endpoint: "/gmail/sent/", kind: "messages", cardClass: "gmail-card", toField: "to" },
  whatsapp: { label: "WhatsApp", containerId: "hello_whatsapp", endpoint: "/whatsapp/sent/", kind: "messages", cardClass: "whatsapp-card", toField: "to" },
  x: { label: "X", containerId: "hello_x", endpoint: "/x/posts/", kind: "posts", cardClass: "x-card" },
  pinterest: { label: "Pinterest", containerId: "hello_pinterest", endpoint: "/pinterest/pins/", kind: "posts", cardClass: "pinterest-card" },
  youtube: { label: "YouTube", containerId: "hello_youtube", endpoint: "/youtube/shorts/", kind: "posts", cardClass: "youtube-card" },
  threads: { label: "Threads", containerId: "hello_threads", endpoint: "/threads/posts/", kind: "posts", cardClass: "threads-card" },
};

const LIST_VIEWS = {
  posts: {
    listKey: "posts",
    loadingText: "Loading posts…",
    emptyText: "No posts found.",
    build: (item, cfg) => buildSocialCard(item, cfg),
  },
  messages: {
    listKey: "messages",
    loadingText: "Loading messages…",
    emptyText: "No sent messages found.",
    build: (item, cfg) => buildMessageCard(item, cfg),
  },
};

const $ = (id) => document.getElementById(id);
const fieldValue = (id) => $(id)?.value.trim() ?? "";
const splitList = (raw) => (raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : []);
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
const accountId = (a) => (a && typeof a === "object" ? (a.account_id ?? a.id) : a);
const accountLabel = (a) => (a && typeof a === "object" ? (a.username || a.name || a.id || a.account_id) : a);

function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function getSavedAccount(key) {
  try {
    return JSON.parse(localStorage.getItem(`${key}_account`)) || null;
  } catch {
    return null;
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

/* ───────────── API / auth ───────────── */
let accountsReady = Promise.resolve();
let refreshPromise = null;

async function apiPost(path, payload = {}, { query, ensure = true, withToken = true } = {}) {
  if (ensure && !(await ensureAuthToken())) return null;
  const token = withToken ? getCookie("authToken") : null;
  const headers = { "Request-ID": crypto.randomUUID() };
  let body;
  if (payload instanceof FormData) {
    if (token && !payload.has("token")) payload.append("token", token);
    body = payload;
  } else {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(withToken ? { token, ...payload } : payload);
  }
  const qs = query ? `?${new URLSearchParams(query)}` : "";
  return fetch(`${API_BASE}${path}${qs}`, { method: "POST", credentials: "include", headers, body });
}

// Concurrent callers share a single /refresh request.
function ensureAuthToken() {
  if (getCookie("authToken")) return Promise.resolve(true);
  refreshPromise ??= (async () => {
    try {
      const res = await apiPost("/refresh", {}, { ensure: false, withToken: false });
      if (res.ok) return true;
      console.error("Refresh failed:", res.status);
    } catch (err) {
      console.error("Refresh request failed:", err);
    }
    return redirectToLogin();
  })().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

async function verifySession() {
  if (!(await ensureAuthToken())) return false;
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

// One place that calls /vrify; returns parsed JSON or null.
async function postVerify() {
  try {
    const res = await apiPost("/vrify");
    if (!res) return null;
    if (res.status === 401) {
      redirectToLogin();
      return null;
    }
    if (!res.ok) {
      console.error("/vrify failed:", res.status);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error("Network error calling /vrify:", err);
    return null;
  }
}

function syncAccountIdsToStorage(data) {
  ACCOUNT_KEYS.forEach((key) => {
    const first = Array.isArray(data[key]) ? data[key][0] : null;
    const id = first ? accountId(first) : null;
    if (id != null) {
      localStorage.setItem(`${key}_account_id`, String(id));
      localStorage.setItem(`${key}_account`, JSON.stringify({ name: accountLabel(first), account_id: String(id) }));
    } else {
      localStorage.removeItem(`${key}_account_id`);
      localStorage.removeItem(`${key}_account`);
    }
  });
}

async function fetchAccounts() {
  const json = await postVerify();
  const data = json?.data || {};
  syncAccountIdsToStorage(data);
  return data;
}

/* ───────────── Connect buttons ───────────── */
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
  box.append(el("p", "", `No ${label} account connected`), buildConnectButton({ label, loginRoute, text: `Connect ${label}` }));
  return box;
}

function buildSocialCard(post, { cardClass }) {
  const card = el("div", cardClass);
  const src = post.thumbnail_url || post.media_url;
  if (src) {
    const img = document.createElement("img");
    img.src = src;
    img.alt = post.caption ? post.caption.slice(0, 60) : "Post";
    img.loading = "lazy";
    card.appendChild(img); }
  const stats = el("div", "stats");
  [["♥", post.like_count], ["💬", post.comments_count]].forEach(([icon, count]) => {
    const stat = el("span");
    stat.append(el("span", "label", icon), ` ${count ?? 0}`);
    stats.appendChild(stat); });
  const body = el("div", "body");
  body.append(el("p", "caption", post.caption || ""), stats);
  if (post.workflow) {
    const wf = el("div", "workflow");
    [["Comment", post.workflow.comment], ["Message", post.workflow.message]].forEach(([label, text]) => {
      if (!text) return;
      const row = el("p", "workflow-row");
      row.append(el("span", "label", `${label}: `), text);
      wf.appendChild(row); });
    body.appendChild(wf); }
  card.appendChild(body);
  return card; }

function buildMessageCard(msg, { cardClass, toField = "to" }) {
  const card = el("div", cardClass);
  const header = el("div", "header");
  header.append(
    el("span", "to", `To: ${msg[toField] || "Unknown"}`),
    el("span", "date", msg.sent_at ? new Date(msg.sent_at).toLocaleString() : "")
  );
  const bodyText = el("p", msg.subject !== undefined ? "subject" : "body", msg.subject || msg.text || "(no content)");
  const status = el("span");
  status.append(el("span", "label", "Status:"), ` ${msg.status || "sent"}`);
  const stats = el("div", "stats");
  stats.appendChild(status);

  card.append(header, bodyText);
  if (msg.snippet) card.appendChild(el("p", "snippet", msg.snippet));
  card.appendChild(stats);
  return card;
}

async function renderCards(container, res, cfg) {
  const view = LIST_VIEWS[cfg.kind];
  try {
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    const items = (await res.json())[view.listKey] || [];
    if (!items.length) {
      container.replaceChildren(el("p", "", view.emptyText));
      return;
    }
    container.replaceChildren(...items.map((item) => view.build(item, cfg)));
  } catch (err) {
    showError(container, `Failed to load: ${err.message}`);
    console.error(err);
  }
}

async function loadPlatform(key) {
  const cfg = PLATFORMS[key];
  const container = $(cfg.containerId);
  if (!container) {
    console.error("Container not found:", cfg.containerId);
    return;
  }
  await accountsReady;
  const username = localStorage.getItem(`${key}_account_id`);
  if (!username) {
    container.replaceChildren(buildConnectBox(cfg.label, `/${key}/auth/login`));
    return;
  }
  container.replaceChildren(el("p", "", LIST_VIEWS[cfg.kind].loadingText));
  try {
    const res = await apiPost(cfg.endpoint, { username });
    if (!res) return;
    if (res.status === 401) {
      redirectToLogin();
      return;
    }
    await renderCards(container, res, cfg);
  } catch (err) {
    showError(container, `Failed to load: ${err.message}`);
    console.error(`Network error loading ${key}:`, err);
  }
}

/* ───────────── Settings page ───────────── */
async function loadSettings() {
  const container = $("settings-accounts");
  if (!container) {
    console.error("Settings container not found");
    return;
  }
  container.replaceChildren(el("p", "", "Loading accounts…"));
  const body = await postVerify();
  if (!body) {
    showError(container, "Failed to load accounts");
    return;
  }
  if (!body.status) {
    showError(container, `Failed to load accounts: ${body.reason || "unknown error"}`);
    return;
  }
  const data = body.data || {};
  const sections = SETTINGS_CATEGORIES.map(({ key, label }) => {
    const loginRoute = `/${key}/auth/login`;
    const accounts = data[key] || [];
    const section = el("div", "settings-category");
    section.appendChild(el("h3", "", label));
    if (!accounts.length) {
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
    list.appendChild(buildConnectButton({ label, loginRoute, text: `+ Add another ${label} account`, extraClass: "add-more" }));
    section.appendChild(list);
    return section;
  });
  container.replaceChildren(...sections);
}

/* ───────────── Upload forms ───────────── */
function buildCampaignFormData(files) {
  const fd = new FormData();
  fd.append("platform", fieldValue("platform-campaign"));
  fd.append("campaign_name", fieldValue("captt-campaign-cname"));
  fd.append("body", fieldValue("captt-campaign-text"));
  fd.append("target", JSON.stringify(splitList(fieldValue("captt-campaign-to"))));
  fd.append("name", JSON.stringify(splitList(fieldValue("captt-campaign-name"))));
  files.forEach((file) => fd.append("file", file));
  return fd;
}

function buildPostFormData(files) {
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
  files.forEach((file) => fd.append("file", file));
  return fd;
}

const buildPostEndpoint = () => `/${fieldValue("platform-post")}/upload/${fieldValue("postType")}`;

function initDropzoneUploader({ dropZoneId, fileInputId, formId, fileListId, textId, endpoint, buildFormData, successMessage }) {
  const dropZone = $(dropZoneId);
  const fileInput = $(fileInputId);
  const form = $(formId);
  const fileListEl = $(fileListId);
  const textForFile = $(textId);
  if (!dropZone || !fileInput || !form || !fileListEl || !textForFile) {
    console.warn("Uploader init skipped, missing element for:", dropZoneId);
    return;
  }
  const submitBtn = form.querySelector('[type="submit"]');
  let selectedFiles = [];

  function refresh() {
    const dt = new DataTransfer();
    selectedFiles.forEach((f) => dt.items.add(f));
    fileInput.files = dt.files;

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
    textForFile.textContent = selectedFiles.length ? `${selectedFiles.length} file(s) selected` : "Drag & drop media for the upload";
  }

  function addFiles(newFiles) {
    for (const file of newFiles) {
      if (!selectedFiles.some((f) => f.name === file.name && f.size === file.size)) selectedFiles.push(file);
    }
    refresh();
  }

  dropZone.addEventListener("click", (e) => {
    if (!e.target.closest(`#${fileListId}`)) fileInput.click();
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
    if (submitBtn?.disabled) return;
    const fd = buildFormData(selectedFiles);
    if (!fd) return;
    if (submitBtn) submitBtn.disabled = true; // prevent double submits
    try {
      const res = await apiPost(typeof endpoint === "function" ? endpoint() : endpoint, fd);
      if (!res) return;
      const data = await res.json().catch(() => ({}));
      if (res.ok) alert(`${successMessage}: ${data.count ?? 0} recipient(s) processed`);
      else alert("Error: " + (data.error || "unknown error"));
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

/* ───────────── Bootstrap ───────────── */
document.addEventListener("DOMContentLoaded", async () => {
  if (!(await verifySession())) return;

  const navItems = document.querySelectorAll(".nav-item[data-target]");
  const pages = document.querySelectorAll(".page");
  const pageTitle = $("page-title");
  const platformSelect = $("platform-post");
  const postTypeSelect = $("postType");
  const accountSelect = $("accounts");
  let accountsData = {};

  function showPage(target) {
    pages.forEach((page) => page.classList.toggle("active", page.id === `page-${target}`));
    navItems.forEach((item) => item.classList.toggle("active", item.dataset.target === target));
    if (pageTitle && PAGE_TITLES[target]) pageTitle.textContent = PAGE_TITLES[target];
    history.replaceState(null, "", `#${target}`);
  }

  // Show the page right away, then load its data (also used for deep links like #instagram).
  async function navigate(target) {
    showPage(target);
    if (target === "settings") return loadSettings();
    if (PLATFORMS[target]) return loadPlatform(target);
  }

  function updatePostTypes() {
    if (!platformSelect || !postTypeSelect) return;
    postTypeSelect.replaceChildren(
      ...(POST_TYPES[platformSelect.value] || []).map((opt) => {
        const o = el("option", "", opt.label);
        o.value = opt.value;
        return o;
      })
    );
  }

  function updateAccountOptions() {
    if (!platformSelect || !accountSelect) return;
    accountSelect.replaceChildren(
      ...(accountsData[platformSelect.value] || []).map((acc) => {
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

  navItems.forEach((item) => item.addEventListener("click", () => navigate(item.dataset.target)));

  const initial = window.location.hash.slice(1);
  if (initial && PAGE_TITLES[initial]) navigate(initial);

  $("relogin-btn")?.addEventListener("click", () => showPage("dashboard"));
  document.querySelector(".support-btn")?.addEventListener("click", () => showPage("complaint"));
  $("logout")?.addEventListener("click", () => {
    clearSavedAccounts();
    clearAuthCookie();
    redirectToLogin();
  });

  // Multi-selects: one shared outside-click listener instead of one per widget.
  document.querySelectorAll(".multi-select").forEach((root) => {
    const optionsBox = root.querySelector(".multi-select-options");
    const label = root.querySelector(".multi-select-label");
    const checkboxes = root.querySelectorAll('input[type="checkbox"]');
    root.querySelector(".multi-select-trigger")?.addEventListener("click", () => optionsBox?.classList.toggle("open"));
    checkboxes.forEach((cb) =>
      cb.addEventListener("change", () => {
        const selected = Array.from(checkboxes).filter((c) => c.checked).map((c) => c.value);
        if (label) label.textContent = selected.length ? selected.join(", ") : "Select metrics";
      })
    );
  });
  document.addEventListener("click", (e) => {
    document.querySelectorAll(".multi-select-options.open").forEach((box) => {
      if (!box.closest(".multi-select")?.contains(e.target)) box.classList.remove("open");
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

  const complaintForm = $("complaintForm");
  const complaintStatus = $("complaint-status");
  complaintForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const bodyEl = $("complaint-body");
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