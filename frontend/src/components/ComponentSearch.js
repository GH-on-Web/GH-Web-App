import React, { useState, useEffect, useRef } from 'react';
import './ComponentSearch.css';

/**
 * Component search bar for adding components from the database to the canvas
 */
const ComponentSearch = ({ componentsDatabase, onComponentSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef(null);

  // Search components when search term changes
  useEffect(() => {
    if (searchTerm.trim().length > 0) {
      const term = searchTerm.toLowerCase();
      const results = componentsDatabase.filter(comp => 
        comp.Name?.toLowerCase().includes(term) ||
        comp.Nickname?.toLowerCase().includes(term) ||
        comp.Category?.toLowerCase().includes(term)
      ).slice(0, 10); // Limit to 10 results
      
      setSearchResults(results);
      setIsOpen(results.length > 0);
      setSelectedIndex(0);
    } else {
      setSearchResults([]);
      setIsOpen(false);
    }
  }, [searchTerm, componentsDatabase]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, searchResults.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (searchResults[selectedIndex]) {
          handleSelectComponent(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  // Handle component selection
  const handleSelectComponent = (component) => {
    if (onComponentSelect) {
      onComponentSelect(component);
    }
    setSearchTerm('');
    setIsOpen(false);
    setSearchResults([]);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="component-search" ref={searchRef}>
      <div className="search-input-container">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="Search components... (e.g., 'addition', 'slider', 'point')"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => searchTerm && setIsOpen(true)}
        />
        {searchTerm && (
          <button 
            className="search-clear"
            onClick={() => {
              setSearchTerm('');
              setIsOpen(false);
            }}
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && searchResults.length > 0 && (
        <div className="search-results">
          {searchResults.map((component, index) => (
            <div
              key={component.Guid}
              className={`search-result-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => handleSelectComponent(component)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="result-main">
                <span className="result-nickname">{component.Nickname || component.Name}</span>
                <span className="result-name">{component.Name}</span>
              </div>
              <div className="result-category">
                {component.Category}{component.SubCategory ? ` > ${component.SubCategory}` : ''}
              </div>
              <div className="result-info">
                <span className="result-io">
                  {component.Inputs?.length || 0} inputs • {component.Outputs?.length || 0} outputs
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {searchTerm && searchResults.length === 0 && (
        <div className="search-results">
          <div className="search-no-results">
            No components found for "{searchTerm}"
          </div>
        </div>
      )}
    </div>
  );
};

export default ComponentSearch;
