import { useEffect, useState } from "react";
import FeatureShell from "./FeatureShell.jsx";

const categories = ["Food", "Shopping", "Transport", "Hotels", "Activities"];

function BudgetDashboard({
  initialTotalBudget,
  budgetStatus,
  loading,
  error,
  onCreateBudget,
  onAddExpense
}) {
  const [totalBudget, setTotalBudget] = useState(initialTotalBudget || 18000);
  const [allocations, setAllocations] = useState({
    Food: 3600,
    Shopping: 2700,
    Transport: 3600,
    Hotels: 5400,
    Activities: 2700
  });
  const [expenseInputs, setExpenseInputs] = useState({
    Food: 500,
    Shopping: 500,
    Transport: 300,
    Hotels: 1000,
    Activities: 400
  });

  useEffect(() => {
    setTotalBudget(initialTotalBudget || 18000);
  }, [initialTotalBudget]);

  const handleAllocationChange = (category, value) => {
    setAllocations(current => ({
      ...current,
      [category]: Number(value) || 0
    }));
  };

  const handleExpenseChange = (category, value) => {
    setExpenseInputs(current => ({
      ...current,
      [category]: Number(value) || 0
    }));
  };

  const budget = budgetStatus?.categories || {};

  return (
    <FeatureShell
      feature="Feature 3"
      title="Smart Budget Manager"
      subtitle="Independent category tracking with live progress"
      icon="◈"
      loading={loading}
      error={error}
      action={
        <button
          className="button button-primary"
          type="button"
          onClick={() => onCreateBudget({ totalBudget, allocations })}
          disabled={loading}
        >
          {loading ? "Saving..." : "Create Budget"}
        </button>
      }
    >
      <div className="budget-dashboard">
        <p className="panel-subtle">
          Define a total trip budget, split it into categories, and track expenses independently for each one.
        </p>

        <label className="budget-total-input">
          <span>Total trip budget</span>
          <input type="number" min="1000" step="500" value={totalBudget} onChange={event => setTotalBudget(Number(event.target.value) || 0)} />
        </label>

        <div className="budget-allocation-grid">
          {categories.map(category => (
            <label key={`allocation-${category}`} className="budget-allocation-card">
              <span>{category}</span>
              <input
                type="number"
                min="0"
                step="100"
                value={allocations[category]}
                onChange={event => handleAllocationChange(category, event.target.value)}
              />
            </label>
          ))}
        </div>

        {!budgetStatus ? (
          <div className="empty-feature-state">
            <strong>No budget plan created yet</strong>
            <span>Create a budget plan to track category-by-category spending progress.</span>
          </div>
        ) : (
          <div className="budget-status-grid">
            <div className="budget-summary-card">
              <strong>Total Budget: INR {Number(budgetStatus.totalBudget || 0).toLocaleString("en-IN")}</strong>
              <span>Total Spent: INR {Number(budgetStatus.totalSpent || 0).toLocaleString("en-IN")}</span>
            </div>

            {categories.map(category => {
              const item = budget[category] || { allocated: 0, spent: 0, remaining: 0, progress: 0 };
              return (
                <article key={`budget-${category}`} className="budget-category-card">
                  <div className="budget-category-head">
                    <strong>{category}</strong>
                    <span>{item.progress}% used</span>
                  </div>

                  <div className="budget-progress-bar">
                    <span style={{ width: `${Math.min(item.progress, 100)}%` }} />
                  </div>

                  <div className="budget-metrics">
                    <div><span>Allocated</span><strong>INR {Number(item.allocated).toLocaleString("en-IN")}</strong></div>
                    <div><span>Spent</span><strong>INR {Number(item.spent).toLocaleString("en-IN")}</strong></div>
                    <div><span>Remaining</span><strong>INR {Number(item.remaining).toLocaleString("en-IN")}</strong></div>
                  </div>

                  <div className="budget-expense-form">
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={expenseInputs[category]}
                      onChange={event => handleExpenseChange(category, event.target.value)}
                    />
                    <button
                      type="button"
                      className="button button-ghost"
                      onClick={() => onAddExpense(category, expenseInputs[category])}
                      disabled={loading}
                    >
                      Add Expense
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </FeatureShell>
  );
}

export default BudgetDashboard;
