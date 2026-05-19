# FSM Tools: Engineering Standards & Workflow

This document defines the core principles and workflows for maintaining and extending the FSM Tools codebase. Upholding these standards is mandatory for ensuring system integrity and reliability.

## 1. Test-Driven Bug Fixing (TDD)
Never apply a fix without empirical proof of failure and subsequent proof of resolution.
- **Red:** Create a Vitest test case (in `*.test.ts`) that reproduces the reported bug.
- **Green:** Implement the minimal surgical change required to pass the test.
- **Refactor:** Clean up the implementation, ensuring it aligns with project patterns.
- **Verify:** Run the full test suite (`bun x vitest run`) and build (`bun run build`) before finalizing.

## 2. Robust Parsing & DSL Design
The DSL is a primary interface; it must be resilient and helpful.
- **Forgiving Input:** Use robust logic (like `dslParser.ts`) that handles flexible whitespace, casing, and symbol variations (e.g., `ε` vs `epsilon`).
- **Context Preservation:** Always attempt to preserve state metadata (like coordinates `x, y`) during round-trip synchronization by matching states by Name or ID.
- **Diagnostic Clarity:** Provide line-specific error reporting. If a format is invalid, tell the user *where* and *why*.

## 3. Performance & Interaction Logic
The UI must remain fluid (60 FPS) even with complex models.
- **Local vs. Global State:** Use local state (e.g., ReactFlow's internal nodes) for high-frequency updates like dragging. Sync to the global store (Zustand) only on interaction completion (e.g., `onNodeDragStop`).
- **Validation Throttling:** Skip heavy logic (like `engine.verify()`) if changes are purely visual (positions only).
- **Shallow Equality:** Implement equality checks for error arrays and complex objects in the store to prevent redundant re-renders.

## 4. Unified Data Representation
The FSM object in `useFsmStore` is the absolute source of truth.
- **Alternative Views:** Text, Graph, and Table are just *projections* of the same data.
- **Two-Way Sync:** Implement debounced auto-sync for the text editor. Ensure changes in any view are immediately reflected in all others.
- **Consistent Naming:** Use display names consistently across all representations to avoid user confusion between technical IDs and labels.

## 5. Coding Standards
- **Strong Typing:** Maintain strict TypeScript safety. No `any` types unless absolutely unavoidable for external libraries.
- **Surgical Edits:** Use the `replace` tool for targeted changes. Avoid large `write_file` calls for existing complex components.
- **Component Hygiene:** Keep components focused. Extract complex logic (like parsing or simulation) into separate utilities or engine classes.
