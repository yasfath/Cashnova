import PageContainer from "../components/common/PageContainer";
import StatCard from "../components/dashboard/StatCard";
import CustomerAnalyticsCard from "../components/dashboard/CustomerAnalyticsCard";
import RecentTransactions from "../components/dashboard/RecentTransactions";
import SalesTrendChart from "../components/dashboard/SalesTrendChart";
import AIAssistantCard from "../components/dashboard/AIAssistantCard";
import { useAppData } from "../context/AppDataContext";

const Dashboard = () => {
  const { dashboardCards, loading, recentTransactions } = useAppData();

  return (
    <PageContainer>
      <div className="dashboard-fit space-y-4 lg:space-y-0">
        <div className="dashboard-top-grid grid grid-cols-1 gap-4 lg:gap-4 xl:grid-cols-[minmax(0,1fr)_268px] 2xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="dashboard-stats-grid grid grid-cols-1 gap-4 sm:grid-cols-2">
            {dashboardCards.map((card) => (
              <StatCard key={card.title} {...card} />
            ))}
          </div>

          <CustomerAnalyticsCard loading={loading} />
        </div>

        <div className="dashboard-bottom-grid grid grid-cols-1 gap-4 lg:gap-4 xl:grid-cols-[minmax(0,1fr)_268px] 2xl:grid-cols-[minmax(0,1fr)_300px]">
          <SalesTrendChart loading={loading} />

          <div className="dashboard-side-stack space-y-4">
            <RecentTransactions loading={loading} transactions={recentTransactions} />
            <AIAssistantCard />
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default Dashboard;
