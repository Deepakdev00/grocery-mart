import React from 'react';
import './magicui.css';

export function DiaTextReveal({
  text = 'Grocery Mart',
  colors = ['#22d3ee', '#818cf8', '#f472b6', '#34d399'],
  className = '',
  onClick
}) {
  const characters = text.split('');

  return (
    <div
      className={`dia-text-reveal ${className}`}
      onClick={onClick}
      role="banner"
      aria-label={text}
    >
      {characters.map((char, index) => {
        const color = colors[index % colors.length];
        const delay = (index * 0.08).toFixed(2);

        if (char === ' ') {
          return <span key={index} style={{ width: '0.35em', display: 'inline-block' }}>&nbsp;</span>;
        }

        return (
          <span
            key={index}
            className="dia-letter"
            style={{
              color,
              animationDelay: `${delay}s`,
            }}
          >
            {char}
          </span>
        );
      })}
    </div>
  );
}

export default DiaTextReveal;
