import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, Lightbulb, ChevronRight } from 'lucide-react';

export function UserProblemList() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api } = useAuth();
  
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock sub-problems since backend doesn't explicitly store them as a list
  const subProblems = [
    { id: 'sub-1', title: 'Low water pressure in 3rd floor', status: 'Unresolved' },
    { id: 'sub-2', title: 'No water in washrooms (2nd floor)', status: 'Unresolved' },
    { id: 'sub-3', title: 'Water overflow in corridor', status: 'Unresolved' },
    { id: 'sub-4', title: 'Water timing not followed', status: 'Unresolved' },
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await api(`/complaints/${id}`);
        setComplaint(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, api]);

  if (loading || !complaint) {
    return <div style={{ padding: '32px' }}>Loading...</div>;
  }

  const isHigh = complaint.priority === 'Critical' || complaint.priority === 'Urgent' || complaint.priority === 'High';
  const badgeColor = isHigh ? '#FEE2E2' : '#FFEDD5';
  const badgeText = isHigh ? '#EF4444' : '#F97316';

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingTop: '32px' }}>
      <button
        onClick={() => navigate('/user/dashboard')}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#64748B',
          fontSize: '14px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          cursor: 'pointer',
          padding: 0,
          marginBottom: '24px'
        }}
      >
        <ChevronLeft size={16} /> Back to Complaints
      </button>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
          Problem List
        </h1>
        <p style={{ margin: 0, color: '#64748B', fontSize: '14px' }}>List of problems raised under this complaint</p>
      </div>

      {/* Parent Complaint Card */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '20px 24px',
          marginBottom: '32px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6', flexShrink: 0, marginRight: '24px' }}>
          <Lightbulb size={20} />
        </div>
        
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
            {complaint.title}
          </h3>
          <div style={{ fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{complaint.department || 'General'}</span>
            <span style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: '#CBD5E1' }} />
            <span>SLA: 24h</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, marginBottom: '6px' }}>Priority</span>
            <span style={{ 
              display: 'inline-block', 
              backgroundColor: isHigh ? '#FEF2F2' : '#F8FAFC', 
              color: isHigh ? '#EF4444' : '#64748B', 
              padding: '4px 10px', 
              borderRadius: '20px', 
              fontSize: '12px', 
              fontWeight: 600,
              border: `1px solid ${isHigh ? '#FCA5A5' : '#E2E8F0'}`
            }}>
              {complaint.priority || 'Medium'}
            </span>
          </div>
          
          {complaint.category && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, marginBottom: '6px' }}>Category</span>
              <span style={{ 
                display: 'inline-block', 
                backgroundColor: '#F8FAFC', 
                color: '#334155', 
                padding: '4px 10px', 
                borderRadius: '20px', 
                fontSize: '12px', 
                fontWeight: 600,
                border: '1px solid #E2E8F0'
              }}>
                {complaint.category}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Sub-Problems List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {subProblems.map((prob, index) => (
          <div
            key={prob.id}
            onClick={() => navigate(`/user/complaints/${id}/detail`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: index === 0 ? '#F8FAFC' : '#FFFFFF',
              border: index === 0 ? '1px solid #E2E8F0' : '1px solid transparent',
              borderBottom: index !== 0 ? '1px solid #E2E8F0' : '1px solid #E2E8F0',
              borderRadius: index === 0 ? '12px' : '0',
              padding: '16px 24px',
              cursor: 'pointer',
            }}
          >
            <div style={{ flex: 1, fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>
              {prob.title}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  padding: '4px 12px',
                  borderRadius: '100px',
                  backgroundColor: '#F1F5F9',
                  color: '#64748B',
                  fontWeight: 600,
                  fontSize: '12px',
                }}
              >
                {prob.status}
              </div>
              <ChevronRight size={18} color="#94A3B8" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
