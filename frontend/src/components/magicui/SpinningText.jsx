import React from 'react';
import './magicui.css';

export function SpinningText({
  children = 'learn more • earn more • grow more •',
  reverse = false,
  duration = 10,
  radius = 6,
  className = '',
  targetId = 'products-section',
  onClick
}) {
  const text = typeof children === 'string' ? children : 'learn more • earn more • grow more •';
  // Magic UI accepts radius as small units (e.g. 5 or 6) or px. Normalize to px.
  const effectiveRadius = Number(radius) <= 12 ? Number(radius) * 9.5 : Number(radius);
  const size = effectiveRadius * 2 + 36;
  const center = size / 2;
  const pathRadius = effectiveRadius;

  const handleScrollClick = (e) => {
    e.preventDefault();
    if (onClick) {
      onClick(e);
      return;
    }
    const target = document.getElementById(targetId) || document.querySelector('.content-area') || document.querySelector('.category-section') || document.querySelector('.about-values-section');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollBy({ top: window.innerHeight * 0.7, behavior: 'smooth' });
    }
  };

  // SVG Circular Path ID
  const pathId = `spinning-text-circle-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <div
      className={`spinning-text-wrapper ${className}`}
      onClick={handleScrollClick}
      title="Scroll down"
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <svg
        className={`spinning-text-svg ${reverse ? 'reverse' : ''}`}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ animationDuration: `${duration}s` }}
      >
        <defs>
          <path
            id={pathId}
            d={`M ${center}, ${center} m -${pathRadius}, 0 a ${pathRadius},${pathRadius} 0 1,1 ${pathRadius * 2},0 a ${pathRadius},${pathRadius} 0 1,1 -${pathRadius * 2},0`}
            className="spinning-text-path"
          />
        </defs>
        <text className="spinning-text-content">
          <textPath href={`#${pathId}`} startOffset="0%">
            {text}
          </textPath>
        </text>
      </svg>

      {/* Center Action Button with Down Arrow */}
      <div className="spinning-text-center-btn" aria-hidden="true">
        <svg
          className="spinning-text-arrow"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <polyline points="19 12 12 19 5 12"></polyline>
        </svg>
      </div>
    </div>
  );
}

export default SpinningText;
