import React from 'react';
import ProductCard from './ProductCard';

const Wishlist = ({ wishlistItems, addToCart, onToggleLike }) => {
  return (
    <div className="content-area">
      <h2 className="cat-title" style={{ marginBottom: '20px' }}>My Wishlist 💕</h2>

      {wishlistItems && wishlistItems.length > 0 ? (
        <div className="product-grid">
          {wishlistItems.map(item => (
            <ProductCard
              key={item.id}
              item={item}
              addToCart={addToCart}
              isLiked={true}
              onToggleLike={() => onToggleLike(item)}
            />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', marginTop: '60px', color: '#666' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>💔</div>
          <h3>Your wishlist is empty</h3>
          <p>Explore the store and click the heart icon on your favorite items to add them here.</p>
        </div>
      )}
    </div>
  );
};

export default Wishlist;
