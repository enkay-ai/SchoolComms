const API_URL = "https://script.google.com/macros/s/AKfycbxCwZP42LymO57XP6-Z33Ckkc7EgpoaHk1lmobcJhF7PBpd9aWratzw3ENpnEsxU981/exec";

let currentTab = "class";
let currentUser = null;
let statFilter = "all";

let posts = [];
let userPinnedPosts = [];
let viewedPosts = [];

const demoPosts = [
  {
    id: "1",
    title: "Welcome to SchoolComms",
    category: "admin",
    classGroup: "Whole School",
    subject: "Admin",
    content: "This platform centralises school announcements, class updates, and staff notices in one digital space.",
    author: "Admin Team",
    authorEmail: "admin@greenwichwaldorfschool.com",
    date: new Date().toLocaleString(),
    urgent: false
  },
  {
    id: "2",
    title: "Class 7 Computing Update",
    category: "class",
    classGroup: "Class 7",
    subject: "Computing",
    content: "Students explored cloud computing concepts and discussed how cloud services work together.",
    author: "Naveen Kumar",
    authorEmail: "demo@greenwichwaldorfschool.com",
    date: new Date().toLocaleString(),
    urgent: false
  },
  {
    id: "3",
    title: "Cover Needed: Upper School",
    category: "cover",
    classGroup: "Upper School",
    subject: "Admin",
    content: "Cover required for Upper School supervision tomorrow morning. Please respond if available.",
    author: "Staff Notice",
    authorEmail: "staff@greenwichwaldorfschool.com",
    date: new Date().toLocaleString(),
    urgent: true
  }
];

document.addEventListener("DOMContentLoaded", function () {
  posts = [...demoPosts];
  lucide.createIcons();
  updateStats();
  renderPosts();
});

async function apiRequest(action, data = {}) {
  if (!API_URL || API_URL.includes("PASTE_YOUR_APPS_SCRIPT")) {
    console.warn("Demo mode active. Apps Script API not connected yet.");
    return { success: false, demoMode: true };
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action, ...data })
    });

    return await response.json();
  } catch (error) {
    console.error("API error:", error);
    return { success: false, error: error.message };
  }
}

async function login() {
  const email = document.getElementById("emailInput").value.trim().toLowerCase();

  if (!email) {
    alert("Please enter your school email address.");
    return;
  }

  if (!email.endsWith("@greenwichwaldorfschool.com")) {
    alert("Access restricted to Greenwich Waldorf School staff email addresses only.");
    return;
  }

  const result = await apiRequest("login", { email });

  if (result.success) {
    currentUser = result.user;
    posts = result.posts || [];
    userPinnedPosts = result.pinnedPosts || [];
    viewedPosts = result.viewedPosts || [];
  } else {
    currentUser = {
      email,
      name: email.split("@")[0],
      role: email.includes("admin") || email.includes("demo") || email.includes("naveen") ? "Admin" : "Staff",
      department: "Demo Department"
    };
  }

  document.getElementById("landing").classList.add("hidden");
  document.getElementById("dashboard").classList.remove("hidden");
  document.getElementById("navMenu").classList.remove("hidden");
  document.getElementById("avatar").classList.remove("hidden");
  document.getElementById("avatar").textContent = currentUser.name.charAt(0).toUpperCase();

  logAction("LOGIN", `${currentUser.email} logged in`);

  updateStats();
  renderPosts();
  lucide.createIcons();
}

function logout() {
  logAction("LOGOUT", `${currentUser?.email || "User"} logged out`);

  currentUser = null;
  currentTab = "class";
  statFilter = "all";
  userPinnedPosts = [];
  viewedPosts = [];

  document.querySelectorAll("main section").forEach(section => {
    section.classList.add("hidden");
  });

  document.getElementById("landing").classList.remove("hidden");
  document.getElementById("navMenu").classList.add("hidden");
  document.getElementById("avatar").classList.add("hidden");
  document.getElementById("emailInput").value = "";

  lucide.createIcons();
}

