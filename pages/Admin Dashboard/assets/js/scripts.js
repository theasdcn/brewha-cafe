const API_BASE = window.location.pathname.includes('/ECOM-FINALS1/')
  ? `${window.location.origin}/ECOM-FINALS1/api`
  : `${window.location.origin}/api`;

let dashboardState = {
  products: [],
  users: []
};

let activeCategory = "drinks";
let selectedUserId = null;
let currentAdmin = null;

document.addEventListener("DOMContentLoaded", async () => {
  bindStaticEvents();

  const allowed = await ensureAdminSession();
  if (!allowed) return;

  await loadDashboard();
});

function bindStaticEvents() {
  bindDropdown();
  bindCategoryButtons();
  bindRefreshButton();
  bindInlineButtons();
  bindProductModal();
  bindUserModal();
}

function showPopupMessage(message, type = "success", redirectUrl = null) {
  const popup = document.createElement("div");
  popup.className = `custom-popup ${type}`;
  popup.innerHTML = `<span class="popup-text">${message}</span>`;
  document.body.appendChild(popup);

  setTimeout(() => {
    popup.style.opacity = "0";
    setTimeout(() => {
      popup.remove();
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    }, 300);
  }, 1500);
}

async function safeJson(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(text || "Invalid server response.");
  }
}

async function ensureAdminSession() {
  try {
    const response = await fetch(`${API_BASE}/auth/me.php`, {
      credentials: "same-origin",
      cache: "no-store"
    });

    const data = await safeJson(response);

    if (!data.loggedIn) {
      showPopupMessage(
        "Please login first.",
        "error",
        "../Login Page/index.html"
      );
      return false;
    }

    if ((data.user?.role || "") !== "admin") {
      showPopupMessage(
        "Admin access only.",
        "error",
        "../../index.html"
      );
      return false;
    }

    currentAdmin = data.user;
    return true;
  } catch (error) {
    console.error("ensureAdminSession error:", error);
    showPopupMessage(
      "Session check failed.",
      "error",
      "../Login Page/index.html"
    );
    return false;
  }
}

function bindDropdown() {
  const accountDropdown = document.getElementById("accountDropdown");
  const dropdownMenu = document.getElementById("dropdownMenu");
  const logoutLink = document.getElementById("logoutLink");
  const adminProfileLink = document.getElementById("adminProfileLink");

  if (!accountDropdown || !dropdownMenu) return;

  accountDropdown.addEventListener("click", (event) => {
    event.stopPropagation();
    dropdownMenu.classList.toggle("show");
    const expanded = accountDropdown.getAttribute("aria-expanded") === "true";
    accountDropdown.setAttribute("aria-expanded", String(!expanded));
  });

  dropdownMenu.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  document.addEventListener("click", (event) => {
    if (!accountDropdown.contains(event.target)) {
      dropdownMenu.classList.remove("show");
      accountDropdown.setAttribute("aria-expanded", "false");
    }
  });

  if (adminProfileLink) {
    adminProfileLink.addEventListener("click", (e) => {
      e.preventDefault();
      showPopupMessage(
        currentAdmin ? `Logged in as ${currentAdmin.name}` : "Admin profile",
        "success"
      );
    });
  }

  if (logoutLink) {
    logoutLink.addEventListener("click", handleLogout);
  }
}

async function handleLogout(event) {
  event.preventDefault();

  try {
    const response = await fetch(`${API_BASE}/auth/logout.php`, {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store"
    });

    const data = await safeJson(response);

    if (data.success) {
      showPopupMessage(
        "Logged out successfully!",
        "success",
        "../Login Page/index.html"
      );
    } else {
      showPopupMessage(data.message || "Logout failed.", "error");
    }
  } catch (error) {
    console.error("logout error:", error);
    window.location.href = "../Login Page/index.html";
  }
}

function bindCategoryButtons() {
  document.querySelectorAll(".category-btn[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category;
      updateCategoryActiveState();
      renderProducts();
    });
  });
}

function bindRefreshButton() {
  const refreshBtn = document.getElementById("refreshDashboardBtn");
  if (!refreshBtn) return;

  refreshBtn.addEventListener("click", async (event) => {
    event.preventDefault();
    await loadDashboard();
    showPopupMessage("Dashboard refreshed.", "success");
  });
}

