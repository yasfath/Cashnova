import PageContainer from "../components/common/PageContainer";
import { Bell, Globe } from "lucide-react";
import { useAppData } from "../context/AppDataContext";
import {
  CURRENCY_OPTIONS,
  LANGUAGE_OPTIONS,
  TIMEZONE_OPTIONS,
} from "../utils/userPreferences";

const SettingCard = ({ icon, title, subtitle, children }) => {
  return (
    <div className="theme-card rounded-[24px] p-5 transition duration-200 hover:-translate-y-[3px] hover:shadow-[0_18px_40px_rgba(19,52,72,0.1)] active:scale-[0.985]">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#f8fbfc_0%,#e7f0f3_100%)] text-[#1F5F7A]">
          {icon}
        </div>
        <div>
          <h3 className="text-[16px] font-bold text-[#12303f]">{title}</h3>
          <p className="mt-1 text-sm text-[#647c8a]">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
};

const ToggleRow = ({ title, desc, enabled = false, onToggle }) => {
  return (
    <div className="theme-panel flex flex-col gap-3 rounded-2xl px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-semibold text-[#12303f]">{title}</p>
        <p className="text-sm text-[#647c8a]">{desc}</p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={onToggle}
        className={`relative h-8 w-14 shrink-0 rounded-full p-1 transition duration-200 ${
          enabled
            ? "bg-[linear-gradient(90deg,#0F7C82_0%,#1F5F7A_100%)]"
            : "bg-[rgba(145,171,184,0.45)]"
        }`}
      >
        <span
          className={`block h-6 w-6 rounded-full bg-white shadow-sm transition duration-200 ${
            enabled ? "translate-x-6" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
};

const SelectField = ({ label, onChange, options = [], value }) => {
  return (
    <div className="theme-panel rounded-2xl p-4">
      <p className="mb-3 font-semibold text-[#12303f]">{label}</p>
      <select
        value={value}
        onChange={onChange}
        className="theme-input w-full rounded-xl px-4 py-3 text-sm text-[#12303f] outline-none"
      >
        {options.map((item) => (
          <option key={typeof item === "string" ? item : item.value} value={typeof item === "string" ? item : item.value}>
            {typeof item === "string" ? item : item.label}
          </option>
        ))}
      </select>
    </div>
  );
};

const Settings = () => {
  const { preferences, updatePreferences } = useAppData();

  const handleToggle = (key) => {
    updatePreferences({
      [key]: !preferences[key],
    });
  };

  return (
    <PageContainer>
      <div className="flex min-h-[calc(100vh-140px)] items-center justify-center py-4 sm:py-6">
        <div className="w-full max-w-[1120px] space-y-5">
          <SettingCard
            icon={<Bell size={20} />}
            title="Notifications"
            subtitle="Control alerts and update preferences."
          >
            <div className="space-y-4">
              <ToggleRow
                title="Email Notifications"
                desc="Receive important alerts and activity updates by email."
                enabled={preferences.emailNotifications}
                onToggle={() => handleToggle("emailNotifications")}
              />
              <ToggleRow
                title="AI Prediction Alerts"
                desc="Get notified when new prediction insights become available."
                enabled={preferences.aiPredictionAlerts}
                onToggle={() => handleToggle("aiPredictionAlerts")}
              />
              <ToggleRow
                title="Monthly Report Reminder"
                desc="Remind user to review monthly reports and summaries."
                enabled={preferences.monthlyReportReminder}
                onToggle={() => handleToggle("monthlyReportReminder")}
              />
            </div>
          </SettingCard>

          <SettingCard
            icon={<Globe size={20} />}
            title="Regional Preferences"
            subtitle="Customize language, currency, and timezone."
          >
            <div className="grid gap-4 md:grid-cols-3">
              <SelectField
                label="Language"
                value={preferences.language}
                onChange={(event) => updatePreferences({ language: event.target.value })}
                options={LANGUAGE_OPTIONS}
              />
              <SelectField
                label="Currency"
                value={preferences.currency}
                onChange={(event) => updatePreferences({ currency: event.target.value })}
                options={CURRENCY_OPTIONS}
              />
              <SelectField
                label="Timezone"
                value={preferences.timezone}
                onChange={(event) => updatePreferences({ timezone: event.target.value })}
                options={TIMEZONE_OPTIONS}
              />
            </div>
          </SettingCard>
        </div>
      </div>
    </PageContainer>
  );
};

export default Settings;
