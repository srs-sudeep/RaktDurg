/* eslint-disable react-refresh/only-export-components */

import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import { PublicLayout } from "@/components/PublicLayout";
import { PageLoader } from "@/components/SplashScreen";
import LoginPage from "./auth/login";
import HomePage from "./home/index";
import AboutPage from "./about";
import ContactPage from "./contact/index";
import MyAccountPage from "./my-account/index";
import CitizenProfilePage from "./my-account/profile";
import CitizenWalletPage from "./my-account/wallet";
import CitizenHistoryPage from "./my-account/history";
import CitizenBookingsPage from "./my-account/bookings";
import DashboardPage from "./dashboard/index";
import PublicStockPage from "./public/stock";
import PublicCampsPage from "./public/camps";
import UnitsPage from "./units/index";
import UnitDetailPage from "./units/detail";
import DonorsPage from "./donors/index";
import DonorDetailPage from "./donors/detail";
import CampsPage from "./camps/index";
import CampApprovalPage from "./camps/approval";
import CampBookingsPage from "./camps/bookings";
import CampCouponsPage from "./camps/coupons";
import RequisitionsPage from "./requisitions/index";
import WalletPage from "./wallet/index";
import AdminPage from "./admin/index";
import UsersPage from "./users/index";
import OrganizersPage from "./organizers/index";
import OrganizerDirectoryPage from "./organizer-directory/index";
import ProfilePage from "./profile/index";

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
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/about", element: <AboutPage /> },
      { path: "/contact", element: <ContactPage /> },
      { path: "/public/stock", element: <PublicStockPage /> },
      { path: "/public/camps", element: <PublicCampsPage /> },
      { path: "/my-account", element: <MyAccountPage /> },
      { path: "/my-account/profile", element: <CitizenProfilePage /> },
      { path: "/my-account/wallet", element: <CitizenWalletPage /> },
      { path: "/my-account/history", element: <CitizenHistoryPage /> },
      { path: "/my-account/bookings", element: <CitizenBookingsPage /> },
    ],
  },
  { path: "/login", element: <LoginPage /> },
  { path: "/unauthorized", element: <Unauthorized /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/dashboard", element: <DashboardPage /> },
          { path: "/profile", element: <ProfilePage /> },
          { path: "/units", element: <UnitsPage /> },
          { path: "/units/:id", element: <UnitDetailPage /> },
          { path: "/donors", element: <DonorsPage /> },
          { path: "/donors/:id", element: <DonorDetailPage /> },
          { path: "/camps", element: <CampsPage /> },
          { path: "/camps/approval", element: <CampApprovalPage /> },
          { path: "/camps/bookings", element: <CampBookingsPage /> },
          { path: "/camps/:id/coupons", element: <CampCouponsPage /> },
          { path: "/camps/apply", element: <CampsPage /> },
          { path: "/requisitions", element: <RequisitionsPage /> },
          { path: "/wallet", element: <WalletPage /> },
          { path: "/users", element: <UsersPage /> },
          { path: "/organizers", element: <OrganizersPage /> },
          { path: "/organizer-directory", element: <OrganizerDirectoryPage /> },
          { path: "/admin", element: <AdminPage /> },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);

export { PageLoader };
