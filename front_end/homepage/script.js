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
  const titles = { dashboard: "Dashboard", campaign: "Campaign", instagram: "Instagram", whatsapp: "Whatsapp", gmail: "Gmail", create: "Create", settings: "Settings", logout: "Log-out", };

  // function
  function showPage(target) {
    pages.forEach((page) => {    page.classList.toggle("active", page.id === `page-${target}`);    });   // foreach loop , Loop through every section block one at a time.
    navItems.forEach((item) => {   item.classList.toggle("active", item.dataset.target === target);    });   // foreach loop , Loop through every sidebar link one at a time.
    if (pageTitle && titles[target]) {   pageTitle.textContent = titles[target];    }   // changes the heading to the title in sidebar
    history.replaceState(null, "", `#${target}`);   }      // Update the URL's hash (e.g. #instagram) without reloading the page.

  navItems.forEach((item) => {
    item.addEventListener("click", () => {   showPage(item.dataset.target);   });    });
  
    const initial = window.location.hash.replace("#", "");      // Read the URL's hash (if any) and strip the "#" symbol off it.
  if (initial && titles[initial]) {     showPage(initial);   }   // Only proceed if there was a hash and it matches a known section. Jump straight to that section on page load

  const reloginBtn = document.getElementById("relogin-btn");   // Grab the "Log back in" button from the Logout page.
  if (reloginBtn) {    reloginBtn.addEventListener("click", () => showPage("dashboard"));   }    });   // only proceed if that button actually exists on the page. When clicked, switch back to the Dashboard section.