const API_BASE = window.location.pathname.includes('/ECOM-FINALS1/')
  ? `${window.location.origin}/ECOM-FINALS1/api`
  : `${window.location.origin}/api`;

let menuData = {
    drinks: [],
    pastry: [],
    pasta: []
};

let originalData = {
    drinks: [],
    pastry: [],
    pasta: []
};

let currentSort = 'default';
let currentPieces = 1;
let currentBasePrice = 0;

async function fetchProductsFromDB() {
    try {
        const response = await fetch(`${API_BASE}/get_products.php`, {
            credentials: 'include'
        });
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to load products');
        }

        menuData = result.data;

        originalData = {
            drinks: menuData.drinks.map(item => ({ ...item })),
            pastry: menuData.pastry.map(item => ({ ...item })),
            pasta: menuData.pasta.map(item => ({ ...item }))
        };

        renderAll();
        updateCartBadge();
    } catch (error) {
        console.error('Error fetching products:', error);
        document.getElementById('drinks').innerHTML = '<div style="color:white;padding:20px;">Failed to load products.</div>';
        document.getElementById('pastry').innerHTML = '<div style="color:white;padding:20px;">Failed to load products.</div>';
        document.getElementById('pasta').innerHTML = '<div style="color:white;padding:20px;">Failed to load products.</div>';
    }
}

async function updateCartBadge() {
    try {
        const response = await fetch(`${API_BASE}/cart/get.php`, {
            credentials: 'include'
        });
        const result = await response.json();
        const badge = document.getElementById('cartBadge');

        if (badge && result.success) {
            badge.textContent = result.count || 0;
            badge.style.display = (result.count || 0) > 0 ? 'flex' : 'none';
        }
    } catch (error) {
        console.error('Failed to update cart badge:', error);
    }
}

function initializeEmptyCart() {
    updateCartBadge();
}

function renderSection(sectionId, dataArray) {
    const container = document.getElementById(sectionId);
    if (!container) return;

    let sortedData = [...dataArray];
    if (currentSort === 'low') sortedData.sort((a, b) => a.price - b.price);
    else if (currentSort === 'high') sortedData.sort((a, b) => b.price - a.price);

    if (sortedData.length === 0) {
        container.innerHTML = '<div style="color: white; padding: 20px;">No products available in this category.</div>';
        return;
    }

    container.innerHTML = sortedData.map(item => `
        <div class="card" onclick="openModal('${sectionId}', ${item.id})">
            <img src="assets/img/${item.img}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/140x140?text=${encodeURIComponent(item.name)}'">
            <span>${item.name}</span>
            <div class="price">₱${item.price}</div>
        </div>
    `).join('');

    container.scrollLeft = 0;
    setTimeout(() => updateActiveDot(container), 50);
}

function renderAll() {
    renderSection('drinks', menuData.drinks);
    renderSection('pastry', menuData.pastry);
    renderSection('pasta', menuData.pasta);
}

function sortAllSections(order) {
    currentSort = order;
    renderAll();
    document.getElementById('sortBtn').textContent =
        order === 'low' ? 'Price: Low to High ▼' : 'Price: High to Low ▼';
}

function resetToOriginal() {
    menuData = {
        drinks: originalData.drinks.map(item => ({ ...item })),
        pastry: originalData.pastry.map(item => ({ ...item })),
        pasta: originalData.pasta.map(item => ({ ...item }))
    };
    currentSort = 'default';
    renderAll();
    document.getElementById('sortBtn').textContent = 'Sort by Price ▼';
}

function filterMenu(sectionId) {
    document.querySelectorAll(".menu-section").forEach(s => s.style.display = "none");
    document.getElementById(sectionId).style.display = "block";
    window.scrollTo({ top: 120, behavior: "smooth" });
}

function scrollCarousel(id, step) {
    const container = document.getElementById(id);
    if (!container) return;
    const visibleSetWidth = 705;
    let newScrollLeft = container.scrollLeft + (step > 0 ? visibleSetWidth : -visibleSetWidth);
    const maxScroll = container.scrollWidth - container.clientWidth;
    newScrollLeft = Math.max(0, Math.min(newScrollLeft, maxScroll));
    container.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
    setTimeout(() => updateActiveDot(container), 200);
}

function updateActiveDot(container) {
    const section = container.closest('.menu-section');
    if (!section) return;
    const dots = section.querySelectorAll('.dot');
    if (dots.length === 0) return;
    const pageWidth = 705;
    const pageIndex = Math.round(container.scrollLeft / pageWidth);
    const safeIndex = Math.min(pageIndex, dots.length - 1);
    dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === safeIndex);
    });
}