function showView(viewId) {
  document.querySelectorAll("main section").forEach(section => {
    section.classList.add("hidden");
  });

  document.getElementById(viewId).classList.remove("hidden");
  lucide.createIcons();
}

function setTab(tab) {
  currentTab = tab;
  statFilter = "all";

  document.querySelectorAll(".tab").forEach(button => {
    button.classList.remove("active");
  });

  event.target.classList.add("active");
  renderPosts();
}

function filterByStat(type) {
  statFilter = type;

  if (["class", "admin", "cover"].includes(type)) {
    currentTab = type;
    setActiveTabButton(type);
  }

  renderPosts();
}

async function createPost() {
  const category = document.getElementById("categoryInput").value;
  const title = document.getElementById("titleInput").value.trim();
  const classGroup = document.getElementById("postClassInput").value;
  const subject = document.getElementById("subjectInput").value;
  const content = document.getElementById("contentInput").value.trim();
  const urgent = document.getElementById("urgentInput").checked;

  if (!title || !content) {
    alert("Please add a title and content.");
    return;
  }

  const newPost = {
    id: String(Date.now()),
    title,
    category,
    classGroup,
    subject,
    content,
    author: currentUser?.name || "Demo User",
    authorEmail: currentUser?.email || "demo@greenwichwaldorfschool.com",
    date: new Date().toLocaleString(),
    urgent
  };

  const result = await apiRequest("createPost", {
    email: currentUser.email,
    post: newPost
  });

  posts.unshift(result.success && result.post ? result.post : newPost);

  await logAction("CREATE_POST", `Created post: ${title}`);

  document.getElementById("titleInput").value = "";
  document.getElementById("contentInput").value = "";
  document.getElementById("urgentInput").checked = false;

  currentTab = category;
  statFilter = "all";
  showView("dashboard");
  setActiveTabButton(category);
  updateStats();
  renderPosts();
}

async function markViewed(postId) {
  if (!viewedPosts.includes(postId)) {
    viewedPosts.push(postId);
  }

  await apiRequest("markViewed", {
    email: currentUser.email,
    postId
  });

  await logAction("MARK_VIEWED", `Marked post ${postId} as viewed`);

  renderPosts();
  updateStats();
}

async function togglePin(postId) {
  let actionText = "";

  if (userPinnedPosts.includes(postId)) {
    userPinnedPosts = userPinnedPosts.filter(id => id !== postId);
    actionText = "UNPIN_POST";
  } else {
    userPinnedPosts.push(postId);
    actionText = "PIN_POST";
  }

  await apiRequest("togglePin", {
    email: currentUser.email,
    postId
  });

  await logAction(actionText, `${actionText} ${postId}`);

  renderPosts();
  updateStats();
}

function canDelete(post) {
  if (!currentUser || !post) return false;

  return (
    currentUser.role.toLowerCase() === "admin" ||
    post.authorEmail.toLowerCase() === currentUser.email.toLowerCase()
  );
}

async function deletePost(postId) {
  const post = posts.find(p => String(p.id) === String(postId));

  if (!canDelete(post)) {
    alert("Only the creator of the post or an admin can delete this post.");
    return;
  }

  if (!confirm("Are you sure you want to delete this post?")) return;

  const result = await apiRequest("deletePost", {
    email: currentUser.email,
    postId
  });

  posts = posts.filter(p => String(p.id) !== String(postId));
  viewedPosts = viewedPosts.filter(id => String(id) !== String(postId));
  userPinnedPosts = userPinnedPosts.filter(id => String(id) !== String(postId));

  await logAction("DELETE_POST", `Deleted post: ${post?.title || postId}`);

  renderPosts();
  updateStats();
}

async function logAction(action, details) {
  if (!currentUser) return;

  await apiRequest("logAction", {
    email: currentUser.email,
    log: {
      timestamp: new Date().toLocaleString(),
      userEmail: currentUser.email,
      action,
      details
    }
  });
}

