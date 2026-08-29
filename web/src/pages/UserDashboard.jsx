import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, ChevronDown, Lightbulb, ChevronRight, Filter } from 'lucide-react';

export function UserDashboard() {
  const { cases } = useAuth();
  const navigate = useNavigate();
  
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All time');

  // Filter complaints based on search text
  const filteredCases = (cases || []).filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.title?.toLowerCase().includes(q) || c.department?.toLowerCase().includes(q);
  });

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingTop: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
            My Complaints
          </h1>
          <p style={{ margin: 0, color: '#64748B', fontSize: '14px' }}>All complaints overview</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        {/* Search Bar */}
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search complaints..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 42px',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              fontSize: '14px',
              backgroundColor: '#FFFFFF',
              outline: 'none',
            }}
          />
        </div>

        {/* Filter Dropdown */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#64748B',
          }}
        >
          <Filter size={16} />
          <span>Filter: <strong>{filter}</strong></span>
          <ChevronDown size={16} />
        </div>
      </div>

      {/* Complaint List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredCases.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
            No complaints found.
          </div>
        ) : (
          filteredCases.map(item => {
            const isHigh = item.priority === 'Critical' || item.priority === 'Urgent' || item.priority === 'High';
            const badgeColor = isHigh ? '#FEE2E2' : '#FFEDD5';
            const badgeText = isHigh ? '#EF4444' : '#F97316';
            
            return (
              <div
                key={item.id}
                onClick={() => navigate(`/user/complaints/${item.id}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '16px',
                  padding: '20px 24px',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s',
                  gap: '24px'
                }}
                onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'}
                onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6', flexShrink: 0 }}>
                  <Lightbulb size={20} />
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.title}
                  </h3>
                  <div style={{ fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{item.department || 'General'}</span>
                    <span style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: '#CBD5E1' }} />
                    <span>SLA: 24h</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94A3B8', fontSize: '12px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '24px' }}>
                    <div style={{ width: '4px', height: '40%', backgroundColor: '#CBD5E1', borderRadius: '2px' }} />
                    <div style={{ width: '4px', height: '70%', backgroundColor: '#94A3B8', borderRadius: '2px' }} />
                    <div style={{ width: '4px', height: '100%', backgroundColor: '#64748B', borderRadius: '2px' }} />
                    <div style={{ width: '4px', height: '60%', backgroundColor: '#94A3B8', borderRadius: '2px' }} />
                  </div>
                  <span>Statistics in<br/>form of graphs</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexShrink: 0, marginLeft: '24px' }}>
                  <div
                    style={{
                      padding: '4px 12px',
                      borderRadius: '100px',
                      backgroundColor: badgeColor,
                      color: badgeText,
                      fontWeight: 700,
                      fontSize: '12px',
                    }}
                  >
                    {item.priority || 'Medium'}
                  </div>
                  <ChevronRight size={20} color="#94A3B8" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
