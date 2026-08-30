import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ResolveComplaint() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api, logout } = useAuth();
  
  const [problemGroup, setProblemGroup] = useState(null);
  const [solution, setSolution] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProblem() {
      try {
        const data = await api(`/staff/problems/${id}`);
        setProblemGroup(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProblem();
  }, [id, api]);

  const handleSend = async () => {
    if (!solution.trim()) return;
    try {
      await api(`/staff/problems/${id}/solution`, {
        method: 'PUT',
        body: JSON.stringify({ solution }),
      });
      navigate('/department');
    } catch (err) {
      console.error(err);
      alert('Failed to resolve: ' + err.message);
    }
  };

  if (loading || !problemGroup) return <div style={{ padding: '48px' }}>Loading...</div>;

  return (
    <div style={{ padding: '48px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Top Header & Back Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/department')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#F3F4F6',
              color: '#374151',
              borderRadius: '8px',
              border: '1px solid #D1D5DB',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '15px'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#E5E7EB'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
          >
            ← Back
          </button>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#000000', margin: 0, letterSpacing: '-0.02em' }}>
            Resolve Problem Group
          </h2>
        </div>
        
        <button
          onClick={logout}
          style={{
            padding: '8px 16px',
            backgroundColor: '#F3F4F6',
            color: '#374151',
            borderRadius: '8px',
            border: '1px solid #D1D5DB',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '15px'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#E5E7EB'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
        >
          Logout
        </button>
      </div>

      {/* Main Container */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '4px solid #000000',
        borderRadius: '16px',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
        minHeight: '600px'
      }}>
        
        {/* Top Row */}
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          
          {/* Left Box */}
          <div style={{ 
            flex: 1, 
            border: '2px solid #000000', 
            borderRadius: '8px', 
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            backgroundColor: '#F9FAFB'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#000000' }}>
              {problemGroup.title}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: '#4B5563' }}>
              {problemGroup.complaint_count} applications • {problemGroup.affected_users} students affected
            </div>
          </div>

          {/* Right Box (AI Button placeholder) */}
          <button style={{ 
            flex: 1,
            border: '2px dashed #000000', 
            borderRadius: '8px', 
            padding: '24px',
            backgroundColor: '#FFFFFF',
            fontSize: '16px',
            fontWeight: 700,
            color: '#6B7280',
            cursor: 'pointer',
            textAlign: 'center'
          }} onClick={() => alert('AI generation coming soon!')}>
            ✨ Generate AI Solution (Demo)
          </button>
        </div>

        {/* Text Area */}
        <textarea
          value={solution}
          onChange={(e) => setSolution(e.target.value)}
          placeholder="Type the official resolution here. This will be sent to all affected students..."
          style={{
            flex: 1,
            width: '100%',
            border: '2px solid #000000',
            borderRadius: '8px',
            padding: '24px',
            fontSize: '16px',
            lineHeight: 1.5,
            color: '#000000',
            resize: 'none',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />

        {/* Send Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleSend}
            style={{
              border: '2px solid #000000',
              backgroundColor: '#000000',
              color: '#FFFFFF',
              borderRadius: '8px',
              padding: '12px 32px',
              fontSize: '16px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.color = '#000000';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#000000';
              e.currentTarget.style.color = '#FFFFFF';
            }}
          >
            Resolve & Notify Students
          </button>
        </div>

      </div>
    </div>
  );
}
