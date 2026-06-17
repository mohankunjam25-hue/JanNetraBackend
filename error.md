## Error: Vite/OXC Module Export SyntaxError
**Message:** `Uncaught SyntaxError: The requested module '/src/types/index.ts' does not provide an export named 'Location'` (and later `User`)

## Why this happened
This occurred because the Vite/OXC compiler sometimes struggles to resolve purely TypeScript interfaces when they are imported using standard import syntax in a fast-refresh environment. Additionally, there was a naming conflict with the global browser `Location` object.

## How it was fixed
1. Renamed the `Location` interface to `UserLocation` to avoid global namespace conflicts.
2. Switched to `import type { ... }` for all interface imports. This explicitly tells the compiler that these are types only and should be stripped during runtime, preventing export resolution errors.

---

## Error: TypeScript Type Mismatch (RefObject)
**Message:** `Type 'RefObject<HTMLInputElement | null>' is not assignable to type 'RefObject<HTMLInputElement>'`

## Why this happened
In the `EditProfile` component, the `fileInputRef` was passed from the parent `Profile` component. The parent initialized it with `null`, but the child component's interface expected a non-nullable `RefObject`.

## How it was fixed
Updated the `EditProfileProps` interface to correctly reflect the nullable state: `fileInputRef: React.RefObject<HTMLInputElement | null>`. This aligned the types and satisfied the TypeScript compiler.

---
*Date: June 12, 2026*

## Error: Vite/OXC Transform Parse Error (Malformed TSX)
**Message:** `[PARSE_ERROR] Expected a semicolon or an implicit semicolon after a statement, but found none`

## Why this happened
This occurred during a surgical code replacement in `Profile.tsx`. Because the component was becoming "heavy" (large amount of UI data/JSX), the `replace` tool failed to match the exact context correctly, leaving behind dangling code fragments at the end of the file. This resulted in syntactically invalid TSX that the Vite compiler could not transform.

## How it was fixed
The corrupted file was completely cleaned up and rewritten with the correct component structure, ensuring all JSX tags and conditional logic were properly closed and scoped.

---
*Date: June 12, 2026*

# Git Error Log: Unrelated Histories

## Error Description
**Message:** `There isn’t anything to compare. main and allfrontend are entirely different commit histories.`

## Why this happens
This error occurs when you try to merge or compare two branches that were initialized independently and do not share a common base commit (ancestry). In this case, `main` and `allfrontend` had completely different starting points.

## How it was fixed
To unify the histories, the branches must be merged using a special flag that allows unrelated histories to be joined.

### Commands Used:
1. **Fetch remote branches:**
   ```powershell
   git fetch origin
   ```

2. **Checkout the target branch (main):**
   ```powershell
   git checkout main
   ```

3. **Merge with the allowance flag:**
   ```powershell
   git merge origin/allfrontend --allow-unrelated-histories -m "Merged allfrontend into main to unify histories"
   ```

4. **Push the unified history:**
   ```powershell
   git push origin main
   ```

---
*Date: June 10, 2026*
