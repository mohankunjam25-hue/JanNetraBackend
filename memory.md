# RealJanNetra Project Rules (Professional/Company Standard)

## Mandatory Protocol
- **READ THIS FILE** before starting any coding session.
- The agent must adhere to the rules defined here strictly.
- **Project Status:** This is a PROFESSIONAL, COMPANY-STANDARD project. High-quality code and UI are mandatory.

## UI/UX Rules
- **Iconography:** Use ONLY Flaticon (UIcons) for all icons. Do not use generic SVGs or emojis for core UI elements.
- **Mandatory Tooltips:** Every interactive element (icons, buttons) that DOES NOT have a visible text label MUST have a Hover Tooltip/Hint Text. If a text label is already visible (like in sidebar links), a tooltip is not required.
- **Tooltip Delay:** Tooltips must appear after a delay of 0.5 to 1 second of hovering to ensure intentional interaction.
- **Tailwind CSS:** Use exclusively Tailwind CSS for all styling. No external CSS files.
- **Dynamic Integration:** Backend and Frontend must be designed to be dynamically connected. Use environment variables (e.g., `VITE_API_URL`).

## Development Phase (Professional/Company Standard)

### 1. Architectural Mandates (To prevent technical debt)
- **Zero Hardcoding:** UI components must never contain raw data. Use Global Stores (Zustand) or Mock Services.
- **Global State Management:** Use `Zustand` for all cross-component state (Auth, Location, User Profile, Theme). NO Prop Drilling.
- **Strict Type Safety:** Every entity (Leader, Scheme, Area) must have a TypeScript Interface in `src/types/`.
- **Performance First:** Use `React.lazy` and `Suspense` for all top-level routes to ensure super-fast initial load times.
- **Modular Data Sourcing:** Design API services in `src/services/` to be independent of UI components.

## UI/UX Rules
- **Iconography:** Use ONLY Flaticon (UIcons) for all icons.
- **Mandatory Tooltips:** Interactive icons without labels must have a 0.5s delay tooltip.
- **Tailwind CSS:** Exclusively used for all styling.
- **Strict Templating (DRY):** NEVER write new code for standard UI elements. You MUST use the shared components from `frontend/src/shared/ui/` (e.g., `<Button>`, `<Card>`, `<Avatar>`, `<Input>`, `<DropdownMenu>`).

## Architectural Standards (MVC & Routing)
- **Backend MVC:** Strictly separate concerns. `routes/` only maps URLs to controllers. `controllers/` contains business logic using `asyncHandler`. `models/` defines data structure. Reusable logic MUST be placed in `utils/` (e.g., `privacyHelper.js`, `validationHelper.js`).
- **Professional Routing:** Keep route files lean and readable. Group related routes clearly.

## Current Focus
- **Refactoring Foundation:** Implementing Global Store and Type System.
