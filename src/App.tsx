import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import MarketPage from "@/pages/MarketPage";
import { MarketDataDashboard } from "@/components/MarketDataDashboard";
import { StrategyManager } from "@/components/StrategyManager";
import { TradingDashboard } from "@/components/TradingDashboard";
import { RiskManagementDashboard } from "@/components/RiskManagementDashboard";
import { VisualizationDashboard } from "@/components/VisualizationDashboard";
import { WebSocketDemo } from "@/pages/WebSocketDemo";
import { RealTimeDemo } from "@/pages/RealTimeDemo";
import { WebSocketTest } from "@/components/WebSocketTest";
import { WebSocketStatus } from "@/components/WebSocketStatus";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/market" element={<MarketDataDashboard />} />
        <Route path="/strategies" element={<StrategyManager />} />
        <Route path="/trading" element={<TradingDashboard />} />
        <Route path="/visualization" element={<VisualizationDashboard />} />
        <Route path="/risk" element={<RiskManagementDashboard />} />
        <Route path="/websocket-demo" element={<WebSocketDemo />} />
        <Route path="/realtime-demo" element={<RealTimeDemo />} />
        <Route path="/websocket-test" element={<WebSocketTest />} />
        <Route path="/websocket-status" element={<WebSocketStatus />} />
      </Routes>
    </Router>
  );
}
