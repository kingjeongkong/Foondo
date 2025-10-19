# AI-Powered Personalized Restaurant Advisor - Project Rules

## 🎯 Project Overview

- **Goal**: AI-based restaurant recommendation system for travelers
- **Architecture**: Next.js 15 + React 19 + TypeScript + Tailwind CSS + shadcn/ui
- **Structure**: Single-page MVP (SPA-like with SSR benefits)

## 📁 Folder Structure Rules

### Global vs App-Specific Separation Principle

```
src/
├── components/          # 🌍 Global components (reusable)
├── lib/                # 🌍 Global logic (reusable)
├── hooks/              # 🌍 Global custom hooks (reusable)
├── types/              # 🌍 Global types (reusable)
└── app/                # 🎯 App-specific logic (current domain)
    ├── components/      # App-only components
    ├── hooks/          # App-specific custom hooks
    ├── lib/            # App-specific logic
    ├── types/          # App-specific types
    └── data/           # App-specific data
```

### Component Classification Rules

#### Global Components (`src/components/`)

- **Purpose**: UI components reusable across multiple apps
- **Examples**: Button, Card, LoadingSpinner, ErrorBoundary
- **Location**: `src/components/common/`
- **shadcn/ui**: `src/components/ui/` (auto-generated, do not modify directly)

#### App-Specific Components (`src/app/components/`)

- **Purpose**: Domain-specific components for current restaurant app only
- **Examples**: CitySelector, RestaurantCard, AISummary
- **Location**: `src/app/components/[feature]/`

### Folder Role Definitions

#### `src/components/` (Global)

```
components/
├── ui/                 # shadcn/ui components (do not modify)
└── common/             # Global common components
    ├── button.tsx
    ├── card.tsx
    ├── loading-spinner.tsx
    └── error-boundary.tsx
```

#### `src/app/components/` (App-Specific)

```
app/components/
├── search/              # Search-related components
│   ├── city-selector.tsx
│   ├── food-selector.tsx
│   └── priority-form.tsx
├── results/             # Result display components
│   ├── restaurant-card.tsx
│   ├── restaurant-list.tsx
│   └── ai-summary.tsx
└── layout/              # App-specific layout
    ├── search-header.tsx
    └── results-layout.tsx
```

#### `src/lib/` (Global)

```
lib/
├── utils.ts             # Global utility functions
├── constants.ts         # Global constants
├── validations.ts       # Global validation logic
└── api/                 # Global API clients
    ├── http-client.ts
    └── cache-service.ts
```

#### `src/app/lib/` (App-Specific)

```
app/lib/
├── api/                 # App-specific API
│   ├── google-places.ts
│   └── ai-service.ts
└── utils/               # App-specific utilities
    ├── search-utils.ts
    └── ranking-utils.ts
```

#### `src/hooks/` (Global)

```
hooks/
├── use-local-storage.ts
├── use-debounce.ts
└── use-media-query.ts
```

#### `src/app/hooks/` (App-Specific)

```
app/hooks/
├── use-search.ts
├── use-results.ts
└── use-ai-analysis.ts
```

#### `src/types/` (Global)

```
types/
├── common.ts            # Global common types
└── api.ts               # Global API types
```

#### `src/app/types/` (App-Specific)

```
app/types/
├── restaurant.ts
├── search.ts
└── ai-analysis.ts
```

#### `src/app/data/` (App-Specific)

```
app/data/
├── cities.ts
├── foods.ts
└── must-try-foods.ts
```

## 🔧 Coding Rules

### Import Path Rules

```typescript
// Global component usage
import { Button } from '@/components/common/button';
import { LoadingSpinner } from '@/components/common/loading-spinner';

// App-specific component usage
import { CitySelector } from '@/app/components/search/city-selector';
import { RestaurantCard } from '@/app/components/results/restaurant-card';

// Global hook usage
import { useLocalStorage } from '@/hooks/use-local-storage';

// App-specific hook usage
import { useSearch } from '@/app/hooks/use-search';
```

### File Naming Rules

- **Components**: PascalCase (e.g., `CitySelector.tsx`)
- **Hooks**: camelCase with 'use' prefix (e.g., `useSearch.ts`)
- **Utilities**: kebab-case (e.g., `search-utils.ts`)
- **Types**: kebab-case (e.g., `restaurant.ts`)

### Component Structure Rules

```typescript
// 1. React imports
import React from 'react';

// 2. Next.js imports
import { useRouter } from 'next/navigation';

// 3. Global component imports
import { Button } from '@/components/common/button';

// 4. App-specific component imports
import { CitySelector } from '@/app/components/search/city-selector';

// 5. Hook imports
import { useSearch } from '@/app/hooks/use-search';

// 6. Type imports
import type { Restaurant } from '@/app/types/restaurant';

// 7. Component definition
export function ComponentName() {
  // Component logic
}
```

## 🎨 Styling Rules

### Tailwind CSS Class Order

