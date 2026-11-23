import { Navigate } from "react-router-dom";

export default function AdvancedSimPage() {
  return <Navigate to="/quick-sim?advanced=1" replace />;
}
