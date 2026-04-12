import React from 'react';

const ProductCard = ({ item, addToCart, isLiked, onToggleLike }) => {
  return (
    <div className="product-card">
      <div className="img-container" style={{ position: 'relative' }}>
        <img
          src={item.img}
          alt={item.name}
          className="prod-img"
          onError={(e) => e.target.src = 'https://placehold.co/100?text=Item'}
        />
        {onToggleLike && (
          <div 
            style={{
              position: 'absolute',
              top: '5px',
              right: '5px',
              cursor: 'pointer',
              background: 'white',
              borderRadius: '50%',
              padding: '4px',
              display: 'flex',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s',
              transform: isLiked ? 'scale(1.1)' : 'scale(1)'
            }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleLike();
            }}
            title={isLiked ? "Remove from wishlist" : "Add to wishlist"}
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill={isLiked ? "#e24056" : "none"}
              stroke={isLiked ? "#e24056" : "#999"}
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </div>
        )}
      </div>
      <div className="prod-details">
        <div className="prod-time">In Time Delivery</div>
        <div className="prod-name">{item.name}</div>
        <div className="prod-weight">{item.weight}</div>
        <div className="prod-footer">
          <div className="prod-price">₹{item.price}</div>
          <button className="add-btn" onClick={() => addToCart(item)}>ADD</button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;