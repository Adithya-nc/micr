import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { DemoAuthProvider } from "@/lib/demoAuth";
import { ThemeProvider } from "@/lib/theme";
import { AppErrorBoundary } from "@/components/resolvesphere/AppErrorBoundary";
import { routers } from "./router";

const queryClient = new QueryClient();

const App = () => {
  const router = createBrowserRouter(routers);
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <DemoAuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AppErrorBoundary>
              <RouterProvider router={router} />
            </AppErrorBoundary>
          </TooltipProvider>
        </DemoAuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
