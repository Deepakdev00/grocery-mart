import React from 'react';
import ProductCard from './ProductCard';

const Wishlist = ({ wishlistItems, addToCart, onToggleLike, onProductClick, onOpenLogin }) => {
  return (
    <div className="content-area">
      <h2 className="cat-title" style={{ marginBottom: '24px' }}>My Wishlist 💕</h2>

      {wishlistItems && wishlistItems.length > 0 ? (
        <div className="product-grid">
          {wishlistItems.map((item) => (
            <ProductCard
              key={item.id}
              item={item}
              addToCart={addToCart}
              isLiked={true}
              onToggleLike={() => onToggleLike(item)}
              onProductClick={onProductClick}
              onOpenLogin={onOpenLogin}
            />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', marginTop: '60px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '46px', marginBottom: '14px' }}>💖</div>
          <h3 style={{ color: 'var(--text-heading)' }}>Your wishlist is empty</h3>
          <p>Explore the store and click the heart icon on your favorite items to save them for later.</p>
        </div>
      )}
    </div>
  );
};

export default Wishlist;