function findProductById(sectionId, productId) {
    if (sectionId === 'drinks') return menuData.drinks.find(p => Number(p.id) === Number(productId));
    if (sectionId === 'pastry') return menuData.pastry.find(p => Number(p.id) === Number(productId));
    if (sectionId === 'pasta') return menuData.pasta.find(p => Number(p.id) === Number(productId));
    return null;
}

function openModal(sectionId, productId) {
    const product = findProductById(sectionId, productId);
    if (!product) return;

    const isDrink = sectionId === 'drinks';
    const hasPieces = sectionId === 'pastry' || sectionId === 'pasta';

    const sizeSectionHTML = isDrink ? `
        <div class="size-section">
            <div class="size-title">Select Size</div>
            <div class="size-options">
                <button class="size-btn" data-size="Tall" data-price-multiplier="0" onclick="selectSize(this, ${product.price})">TALL</button>
                <button class="size-btn selected" data-size="Grande" data-price-multiplier="10" onclick="selectSize(this, ${product.price})">GRANDE (+₱10)</button>
                <button class="size-btn" data-size="Venti" data-price-multiplier="25" onclick="selectSize(this, ${product.price})">VENTI (+₱25)</button>
            </div>
        </div>
    ` : '';

    const piecesSectionHTML = hasPieces ? `
        <div class="size-section">
            <div class="size-title">Select Quantity</div>
            <div class="pieces-control">
                <button class="qty-btn" onclick="changePieces(-1, ${product.price})">−</button>
                <span id="piecesCount">1</span>
                <button class="qty-btn" onclick="changePieces(1, ${product.price})">+</button>
            </div>
            <div id="piecesTotal">Total: ₱${product.price}</div>
        </div>
    ` : '';

    const modalHtml = `
        <div class="modal-content">
            <div class="modal-left">
                <img src="assets/img/${product.img}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/280?text=${encodeURIComponent(product.name)}'">
            </div>
            <div class="modal-right">
                <div class="modal-badge">BREW-HA</div>
                <div class="available"><i class="fas fa-circle" style="color: #2a7a2a; font-size: 0.6rem;"></i> ${product.availability || 'Available'}</div>
                <div class="category">${product.category || sectionId}</div>
                <div class="name-price">
                    <span class="product-name">${product.name}</span>
                    <span class="product-price" id="modalPrice">₱${product.price}</span>
                </div>
                <div class="description">${product.description || 'A delicious product from our menu.'}</div>

                ${sizeSectionHTML}
                ${piecesSectionHTML}

                <div class="add-notes">
                    <input type="text" placeholder="Add Notes..." id="notesInput">
                </div>

                <div class="action-buttons">
                    <button class="add-to-cart-btn" onclick="addToCart(${product.id}, ${product.price}, '${sectionId}')">Add to Cart</button>
                    <button class="add-to-cart-btn" style="background: #4a4f35;" onclick="orderNow(${product.id}, ${product.price}, '${sectionId}')">Order Now</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modalDynamicContent').innerHTML = modalHtml;
    document.getElementById('productModal').style.display = 'flex';

    currentPieces = 1;
    currentBasePrice = product.price;

    setTimeout(() => {
        if (isDrink) {
            const grandeBtn = document.querySelector('.size-btn[data-size="Grande"]');
            if (grandeBtn) {
                selectSize(grandeBtn, product.price);
            }
        }
    }, 100);
}

function closeModal() {
    document.getElementById('productModal').style.display = 'none';
}

function selectSize(btn, basePrice) {
    const parent = btn.parentNode;
    const allBtns = parent.querySelectorAll('.size-btn');
    allBtns.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');

    const multiplier = parseInt(btn.getAttribute('data-price-multiplier') || '0', 10);
    const newPrice = basePrice + multiplier;

    const priceElement = document.getElementById('modalPrice');
    if (priceElement) {
        priceElement.textContent = `₱${newPrice}`;
    }
}

function changePieces(delta, basePrice) {
    currentBasePrice = basePrice;
    currentPieces = currentPieces + delta;

    if (currentPieces < 1) currentPieces = 1;

    const piecesElement = document.getElementById('piecesCount');
    if (piecesElement) piecesElement.textContent = currentPieces;

    const totalPrice = basePrice * currentPieces;
    const totalElement = document.getElementById('piecesTotal');
    if (totalElement) totalElement.textContent = `Total: ₱${totalPrice}`;

    const priceElement = document.getElementById('modalPrice');
    if (priceElement) priceElement.textContent = `₱${totalPrice}`;
}

async function addToCart(productId, basePrice, sectionId, showSuccess = true) {
    const isDrink = sectionId === 'drinks';
    const hasPieces = sectionId === 'pastry' || sectionId === 'pasta';

    let size = null;
    let pieces = null;

    if (isDrink) {
        const sizeElem = document.querySelector('.size-btn.selected');
        size = sizeElem ? sizeElem.getAttribute('data-size') : 'Grande';
    } else if (hasPieces) {
        const piecesElement = document.getElementById('piecesCount');
        pieces = piecesElement ? parseInt(piecesElement.textContent, 10) : 1;
    }

    const notes = document.getElementById('notesInput')?.value || '';

    try {
        const response = await fetch(`${API_BASE}/cart/add.php`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                product_id: productId,
                qty: 1,
                size: size,
                pieces: pieces,
                notes: notes
            })
        });

        const result = await response.json();

        if (!result.success) {
            alert(result.error || 'Failed to add to cart');
            return false;
        }

        if (showSuccess) {
    window.location.href = '../Cart Page/index.html';
}

        currentPieces = 1;
        closeModal();
        await updateCartBadge();

        return true;
    } catch (error) {
        console.error(error);
        alert('Failed to connect to cart API');
        return false;
    }
}

async function orderNow(productId, basePrice, sectionId) {
    const success = await addToCart(productId, basePrice, sectionId, false);

    if (success) {
        window.location.href = '../Cart Page/index.html';
    }
}

function closeSuccessModal() {
    document.getElementById('successModal').style.display = 'none';
}

function performSearch() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const resultsContainer = document.getElementById('searchResults');

    if (query === '') {
        resultsContainer.innerHTML = '<p style="color:white;">Please enter a search term.</p>';
        return;
    }

    let results = [];

    if (query === 'drinks' || query === 'drink' || query === 'beverage' || query === 'beverages') {
        results = menuData.drinks;
    } else if (query === 'pastry' || query === 'pastries' || query === 'baked goods' || query === 'baked') {
        results = menuData.pastry;
    } else if (query === 'pasta' || query === 'pastas' || query === 'noodles' || query === 'noodle') {
        results = menuData.pasta;
    } else {
        const allItems = [...menuData.drinks, ...menuData.pastry, ...menuData.pasta];
        results = allItems.filter(item =>
            item.name.toLowerCase().includes(query) ||
            (item.description && item.description.toLowerCase().includes(query))
        );
    }

    if (results.length === 0) {
        resultsContainer.innerHTML = '<p style="color:white;">No items found.</p>';
    } else {
        resultsContainer.innerHTML = results.map(item => {
            let section = 'drinks';
            if (menuData.pastry.some(p => p.id === item.id)) section = 'pastry';
            else if (menuData.pasta.some(p => p.id === item.id)) section = 'pasta';

            return `
                <div class="result-item" onclick="openModal('${section}', ${item.id})">
                    <div class="result-info">
                        <img src="assets/img/${item.img}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/60x60?text=${encodeURIComponent(item.name)}'">
                        <span>${item.name}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 20px;">
                        <span class="result-price">₱${item.price}</span>
                    </div>
                </div>
            `;
        }).join('');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initializeEmptyCart();

    const acc = document.getElementById('accountDropdown');
    const drop = document.getElementById('dropdownMenu');

    if (acc) {
        acc.addEventListener('click', function(e) {
            e.stopPropagation();
            drop.classList.toggle('show');
            acc.classList.toggle('show-logout');
        });
    }

    document.addEventListener('click', function(e) {
        if (!acc?.contains(e.target)) {
            drop?.classList.remove('show');
            acc?.classList.remove('show-logout');
        }
    });

    const searchIcon = document.getElementById('searchIcon');
    if (searchIcon) {
        searchIcon.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('searchOverlay').style.display = 'flex';
            document.getElementById('searchInput').focus();
        });
    }

    document.getElementById('closeSearch').addEventListener('click', function() {
        document.getElementById('searchOverlay').style.display = 'none';
        document.getElementById('searchResults').innerHTML = '';
    });

    document.getElementById('searchButton').addEventListener('click', performSearch);
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') performSearch();
    });

    fetchProductsFromDB();

    document.querySelectorAll('.products').forEach(c => {
        c.addEventListener('scroll', function() {
            clearTimeout(window.dotUpdateTimer);
            window.dotUpdateTimer = setTimeout(() => updateActiveDot(this), 100);
        });
    });

    window.onclick = function(e) {
        const modal = document.getElementById('productModal');
        if (e.target === modal) closeModal();

        const successModal = document.getElementById('successModal');
        if (e.target === successModal) closeSuccessModal();
    };
});