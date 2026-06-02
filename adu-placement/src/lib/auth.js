// JSX is not valid in .js files — all logic lives in auth.jsx.
// This re-export keeps every import path like `from "./lib/auth"` working.
export { AuthProvider, useAuth } from "./auth.jsx";
