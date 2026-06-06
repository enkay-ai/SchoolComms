document.addEventListener("DOMContentLoaded", function () {
    const loginBtn = document.getElementById("loginBtn");

    if (loginBtn) {
        loginBtn.addEventListener("click", login);
    }
});

let posts = [];
let coverRequests = [];

function login() {
    const emailInput = document.getElementById("emailInput");
    const loginScreen = document.getElementById("loginScreen");
    const app = document.getElementById("app");

    if (!emailInput || !loginScreen || !app) {
        alert("Page elements not found. Please check index.html IDs.");
        return;
    }

    const email = emailInput.value.trim().toLowerCase();

    if (email === "") {
        alert("Please enter an email address.");
        return;
    }

    if (!email.endsWith("@greenwichwaldorfschool.com")) {
        alert("Access restricted to Greenwich Waldorf School staff emails only.");
        return;
    }

    loginScreen.style.display = "none";
    app.classList.remove("hidden");
    app.style.display = "flex";
}

function showSection(sectionId) {
    document.querySelectorAll(".section").forEach(section => {
        section.classList.remove("active");
    });

    document.getElementById(sectionId).classList.add("active");
}

function addPost() {
    const input = document.getElementById("postInput");
    const content = input.value.trim();

    if (!content) return;

    posts.unshift({
        text: content,
        date: new Date().toLocaleString(),
        likes: 0
    });

    renderPosts();
    input.value = "";
}

function renderPosts() {
    const postList = document.getElementById("postList");
    postList.innerHTML = "";

    posts.forEach((post, index) => {
        const div = document.createElement("div");
        div.className = "post";

        div.innerHTML = `
            <p>${post.text}</p>
            <small>${post.date}</small>
            <br><br>
            <button onclick="likePost(${index})">👍 Like (${post.likes})</button>
        `;

        postList.appendChild(div);
    });
}

function likePost(index) {
    posts[index].likes++;
    renderPosts();
}

function addCoverRequest() {
    const input = document.getElementById("coverInput");
    const text = input.value.trim();

    if (!text) return;

    coverRequests.unshift({
        text: text,
        status: "Open"
    });

    renderCoverRequests();
    input.value = "";
}

function renderCoverRequests() {
    const coverList = document.getElementById("coverList");
    coverList.innerHTML = "";

    coverRequests.forEach((request, index) => {
        const div = document.createElement("div");
        div.className = "post";

        div.innerHTML = `
            <h4>${request.text}</h4>
            <p>Status: ${request.status}</p>
            <button onclick="markCovered(${index})">Mark Covered</button>
        `;

        coverList.appendChild(div);
    });
}

function markCovered(index) {
    coverRequests[index].status = "Covered";
    renderCoverRequests();
}
