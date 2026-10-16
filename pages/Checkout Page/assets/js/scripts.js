const API_BASE = window.location.pathname.includes('/ECOM-FINALS1/')
  ? `${window.location.origin}/ECOM-FINALS1/api`
  : `${window.location.origin}/api`;

let cart = [];
let subtotal = 0;
let deliveryFee = 0;
let deliveryMethod = 'pickup';
let selectedPaymentMethod = null;
let selectedPaymentUrl = null;

async function loadCart() {
    try {
        const response = await fetch(`${API_BASE}/cart/get.php`, {
            credentials: 'include'
        });
        const result = await response.json();

        if (result.success) {
            cart = result.cart || [];
        } else {
            cart = [];
        }
    } catch (e) {
        console.error("Error loading cart:", e);
        cart = [];
    }

    displayCart();
}

function displayCart() {
    let orderItems = document.getElementById("orderItems");
    orderItems.innerHTML = "";
    subtotal = 0;

    if (cart.length === 0) {
        orderItems.innerHTML = '<div class="item"><span>No items in cart</span><span>₱ 0</span></div>';
    } else {
        cart.forEach(item => {
            let itemDetails = '';

            if (item.size) {
                itemDetails += `<div class="item-details">Size: ${item.size}</div>`;
            }

            if (item.pieces && item.pieces > 1) {
                itemDetails += `<div class="item-details">Quantity: ${item.pieces} pcs</div>`;
            }

            if (item.notes) {
                itemDetails += `<div class="item-details">Note: ${item.notes}</div>`;
            }

            orderItems.innerHTML += `
            <div class="item">
                <div>
                    <span>${item.name} ${item.qty > 1 ? ' x' + item.qty : ''}</span>
                    ${itemDetails}
                </div>
                <span>₱ ${(item.price * (item.qty || 1)).toFixed(2)}</span>
            </div>
            `;

            subtotal += item.price * (item.qty || 1);
        });
    }

    document.getElementById("subtotal").innerText = subtotal.toFixed(2);
    updateTotal();
}

function updateTotal() {
    const total = subtotal + deliveryFee;
    document.getElementById("total").innerText = total.toFixed(2);
}

function selectDeliveryMethod(method) {
    deliveryMethod = method;

    document.getElementById('pickupOption').classList.remove('selected');
    document.getElementById('deliveryOption').classList.remove('selected');

    if (method === 'pickup') {
        document.getElementById('pickupOption').classList.add('selected');
        document.getElementById('deliveryFields').classList.remove('show');
        document.getElementById('deliveryFeeInfo').style.display = 'none';
        deliveryFee = 0;
        document.getElementById('deliveryFee').innerText = '0';
    } else {
        document.getElementById('deliveryOption').classList.add('selected');
        document.getElementById('deliveryFields').classList.add('show');
        document.getElementById('deliveryFeeInfo').style.display = 'block';
        deliveryFee = 40;
        document.getElementById('deliveryFee').innerText = '40';
    }

    updateTotal();
}

function selectPayment(method, url, element) {
    selectedPaymentMethod = method;
    selectedPaymentUrl = url;

    document.querySelectorAll('.payment-option').forEach(opt => {
        opt.classList.remove('selected');
    });

    element.classList.add('selected');

    const radio = element.querySelector('input[type="radio"]');
    if (radio) radio.checked = true;
}

function getFullAddress() {
    let houseNumber = document.getElementById("houseNumber").value.trim();
    let street = document.getElementById("street").value.trim();
    let barangay = document.getElementById("barangay").value.trim();
    let city = document.getElementById("city").value.trim();
    let province = document.getElementById("province").value.trim();
    let zipCode = document.getElementById("zipCode").value.trim();

    return `${houseNumber} ${street}, ${barangay}, ${city}, ${province} ${zipCode}`.trim();
}

