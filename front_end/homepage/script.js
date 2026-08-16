// async function getUserDetails() {
//     const token = localStorage.getItem("authToken"); 
//     if (!token){
//         return false}
//     try {
//     const response = await fetch("backend_user_check_url", {
//       method: "GET", // or POST if you're sending a body too
//       headers: {
//         "Content-Type": "application/json",
//         "Authorization": `Bearer ${token}`
//       }});
//     if (!response.ok) {
//       if (response.status === 401) {
//         console.error("Token invalid or expired");
//       }
//       throw new Error(`HTTP ${response.status}`);
//     }
//     const data = await response.json();
//     if (data.status){
//         return true }}   
//      catch (err) {
//     console.error("Request failed:", err);
//   }
// }


document.addEventListener("DOMContentLoaded", () => {
  const navItems = document.querySelectorAll(".nav-item[data-target]");
  const pages = document.querySelectorAll(".page");
  const pageTitle = document.getElementById("page-title");

  // Human-readable titles for the topbar heading per section
  const titles = {
    dashboard: "Dashboard",
    campaign: "Campaign",
    instagram: "Instagram",
    whatsapp: "Whatsapp",
    gmail: "Gmail",
    create: "Create",
    settings: "Settings",
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

    // Keep the URL shareable/bookmarkable without a full reload
    history.replaceState(null, "", `#${target}`);
  }

  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      showPage(item.dataset.target);
    });
  });

  // Support direct links like index.html#instagram
  const initial = window.location.hash.replace("#", "");
  if (initial && titles[initial]) {
    showPage(initial);
  }

  // "Log back in" button on the logout page returns to the dashboard
  const reloginBtn = document.getElementById("relogin-btn");
  if (reloginBtn) {
    reloginBtn.addEventListener("click", () => showPage("dashboard"));
  }
});