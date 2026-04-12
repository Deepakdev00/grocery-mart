import React from 'react';

const Sidebar = ({ categories, activeCategory, onSelectCategory }) => {
  return (
    <aside className="sidebar">
      <nav>
        {categories.map((cat) => (
          cat.label && ( 
            <div 
                key={cat.id} 
                className={`nav-item ${activeCategory === cat.id ? 'active' : ''}`} 
                onClick={() => onSelectCategory(cat.id)}
            >
                {cat.label}
            </div>
          )
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;