import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import { products, categories } from './data';

import Navbar from './components/Navbar';
import Sidebar from './components/sidebar';
import ProductCard from './components/ProductCard';
import Cart from './components/Cart';
import LoginModal from './components/LoginModal';
import PaymentModal from './components/PaymentModal';
import MyOrders from './components/MyOrders';
import Wishlist from './components/Wishlist';
import { AuthProvider, useAuth } from './context/AuthContext';
import { cartAPI } from './services/api';

function AppContent() {

  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("veg");

  // Navigation State
  const [activeView, setActiveView] = useState("home"); // "home" | "orders" | "wishlist"
  const [activeOrderId, setActiveOrderId] = useState(null);

  // Wishlist State (Local Storage)
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const { isAuthenticated, syncCartToServer } = useAuth();

  // Save wishlist on change
  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const toggleWishlist = useCallback((item) => {
    if (!isAuthenticated) {
      setIsLoginOpen(true);
      return;
    }
    setWishlist(prev => {
      const isLiked = prev.some(w => w.id === item.id);
      if (isLiked) {
        return prev.filter(w => w.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  }, [isAuthenticated]);
  useEffect(() => {
    const loadCart = async () => {
      if (isAuthenticated) {
        try {
          // Sync local cart to server if exists
          if (cart.length > 0) {
            await syncCartToServer(cart);
          }
          // Fetch cart from server
          const data = await cartAPI.getCart();
          if (data.cart && data.cart.items) {
            setCart(data.cart.items.map(item => ({
              id: item.productId,
              name: item.name,
              weight: item.weight,
              price: item.price,
              img: item.img,
              qty: item.qty
            })));
          }
        } catch (error) {
          console.error('Failed to load cart:', error);
        }
      }
    };
    loadCart();
  }, [isAuthenticated, cart, syncCartToServer]);

  const addToCart = useCallback(async (product) => {
    setCart((prev) => {
      const exist = prev.find((item) => item.id === product.id);
      if (exist) return prev.map((item) => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { ...product, qty: 1 }];
    });
    setIsCartOpen(true);

    // Sync with server if authenticated
    if (isAuthenticated) {
      try {
        await cartAPI.addToCart(product);
      } catch (error) {
        console.error('Failed to sync cart:', error);
      }
    }
  }, [isAuthenticated]);

  const updateQty = useCallback(async (id, delta) => {
    let newQty = 0;
    setCart((prev) => prev.map((item) => {
      if (item.id === id) {
        newQty = item.qty + delta;
        return { ...item, qty: newQty };
      }
      return item;
    }).filter((item) => item.qty > 0));

    // Sync with server if authenticated
    if (isAuthenticated) {
      try {
        const currentItem = cart.find(item => item.id === id);
        if (currentItem) {
          const updatedQty = currentItem.qty + delta;
          await cartAPI.updateCart(id, updatedQty);
        }
      } catch (error) {
        console.error('Failed to update cart:', error);
      }
    }
  }, [isAuthenticated, cart]);

  const handlePaymentSuccess = useCallback(async (paymentData) => {
    setCart([]);
    setIsPaymentOpen(false);

    // Clear cart on server if authenticated
    if (isAuthenticated) {
      try {
        await cartAPI.clearCart();
      } catch (error) {
        console.error('Failed to clear cart:', error);
      }

      // Navigate to orders and highlight the new order if created
      if (paymentData && paymentData.id) {
        setActiveOrderId(paymentData.id);
      } else {
        setActiveOrderId(null);
      }
      setActiveView('orders');
    } else {
      // if not authenticated, maybe just show home since history is protected
      setActiveView('home');
    }
  }, [isAuthenticated]);

  const handleLoginSuccess = useCallback(() => {
    // Sync cart after login
    if (cart.length > 0) {
      syncCartToServer(cart);
    }
  }, [cart, syncCartToServer]);

  const scrollToSection = (id) => {
    setActiveCategory(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };


  const allProducts = Object.values(products).flat();

  const displayedProducts = searchQuery
    ? { 'Search Results': allProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())) }
    : products;

  return (
    <div className="app-container">

      {/* NAVBAR */}
      <Navbar
        cartCount={cart.reduce((sum, item) => sum + item.qty, 0)}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onNavigate={(view) => {
          setActiveView(view);
          if (view !== 'orders') setActiveOrderId(null);
        }}
      />

      <div className="main-body">
        {activeView === 'home' && (
          <>
            {/* SIDEBAR */}
            <Sidebar
              categories={categories}
              activeCategory={activeCategory}
              onSelectCategory={(id) => { setSearchQuery(""); scrollToSection(id); }}
            />

            {/* MAIN PRODUCT AREA */}
            <main className="content-area">
              {searchQuery && displayedProducts['Search Results']?.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: '50px', color: '#666' }}><h3>No products found</h3></div>
              ) : (
                Object.entries(displayedProducts).map(([key, items]) => (
                  items && items.length > 0 && (
                    <section key={key} id={key} className="category-section">
                      <h2 className="cat-title">{key === 'Search Results' ? `Results for "${searchQuery}"` : categories.find(c => c.id === key)?.label || key}</h2>
                      <div className="product-grid">
                        {items.map((item) => (
                          <ProductCard
                            key={item.id}
                            item={item}
                            addToCart={addToCart}
                            isLiked={wishlist.some(w => w.id === item.id)}
                            onToggleLike={() => toggleWishlist(item)}
                          />
                        ))}
                      </div>
                    </section>
                  )
                ))
              )}
            </main>
          </>
        )}

        {activeView === 'orders' && (
          <MyOrders
            activeOrderId={activeOrderId}
            onOpenLogin={() => setIsLoginOpen(true)}
          />
        )}

        {activeView === 'wishlist' && (
          <Wishlist
            wishlistItems={wishlist}
            addToCart={addToCart}
            onToggleLike={toggleWishlist}
          />
        )}
      </div>

      {/* MODALS & OVERLAYS */}
      {isCartOpen && (
        <Cart
          cart={cart}
          onClose={() => setIsCartOpen(false)}
          updateQty={updateQty}
          onOpenPayment={() => setIsPaymentOpen(true)}
        />
      )}

      {isPaymentOpen && (
        <PaymentModal
          onClose={() => setIsPaymentOpen(false)}
          onPaymentSuccess={handlePaymentSuccess}
          cart={cart}
          onOpenLogin={() => setIsLoginOpen(true)}
        />
      )}

      {isLoginOpen && <LoginModal onClose={() => setIsLoginOpen(false)} onLoginSuccess={handleLoginSuccess} />}

    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;