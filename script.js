const API_URL = "https://script.google.com/a/macros/greenwichwaldorfschool.com/s/AKfycbxrA3h4Xi3tsiFXXUDWbJA06AqprKy9yUp2SyuMTsoehphnB0yq8eufbyOox-Fu4rd23g/exec";

let currentUser = null;
let allPosts = [];
let currentTab = "class";
let statFilter = "all";

window.onload = function () {
  lucide.createIcons();
};

async function apiGet(action, params = {}) {
  const url = new URL(API_URL);
  url.searchParams.set("action", action);

  Object.keys(params).forEach(key => {
    if (params[key]) url.searchParams.set(key, params[key]);
  });

  const res = await fetch(url.toString());
  return await res.json();
}

async function apiPost(action, payload = {}) {
  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: action,
      ...payload
    })
  });

  return await res.json();
}

async function login() {
  const email = document.getElementById("emailInput").value.trim();

  if (!email.endsWith("@greenwichwaldorfschool.com")) {
    alert("Please use your school email address.");
    return;
  }

  const res = await apiGet("getCurrentUser");

  if (!res.success) {
    alert(res.message);
    return;
  }

  currentUser = res.user;

  document.getElementById("landing").classList.add("hidden");
  document.getElementById("dashboard").classList.remove("hidden");
  document.getElementById("navMenu").classList.remove("hidden");
  document.getElementById("avatar").classList.remove("hidden");
  document.getElementById("avatar").innerText = currentUser.initial;

  document.querySelector(".profile-avatar").innerText = currentUser.initial;
  document.querySelector(".profile-card h1").innerText = currentUser.name;
  document.querySelector(".profile-card p").innerText =
    currentUser.role + " · " + currentUser.department;

  await loadDropdowns();
  await loadStats();
  await loadPosts();
}

function logout() {
  currentUser = null;

  document.getElementById("landing").classList.remove("hidden");
  document.getElementById("dashboard").classList.add("hidden");
  document.getElementById("newPost").classList.add("hidden");
  document.getElementById("profile").classList.add("hidden");
  document.getElementById("navMenu").classList.add("hidden");
  document.getElementById("avatar").classList.add("hidden");
}

function showView(view) {
  ["landing", "dashboard", "newPost", "profile"].forEach(id => {
    document.getElementById(id).classList.add("hidden");
  });

  document.getElementById(view).classList.remove("hidden");

  document.querySelectorAll(".nav button").forEach(btn => {
    btn.classList.remove("active");
  });

  lucide.createIcons();
}

async function loadDropdowns() {
  const res = await apiGet("getDropdowns");

  if (!res.success) return;

  fillSelect("classFilter", res.classes, "All classes", "");
  fillSelect("postClassInput", res.classes, "Whole School", "Whole School");

  fillSelect("subjectFilter", res.subjects, "All subjects", "");
  fillSelect("subjectInput", res.subjects, "General", "General");
}

function fillSelect(id, values, firstText, firstValue) {
  const select = document.getElementById(id);
  select.innerHTML = "";

  const first = document.createElement("option");
  first.textContent = firstText;
  first.value = firstValue;
  select.appendChild(first);

  values.forEach(value => {
    const option = document.createElement("option");
    option.textContent = value;
    option.value = value;
    select.appendChild(option);
  });
}

async function loadStats() {
  const res = await apiGet("getStats");

  if (!res.success) return;

  document.getElementById("totalPosts").innerText = res.totalPosts || 0;
  document.getElementById("pinnedPosts").innerText = res.pinned || 0;
  document.getElementById("urgentPosts").innerText = res.urgent || 0;
  document.getElementById("classPosts").innerText = res.classUpdates || 0;
  document.getElementById("adminPosts").innerText = res.adminNotices || 0;
  document.getElementById("coverPosts").innerText = res.coverNotices || 0;
}

async function loadPosts() {
  const res = await apiGet("getPosts");

  if (!res.success) {
    alert(res.message);
    return;
  }

  allPosts = res.posts || [];
  renderPosts();
}

function setTab(tab) {
  currentTab = tab;
  statFilter = "all";

  document.querySelectorAll(".tab").forEach(btn => {
    btn.classList.remove("active");
  });

  event.target.classList.add("active");
  renderPosts();
}

function filterByStat(type) {
  statFilter = type;
  renderPosts();
}

