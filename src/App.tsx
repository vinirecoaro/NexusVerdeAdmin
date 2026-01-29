import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import RegisterCompany from "./pages/RegisterCompany";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />

                <Route
                    path="/register-company"
                    element={
                        <ProtectedRoute>
                            <RegisterCompany />
                        </ProtectedRoute>
                    }
                />

                <Route path="/" element={<Navigate to="/register-company" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