function bindInlineButtons() {
  const openAddProductInline = document.getElementById("openAddProductInline");
  const openAddUserInline = document.getElementById("openAddUserInline");

  if (openAddProductInline) {
    openAddProductInline.addEventListener("click", (e) => {
      e.preventDefault();
      openAddProductModal();
    });
  }

  if (openAddUserInline) {
    openAddUserInline.addEventListener("click", (e) => {
      e.preventDefault();
      openAddUserModal();
    });
  }
}

function bindProductModal() {
  const productModal = document.getElementById("productModal");
  const closeProductModal = document.getElementById("closeProductModal");
  const cancelProductEdit = document.getElementById("cancelProductEdit");
  const productForm = document.getElementById("productForm");

  closeProductModal?.addEventListener("click", closeProductModalFn);
  cancelProductEdit?.addEventListener("click", closeProductModalFn);

  productModal?.addEventListener("click", (event) => {
    if (event.target === productModal) closeProductModalFn();
  });

  productForm?.addEventListener("submit", handleProductFormSubmit);
}

function bindUserModal() {
  const userModal = document.getElementById("userModal");
  const closeUserModal = document.getElementById("closeUserModal");
  const cancelUserEdit = document.getElementById("cancelUserEdit");
  const userForm = document.getElementById("userForm");

  closeUserModal?.addEventListener("click", closeUserModalFn);
  cancelUserEdit?.addEventListener("click", closeUserModalFn);

  userModal?.addEventListener("click", (event) => {
    if (event.target === userModal) closeUserModalFn();
  });

  userForm?.addEventListener("submit", handleUserFormSubmit);
}

async function loadDashboard() {
  try {
    const response = await fetch(`${API_BASE}/admin/dashboard.php`, {
      credentials: "same-origin",
      cache: "no-store"
    });

    const data = await safeJson(response);

    if (!data.success) {
      showPopupMessage(data.message || "Failed to load dashboard.", "error");
      return;
    }

    dashboardState.products = data.products || [];
    dashboardState.users = data.users || [];

    if (!selectedUserId && dashboardState.users.length) {
      selectedUserId = dashboardState.users[0].id;
    }

    if (
      selectedUserId &&
      !dashboardState.users.find((u) => Number(u.id) === Number(selectedUserId))
    ) {
      selectedUserId = dashboardState.users.length ? dashboardState.users[0].id : null;
    }

    renderDashboard();
  } catch (error) {
    console.error("loadDashboard error:", error);
    showPopupMessage("Failed to load dashboard.", "error");
  }
}

function renderDashboard() {
  updateCategoryActiveState();
  renderProducts();
  renderUsers();
  renderSelectedUserOrders();
}

function updateCategoryActiveState() {
  document.querySelectorAll(".category-btn[data-category]").forEach((button) => {
    button.classList.toggle("active", button.dataset.category === activeCategory);
  });
}

function renderProducts() {
  const productTableBody = document.getElementById("productTableBody");
  if (!productTableBody) return;

  const products = dashboardState.products.filter(
    (product) => product.category === activeCategory
  );

  if (!products.length) {
    productTableBody.innerHTML = `
      <div class="product-row">
        <div class="product-name-cell">No products found</div>
        <div class="price-cell">-</div>
        <div class="status-cell">-</div>
        <div class="orders-cell">-</div>
        <div class="actions-cell">-</div>
      </div>
    `;
    return;
  }

  productTableBody.innerHTML = products.map((product) => `
    <div class="product-row">
      <div class="product-name-cell">
        <span>${escapeHtml(product.name)}</span>
      </div>
      <div class="price-cell">PHP ${formatMoney(product.price)}</div>
      <div class="status-cell ${Number(product.availability) === 1 ? "status-available" : "status-unavailable"}">
        ${Number(product.availability) === 1 ? "Available" : "Not Available"}
      </div>
      <div class="orders-cell">#${formatNumber(product.total_orders)}</div>
      <div class="actions-cell">
        <button class="action-btn edit-btn" type="button" onclick="openEditProductModal(${product.id})">
          <i class="fas fa-pen-to-square"></i>
        </button>
        <button class="action-btn delete-btn" type="button" onclick="deleteProduct(${product.id})">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `).join("");
}

