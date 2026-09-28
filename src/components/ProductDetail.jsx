import React, { useState } from 'react';
import './ProductDetail.css';

const ProductDetail = ({ product, onClose, addToCart, onToggleLike, isLiked, allProducts }) => {
  const [quantity, setQuantity] = useState(1);

  // Get suggested products (same category, excluding current product)
  const getSuggestedProducts = () => {
    return allProducts
      .filter(p => p.id !== product.id)
      .slice(0, 5);
  };

  const suggestedProducts = getSuggestedProducts();

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    alert(`${quantity} x ${product.name} added to cart!`);
  };

  return (
    <div className="product-detail-overlay" onClick={onClose}>
      <div className="product-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="detail-close-btn" onClick={onClose}>×</button>

        <div className="detail-container">
          {/* Left Section: Images */}
          <div className="detail-left">
            <div className="main-image">
              <img src={product.img} alt={product.name} />
            </div>
            <div className="thumbnail-images">
              <img src={product.img} alt={product.name} className="active" />
              <img src={product.img} alt={product.name} />
              <img src={product.img} alt={product.name} />
            </div>
          </div>

          {/* Right Section: Product Details */}
          <div className="detail-right">
            <h1 className="detail-product-name">{product.name}</h1>

            <div className="detail-rating">
              <span className="stars">★★★★★</span>
              <span className="review-count">(124 reviews)</span>
            </div>

            <div className="detail-price-section">
              <span className="detail-price">₹{product.price}</span>
              <span className="original-price">₹{Math.round(product.price * 1.3)}</span>
              <span className="discount">Save 25%</span>
            </div>

            <div className="detail-info">
              <div className="info-row">
                <span className="info-label">Weight/Unit:</span>
                <span className="info-value">{product.weight}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Availability:</span>
                <span className="info-value in-stock">In Stock</span>
              </div>
              <div className="info-row">
                <span className="info-label">Delivery:</span>
                <span className="info-value">Free delivery on orders above ₹500</span>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="quantity-selector">
              <label>Quantity:</label>
              <div className="qty-control">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                <input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} />
                <button onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button className="add-to-cart-btn" onClick={handleAddToCart}>
                🛒 Add to Cart
              </button>
              <button
                className={`wishlist-btn ${isLiked ? 'liked' : ''}`}
                onClick={onToggleLike}
              >
                {isLiked ? '❤️' : '🤍'} Wishlist
              </button>
            </div>

            {/* Product Description */}
            <div className="product-description">
              <h3>About This Product</h3>
              <p>
                Fresh and premium quality {product.name}. Sourced directly from certified farmers to ensure maximum freshness and nutritional value.
                Packed with essential vitamins and minerals for a healthy lifestyle.
              </p>
              <ul>
                <li>✓ 100% Fresh Guarantee</li>
                <li>✓ Organic & Pesticide-free</li>
                <li>✓ Same-day Delivery Available</li>
                <li>✓ Money-back Guarantee</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Suggested Products Section */}
        <div className="suggested-section">
          <h2>Customers Also Bought</h2>
          <div className="suggested-products">
            {suggestedProducts.map((suggestedItem) => (
              <div key={suggestedItem.id} className="suggested-product-card">
                <div className="suggested-img">
                  <img src={suggestedItem.img} alt={suggestedItem.name} />
                </div>
                <p className="suggested-name">{suggestedItem.name}</p>
                <p className="suggested-weight">{suggestedItem.weight}</p>
                <div className="suggested-footer">
                  <span className="suggested-price">₹{suggestedItem.price}</span>
                  <button
                    className="suggested-add-btn"
                    onClick={() => {
                      addToCart(suggestedItem);
                      alert(`${suggestedItem.name} added to cart!`);
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
