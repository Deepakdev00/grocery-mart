import React, { useState, useEffect, useCallback } from 'react';
import './assets/styles/App.css';
import { categories } from './constants';

import { Navbar, Sidebar } from './components/layout';
import { SessionWarning } from './components/feedback';
import { ProductCard, ProductDetail, Wishlist } from './features/products';
import { Cart, PaymentModal } from './features/cart';
import { LoginModal } from './features/auth';
import { MyOrders } from './features/orders';
import { AdminLogin, AdminPanel } from './features/admin';
import { UserProfile, SupportCenter, AboutUs, ContactUs } from './pages';
import {
  AuthProvider,
  useAuth,
  AdminProvider,
  useAdmin,
  ThemeProvider,
  useTheme,
  ToastProvider,
  useToast
} from './context';
import { cartAPI, productsAPI, wishlistAPI } from './services';

const mapCartItem = (item) => ({
  id: item.productId || item.id,
  name: item.name,
  weight: item.weight || '',
  price: Number(item.price),
  img: item.img || item.imageUrl || '',
  qty: item.qty || 1
});

const mapProduct = (product) => {
  const categoryAliases = {
    vegetables: 'veg',
    fruits: 'veg',
    bakery: 'dairy',
    beverages: 'drinks'
  };
  const category = categories.some(({ id }) => id === product.category)
    ? product.category
    : categoryAliases[product.category?.toLowerCase()] || product.category;
  return {
    ...product,
    id: String(product.id),
    category,
    weight: product.weight || '',
    img: product.imageUrl || ''
  };
};