function renderUsers() {
  const usersList = document.getElementById("usersList");
  if (!usersList) return;

  if (!dashboardState.users.length) {
    usersList.innerHTML = `<div class="user-item">No users found</div>`;
    return;
  }

  usersList.innerHTML = dashboardState.users.map((user) => `
    <div class="user-item ${Number(user.id) === Number(selectedUserId) ? "active" : ""}">
      <div class="user-main" onclick="selectUser(${user.id})">
        <i class="far fa-circle-user"></i>
        <span>${escapeHtml(user.name)} (${escapeHtml(user.role)})</span>
      </div>
      <div class="user-actions">
        <button class="action-btn edit-btn" type="button" onclick="openEditUserModal(${user.id})">
          <i class="fas fa-pen-to-square"></i>
        </button>
        <button class="action-btn delete-btn" type="button" onclick="deleteUser(${user.id})">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `).join("");
}

function renderSelectedUserOrders() {
  const selectedUserName = document.getElementById("selectedUserName");
  const selectedUserOrders = document.getElementById("selectedUserOrders");

  if (!selectedUserName || !selectedUserOrders) return;

  const user = dashboardState.users.find((item) => Number(item.id) === Number(selectedUserId));

  if (!user) {
    selectedUserName.textContent = "Selected User";
    selectedUserOrders.innerHTML = `<div class="order-line"><div>-</div><div>-</div><div>-</div></div>`;
    return;
  }

  selectedUserName.textContent = `${user.name} (${user.role})`;

  if (!user.orders || !user.orders.length) {
    selectedUserOrders.innerHTML = `<div class="order-line"><div>No orders</div><div>-</div><div>-</div></div>`;
    return;
  }

  selectedUserOrders.innerHTML = user.orders.map((order) => `
    <div class="order-line">
      <div>${escapeHtml(order.product_name)}</div>
      <div>${escapeHtml(order.qty_size)}</div>
      <div>${escapeHtml(order.order_number)}</div>
    </div>
  `).join("");
}

window.selectUser = function (userId) {
  selectedUserId = userId;
  renderUsers();
  renderSelectedUserOrders();
};

function openAddProductModal() {
  document.getElementById("productModalTitle").textContent = "Add Product";
  document.getElementById("productId").value = "";
  document.getElementById("productName").value = "";
  document.getElementById("productCategory").value = activeCategory;
  document.getElementById("productPrice").value = "";
  document.getElementById("productStatus").value = "1";
  document.getElementById("productDescription").value = "";
  document.getElementById("productImagePath").value = "";
  document.getElementById("productModal").classList.add("show");
}
window.openAddProductModal = openAddProductModal;

function openEditProductModal(productId) {
  const product = dashboardState.products.find((item) => Number(item.id) === Number(productId));
  if (!product) return;

  document.getElementById("productModalTitle").textContent = "Edit Product";
  document.getElementById("productId").value = product.id;
  document.getElementById("productName").value = product.name;
  document.getElementById("productCategory").value = product.category;
  document.getElementById("productPrice").value = product.price;
  document.getElementById("productStatus").value = String(product.availability);
  document.getElementById("productDescription").value = product.description || "";
  document.getElementById("productImagePath").value = product.image_path || "";
  document.getElementById("productModal").classList.add("show");
}
window.openEditProductModal = openEditProductModal;

function closeProductModalFn() {
  document.getElementById("productModal").classList.remove("show");
}

