import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { SendHorizontal, Sparkles } from "lucide-react";
import PageContainer from "../components/common/PageContainer";
import api from "../services/api";
import { useAppData } from "../context/AppDataContext";

const buildLocalReply = (message, entries, formatCurrency) => {
  const loweredMessage = message.toLowerCase();
  const income = entries
    .filter((entry) => entry.type === "income")
    .reduce((total, entry) => total + Number(entry.amount || 0), 0);
  const expense = entries
    .filter((entry) => entry.type === "expense")
    .reduce((total, entry) => total + Number(entry.amount || 0), 0);
  const balance = income - expense;

  if (entries.length === 0) {
    if (loweredMessage.includes("income")) {
      return "Your total income is 0. I do not see any income entries for this account yet.";
    }

    if (loweredMessage.includes("expense") || loweredMessage.includes("spend")) {
      return "Your total expense is 0. I do not see any expense entries for this account yet.";
    }

    if (loweredMessage.includes("balance") || loweredMessage.includes("cash")) {
      return "Your current balance is 0 because this account has no transactions yet.";
    }

    return "I am ready to chat. Add income or expense entries and I can answer totals, balance, categories, forecasts, and finance questions from your Cashnova data.";
  }

  if (loweredMessage.includes("income") || loweredMessage.includes("revenue")) {
    return `Your total income is ${formatCurrency(income)}.`;
  }

  if (loweredMessage.includes("expense") || loweredMessage.includes("spend")) {
    return `Your total expense is ${formatCurrency(expense)}.`;
  }

  if (loweredMessage.includes("balance") || loweredMessage.includes("cash")) {
    return `Your current balance is ${formatCurrency(balance)}. Income is ${formatCurrency(
      income
    )} and expense is ${formatCurrency(expense)}.`;
  }

  return `Here is your quick Cashnova summary: income ${formatCurrency(
    income
  )}, expense ${formatCurrency(expense)}, balance ${formatCurrency(balance)}, records ${
    entries.length
  }.`;
};

const AIAssistant = () => {
  const location = useLocation();
  const { entries, formatCurrency } = useAppData();
  const chatAreaRef = useRef(null);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const hasMessages = messages.length > 0;
  const emptyCopy = useMemo(
    () =>
      entries.length === 0
        ? "Ask me anything. Your account is empty now, so finance totals will start from zero until you add entries."
        : "Ask about income, expenses, balance, top category, forecasts, or recent transactions.",
    [entries.length]
  );

  useEffect(() => {
    if (location.hash === "#chat-area") {
      chatAreaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

      const timer = window.setTimeout(() => {
        inputRef.current?.focus();
      }, 250);

      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [location.hash]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, submitting]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage || submitting) {
      return;
    }

    setMessages((currentMessages) => [
      ...currentMessages,
      { id: `user-${Date.now()}`, role: "user", text: trimmedMessage },
    ]);
    setMessage("");
    setSubmitting(true);

    try {
      const response = await api.askAssistant({ message: trimmedMessage });
      const reply =
        response?.reply ??
        response?.message ??
        response?.answer ??
        buildLocalReply(trimmedMessage, entries, formatCurrency);

      setMessages((currentMessages) => [
        ...currentMessages,
        { id: `assistant-${Date.now()}`, role: "assistant", text: reply },
      ]);
    } catch {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: buildLocalReply(trimmedMessage, entries, formatCurrency),
        },
      ]);
    } finally {
      setSubmitting(false);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  return (
    <PageContainer>
      <div
        id="chat-area"
        ref={chatAreaRef}
        className="theme-card flex h-[calc(100vh-150px)] flex-col overflow-hidden rounded-[28px] shadow-[0_20px_48px_rgba(176,103,230,0.14)]"
      >
        <div className="theme-panel-strong flex items-center justify-between border-b border-[rgba(203,174,241,0.24)] px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9B84BF]">
              Cashnova AI
            </p>
            <h2 className="mt-2 text-[24px] font-bold tracking-[-0.03em] text-[#24163B]">
              Assistant Workspace
            </h2>
          </div>

          <div className="theme-panel inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-[#8C79B0]">
            <Sparkles className="h-4 w-4 text-[#9E63FF]" />
           
          </div>
        </div>

        <div className="relative flex-1 overflow-y-auto px-6 py-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,142,212,0.08),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(156,104,255,0.1),transparent_30%)]" />

          {hasMessages ? (
            <div className="relative flex min-h-full flex-col justify-end gap-4">
              {messages.map((item) => (
                <div
                  key={item.id}
                  className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[min(720px,82%)] rounded-[22px] px-5 py-4 text-sm font-medium leading-7 shadow-[0_14px_30px_rgba(49,32,78,0.08)] ${
                      item.role === "user"
                        ? "bg-[#127d8c] text-white"
                        : "theme-panel text-[#281A43]"
                    }`}
                  >
                    {item.text}
                  </div>
                </div>
              ))}

              {submitting && (
                <div className="flex justify-start">
                  <div className="theme-panel rounded-[22px] px-5 py-4 text-sm font-semibold text-[#8C79B0] shadow-[0_14px_30px_rgba(49,32,78,0.08)]">
                    Thinking...
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="relative flex h-full items-center justify-center">
              <div className="max-w-[480px] text-center">
                <div className="mx-auto mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[linear-gradient(145deg,rgba(255,240,248,0.96),rgba(241,228,255,0.92))] text-[#9E63FF] shadow-[0_16px_32px_rgba(176,103,230,0.14)]">
                  <Sparkles className="h-8 w-8" />
                </div>
                <h3 className="text-[22px] font-bold tracking-[-0.03em] text-[#24163B]">
                  Ask for insights, forecasts, and finance help
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#8C79B0]">
                  {emptyCopy}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-[rgba(203,174,241,0.24)] px-6 py-4">
          <form
            className="theme-panel flex items-center gap-3 rounded-[20px] px-4 py-3"
            onSubmit={handleSubmit}
          >
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Type your message..."
              className="w-full bg-transparent text-sm text-[#281A43] outline-none placeholder:text-[#9C8BB9]"
            />
            <button
              type="submit"
              disabled={submitting || !message.trim()}
              className="theme-button-primary rounded-xl p-2.5 text-white transition duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Send message"
            >
              <SendHorizontal size={18} />
            </button>
          </form>
        </div>
      </div>
    </PageContainer>
  );
};

export default AIAssistant;
