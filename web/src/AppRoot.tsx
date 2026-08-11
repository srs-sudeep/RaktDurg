import { RouterProvider } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { SplashScreen } from "@/components/SplashScreen";
import { router } from "@/routes/index";

export function AppRoot() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <SplashScreen message="Starting up…" />;
  }

  return <RouterProvider router={router} />;
}
