import React from "react";
import { Routes, Route, Navigate, BrowserRouter } from "react-router-dom";
import Login from "./pages/Login";
import PrivateRoute from "./components/PrivateRoute";
import MainLayout from "./layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Unauthorized from "./pages/Unauthorized";
import Profile from "./pages/Profile";
import POS from "./pages/POS";
import Product from "./pages/Product";
import Warehouse from "./pages/Warehouse";
import Customer from "./pages/Customer";
import Supplier from "./pages/Supplier";
import Promotion from "./pages/Promotion";
import Report from "./pages/Report";
import Staff from "./pages/Staff";
import Finance from "./pages/Finance";
import Setting from "./pages/Setting";
import { Toaster } from "sonner";

const App = () => {
  return (
    <BrowserRouter>
      <Toaster richColors closeButton position="top-right" duration={1500} />
      <Routes>
        {/* ----- KHÔNG CẦN ĐĂNG NHẬP ----- */}
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* ----- CẦN ĐĂNG NHẬP ----- */}
        <Route element={<PrivateRoute />}>
          <Route element={<MainLayout />}>
            {/* CHUNG */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/profile" element={<Profile />} />

            {/* STAFF + MANAGER + ADMIN */}
            <Route
              element={
                <PrivateRoute allowedRoles={["staff", "manager", "admin"]} />
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/products" element={<Product />} />
              <Route path="/pos" element={<POS />} />
              <Route path="/customers" element={<Customer />} />
              <Route path="/warehouses" element={<Warehouse />} />
            </Route>

            {/* MANAGER + ADMIN */}
            <Route
              element={<PrivateRoute allowedRoles={["manager", "admin"]} />}
            >
              <Route path="/suppliers" element={<Supplier />} />
              <Route path="/promotions" element={<Promotion />} />
              <Route path="/staff" element={<Staff />} />
              <Route path="/reports" element={<Report />} />
            </Route>

            {/* ADMIN */}
            <Route element={<PrivateRoute allowedRoles={["admin"]} />}>
              <Route path="/finances" element={<Finance />} />
              <Route path="/settings" element={<Setting />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
