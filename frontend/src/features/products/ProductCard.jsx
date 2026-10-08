import React, { useState } from 'react';
import { useAuth } from '../../context';
import { ShimmerButton } from '../../components/magicui';

const ProductCard = ({ item, addToCart, isLiked, onToggleLike, onProductClick, onOpenLogin }) => {
  const { isAuthenticated } = useAuth();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddClick = (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      if (onOpenLogin) onOpenLogin();
    } else {
      setIsAdding(true);
      addToCart(item);
      setTimeout(() => setIsAdding(false), 600);
    }
  };

  return (
    <div className="product-card" onClick={() => onProductClick && onProductClick(item)}>
      <div className="img-container" style={{ position: 'relative', cursor: 'pointer' }}>
        <img
          src={item.img}
          alt={item.name}
          className="prod-img"
          onError={(e) => { e.target.src = 'https://placehold.co/100?text=Item'; }}
        />
        {onToggleLike && (
          <div
            style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              cursor: 'pointer',
              background: 'var(--bg-card)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid var(--border-glass)',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s',
              transform: isLiked ? 'scale(1.15)' : 'scale(1)',
            }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleLike();
            }}
            title={isLiked ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill={isLiked ? 'var(--color-danger)' : 'none'}
              stroke={isLiked ? 'var(--color-danger)' : 'var(--text-muted)'}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transition: 'all 0.25s',
                animation: isLiked ? 'heartPop 0.35s ease' : 'none'
              }}
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </div>
        )}
      </div>
      <div className="prod-details">
        <div className="prod-time">⚡ 10 MINS</div>
        <div className="prod-name" title={item.name}>{item.name}</div>
        <div className="prod-weight">{item.weight}</div>
        <div className="prod-footer">
          <div className="prod-price">₹{item.price}</div>
          <ShimmerButton
            onClick={handleAddClick}
            isAdded={isAdding}
            className="card-shimmer-btn"
          >
            ADD
          </ShimmerButton>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