function AppContent() {
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState('');
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

  const [wishlist, setWishlist] = useState([]);
  const { isAuthenticated, user } = useAuth();
  const { isAdminAuthenticated, loading: adminLoading, logoutAdmin } = useAdmin();
  const { setTheme } = useTheme();
  const { error: showError } = useToast();

  useEffect(() => {
    if (!adminLoading && isAdminAuthenticated) {
      setActiveView('admin');
    }
  }, [adminLoading, isAdminAuthenticated]);

  useEffect(() => {
    if (
      !isAuthenticated &&
      !isAdminAuthenticated &&
      activeView !== 'about' &&
      activeView !== 'contact' &&
      activeView !== 'admin'
    ) {
      setActiveView('about');
    }
  }, [isAuthenticated, isAdminAuthenticated, activeView]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'customer') {
      setCart([]);
      setWishlist([]);
      setProducts([]);
      setProductsLoading(false);
      setIsCartOpen(false);
      return;
    }

    let isCurrent = true;
    setProductsLoading(true);
    setProductsError('');
    Promise.all([productsAPI.getProducts(), cartAPI.getCart(), wishlistAPI.getWishlist()])
      .then(([productData, cartData, wishlistData]) => {
        if (!isCurrent) return;
        setProducts((productData.products || []).map(mapProduct));
        setCart((cartData.cart?.items || []).map(mapCartItem));
        setWishlist((wishlistData.items || []).map(mapProduct));
      })
      .catch((error) => {
        if (!isCurrent) return;
        setProductsError(error.message || 'Could not load store data. Please try again.');
      })
      .finally(() => {
        if (isCurrent) setProductsLoading(false);
      });
    return () => { isCurrent = false; };
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    if (isAuthenticated && user?.profile?.theme) {
      setTheme(user.profile.theme);
    }
  }, [isAuthenticated, setTheme, user?.profile?.theme]);

  const toggleWishlist = useCallback(async (item) => {
    if (!isAuthenticated || user?.role !== 'customer') {
      setLoginModalState({ isOpen: true, isSignUp: false });
      return;
    }

    const isLiked = wishlist.some((saved) => saved.id === item.id);
    try {
      if (isLiked) {
        await wishlistAPI.remove(item.id);
        setWishlist((previous) => previous.filter((saved) => saved.id !== item.id));
      } else {
        const { product } = await wishlistAPI.add(item.id);
        setWishlist((previous) => previous.some((saved) => saved.id === item.id)
          ? previous
          : [...previous, mapProduct(product)]);
      }
    } catch (error) {
      showError(error.message || 'Could not update your wishlist.');
    }
  }, [isAuthenticated, user?.role, wishlist, showError]);

  const loadCartFromResponse = useCallback((data) => {
    setCart((data.cart?.items || []).map(mapCartItem));
  }, []);

  const addToCart = useCallback(async (product) => {
    if (!isAuthenticated || user?.role !== 'customer') {
      setLoginModalState({ isOpen: true, isSignUp: false });
      return;
    }

    try {
      const data = await cartAPI.addToCart({ id: product.id, qty: 1 });
      loadCartFromResponse(data);
      setIsCartOpen(true);
    } catch (error) {
      showError(error.message || 'Could not add this product to your cart.');
    }
  }, [isAuthenticated, user?.role, showError, loadCartFromResponse]);

  const updateQty = useCallback(async (id, delta) => {
    const currentItem = cart.find((item) => item.id === id);
    if (!currentItem) return;

    try {
      const data = await cartAPI.updateCart(id, currentItem.qty + delta);
      loadCartFromResponse(data);
    } catch (error) {
      showError(error.message || 'Could not update your cart.');
    }
  }, [cart, showError, loadCartFromResponse]);

  const handlePaymentSuccess = useCallback(async (paymentData) => {
    setCart([]);
    setIsPaymentOpen(false);

    if (isAuthenticated && paymentData?.id) {
      setActiveOrderId(paymentData.id);
      setActiveView('orders');
    } else {
      setActiveView('home');
    }
  }, [isAuthenticated]);

  const handleLoginSuccess = useCallback(() => {
    setActiveView('home');
    setLoginModalState({ isOpen: false, isSignUp: false });
  }, []);

  const scrollToSection = (id) => {
    setActiveCategory(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const displayedProducts = searchQuery
    ? {
      'Search Results': products.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()))
    }
    : products.reduce((grouped, product) => {
      const category = product.category || 'Other';
      grouped[category] = [...(grouped[category] || []), product];
      return grouped;
    }, {});

  const allProducts = products;

  return (
    <div className="app-container">
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
            const customerOnlyViews = ['home', 'orders', 'wishlist'];
            if (
              view !== 'admin' &&
              view !== 'about' &&
              view !== 'contact' &&
              (!isAuthenticated || (customerOnlyViews.includes(view) && user?.role !== 'customer'))
            ) {
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
          adminLoading ? (
            <div role="status" className="content-area">Checking administrator session...</div>
          ) : isAdminAuthenticated ? (
            <AdminPanel
              onBack={async () => {
                try {
                  await logoutAdmin();
                } finally {
                  setActiveView(isAuthenticated ? 'home' : 'about');
                }
              }}
            />
          ) : (
            <AdminLogin
              onClose={() => setActiveView('about')}
              onLoginSuccess={() => setActiveView('admin')}
            />
          )
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

        {activeView === 'home' && isAuthenticated && user?.role === 'customer' && (
          <>
            <Sidebar
              categories={categories}
              activeCategory={activeCategory}
              onSelectCategory={(id) => { setSearchQuery(''); scrollToSection(id); }}
            />
            <main className="content-area">
              {productsError && <p role="alert">{productsError}</p>}
              {productsLoading ? (
                <p role="status">Loading products...</p>
              ) : !productsError && products.length === 0 ? (
                <div role="status" style={{ textAlign: 'center', marginTop: '50px' }}>
                  <h3>No products are available right now.</h3>
                  <p>Please check back later.</p>
                </div>
              ) : searchQuery && displayedProducts['Search Results']?.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-secondary, #666)' }}>
                  <h3>No products found for "{searchQuery}"</h3>
                  <p>Try searching for something else.</p>
                </div>
              ) : (
                Object.entries(displayedProducts).map(([key, items]) => (
                  items && items.length > 0 && (
                    <section key={key} id={key} className="category-section">
                      <h2 className="cat-title">
                        {key === 'Search Results'
                          ? `Results for "${searchQuery}"`
                          : categories.find((category) => category.id === key)?.label || key}
                      </h2>
                      <div className="product-grid">
                        {items.map((item) => (
                          <ProductCard
                            key={item.id}
                            item={item}
                            addToCart={addToCart}
                            isLiked={wishlist.some((saved) => saved.id === item.id)}
                            onToggleLike={() => toggleWishlist(item)}
                            onProductClick={() => setSelectedProduct(item)}
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

        {activeView === 'orders' && isAuthenticated && user?.role === 'customer' && (
          <MyOrders
            activeOrderId={activeOrderId}
            onOpenLogin={() => setLoginModalState({ isOpen: true, isSignUp: false })}
          />
        )}

        {activeView === 'wishlist' && isAuthenticated && user?.role === 'customer' && (
          <Wishlist
            wishlistItems={wishlist}
            addToCart={addToCart}
            onToggleLike={toggleWishlist}
          />
        )}

        {activeView === 'profile' && (
          <UserProfile onBack={() => setActiveView('home')} />
        )}

        {activeView === 'support' && (
          <SupportCenter onBack={() => setActiveView('home')} />
        )}
      </div>

      {isAuthenticated && user?.role === 'customer' && isCartOpen && (
        <Cart
          cart={cart}
          onClose={() => setIsCartOpen(false)}
          updateQty={updateQty}
          onOpenPayment={() => setIsPaymentOpen(true)}
        />
      )}

      {isAuthenticated && user?.role === 'customer' && isPaymentOpen && (
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
          isLiked={wishlist.some((saved) => saved.id === selectedProduct.id)}
          allProducts={allProducts}
        />
      )}

      {isAuthenticated && <SessionWarning />}
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