function setActiveTabButton(category) {
  document.querySelectorAll(".tab").forEach(button => {
    button.classList.remove("active");

    if (
      (category === "class" && button.textContent.includes("Class")) ||
      (category === "admin" && button.textContent.includes("Admin")) ||
      (category === "cover" && button.textContent.includes("Cover"))
    ) {
      button.classList.add("active");
    }
  });
}

function renderPosts() {
  const postList = document.getElementById("postList");
  if (!postList) return;

  const search = document.getElementById("searchInput")?.value.toLowerCase() || "";
  const classFilter = document.getElementById("classFilter")?.value || "";
  const subjectFilter = document.getElementById("subjectFilter")?.value || "";

  let filtered = posts.filter(post => !viewedPosts.includes(String(post.id)));

  if (statFilter === "pinned") {
    filtered = filtered.filter(post => userPinnedPosts.includes(String(post.id)));
  } else if (statFilter === "urgent") {
    filtered = filtered.filter(post => post.urgent === true || post.urgent === "TRUE");
  } else if (["class", "admin", "cover"].includes(statFilter)) {
    filtered = filtered.filter(post => post.category === statFilter);
  } else {
    filtered = filtered.filter(post => post.category === currentTab);
  }

  if (classFilter) filtered = filtered.filter(post => post.classGroup === classFilter);
  if (subjectFilter) filtered = filtered.filter(post => post.subject === subjectFilter);

  if (search) {
    filtered = filtered.filter(post =>
      post.title.toLowerCase().includes(search) ||
      post.content.toLowerCase().includes(search) ||
      post.classGroup.toLowerCase().includes(search) ||
      post.subject.toLowerCase().includes(search)
    );
  }

  filtered.sort((a, b) => {
    const aPinned = userPinnedPosts.includes(String(a.id));
    const bPinned = userPinnedPosts.includes(String(b.id));

    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;

    return Number(b.id) - Number(a.id);
  });

  if (filtered.length === 0) {
    postList.innerHTML = `
      <div class="empty-state">
        <i data-lucide="inbox"></i>
        <h3>No posts here</h3>
        <p>No posts match this filter, or they have already been marked as viewed.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  postList.innerHTML = filtered.map(post => `
    <article class="post-card">
      <div class="post-top">
        <div>
          <h3>${post.title}</h3>
          <div class="meta">${post.author} · ${post.date}</div>
        </div>

        <div class="badges">
          <span>${post.classGroup}</span>
          <span>${post.subject}</span>
          ${userPinnedPosts.includes(String(post.id)) ? `<span class="pinned-badge">Pinned by you</span>` : ""}
          ${post.urgent === true || post.urgent === "TRUE" ? `<span class="urgent-badge">Urgent</span>` : ""}
        </div>
      </div>

      <p>${post.content}</p>

      <div class="post-actions">
        <button class="viewed" onclick="markViewed('${post.id}')">Viewed</button>

        <button onclick="togglePin('${post.id}')">
          ${userPinnedPosts.includes(String(post.id)) ? "Unpin for me" : "Pin for me"}
        </button>

        ${canDelete(post) ? `<button class="danger" onclick="deletePost('${post.id}')">Delete</button>` : ""}
      </div>
    </article>
  `).join("");

  lucide.createIcons();
}

function updateStats() {
  const visiblePosts = posts.filter(post => !viewedPosts.includes(String(post.id)));

  document.getElementById("totalPosts").textContent = visiblePosts.length;
  document.getElementById("pinnedPosts").textContent = visiblePosts.filter(p => userPinnedPosts.includes(String(p.id))).length;
  document.getElementById("urgentPosts").textContent = visiblePosts.filter(p => p.urgent === true || p.urgent === "TRUE").length;
  document.getElementById("classPosts").textContent = visiblePosts.filter(p => p.category === "class").length;
  document.getElementById("adminPosts").textContent = visiblePosts.filter(p => p.category === "admin").length;
  document.getElementById("coverPosts").textContent = visiblePosts.filter(p => p.category === "cover").length;
}
