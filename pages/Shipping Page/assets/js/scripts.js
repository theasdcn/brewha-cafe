const API_BASE = window.location.pathname.includes('/ECOM-FINALS1/')
  ? `${window.location.origin}/ECOM-FINALS1/api`
  : `${window.location.origin}/api`;

document.addEventListener("DOMContentLoaded", () => {
  initializeDropdown();
  initializeHelpModal();
  initializeButtons();
  loadShippingFromBackend();
});

async function loadShippingFromBackend() {
  try {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('order_id');

    if (!orderId) {
      renderEmptyShipping("No order selected.");
      return;
    }

    const response = await fetch(`${API_BASE}/orders/shipping.php?order_id=${encodeURIComponent(orderId)}`);
    const result = await response.json();

    if (!result.success) {
      renderEmptyShipping(result.error || "Order not found.");
      return;
    }

    renderShippingPage(result.data);
  } catch (error) {
    console.error(error);
    renderEmptyShipping("Failed to load shipping data.");
  }
}

function renderEmptyShipping(message) {
  document.getElementById("estimatedTime").textContent = "--";
  document.getElementById("shippingStatusText").textContent = message;
  document.getElementById("orderItems").innerHTML = `
    <div class="order-item">
      <div class="order-item-left">
        <div class="order-item-name">No active order</div>
        <div class="order-item-meta">${message}</div>
      </div>
      <div class="order-item-price">₱0</div>
    </div>
  `;
  document.getElementById("subtotalAmount").textContent = "₱0";
  document.getElementById("deliveryFeeAmount").textContent = "₱0";
  document.getElementById("totalAmount").textContent = "₱0";
}

function initializeDropdown() {
  const accountDropdown = document.getElementById("accountDropdown");
  const dropdownMenu = document.getElementById("dropdownMenu");

  if (!accountDropdown || !dropdownMenu) return;

  accountDropdown.addEventListener("click", (event) => {
    event.stopPropagation();
    dropdownMenu.classList.toggle("show");

    const expanded = accountDropdown.getAttribute("aria-expanded") === "true";
    accountDropdown.setAttribute("aria-expanded", String(!expanded));
  });

  document.addEventListener("click", (event) => {
    if (!accountDropdown.contains(event.target)) {
      dropdownMenu.classList.remove("show");
      accountDropdown.setAttribute("aria-expanded", "false");
    }
  });
}

function initializeHelpModal() {
  const helpBtn = document.getElementById("helpBtn");
  const helpModal = document.getElementById("helpModal");
  const closeHelpModal = document.getElementById("closeHelpModal");

  if (helpBtn && helpModal) {
    helpBtn.addEventListener("click", () => {
      helpModal.classList.add("show");
    });
  }

  if (closeHelpModal && helpModal) {
    closeHelpModal.addEventListener("click", () => {
      helpModal.classList.remove("show");
    });
  }

  if (helpModal) {
    helpModal.addEventListener("click", (event) => {
      if (event.target === helpModal) {
        helpModal.classList.remove("show");
      }
    });
  }
}

function initializeButtons() {
  const contactRiderBtn = document.getElementById("contactRiderBtn");
  const modalRiderBtn = document.getElementById("modalRiderBtn");
  const supportBtn = document.getElementById("supportBtn");

  if (contactRiderBtn) {
    contactRiderBtn.addEventListener("click", () => {
      alert("Rider contact will be connected later.");
    });
  }

  if (modalRiderBtn) {
    modalRiderBtn.addEventListener("click", () => {
      alert("Rider contact will be connected later.");
    });
  }

  if (supportBtn) {
    supportBtn.addEventListener("click", () => {
      alert("Support will be connected later.");
    });
  }
}

function renderShippingPage(data) {
  renderMerchantLogo(data.merchant);
  renderShippingStatus(data.shipping);
  renderOrderItems(data.items);
  renderPricing(data.pricing);
}

function renderMerchantLogo(merchant) {
  const merchantLogo = document.getElementById("merchantLogo");
  const merchantLogoFallback = document.getElementById("merchantLogoFallback");

  if (!merchantLogo || !merchantLogoFallback) return;

  if (merchant.logo && merchant.logo.trim() !== "") {
    merchantLogo.src = merchant.logo;
    merchantLogo.hidden = false;
    merchantLogoFallback.hidden = true;
  } else {
    merchantLogo.hidden = true;
    merchantLogoFallback.hidden = false;
    merchantLogoFallback.textContent = "LOGO";
  }
}

function renderShippingStatus(shipping) {
  const estimatedTime = document.getElementById("estimatedTime");
  const shippingStatusText = document.getElementById("shippingStatusText");
  const deliveryModeText = document.getElementById("deliveryModeText");
  const steps = document.querySelectorAll(".progress-step");

  estimatedTime.textContent = shipping.estimatedTimeText || "Time";
  shippingStatusText.textContent = shipping.statusMessage || "";
  deliveryModeText.textContent = shipping.deliveryModeLabel || "(Delivery location)";

  steps.forEach((step, index) => {
    if (index < (shipping.currentStage || 0)) {
      step.classList.add("active");
    } else {
      step.classList.remove("active");
    }
  });
}

function renderOrderItems(items) {
  const orderItems = document.getElementById("orderItems");
  if (!orderItems) return;

  if (!Array.isArray(items) || items.length === 0) {
    orderItems.innerHTML = `
      <div class="order-item">
        <div class="order-item-left">
          <div class="order-item-name">No items yet</div>
          <div class="order-item-meta">Waiting for backend data</div>
        </div>
        <div class="order-item-price">₱0</div>
      </div>
    `;
    return;
  }

  orderItems.innerHTML = items.map(item => {
    const qty = Number(item.quantity || 1);
    const price = Number(item.price || 0);
    const lineTotal = qty * price;

    return `
      <div class="order-item">
        <div class="order-item-left">
          <div class="order-item-name">${escapeHtml(item.name)}${qty > 1 ? ` x${qty}` : ""}</div>
          <div class="order-item-meta">${escapeHtml(item.meta || "")}</div>
        </div>
        <div class="order-item-price">${formatPeso(lineTotal)}</div>
      </div>
    `;
  }).join("");
}

function renderPricing(pricing) {
  document.getElementById("subtotalAmount").textContent = formatPeso(pricing.subtotal || 0);
  document.getElementById("deliveryFeeAmount").textContent = formatPeso(pricing.deliveryFee || 0);
  document.getElementById("totalAmount").textContent = formatPeso(pricing.total || 0);
}

function formatPeso(value) {
  return `₱${Number(value).toLocaleString("en-PH")}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}