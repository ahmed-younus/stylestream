import { memo } from "react";

const PageLoader = memo(() => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
));

PageLoader.displayName = "PageLoader";

export default PageLoader;
