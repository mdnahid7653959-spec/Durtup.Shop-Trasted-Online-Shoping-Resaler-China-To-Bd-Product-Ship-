import { ReactNode, useEffect, useState, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { isAdminGateUnlocked } from "@/components/admin/AdminGate";
import NotFound from "@/pages/NotFound";
import { Loader2 } from "lucide-react";

interface AdminProtectedRouteProps {
  children: ReactNode;
}

export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  // If not running in Electron Desktop App (or unlocked via secret route), block completely with 404
  if (!isAdminGateUnlocked()) {
    return <NotFound />;
  }

  const { isAuthenticated, loading, validateSession } = useAdminAuth();
  const location = useLocation();
  const [validating, setValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const hasValidated = useRef(false);

  useEffect(() => {
    if (loading || hasValidated.current) return;

    const validate = async () => {
      hasValidated.current = true;
      if (isAuthenticated) {
        try {
          const valid = await validateSession();
          setIsValid(valid);
        } catch (error) {
          console.error("Admin session validation error:", error);
          setIsValid(false);
        }
      } else {
        setIsValid(false);
      }
      setValidating(false);
    };

    validate();
  }, [loading, isAuthenticated, validateSession]);

  if (loading || validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading admin portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isValid) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

