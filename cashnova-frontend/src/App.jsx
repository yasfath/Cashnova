import { AppDataProvider } from "./context/AppDataContext";
import AppRoutes from "./routes/AppRoutes";

function App() {
  return (
    <AppDataProvider>
      <div className="font-poppins">
        <AppRoutes />
      </div>
    </AppDataProvider>
  );
}

export default App;
