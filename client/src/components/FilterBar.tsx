import React from 'react';
import { Search } from 'lucide-react';

const CATEGORIES = [
  'All',
  'Model Release',
  'Model Update',
  'Research Breakthrough',
  'AI Agent',
  'Open Source / Open Weight',
  'AI Coding',
  'AI Hardware',
  'AI Infrastructure',
  'AI Safety',
  'AI Regulation / Policy',
  'Robotics',
  'AI Startup',
  'Enterprise AI',
  'Developer Tools',
  'Benchmark'
];

const TIME_RANGES = [
  { label: '24 Hours', value: '24h' },
  { label: 'Today', value: 'today' },
  { label: '3 Days', value: '3d' },
  { label: '7 Days', value: '7d' }
];

const STATUS_FILTERS = [
  { label: 'All Signal', value: 'all' },
  { label: '🔥 Breaking', value: 'breaking' },
  { label: '● Verified', value: 'verified' },
  { label: '🔍 Emerging', value: 'emerging' }
];

interface FilterBarProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedTimeRange: string;
  onSelectTimeRange: (range: string) => void;
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedCategory,
  onSelectCategory,
  selectedTimeRange,
  onSelectTimeRange,
  selectedStatus,
  onSelectStatus,
  searchQuery,
  onSearchChange
}) => {
  return (
    <div className="glass-glossy filter-bar">
      
      {/* Top Filter Controls Row */}
      <div className="filter-top-row">
        
        {/* Search */}
        <div className="search-box-wrapper">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search models (o3, R1), companies, benchmarks, papers..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Time Segments */}
        <div className="segmented-group">
          {TIME_RANGES.map((t) => (
            <button
              key={t.value}
              onClick={() => onSelectTimeRange(t.value)}
              className={`segment-btn ${selectedTimeRange === t.value ? 'active' : ''}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Status Segments */}
        <div className="segmented-group">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s.value}
              onClick={() => onSelectStatus(s.value)}
              className={`segment-btn ${selectedStatus === s.value ? 'active' : ''}`}
            >
              {s.label}
            </button>
          ))}
        </div>

      </div>

      {/* Category Pills */}
      <div className="category-scroll-row">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
          >
            {cat}
          </button>
        ))}
      </div>

    </div>
  );
};
