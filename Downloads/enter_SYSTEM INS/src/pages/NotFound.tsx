import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShieldCheck, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-5">
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />
      <div className="relative w-full max-w-md text-center animate-slide-up">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <ShieldCheck className="h-8 w-8 text-primary" />
        </div>
        <p className="text-6xl font-extrabold gradient-text">404</p>
        <h1 className="mt-3 text-xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{location.pathname}</code> does not exist in ResolveSphere AI.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild className="gap-2 rounded-xl">
            <Link to="/"><Home className="h-4 w-4" />Home</Link>
          </Button>
          <Button asChild variant="outline" className="gap-2 rounded-xl">
            <Link to="/app"><ArrowLeft className="h-4 w-4" />Command Center</Link>
          </Button>
          <Button asChild variant="outline" className="gap-2 rounded-xl">
            <Link to="/app/cases">Active Cases</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
