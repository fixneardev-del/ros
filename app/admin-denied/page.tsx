import { forbidden } from "next/navigation";

/**
 * The proxy rewrites admin routes here for signed-in people without the admin
 * role. Calling `forbidden()` before anything renders returns a real 403.
 */
export default function AdminDeniedPage() {
  forbidden();
}
