import React from 'react';
import './magicui.css';

export function ShimmerButton({
  children = 'ADD',
  onClick,
  className = '',
  isAdded = false,
  disabled = false,
  type = 'button'
}) {
  return (
    <button
      type={type}
      className={`shimmer-button ${isAdded ? 'added' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={typeof children === 'string' ? children : 'Add product'}
    >
      <div className="shimmer-button-glow" aria-hidden="true"></div>
      <div className="shimmer-button-inner">
        {isAdded ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>ADDED</span>
          </>
        ) : (
          children
        )}
      </div>
    </button>
  );
}

export default ShimmerButton;
