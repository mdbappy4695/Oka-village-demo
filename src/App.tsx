import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { DemoBar } from "./components/DemoBar";
import { Shell } from "./components/Shell";
import { DemoProvider, useDemo } from "./demo/DemoContext";
import { Contributions, Earnings, Finances, History } from "./pages/Details";
import { Gate } from "./pages/Gate";
import { Methodology } from "./pages/Methodology";
import { Overview } from "./pages/Overview";

function RequireMember() {
  const { member } = useDemo();
  if (!member) return <Navigate to="/" replace />;
  return <Outlet />;
}

export function App() {
  return (
    <BrowserRouter>
      <DemoProvider>
        <Routes>
          <Route path="/" element={<Gate />} />
          <Route element={<RequireMember />}>
            <Route path="/open-accounting" element={<Shell />}>
              <Route index element={<Overview />} />
              <Route path="methodology" element={<Methodology />} />
              <Route path="earnings" element={<Earnings />} />
              <Route path="contributions" element={<Contributions />} />
              <Route path="history" element={<History />} />
              <Route path="finances" element={<Finances />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <DemoBar />
      </DemoProvider>
    </BrowserRouter>
  );
}
