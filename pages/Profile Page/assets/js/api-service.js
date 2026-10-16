/**
 * API Service Layer
 * =================
 * This file handles all backend communication.
 * Backend developers: Replace the mock implementations with actual API calls.
 */

const API = {
    // Base URL for API endpoints - change this to your actual backend URL
    BASE_URL: window.location.pathname.includes('/ECOM-FINALS1/') ? `${window.location.origin}/ECOM-FINALS1/api` : `${window.location.origin}/api`,
    
    // Flag to use mock data (set to false when backend is ready)
    USE_MOCK: true,

    /**
     * Generic request handler
     * Backend developers: Implement actual fetch calls here
     */
    async request(endpoint, options = {}) {
        const url = `${this.BASE_URL}${endpoint}`;
        
        // Default headers
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        // Add auth token if available
        const token = localStorage.getItem('authToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers
        };

        try {
            // TODO: Replace with actual fetch when backend is ready
            if (!this.USE_MOCK) {
                const response = await fetch(url, config);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return await response.json();
            } else {
                // Return mock data based on endpoint
                return this.getMockData(endpoint, options);
            }
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    },

    /**
     * Mock data provider
     * Backend developers: Replace these with actual API responses
     */
    getMockData(endpoint, options) {
        // Simulate network delay
        return new Promise((resolve) => {
            setTimeout(() => {
                // User endpoints
                if (endpoint === '/user/profile') {
                    resolve({
                        id: 1,
                        username: 'CoffeeLover123',
                        firstName: 'Alex',
                        lastName: 'Morgan',
                        email: 'alex.morgan@example.com',
                        joinDate: '2024-01-15'
                    });
                }
                
                // Purchases endpoints
                else if (endpoint === '/user/purchases') {
                    resolve([
                        {
                            id: 101,
                            coffeeName: "Hazel Nut",
                            size: "Grande",
                            quantity: 2,
                            totalAmount: 4.00,
                            purchaseDate: "2025-03-10",
                            rating: null
                        },
                        {
                            id: 102,
                            coffeeName: "Mocha",
                            size: "Tall",
                            quantity: 1,
                            totalAmount: 4.00,
                            purchaseDate: "2025-03-08",
                            rating: 5
                        },
                        {
                            id: 103,
                            coffeeName: "Vanilla Latte",
                            size: "Short",
                            quantity: 3,
                            totalAmount: 12.00,
                            purchaseDate: "2025-03-05",
                            rating: null
                        },
                        {
                            id: 104,
                            coffeeName: "Caramel Macchiato",
                            size: "Venti",
                            quantity: 1,
                            totalAmount: 5.50,
                            status: "shipped",
                            purchaseDate: "2025-03-12",
                            rating: null
                        },
                        {
                            id: 105,
                            coffeeName: "Signature Latte",
                            size: "Grande",
                            quantity: 2,
                            totalAmount: 9.00,
                            purchaseDate: "2025-03-01",
                            rating: 4
                        }
                    ]);
                }
                
                // Likes endpoints
                else if (endpoint === '/user/likes') {
                    resolve([
                        {
                            id: 201,
                            name: "Espresso",
                            category: "Drinks",
                            price: 3.50,
                            imageUrl: "assets/images/espresso.jpg",
                            description: "Strong and bold espresso shot"
                        },
                        {
                            id: 202,
                            name: "Latte",
                            category: "Drinks",
                            price: 4.20,
                            imageUrl: "assets/images/latte.jpg",
                            description: "Smooth espresso with steamed milk"
                        },
                        {
                            id: 203,
                            name: "Croissant",
                            category: "Pastry",
                            price: 2.95,
                            imageUrl: "assets/images/croissant.jpg",
                            description: "Buttery, flaky French pastry"
                        },
                        {
                            id: 204,
                            name: "Muffin",
                            category: "Pastry",
                            price: 3.25,
                            imageUrl: "assets/images/muffin.jpg",
                            description: "Blueberry muffin with streusel topping"
                        },
                        {
                            id: 205,
                            name: "Pesto Pasta",
                            category: "Pasta",
                            price: 8.50,
                            imageUrl: "assets/images/pesto.jpg",
                            description: "Fresh basil pesto with cherry tomatoes"
                        },
                        {
                            id: 206,
                            name: "Carbonara",
                            category: "Pasta",
                            price: 9.00,
                            imageUrl: "assets/images/carbonara.jpg",
                            description: "Creamy egg-based pasta with bacon"
                        },
                        {
                            id: 207,
                            name: "Cold Brew",
                            category: "Drinks",
                            price: 4.50,
                            imageUrl: "assets/images/coldbrew.jpg",
                            description: "Smooth cold-brewed coffee"
                        }
                    ]);
                }
                
                // Likes with category filter
                else if (endpoint.startsWith('/user/likes?category=')) {
                    const category = endpoint.split('=')[1];
                    const allLikes = this.getMockData('/user/likes', {});
                    
                    if (category === 'all') {
                        resolve(allLikes);
                    } else {
                        resolve(allLikes.filter(item => item.category === category));
                    }
                }
                
                // Default response
                else {
                    resolve({ message: 'Mock endpoint not implemented' });
                }
            }, 500); // Simulate 500ms network delay
        });
    },

    // ============================================
    // PUBLIC API METHODS - For Frontend Use
    // ============================================

    /**
     * Get user profile data
     * @returns {Promise<Object>} User data
     */
    async getUserProfile() {
        // TODO: Replace with actual API call
        return this.request('/user/profile');
    },

    /**
     * Get user's purchase history
     * @returns {Promise<Array>} List of purchases
     */
    async getPurchaseHistory() {
        // TODO: Replace with actual API call
        return this.request('/user/purchases');
    },

    /**
     * Get user's liked items
     * @param {string} category - Filter by category (optional)
     * @returns {Promise<Array>} List of liked items
     */
    async getUserLikes(category = 'all') {
        // TODO: Replace with actual API call
        if (category === 'all') {
            return this.request('/user/likes');
        } else {
            return this.request(`/user/likes?category=${encodeURIComponent(category)}`);
        }
    },

    /**
     * Add rating to a purchase
     * @param {number} purchaseId - ID of the purchase
     * @param {number} rating - Rating value (1-5)
     * @returns {Promise<Object>} Response data
     */
    async addPurchaseRating(purchaseId, rating) {
        // TODO: Replace with actual API call
        return this.request(`/purchases/${purchaseId}/rate`, {
            method: 'POST',
            body: JSON.stringify({ rating })
        });
    },

    /**
     * Reorder a previous purchase
     * @param {number} purchaseId - ID of the purchase to reorder
     * @returns {Promise<Object>} Response data
     */
    async reorderPurchase(purchaseId) {
        // TODO: Replace with actual API call
        return this.request(`/purchases/${purchaseId}/reorder`, {
            method: 'POST'
        });
    },

    /**
     * Logout user
     * @returns {Promise<Object>} Response data
     */
    async logout() {
        // TODO: Replace with actual API call
        return this.request('/auth/logout', {
            method: 'POST'
        });
    }
};