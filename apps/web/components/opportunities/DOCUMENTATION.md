# Opportunities Components

Complete set of components for the Opportunities/Jobs feed feature.

## Components

### 1. GateModal
**File**: `GateModal.tsx`

Initial modal shown to users on first visit. Mandatory before accessing opportunities.

**Features**:
- Location input (required)
- Employment type checkboxes (Full-Time, Part-Time)
- Work type checkboxes (Remote, Hybrid, In-Person)
- Continue button (disabled until location is provided)
- Localized to Arabic

**Usage**:
```tsx
<GateModal
  isOpen={isGateOpen}
  onSubmit={(preferences) => {
    // Handle preferences
  }}
/>
```

### 2. FilterBar
**File**: `FilterBar.tsx`

Sticky filter bar at the top of the feed.

**Features**:
- Category toggle buttons (Jobs, Coop, GDP)
- Advanced filters (employment type, work type)
- Clear filters button
- Responsive grid layout

**Usage**:
```tsx
<FilterBar
  filters={filters}
  onFiltersChange={(newFilters) => {
    // Handle filter changes
  }}
/>
```

### 3. JobCard
**File**: `JobCard.tsx`

Individual opportunity card in the feed.

**Features**:
- Company name and job title
- Location, salary, work type badges
- Compliance percentage with color-coded progress bar
- Posted date (relative time)
- View Details button
- Click animations
- Status badge (closed if not open)

**Usage**:
```tsx
<JobCard
  opportunity={opportunity}
  onViewDetails={(id) => {
    // Handle card click
  }}
/>
```

### 4. OpportunitiesFeed
**File**: `OpportunitiesFeed.tsx`

Main feed displaying list of opportunities.

**Features**:
- Responsive grid layout (1 col on mobile, 2 on tablet, 3 on desktop)
- Loading skeleton animation
- Empty state message
- Error handling with alert
- Result count display
- Infinite scroll ready (future enhancement)

**Usage**:
```tsx
<OpportunitiesFeed
  opportunities={opportunities}
  isLoading={isLoading}
  error={error}
  onSelectOpportunity={(id) => {
    // Handle opportunity selection
  }}
  totalCount={totalCount}
/>
```

### 5. DetailModal
**File**: `DetailModal.tsx`

Full-screen job details modal with 6 blocks.

**6 Blocks**:
1. **Header**: Job title, company, location, compliance %
2. **Company Description**: AI-generated company overview
3. **Job Role**: AI-enriched job description
4. **Requirements**: Formatted requirements list
5. **Why This Percent** (highlighted): Explanation with matched/missing skills
6. **Learning Suggestions**: Learning resources + Apply button

**Features**:
- Loading state
- Error handling
- Color-coded skill badges (verified/danger)
- Direct apply link
- Escape key to close
- Monospace typography
- Retro design

**Usage**:
```tsx
<DetailModal
  isOpen={isOpen}
  opportunity={opportunity}
  isLoading={isLoading}
  error={error}
  onClose={() => {
    // Handle close
  }}
/>
```

## Integration Example

Complete example showing all components working together:

```tsx
import {
  GateModal,
  FilterBar,
  OpportunitiesFeed,
  DetailModal,
} from '@/components/opportunities';
import {
  useOpportunities,
  useOpportunityDetail,
  useOpportunitiesFilters,
} from '@/hooks/opportunities';

export default function OpportunitiesPage() {
  const [isGateOpen, setIsGateOpen] = useState(true);

  const { gatePreferences, filters, setGate, updateFilters } =
    useOpportunitiesFilters();

  const { opportunities, isLoading, error, updateFilters: updateOpportunitiesFilters } =
    useOpportunities();

  const { data: selectedOpportunity, fetch: fetchDetail } =
    useOpportunityDetail();

  return (
    <main>
      <GateModal isOpen={isGateOpen} onSubmit={setGate} />

      {!isGateOpen && (
        <>
          <FilterBar filters={filters} onFiltersChange={updateFilters} />
          <OpportunitiesFeed
            opportunities={opportunities}
            isLoading={isLoading}
            error={error}
            onSelectOpportunity={fetchDetail}
          />
        </>
      )}

      <DetailModal opportunity={selectedOpportunity} />
    </main>
  );
}
```

## Styling & Design

All components follow the Retro/Pixel design system:

- **Borders**: 2-4px solid black, square corners
- **Shadows**: 4px 4px 0px 0px rgba(0,0,0,1)
- **Typography**: Monospace (font-mono), retro fonts for headings
- **Colors**: 8-bit blue primary, green/yellow/red for states
- **Animations**: Blocky, stepped transitions

## State Management

Components are designed to work with custom hooks:

- `useOpportunities`: Fetch and manage opportunity feed
- `useOpportunityDetail`: Fetch single opportunity
- `useOpportunitiesFilters`: Manage filter and gate state

## Accessibility

All components include:
- ARIA labels and roles
- Keyboard navigation
- Focus indicators
- Screen reader support
- Color contrast compliance

## Localization

Components are fully localized to Arabic:
- Labels and placeholders in Arabic
- RTL-friendly (future)
- Arabic date formatting
- Arabic error messages
