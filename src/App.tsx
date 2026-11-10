import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { DemoBar } from "./components/DemoBar";
import { DemoProvider, useDemo } from "./demo/DemoContext";
import { canViewEarnings, canViewOpenAccounting } from "./lib/allocate";
import { Earnings } from "./pages/Earnings";
import { Gate } from "./pages/Gate";
import { Home } from "./pages/Home";
import { OpenAccounting } from "./pages/OpenAccounting";

function Root() {
  const { role } = useDemo();
  if (role === "signed-out") return <Gate />;
  return <Home />;
}

function RequireEarnings() {
  const { role } = useDemo();
  if (!canViewEarnings(role)) return <Navigate to="/" replace />;
  return <Outlet />;
}

function RequireAccounting() {
  const { role } = useDemo();
  if (!canViewOpenAccounting(role)) return <Navigate to="/" replace />;
  return <Outlet />;
}

export function App() {
  return (
    <BrowserRouter>
      <DemoProvider>
        <Routes>
          <Route path="/" element={<Root />} />
          <Route element={<RequireEarnings />}>
            <Route path="/earnings" element={<Earnings />} />
          </Route>
          <Route element={<RequireAccounting />}>
            <Route path="/open-accounting" element={<OpenAccounting />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <DemoBar />
      </DemoProvider>
    </BrowserRouter>
  );
}
