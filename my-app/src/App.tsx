import { mockBudgetSummary, mockTransactions } from './data/mockData';

export default function App() {
  const { monthly_income, total_budget, total_spent, remaining, categories } = mockBudgetSummary;

  return (
    <div style={{ padding: '24px', fontFamily: 'sans-serif', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>Finance Dashboard</h1>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h4>Monthly Income</h4>
          <p style={{ fontSize: '20px', fontWeight: 'bold' }}>৳{monthly_income}</p>
        </div>
        <div style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h4>Total Budget</h4>
          <p style={{ fontSize: '20px', fontWeight: 'bold' }}>৳{total_budget}</p>
        </div>
        <div style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h4>Total Spent</h4>
          <p style={{ fontSize: '20px', fontWeight: 'bold' }}>৳{total_spent}</p>
        </div>
        <div style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h4>Remaining</h4>
          <p style={{ fontSize: '20px', fontWeight: 'bold', color: remaining >= 0 ? 'green' : 'red' }}>৳{remaining}</p>
        </div>
      </div>

      {/* Budget Categories */}
      <h2>Category Budget Status</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {categories.map((cat) => (
          <li key={cat.name} style={{ marginBottom: '12px', padding: '12px', border: '1px solid #eee', borderRadius: '6px' }}>
            <strong>{cat.name}</strong> — Allocated: ৳{cat.allocated} | Spent: ৳{cat.spent} 
            <span style={{ 
              marginLeft: '10px', 
              padding: '2px 8px', 
              borderRadius: '4px',
              backgroundColor: cat.status === 'danger' ? '#ffebee' : cat.status === 'warning' ? '#fff8e1' : '#e8f5e9',
              color: cat.status === 'danger' ? '#c62828' : cat.status === 'warning' ? '#f57f17' : '#2e7d32' 
            }}>
              {cat.status.toUpperCase()}
            </span>
          </li>
        ))}
      </ul>

      {/* Recent Transactions */}
      <h2>Recent Transactions</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ddd' }}>
            <th style={{ padding: '8px' }}>Date</th>
            <th style={{ padding: '8px' }}>Merchant</th>
            <th style={{ padding: '8px' }}>Category</th>
            <th style={{ padding: '8px' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {mockTransactions.map((tx) => (
            <tr key={tx.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '8px' }}>{tx.date}</td>
              <td style={{ padding: '8px' }}>{tx.merchant}</td>
              <td style={{ padding: '8px' }}>{tx.category}</td>
              <td style={{ padding: '8px' }}>৳{tx.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}