1. **Layout**: `flex`, `grid`, `block`, `hidden`
2. **Position**: `relative`, `absolute`, `fixed`
3. **Size**: `w-`, `h-`, `max-w-`, `min-h-`
4. **Spacing**: `p-`, `m-`, `gap-`, `space-`
5. **Colors**: `bg-`, `text-`, `border-`
6. **Typography**: `text-`, `font-`, `leading-`
7. **Effects**: `shadow-`, `rounded-`, `opacity-`
8. **States**: `hover:`, `focus:`, `active:`

### Responsive Design

```typescript
// Mobile-first approach
<div className="flex flex-col gap-4 sm:flex-row lg:gap-8">
  <div className="w-full sm:w-1/2 lg:w-1/3">
    {/* Content */}
  </div>
</div>
```

## 🚀 Development Workflow

### 1. New Feature Development

1. **Global vs App-Specific Decision**: Consider if it will be used in other apps
2. **Folder Location Decision**: Choose appropriate location according to rules above
3. **Dependency Direction Check**: Global → App-specific ✅, App-specific → Other apps ❌
4. **Import Path Setting**: Use `@/` path for all imports

### 2. Component Creation

```typescript
// 1. Define types first
export interface ComponentProps {
  // props type definition
}

// 2. Write JSDoc comments
/**
 * Component description
 * @param {Object} props - Component props
 * @param {string} props.prop1 - prop1 description
 * @param {number} [props.prop2] - prop2 description (optional)
 */
export function ComponentName({ prop1, prop2 }: ComponentProps) {
  // Implementation
}

// 3. Set default values
ComponentName.defaultProps = {
  // default values
};
```

### 3. Hook Creation

```typescript
// 1. Define return type
export interface UseHookReturn {
  // return value type
}

// 2. Write JSDoc comments
/**
 * Hook description
 * @returns {UseHookReturn} return value description
 * @returns {string} returnValue.property1 - property1 description
 * @returns {Function} returnValue.method1 - method1 description
 */
export function useHookName(): UseHookReturn {
  // Implementation
}
```

## 📝 Comment Rules

### JSDoc Comments Required

Write JSDoc comments for all functions, components, and hooks to quickly understand information.

#### Function JSDoc Example

```typescript
/**
 * Custom hook for managing user search state
 * @returns {Object} search state and related functions
 * @returns {string} searchData.city - selected city
 * @returns {string} searchData.food - selected food
 * @returns {Object} searchData.priorities - priority settings
 * @returns {Function} updateSearch - function to update search data
 * @returns {Function} resetSearch - function to reset search data
 */
export function useSearch() {
  // Implementation...
}
```

#### Component JSDoc Example

```typescript
/**
 * City selection component
 * @param {Object} props - component props
 * @param {Function} props.onCitySelect - callback when city is selected
 * @param {string} [props.defaultCity] - default selected city
 * @param {boolean} [props.disabled] - disabled state
 */
export function CitySelector({
  onCitySelect,
  defaultCity,
  disabled = false,
}: CitySelectorProps) {
  // Implementation...
}
```

#### API Function JSDoc Example

```typescript
/**
 * Search restaurant list through Google Places API
 * @param {string} city - city name to search
 * @param {string} food - food category to search
 * @param {Object} options - search options
 * @param {number} [options.limit=20] - result count limit
 * @param {string} [options.language='ko'] - language setting
 * @returns {Promise<Restaurant[]>} restaurant list Promise
 * @throws {Error} error when API call fails
 */
export async function searchRestaurants(
  city: string,
  food: string,
  options: SearchOptions = {}
): Promise<Restaurant[]> {
  // Implementation...
}
```

#### Utility Function JSDoc Example

```typescript
/**
 * Sort restaurant list by priority
 * @param {Restaurant[]} restaurants - restaurant list to sort
 * @param {PrioritySettings} priorities - priority settings
 * @returns {Restaurant[]} sorted restaurant list
 */
export function sortRestaurantsByPriority(
  restaurants: Restaurant[],
  priorities: PrioritySettings
): Restaurant[] {
  // Implementation...
}
```

### Korean Comments for Code

```typescript
// Hook for managing user search state
export function useSearch() {
  // City selection state
  const [selectedCity, setSelectedCity] = useState<string>('');

  // Search result state
  const [results, setResults] = useState<Restaurant[]>([]);
}
```

### English Strings for UI

```typescript
<Button>Search Restaurants</Button>
<h1>Find Your Perfect Restaurant</h1>
```

## 🔍 Code Quality Rules

### TypeScript Strict Mode

- Follow `strict: true` setting
- Define types for all props and state
- Prohibit `any` type usage

### ESLint Rules

- Follow Prettier settings
- Maintain consistent code style
- Remove unused imports

### Performance Optimization

- Use `React.memo` appropriately
- Use `useMemo`, `useCallback` only when necessary
- Code splitting with dynamic imports

## 🚨 Important Notes

### Prohibited Actions

- Do not modify `src/components/ui/` folder directly (shadcn/ui auto-generated)
- Do not import app-specific components from other apps
- Do not include app-specific logic in global components

### Recommendations

- Follow single responsibility principle for components
- Move reusable components to global scope
- Clearly separate app-specific logic
- Ensure safety through type definitions

Follow these rules to build a consistent and scalable codebase.
