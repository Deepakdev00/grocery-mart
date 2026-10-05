import React, { useState, useEffect, useCallback } from 'react';
import './assets/styles/App.css';
import { products, categories } from './constants';

import { Navbar, Sidebar } from './components/layout';
import { SessionWarning } from './components/feedback';
import { ProductCard, ProductDetail, Wishlist } from './features/products';
import { Cart, PaymentModal } from './features/cart';
import { LoginModal } from './features/auth';
import { MyOrders } from './features/orders';
import { AdminPanel } from './features/admin';
import { UserProfile, SupportCenter, AboutUs, ContactUs } from './pages';
import { AuthProvider, useAuth, AdminProvider, ThemeProvider, ToastProvider } from './context';
import { cartAPI } from './services';

function AppContent() {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loginModalState, setLoginModalState] = useState({ isOpen: false, isSignUp: false });
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('veg');
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Navigation State: "home" | "about" | "contact" | "orders" | "wishlist" | "profile" | "support" | "admin"
  // Default to "about" for unauthenticated visitors
  const [activeView, setActiveView] = useState('about');
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

  // Route protection: If unauthenticated and on a protected view, redirect to "about"
  useEffect(() => {
    if (!isAuthenticated && activeView !== 'about' && activeView !== 'contact') {
      setActiveView('about');
    }
  }, [isAuthenticated, activeView]);

  // Save wishlist on change
  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const toggleWishlist = useCallback((item) => {
    if (!isAuthenticated) {
      setLoginModalState({ isOpen: true, isSignUp: false });
      return;
    }
    setWishlist((prev) => {
      const isLiked = prev.some((w) => w.id === item.id);
      if (isLiked) {
        return prev.filter((w) => w.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  }, [isAuthenticated]);

  useEffect(() => {
    const loadCart = async () => {
      if (isAuthenticated) {
        try {
          const data = await cartAPI.getCart();
          if (data.cart && data.cart.items) {
            setCart(data.cart.items.map((item) => ({
              id: item.productId,
              name: item.name,
              weight: item.weight,
              price: item.price,
              img: item.img,
              qty: item.qty,
            })));
          }
        } catch (error) {
          console.error('Failed to load cart:', error);
        }
      }
    };
    loadCart();
  }, [isAuthenticated]);

  const addToCart = useCallback(async (product) => {
    setCart((prev) => {
      const exist = prev.find((item) => item.id === product.id);
      if (exist) return prev.map((item) => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { ...product, qty: 1 }];
    });
    setIsCartOpen(true);

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

    if (isAuthenticated) {
      try {
        const currentItem = cart.find((item) => item.id === id);
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

    if (isAuthenticated) {
      try {
        await cartAPI.clearCart();
      } catch (error) {
        console.error('Failed to clear cart:', error);
      }

      if (paymentData && paymentData.id) {
        setActiveOrderId(paymentData.id);
      } else {
        setActiveOrderId(null);
      }
      setActiveView('orders');
    } else {
      setActiveView('home');
    }
  }, [isAuthenticated]);

  const handleLoginSuccess = useCallback(() => {
    setActiveView('home');
    setLoginModalState({ isOpen: false, isSignUp: false });
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
    ? { 'Search Results': allProducts.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase())) }
    : products;

  return (
    <div className="app-container">
      {/* NAVBAR - Hidden only during admin view */}
      {activeView !== 'admin' && (
        <Navbar
          cartCount={cart.reduce((sum, item) => sum + item.qty, 0)}
          onOpenLogin={(isSignUp = false) => setLoginModalState({ isOpen: true, isSignUp })}
          onOpenSignUp={() => setLoginModalState({ isOpen: true, isSignUp: true })}
          onOpenCart={() => setIsCartOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeView={activeView}
          onNavigate={(view) => {
            if (!isAuthenticated && view !== 'about' && view !== 'contact') {
              setLoginModalState({ isOpen: true, isSignUp: false });
              return;
            }
            setActiveView(view);
            if (view !== 'orders') setActiveOrderId(null);
          }}
        />
      )}

      <div className="main-body">
        {activeView === 'admin' && (
          <AdminPanel
            onBack={() => setActiveView('home')}
          />
        )}

        {activeView === 'about' && (
          <AboutUs
            onNavigate={(view) => setActiveView(view)}
            onOpenLogin={(isSignUp = false) => setLoginModalState({ isOpen: true, isSignUp })}
          />
        )}

        {activeView === 'contact' && (
          <ContactUs
            onNavigate={(view) => setActiveView(view)}
            onOpenLogin={(isSignUp = false) => setLoginModalState({ isOpen: true, isSignUp })}
          />
        )}

        {activeView === 'home' && (
          <>
            {/* SIDEBAR */}
            <Sidebar
              categories={categories}
              activeCategory={activeCategory}
              onSelectCategory={(id) => { setSearchQuery(''); scrollToSection(id); }}
            />

            {/* MAIN PRODUCT AREA */}
            <main className="content-area">
              {searchQuery && displayedProducts['Search Results']?.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-secondary, #666)' }}>
                  <h3>No products found for "{searchQuery}"</h3>
                  <p>Try searching for something else like tomato, milk, chips or apple</p>
                </div>
              ) : (
                Object.entries(displayedProducts).map(([key, items]) => (
                  items && items.length > 0 && (
                    <section key={key} id={key} className="category-section">
                      <h2 className="cat-title">
                        {key === 'Search Results' ? `Results for "${searchQuery}"` : categories.find((c) => c.id === key)?.label || key}
                      </h2>
                      <div className="product-grid">
                        {items.map((item) => (
                          <ProductCard
                            key={item.id}
                            item={item}
                            addToCart={addToCart}
                            isLiked={wishlist.some((w) => w.id === item.id)}
                            onToggleLike={() => toggleWishlist(item)}
                            onProductClick={() => {
                              if (!isAuthenticated) {
                                setLoginModalState({ isOpen: true, isSignUp: false });
                              } else {
                                setSelectedProduct(item);
                              }
                            }}
                            onOpenLogin={() => setLoginModalState({ isOpen: true, isSignUp: false })}
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
            onOpenLogin={() => setLoginModalState({ isOpen: true, isSignUp: false })}
          />
        )}

        {activeView === 'wishlist' && (
          <Wishlist
            wishlistItems={wishlist}
            addToCart={addToCart}
            onToggleLike={toggleWishlist}
          />
        )}

        {activeView === 'profile' && (
          <UserProfile
            onBack={() => setActiveView('home')}
          />
        )}

        {activeView === 'support' && (
          <SupportCenter
            onBack={() => setActiveView('home')}
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
          onOpenLogin={() => setLoginModalState({ isOpen: true, isSignUp: false })}
        />
      )}

      {loginModalState.isOpen && (
        <LoginModal
          initialIsSignUp={loginModalState.isSignUp}
          onClose={() => setLoginModalState({ isOpen: false, isSignUp: false })}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          addToCart={addToCart}
          onToggleLike={() => toggleWishlist(selectedProduct)}
          isLiked={wishlist.some((w) => w.id === selectedProduct.id)}
          allProducts={Object.values(products).flat()}
        />
      )}

      {/* SESSION TIMEOUT WARNING MODAL */}
      <SessionWarning />
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <ThemeProvider>
        <AuthProvider>
          <AdminProvider>
            <AppContent />
          </AdminProvider>
        </AuthProvider>
      </ThemeProvider>
    </ToastProvider>
  );
}

export default App;
