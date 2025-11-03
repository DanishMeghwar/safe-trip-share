import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import PostRide from "./pages/PostRide";
import SearchRides from "./pages/SearchRides";
import Profile from "./pages/Profile";
import ActiveRide from "./pages/ActiveRide";
import NotFound from "./pages/NotFound";
import { NetworkStatus } from "./components/NetworkStatus";
import { pushNotificationService } from "./services/pushNotificationService";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

const App = () => {
  useEffect(() => {
    // Initialize push notifications
    pushNotificationService.initialize();
    
    return () => {
      pushNotificationService.unregister();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <NetworkStatus />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/post-ride" element={<PostRide />} />
            <Route path="/search-rides" element={<SearchRides />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/ride/:rideId" element={<ActiveRide />} />
            <Route path="/welcome" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
