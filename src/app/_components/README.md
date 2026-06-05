# Shared Components Reference

This directory contains reusable UI components and domain-specific logic shared across multiple pages in the T3 Activity Process application.

## Core Components

### 1. `PageHeader`
- **Function**: Implements a standardized page header with breadcrumbs and a perfectly centered title using a 3-column grid layout (`grid-cols-[1fr_auto_1fr]`).
- **Usage**:
  - `CheckHeader.tsx`: Used in the Check-in process page.
  - `ProcessHeader.tsx`: Used in the Data Processing page.
- **Notes**: This component is a pure presentation component. It should not contain data-fetching logic.

### 2. `DataFilterToolbar`
- **Function**: A complex layout component that combines a `SearchField` and a dynamic grid of `FilterSelect` dropdowns. It automatically adjusts column widths based on the number of filters.
- **Usage**:
  - `CheckPageClient.tsx`: Main toolbar for filtering check-in lists.
  - `ProcessPageClient.tsx`: Main toolbar for filtering processed data lists.
- **Notes**: Uses the `filterType` prop to switch between `google` and `check` data sources for the filters.

### 3. `SyncConfirmDialog`
- **Function**: A confirmation dialog for long-running synchronization tasks. Includes a warning icon and localized labels.
- **Usage**:
  - Used as the `action` prop in `PageHeader` across various pages.
- **Notes**: Wraps HeroUI `AlertDialog` and `Button` with built-in sync state (spinner) support.

### 4. `FilterSelect`
- **Function**: A specialized dropdown that fetches unique values for a specific Google Sheet column and allows single-selection filtering.
- **Usage**:
  - Integrated within `DataFilterToolbar`.
- **Notes**: Supports optimistic loading states and handles "Select All" logic.

### 5. `DashboardItemCard`
- **Function**: A unified card component for displaying both **Activities** and **Processes** on the main dashboard.
- **Usage**:
  - `ActivityCard.tsx`
  - `ProcessCard.tsx`
- **Notes**: Features a left-side color accent and consistent interaction patterns (stopping event propagation for inner buttons).

### 6. `Navbar`
- **Function**: The global navigation bar with branding, user identity section, and theme switching.
- **Usage**:
  - `layout.tsx` (Global root layout).

---

## Developer Guidelines

1. **Design Taste**: All components must follow the rules defined in `heroui-pro-design-taste` skill.
2. **Layout Centering**: For headers, always use the Grid-based absolute centering pattern (see `PageHeader`) instead of `position: absolute`.
3. **Localization**: Use Traditional Chinese for all user-facing labels.
4. **Imports**: Prefer absolute paths using `~/app/_components/...`.
