import { useState } from "react";
import PageContainer from "../components/common/PageContainer";
import { useAppData } from "../context/AppDataContext";

const initialFormState = {
  title: "",
  amount: "",
  type: "income",
  date: new Date().toISOString().slice(0, 10),
  category: "",
  notes: "",
};

const AddEntry = () => {
  const { addEntry, notice, saving } = useAppData();
  const [formValues, setFormValues] = useState(initialFormState);
  const [feedback, setFeedback] = useState("");
  const [errors, setErrors] = useState({});

  const handleFieldChange = (field) => (event) => {
    const nextValue = event.target.value;

    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: nextValue,
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: "",
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};

    if (!formValues.title.trim()) {
      nextErrors.title = "Title is required.";
    }

    if (!formValues.amount || Number(formValues.amount) <= 0) {
      nextErrors.amount = "Enter a valid amount greater than 0.";
    }

    if (!formValues.date) {
      nextErrors.date = "Choose a date.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setFeedback("");
      return;
    }

    await addEntry({
      ...formValues,
      category: formValues.category.trim() || "Others",
    });

    setFormValues({
      ...initialFormState,
      date: new Date().toISOString().slice(0, 10),
    });
    setErrors({});
    setFeedback("Entry saved successfully.");
  };

  const inputClassName =
    "theme-input w-full rounded-2xl px-5 py-4 text-sm font-medium text-[#281A43] outline-none transition";

  return (
    <PageContainer>
      <div className="flex min-h-[calc(100vh-140px)] items-center justify-center py-4 sm:py-6">
        <div className="theme-card flex w-full max-w-[1180px] flex-col rounded-[30px] p-7 sm:min-h-[660px] sm:p-9 lg:p-12">
          <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5">
            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <input
                  value={formValues.title}
                  onChange={handleFieldChange("title")}
                  className={inputClassName}
                  placeholder="Title"
                />
                {errors.title && (
                  <p className="mt-2 text-xs font-medium text-[#F067AA]">{errors.title}</p>
                )}
              </div>

              <div>
                <input
                  value={formValues.amount}
                  onChange={handleFieldChange("amount")}
                  className={inputClassName}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Amount"
                />
                {errors.amount && (
                  <p className="mt-2 text-xs font-medium text-[#F067AA]">{errors.amount}</p>
                )}
              </div>

              <div>
                <select
                  value={formValues.type}
                  onChange={handleFieldChange("type")}
                  className={inputClassName}
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>

              <div>
                <input
                  type="date"
                  value={formValues.date}
                  onChange={handleFieldChange("date")}
                  className={inputClassName}
                />
                {errors.date && (
                  <p className="mt-2 text-xs font-medium text-[#F067AA]">{errors.date}</p>
                )}
              </div>
            </div>

            <input
              value={formValues.category}
              onChange={handleFieldChange("category")}
              className={inputClassName}
              placeholder="Category"
            />

            <textarea
              rows="7"
              value={formValues.notes}
              onChange={handleFieldChange("notes")}
              className={`${inputClassName} min-h-[280px] resize-none`}
              placeholder="Notes"
            />

            <div className="mt-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-h-[20px] text-sm font-medium text-[#8E7AAE]">
                {feedback || notice}
              </div>

              <button
                type="submit"
                disabled={saving}
                className="theme-button-primary inline-flex min-w-[180px] items-center justify-center rounded-2xl px-8 py-4 font-semibold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? "Saving..." : "Save Entry"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageContainer>
  );
};

export default AddEntry;
