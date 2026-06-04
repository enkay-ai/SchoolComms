let currentTab = "class";
let currentUser = null;

let posts = [
  {
    title: "Welcome to SchoolComms",
    category: "admin",
    classGroup: "Whole School",
    subject: "Admin",
    content: "This platform centralises school announcements, class updates, and staff notices in one digital space.",
    author: "Admin Team",
    date: new Date().toLocaleString(),
    pinned: true,
    urgent: false
  },
  {
    title: "Class 7 Computing Update",
    category: "class",
    classGroup: "Class 7",
    subject: "Computing",
    content: "Students explored cloud computing concepts and discussed how services like storage, identity, and hosting work together.",
    author: "Naveen Kumar",
    date: new Date().toLocaleString(),
    pinned: false,
    urgent: false
  },
  {
    title: "Cover Needed: Upper School",
    category: "cover",
    classGroup: "Upper School",
    subject: "Admin",
    content: "Cover required for Upper School supervision tomorrow morning. Please respond if available.",
    author: "Staff Notice",
    date: new Date().toLocaleString(),
    pinned: false,
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
    name: email.split("@")[0]
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

  document.querySelectorAll(".nav button").forEach(btn => {
    btn.classList.remove("active");
  });

  lucide.createIcons();
}

function setTab(tab) {
  currentTab = tab;

  document.querySelectorAll(".tab").forEach(button => {
    button.classList.remove("active");
  });

  event.target.classList.add("active");
  renderPosts();
}

function createPost() {
  const category = document.getElementById("categoryInput").value;
  const title = document.getElementById("titleInput").value.trim();
  const classGroup = document.getElementById("postClassInput").value;
  const subject = document.getElementById("subjectInput").value;
  const content = document.getElementById("contentInput").value.trim();
  const pinned = document.getElementById("pinnedInput").checked;
  const urgent = document.getElementById("urgentInput").checked;

  if (!title || !content) {
    alert("Please add a title and content.");
    return;
  }

  posts.unshift({
    title,
    category,
    classGroup,
    subject,
    content,
    author: currentUser ? currentUser.name : "Demo User",
    date: new Date().toLocaleString(),
    pinned,
    urgent
  });

  document.getElementById("titleInput").value = "";
  document.getElementById("contentInput").value = "";
  document.getElementById("pinnedInput").checked = false;
  document.getElementById("urgentInput").checked = false;

  currentTab = category;
  showView("dashboard");
  setActiveTabButton(category);
  updateStats();
  renderPosts();
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

  let filtered = posts.filter(post => post.category === currentTab);

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
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });

  if (filtered.length === 0) {
    postList.innerHTML = `
      <div class="empty-state">
        <i data-lucide="inbox"></i>
        <h3>No posts yet</h3>
        <p>Create a new post to populate this section.</p>
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
          ${post.pinned ? `<span class="pinned-badge">Pinned</span>` : ""}
          ${post.urgent ? `<span class="urgent-badge">Urgent</span>` : ""}
        </div>
      </div>

      <p>${post.content}</p>
    </article>
  `).join("");

  lucide.createIcons();
}

function updateStats() {
  document.getElementById("totalPosts").textContent = posts.length;
  document.getElementById("pinnedPosts").textContent = posts.filter(p => p.pinned).length;
  document.getElementById("urgentPosts").textContent = posts.filter(p => p.urgent).length;
  document.getElementById("classPosts").textContent = posts.filter(p => p.category === "class").length;
  document.getElementById("adminPosts").textContent = posts.filter(p => p.category === "admin").length;
  document.getElementById("coverPosts").textContent = posts.filter(p => p.category === "cover").length;
}