async function placeOrder() {
    if (deliveryMethod === 'delivery') {
        if (
            !document.getElementById("houseNumber").value.trim() ||
            !document.getElementById("street").value.trim() ||
            !document.getElementById("barangay").value.trim() ||
            !document.getElementById("city").value.trim() ||
            !document.getElementById("province").value.trim() ||
            !document.getElementById("zipCode").value.trim()
        ) {
            alert("Please fill in all delivery address fields");
            return;
        }
    }

    if (!selectedPaymentMethod) {
        alert("Please select payment method");
        return;
    }

    if (!document.getElementById("agree").checked) {
        alert("You must agree to the terms");
        return;
    }

    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/orders/place.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                payment_method: selectedPaymentMethod,
                delivery_method: deliveryMethod,
                delivery_fee: deliveryFee,
                address: deliveryMethod === 'delivery'
                    ? getFullAddress()
                    : 'Pickup at store'
            })
        });

        // 🔥 IMPORTANT FIX: read raw text first
        const text = await response.text();
        console.log("RAW RESPONSE:", text);

        // Prevent crash if empty
        if (!text) {
            alert("Server returned empty response");
            return;
        }

        let result;
        try {
            result = JSON.parse(text);
        } catch (e) {
            console.error("Invalid JSON:", text);
            alert("Server error (invalid JSON)");
            return;
        }

        console.log("PARSED:", result);

        if (!result.success) {
            alert(result.error || 'Failed to place order');
            return;
        }

        alert("Order placed successfully! 🎉");
        window.location.href = `../Shipping Page/index.html?order_id=${result.order_id}`;

    } catch (error) {
        console.error(error);
        alert('Failed to connect to order API');
    }
}

function validateAndShowPayment() {
    if (selectedPaymentMethod === 'COD') {
        placeOrder();
        return;
    }

    if (!selectedPaymentMethod) {
        alert("Please select payment method");
        return;
    }

    const totalAmount = subtotal + deliveryFee;
    document.getElementById('paymentModalMessage').innerHTML =
        `You will be redirected to <strong>${selectedPaymentMethod}</strong> to complete your payment.`;
    document.getElementById('paymentAmount').innerText = `₱${totalAmount.toFixed(2)}`;
    document.getElementById('paymentModal').style.display = 'flex';
}

function closePaymentModal() {
    document.getElementById('paymentModal').style.display = 'none';
}

async function proceedToPayment() {
    if (selectedPaymentUrl) {
        window.open(selectedPaymentUrl, '_blank');
    }
    closePaymentModal();
    await placeOrder();
}

// (rest of your code stays the same)
document.addEventListener('DOMContentLoaded', function() {
    loadCart();
    selectDeliveryMethod('pickup');

    const searchIcon = document.getElementById('searchIcon');
    const searchOverlay = document.getElementById('searchOverlay');
    const closeSearch = document.getElementById('closeSearch');
    const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.querySelector('.search-results');

    searchIcon?.addEventListener('click', function(e) {
        e.preventDefault();
        searchOverlay.style.display = 'flex';
        searchInput.focus();
        searchResults.classList.remove('has-results');
        document.getElementById('searchResults').innerHTML = '';
        searchInput.value = '';
    });

    closeSearch?.addEventListener('click', function() {
        searchOverlay.style.display = 'none';
        searchResults.classList.remove('has-results');
        document.getElementById('searchResults').innerHTML = '';
        searchInput.value = '';
    });

    searchButton?.addEventListener('click', performSearch);

    searchInput?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    searchOverlay?.addEventListener('click', function(e) {
        if (e.target === searchOverlay) {
            searchOverlay.style.display = 'none';
            searchResults.classList.remove('has-results');
            document.getElementById('searchResults').innerHTML = '';
            searchInput.value = '';
        }
    });

    const acc = document.getElementById('accountDropdown');
    const drop = document.getElementById('dropdownMenu');

    acc?.addEventListener('click', function(e) {
        e.stopPropagation();
        drop.classList.toggle('show');
    });

    document.addEventListener('click', function(e) {
        if (!acc?.contains(e.target)) {
            drop.classList.remove('show');
        }
    });

    drop?.addEventListener('click', function(e) {
        e.stopPropagation();
    });

    function performSearch() {
    console.log("Search not implemented yet");
}
});