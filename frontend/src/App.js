import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import Home from "./pages/Home";
import Inventory from "./pages/Inventory";
import Retail from "./pages/Retail";
import Wholesale from "./pages/Wholesale";
import Expense from "./pages/Expense";
import Report from "./pages/Report";
import CashDrawer from "./pages/CashDrawer";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:7000";
export const API = `${BACKEND_URL}/api`;

export { axios, toast };

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/retail" element={<Retail />} />
          <Route path="/wholesale" element={<Wholesale />} />
          <Route path="/expense" element={<Expense />} />
          <Route path="/report" element={<Report />} />
          <Route path="/cash-drawer" element={<CashDrawer />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