function renderPosts() {
  const list = document.getElementById("postList");
  const search = document.getElementById("searchInput").value.toLowerCase();
  const classFilter = document.getElementById("classFilter").value;
  const subjectFilter = document.getElementById("subjectFilter").value;

  let posts = [...allPosts];

  if (currentTab === "class") {
    posts = posts.filter(p => p.PostType === "Class Update");
  }

  if (currentTab === "admin") {
    posts = posts.filter(p => p.PostType === "Admin Notice");
  }

  if (currentTab === "cover") {
    posts = posts.filter(p =>
      p.PostType === "Cover Notice" || p.PostType === "Staff Notice"
    );
  }

  if (statFilter === "pinned") posts = posts.filter(p => p.IsPinned === "TRUE");
  if (statFilter === "urgent") posts = posts.filter(p => p.Priority === "Urgent");
  if (statFilter === "class") posts = posts.filter(p => p.PostType === "Class Update");
  if (statFilter === "admin") posts = posts.filter(p => p.PostType === "Admin Notice");
  if (statFilter === "cover") posts = posts.filter(p => p.PostType === "Cover Notice");

  if (classFilter) posts = posts.filter(p => p.ClassName === classFilter);
  if (subjectFilter) posts = posts.filter(p => p.SubjectName === subjectFilter);

  if (search) {
    posts = posts.filter(p =>
      String(p.Title).toLowerCase().includes(search) ||
      String(p.Content).toLowerCase().includes(search) ||
      String(p.AuthorName).toLowerCase().includes(search)
    );
  }

  if (!posts.length) {
    list.innerHTML = `
      <div class="empty-state">
        <h3>No posts found</h3>
        <p>Create a new post or change your filters.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = posts.map(post => `
    <div class="post-card">
      <div class="post-header">
        <div>
          <h3>${post.IsPinned === "TRUE" ? "📌 " : ""}${escapeHtml(post.Title)}</h3>
          <p>${escapeHtml(post.AuthorName)} · ${formatDate(post.Timestamp)}</p>
        </div>
      </div>

      <div class="post-tags">
        <span>${escapeHtml(post.PostType)}</span>
        <span>${escapeHtml(post.ClassName || "Whole School")}</span>
        <span>${escapeHtml(post.SubjectName || "General")}</span>
        <span class="${post.Priority === "Urgent" ? "urgent-tag" : ""}">
          ${escapeHtml(post.Priority || "Normal")}
        </span>
      </div>

      <p class="post-content">${escapeHtml(post.Content)}</p>

      <div class="post-actions">
        <button onclick="togglePin('${post.PostID}')">Pin / Unpin</button>
        <button onclick="deletePost('${post.PostID}')">Delete</button>
      </div>
    </div>
  `).join("");

  lucide.createIcons();
}

async function createPost() {
  const category = document.getElementById("categoryInput").value;

  const postTypeMap = {
    class: "Class Update",
    admin: "Admin Notice",
    cover: "Cover Notice"
  };

  const title = document.getElementById("titleInput").value.trim();
  const content = document.getElementById("contentInput").value.trim();

  if (!title || !content) {
    alert("Please add a title and content.");
    return;
  }

  const postData = {
    postType: postTypeMap[category],
    title: title,
    content: content,
    className: document.getElementById("postClassInput").value,
    subjectName: document.getElementById("subjectInput").value,
    priority: document.getElementById("urgentInput").checked ? "Urgent" : "Normal",
    visibility: "Staff Only",
    imageUrl: ""
  };

  const res = await apiPost("createPost", {
    data: postData
  });

  if (!res.success) {
    alert(res.message);
    return;
  }

  if (document.getElementById("pinnedInput").checked && res.postId) {
    await apiPost("togglePinPost", {
      postId: res.postId
    });
  }

  alert("Post published successfully.");

  document.getElementById("titleInput").value = "";
  document.getElementById("contentInput").value = "";
  document.getElementById("pinnedInput").checked = false;
  document.getElementById("urgentInput").checked = false;

  showView("dashboard");
  await loadStats();
  await loadPosts();
}

async function togglePin(postId) {
  const res = await apiPost("togglePinPost", {
    postId: postId
  });

  alert(res.message);
  await loadStats();
  await loadPosts();
}

async function deletePost(postId) {
  if (!confirm("Are you sure you want to delete this post?")) return;

  const res = await apiPost("deletePost", {
    postId: postId
  });

  alert(res.message);
  await loadStats();
  await loadPosts();
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("en-GB");
}

function escapeHtml(text) {
  if (!text) return "";

  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
