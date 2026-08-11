import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import LoginPage from "./auth/login";
import DashboardPage from "./dashboard/index";
import PublicStockPage from "./public/stock";
import UnitsPage from "./units/index";
import UnitDetailPage from "./units/detail";
import DonorsPage from "./donors/index";
import DonorDetailPage from "./donors/detail";
import CampsPage from "./camps/index";
import CampApprovalPage from "./camps/approval";
import CampCouponsPage from "./camps/coupons";
import RequisitionsPage from "./requisitions/index";
import WalletPage from "./wallet/index";
import AdminPage from "./admin/index";
import AboutPage from "./about";

function Unauthorized() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
      <p className="text-gray-500">You don't have permission to view this page.</p>
      <a href="/dashboard" className="text-red-600 underline hover:text-red-800">
        Go to dashboard
      </a>
    </div>
  );
}

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/about", element: <AboutPage /> },
  { path: "/public/stock", element: <PublicStockPage /> },
  { path: "/unauthorized", element: <Unauthorized /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/dashboard", element: <DashboardPage /> },
          { path: "/units", element: <UnitsPage /> },
          { path: "/units/:id", element: <UnitDetailPage /> },
          { path: "/donors", element: <DonorsPage /> },
          { path: "/donors/:id", element: <DonorDetailPage /> },
          { path: "/camps", element: <CampsPage /> },
          { path: "/camps/approval", element: <CampApprovalPage /> },
          { path: "/camps/:id/coupons", element: <CampCouponsPage /> },
          { path: "/camps/apply", element: <CampsPage /> },
          { path: "/requisitions", element: <RequisitionsPage /> },
          { path: "/wallet", element: <WalletPage /> },
          { path: "/admin", element: <AdminPage /> },
        ],
      },
    ],
  },
  { path: "/", element: <Navigate to="/dashboard" replace /> },
  { path: "*", element: <Navigate to="/dashboard" replace /> },
]);
