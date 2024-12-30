import React, { Suspense } from "react";
import DashboardPage from "./page";
import { BarLoader } from "react-spinners";

const DashboardLayout = () => {
  return (
    <div className="px-5">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-5xl font-bold tracking-tight gradient-title">
          Dashboard
        </h1>
      </div>

      {/* Dashboard Page - Rendering it using a suspense */}
      <Suspense
        fallback={
          <>
            <BarLoader className="mt-24" width={"100%"} color="#9333ea" />
          </>
        }
      >
        <DashboardPage />
      </Suspense>
    </div>
  );
};

export default DashboardLayout;
