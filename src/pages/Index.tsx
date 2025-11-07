import { Navbar } from "@/components/layout/Navbar";
import { MainSidebar } from "@/components/layout/MainSidebar";
import { Dashboard } from "./Dashboard";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      <Navbar />
      <div className="flex flex-1 w-full overflow-hidden">
        <MainSidebar />
        <main className="flex-1 overflow-auto">
          <Dashboard />
        </main>
      </div>
    </div>
  );
};

export default Index;