async function handleProductFormSubmit(event) {
  event.preventDefault();

  const id = document.getElementById("productId").value.trim();
  const payload = {
    name: document.getElementById("productName").value.trim(),
    category: document.getElementById("productCategory").value,
    price: document.getElementById("productPrice").value,
    availability: document.getElementById("productStatus").value,
    description: document.getElementById("productDescription").value.trim(),
    image_path: document.getElementById("productImagePath").value.trim()
  };

  try {
    const response = await fetch(
      id ? `${API_BASE}/admin/products/update.php?id=${encodeURIComponent(id)}` : `${API_BASE}/admin/products/create.php`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload)
      }
    );

    const data = await safeJson(response);

    if (data.success) {
      closeProductModalFn();
      await loadDashboard();
      showPopupMessage(id ? "Product updated successfully." : "Product created successfully.", "success");
    } else {
      showPopupMessage(data.message || "Failed to save product.", "error");
    }
  } catch (error) {
    console.error("handleProductFormSubmit error:", error);
    showPopupMessage("Failed to save product.", "error");
  }
}

window.deleteProduct = async function (productId) {
  if (!confirm("Delete this product?")) return;

  try {
    const response = await fetch(`${API_BASE}/admin/products/delete.php?id=${encodeURIComponent(productId)}`, {
      method: "POST",
      credentials: "same-origin"
    });

    const data = await safeJson(response);

    if (data.success) {
      await loadDashboard();
      showPopupMessage("Product deleted successfully.", "success");
    } else {
      showPopupMessage(data.message || "Failed to delete product.", "error");
    }
  } catch (error) {
    console.error("deleteProduct error:", error);
    showPopupMessage("Failed to delete product.", "error");
  }
};

function openAddUserModal() {
  document.getElementById("userModalTitle").textContent = "Add User";
  document.getElementById("userId").value = "";
  document.getElementById("userNameInput").value = "";
  document.getElementById("userPasswordInput").value = "";
  document.getElementById("userRoleInput").value = "customer";
  document.getElementById("userModal").classList.add("show");
}
window.openAddUserModal = openAddUserModal;

function openEditUserModal(userId) {
  const user = dashboardState.users.find((item) => Number(item.id) === Number(userId));
  if (!user) return;

  document.getElementById("userModalTitle").textContent = "Edit User";
  document.getElementById("userId").value = user.id;
  document.getElementById("userNameInput").value = user.name;
  document.getElementById("userPasswordInput").value = "";
  document.getElementById("userRoleInput").value = user.role;
  document.getElementById("userModal").classList.add("show");
}
window.openEditUserModal = openEditUserModal;

function closeUserModalFn() {
  document.getElementById("userModal").classList.remove("show");
}

async function handleUserFormSubmit(event) {
  event.preventDefault();

  const id = document.getElementById("userId").value.trim();
  const payload = {
    name: document.getElementById("userNameInput").value.trim(),
    password: document.getElementById("userPasswordInput").value.trim(),
    role: document.getElementById("userRoleInput").value
  };

  try {
    const response = await fetch(
      id ? `${API_BASE}/admin/users/update.php?id=${encodeURIComponent(id)}` : `${API_BASE}/admin/users/create.php`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload)
      }
    );

    const data = await safeJson(response);

    if (data.success) {
      closeUserModalFn();
      await loadDashboard();
      showPopupMessage(id ? "User updated successfully." : "User created successfully.", "success");
    } else {
      showPopupMessage(data.message || "Failed to save user.", "error");
    }
  } catch (error) {
    console.error("handleUserFormSubmit error:", error);
    showPopupMessage("Failed to save user.", "error");
  }
}

window.deleteUser = async function (userId) {
  const user = dashboardState.users.find((item) => Number(item.id) === Number(userId));
  if (!user) return;

  if (user.role === "admin") {
    showPopupMessage("Deleting admin users is blocked here.", "error");
    return;
  }

  if (!confirm(`Delete user ${user.name}?`)) return;

  try {
    const response = await fetch(`${API_BASE}/admin/users/delete.php?id=${encodeURIComponent(userId)}`, {
      method: "POST",
      credentials: "same-origin"
    });

    const data = await safeJson(response);

    if (data.success) {
      if (Number(selectedUserId) === Number(userId)) {
        selectedUserId = null;
      }
      await loadDashboard();
      showPopupMessage("User deleted successfully.", "success");
    } else {
      showPopupMessage(data.message || "Failed to delete user.", "error");
    }
  } catch (error) {
    console.error("deleteUser error:", error);
    showPopupMessage("Failed to delete user.", "error");
  }
};

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-PH");
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}