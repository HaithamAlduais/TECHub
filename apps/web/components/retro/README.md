# Retro UI Components

All UI components follow the **Clean Pixel / Retro Brutalist** design system specified in the TECHub MVP Requirements.

## Design Specification

### Visual Characteristics

- **Backgrounds**: Pure white (#FFFFFF) or off-white (#F8F9FA)
- **Primary Accent Color**: 8-bit Blue (#0000FF or similar vibrant blue)
- **Borders**: Sharp, square corners (border-radius: 0)
- **Border Style**: Thick, solid black borders (2px-4px)
- **Shadows**: Hard drop shadows (4px 4px 0px #000)
- **Typography**:
  - Logos/Headings/Numbers: Pixel-art fonts (Press Start 2P, VT323, Silkscreen)
  - Body Text/Tags: Clean Monospace fonts (Fira Code, JetBrains Mono)
- **Cursor**: Custom pixelated pointing hand for clickable elements
- **Animations**: Blocky and stepped (no smooth ease-in/ease-out transitions)

## Components

### Button Components

#### RetroButton
Primary action button with retro styling.

```tsx
<RetroButton variant="primary" size="md">
  Click Me
</RetroButton>
```

**Variants**: `primary`, `secondary`, `danger`, `success`, `outline`
**Sizes**: `sm`, `md`, `lg`, `xl`

### Container Components

#### RetroCard
Container for content with retro border and shadow.

```tsx
<RetroCard highlighted={false} clickable={false}>
  Content here
</RetroCard>
```

**Props**:
- `highlighted`: Yellow border highlight box
- `clickable`: Adds click animation

#### RetroModal
Dialog/popup component with 6 sub-components:

```tsx
<RetroModal>
  <RetroModalTrigger>Open</RetroModalTrigger>
  <RetroModalContent>
    <RetroModalHeader>
      <RetroModalTitle>Title</RetroModalTitle>
    </RetroModalHeader>
    Content here
    <RetroModalFooter>
      <RetroModalClose />
    </RetroModalFooter>
  </RetroModalContent>
</RetroModal>
```

#### RetroAlert
Notification/alert box.

```tsx
<RetroAlert
  variant="error"
  title="Error"
  description="Something went wrong"
/>
```

**Variants**: `error`, `success`, `warning`, `info`

### Form Elements

#### RetroInput
Text input field.

```tsx
<RetroInput
  label="Name"
  placeholder="Enter name"
  error={error}
/>
```

#### RetroCheckbox
Custom checkbox with label support.

```tsx
<RetroCheckbox
  label="Full-Time"
  description="Full-time positions"
/>
```

#### RetroSelect
Dropdown/select element.

```tsx
<RetroSelect
  label="Category"
  options={[
    { value: 'jobs', label: 'Jobs' },
    { value: 'coop', label: 'Co-op' },
  ]}
  placeholder="Select..."
/>
```

### Data Display

#### RetroBadge
Tag/label for categorizing and filtering.

```tsx
<RetroBadge variant="verified" size="md">
  ✓ Verified Skill
</RetroBadge>
```

**Variants**: `verified`, `unverified`, `category`, `warning`, `success`, `danger`
**Sizes**: `sm`, `md`, `lg`

#### RetroProgressBar
8-bit progress bar for compliance scores.

```tsx
<RetroProgressBar
  value={88}
  showLabel={true}
  showPercentage={true}
  size="md"
/>
```

**Size**: `sm`, `md`, `lg`
**Color Logic**:
- Green (≥75%)
- Yellow (50-74%)
- Red (<50%)

### Typography

#### RetroLabel
Form label with variants.

```tsx
<RetroLabel size="md" variant="default">
  Label Text
</RetroLabel>
```

**Sizes**: `sm`, `md`, `lg`
**Variants**: `default`, `muted`, `accent`

## Usage Examples

### Complete Form Example

```tsx
import {
  RetroButton,
  RetroInput,
  RetroCheckbox,
  RetroLabel,
  RetroAlert,
} from '@/components/retro';

export function GateForm() {
  return (
    <form className="space-y-4">
      <RetroLabel>Search Preferences</RetroLabel>

      <RetroInput
        label="Location"
        placeholder="e.g., Riyadh"
        required
      />

      <div className="space-y-2">
        <RetroCheckbox label="Full-Time" />
        <RetroCheckbox label="Remote" />
      </div>

      <RetroButton variant="primary" size="lg">
        Search Opportunities
      </RetroButton>

      <RetroAlert
        variant="info"
        description="We'll show you jobs that match your profile"
      />
    </form>
  );
}
```

### Job Card with Progress

```tsx
import { RetroCard, RetroProgressBar, RetroBadge, RetroButton } from '@/components/retro';

export function JobCard({ job }) {
  return (
    <RetroCard clickable>
      <h3 className="font-mono font-bold text-lg">{job.title}</h3>
      <p className="text-sm">{job.company}</p>

      <div className="my-3 space-y-2">
        <RetroBadge variant="category">{job.category}</RetroBadge>
        <RetroProgressBar value={job.compliance} />
      </div>

      <RetroButton variant="secondary" size="sm">
        View Details
      </RetroButton>
    </RetroCard>
  );
}
```

## Accessibility

All components follow accessibility best practices:
- Proper ARIA labels and roles
- Keyboard navigation support
- Focus indicators
- Color contrast compliance
- Screen reader support

## Animation Guidelines

Components use blocky, stepped animations:

```css
/* Avoid */
transition: all ease-in-out 0.3s;

/* Use instead */
transition: all duration-75; /* Instant, snappy */
```

## Color Reference

- **Primary Blue**: #0000FF (or similar vibrant blue)
- **White**: #FFFFFF
- **Off-White**: #F8F9FA
- **Black**: #000000
- **Success Green**: #16A34A
- **Warning Yellow**: #EAB308
- **Danger Red**: #DC2626

## Contributing

When adding new components:
1. Follow the retro design specification
2. Use square corners (no border-radius)
3. Add thick black borders
4. Include hard drop shadows
5. Use monospace fonts for text
6. Document with TypeScript
7. Export from `index.ts`
