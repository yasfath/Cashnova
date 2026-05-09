import { useNavigate } from "react-router-dom";
import AssistantMark from "../common/AssistantMark";
import { useAppData } from "../../context/AppDataContext";
import { useSessionUser } from "../../hooks/useSessionUser";

const AIAssistantCard = () => {
  const navigate = useNavigate();
  const { dataSource } = useAppData();
  const sessionUser = useSessionUser();
  const showPrompt = dataSource === "backend" && Boolean(sessionUser);

  const openAssistantChat = () => {
    navigate("/ai-assistant#chat-area");
  };

  return (
    <div className="dashboard-assistant-card flex items-center justify-center px-2 py-3 sm:px-4 xl:justify-end xl:pr-8">
      <div className="relative">
        <button
          type="button"
          onClick={openAssistantChat}
          className="dashboard-assistant-button relative flex h-[92px] w-[92px] items-center justify-center rounded-full bg-transparent transition duration-200 hover:-translate-y-1 sm:h-[102px] sm:w-[102px]"
          aria-label="Open AI assistant chat"
        >
          <AssistantMark className="dashboard-assistant-mark relative z-10 h-[68px] w-[68px] drop-shadow-[0_14px_22px_rgba(15,124,130,0.24)] sm:h-[76px] sm:w-[76px]" />
        </button>

        {showPrompt && (
          <button
            type="button"
            onClick={openAssistantChat}
            className="absolute right-[calc(100%+14px)] top-1/2 hidden -translate-y-1/2 items-center rounded-full border border-white/70 bg-[rgba(255,255,255,0.9)] px-4 py-2 text-sm font-semibold text-[#1F5F7A] shadow-[0_18px_38px_rgba(19,52,72,0.12)] backdrop-blur sm:flex"
          >
            Any help?
            <span className="absolute -right-[7px] top-1/2 h-3.5 w-3.5 -translate-y-1/2 rotate-45 border-r border-b border-white/70 bg-white/90" />
          </button>
        )}
      </div>
    </div>
  );
};

export default AIAssistantCard;
