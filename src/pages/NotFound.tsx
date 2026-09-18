import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-5">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 text-center">
        <h1 className="text-lg font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">The page "{location.pathname}" does not exist in ResolveSphere AI.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3 text-sm">
          <Link to="/" className="font-medium text-primary underline">Home</Link>
          <Link to="/app" className="font-medium text-primary underline">Command Center</Link>
          <Link to="/status" className="font-medium text-primary underline">Backend Status</Link>
          <Link to="/app/cases" className="font-medium text-primary underline">Active Cases</Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
