let currentTab = "class";
let currentUser = null;
let statFilter = "all";
let viewedPosts = [];
let userPinnedPosts = [];

let posts = [
  {
    id: 1,
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
    id: 2,
    title: "Class 7 Computing Update",
    category: "class",
    classGroup: "Class 7",
    subject: "Computing",
    content: "Students explored cloud computing concepts and discussed how services like storage, identity, and hosting work together.",
    author: "Naveen Kumar",
    authorEmail: "demo@greenwichwaldorfschool.com",
    date: new Date().toLocaleString(),
    urgent: false
  },
  {
    id: 3,
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
  lucide.createIcons();
  updateStats();
  renderPosts();
});

function login() {
  const email = document.getElementById("emailInput").value.trim().toLowerCase();

  if (!email) {
    alert("Please enter your school email address.");
    return;
  }

  if (!email.endsWith("@greenwichwaldorfschool.com")) {
    alert("Access restricted to Greenwich Waldorf School staff email addresses only.");
    return;
  }

  currentUser = {
    email: email,
    name: email.split("@")[0],
    role: email.includes("admin") || email.includes("naveen") || email.includes("demo") ? "admin" : "staff"
  };

  document.getElementById("landing").classList.add("hidden");
  document.getElementById("dashboard").classList.remove("hidden");
  document.getElementById("navMenu").classList.remove("hidden");
  document.getElementById("avatar").classList.remove("hidden");

  updateStats();
  renderPosts();
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

function createPost() {
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

  posts.unshift({
    id: Date.now(),
    title,
    category,
    classGroup,
    subject,
    content,
    author: currentUser ? currentUser.name : "Demo User",
    authorEmail: currentUser ? currentUser.email : "demo@greenwichwaldorfschool.com",
    date: new Date().toLocaleString(),
    urgent
  });

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

function markViewed(postId) {
  if (!viewedPosts.includes(postId)) {
    viewedPosts.push(postId);
  }

  renderPosts();
  updateStats();
}

function togglePin(postId) {
  if (userPinnedPosts.includes(postId)) {
    userPinnedPosts = userPinnedPosts.filter(id => id !== postId);
  } else {
    userPinnedPosts.push(postId);
  }

  renderPosts();
  updateStats();
}

function canDelete(post) {
  if (!currentUser || !post) return false;
  return currentUser.role === "admin" || post.authorEmail === currentUser.email;
}

function deletePost(postId) {
  const post = posts.find(p => p.id === postId);

  if (!canDelete(post)) {
    alert("Only the creator of the post or an admin can delete this post.");
    return;
  }

  if (confirm("Are you sure you want to delete this post?")) {
    posts = posts.filter(p => p.id !== postId);
    viewedPosts = viewedPosts.filter(id => id !== postId);
    userPinnedPosts = userPinnedPosts.filter(id => id !== postId);

    renderPosts();
    updateStats();
  }
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

  let filtered = posts.filter(post => !viewedPosts.includes(post.id));

  if (statFilter === "pinned") {
    filtered = filtered.filter(post => userPinnedPosts.includes(post.id));
  } else if (statFilter === "urgent") {
    filtered = filtered.filter(post => post.urgent);
  } else if (["class", "admin", "cover"].includes(statFilter)) {
    filtered = filtered.filter(post => post.category === statFilter);
  } else {
    filtered = filtered.filter(post => post.category === currentTab);
  }

  if (classFilter) {
    filtered = filtered.filter(post => post.classGroup === classFilter);
  }

  if (subjectFilter) {
    filtered = filtered.filter(post => post.subject === subjectFilter);
  }

  if (search) {
    filtered = filtered.filter(post =>
      post.title.toLowerCase().includes(search) ||
      post.content.toLowerCase().includes(search) ||
      post.classGroup.toLowerCase().includes(search) ||
      post.subject.toLowerCase().includes(search)
    );
  }

  filtered.sort((a, b) => {
    const aPinned = userPinnedPosts.includes(a.id);
    const bPinned = userPinnedPosts.includes(b.id);

    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return b.id - a.id;
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
          ${userPinnedPosts.includes(post.id) ? `<span class="pinned-badge">Pinned by you</span>` : ""}
          ${post.urgent ? `<span class="urgent-badge">Urgent</span>` : ""}
        </div>
      </div>

      <p>${post.content}</p>

      <div class="post-actions">
        <button class="viewed" onclick="markViewed(${post.id})">Viewed</button>

        <button onclick="togglePin(${post.id})">
          ${userPinnedPosts.includes(post.id) ? "Unpin for me" : "Pin for me"}
        </button>

        ${canDelete(post) ? `<button class="danger" onclick="deletePost(${post.id})">Delete</button>` : ""}
      </div>
    </article>
  `).join("");

  lucide.createIcons();
}

function updateStats() {
  const visiblePosts = posts.filter(post => !viewedPosts.includes(post.id));

  document.getElementById("totalPosts").textContent = visiblePosts.length;
  document.getElementById("pinnedPosts").textContent = visiblePosts.filter(p => userPinnedPosts.includes(p.id)).length;
  document.getElementById("urgentPosts").textContent = visiblePosts.filter(p => p.urgent).length;
  document.getElementById("classPosts").textContent = visiblePosts.filter(p => p.category === "class").length;
  document.getElementById("adminPosts").textContent = visiblePosts.filter(p => p.category === "admin").length;
  document.getElementById("coverPosts").textContent = visiblePosts.filter(p => p.category === "cover").length;
}
