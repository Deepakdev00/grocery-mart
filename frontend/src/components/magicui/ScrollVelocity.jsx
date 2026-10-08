import React from 'react';
import './magicui.css';

export function ScrollVelocityRow({ children, baseVelocity = 20, direction = 1, className = '' }) {
  const isForward = direction >= 0;
  // Duplicate array of items to create seamless infinite scroll
  const repetitions = [0, 1, 2, 3, 4, 5];

  return (
    <div className={`scroll-velocity-row ${className}`}>
      <div className={`scroll-velocity-track ${isForward ? 'direction-forward' : 'direction-reverse'}`}>
        {repetitions.map((idx) => (
          <div key={`track1-${idx}`} className="velocity-item">
            {children}
          </div>
        ))}
      </div>
      <div className={`scroll-velocity-track ${isForward ? 'direction-forward' : 'direction-reverse'}`} aria-hidden="true">
        {repetitions.map((idx) => (
          <div key={`track2-${idx}`} className="velocity-item">
            {children}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ScrollVelocityContainer({ children, className = '' }) {
  return (
    <div className={`scroll-velocity-container ${className}`}>
      <div className="scroll-velocity-fade-left"></div>
      <div className="scroll-velocity-fade-right"></div>
      {children}
    </div>
  );
}

const ScrollVelocity = {
  ScrollVelocityContainer,
  ScrollVelocityRow
};

export default ScrollVelocity;
