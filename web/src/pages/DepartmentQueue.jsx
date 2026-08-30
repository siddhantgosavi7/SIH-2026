import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search } from 'lucide-react';

function priorityBand(score) {
  if (score >= 90) return { label: 'CRITICAL', color: '#DC2626' };
  if (score >= 75) return { label: 'HIGH', color: '#F97316' };
  if (score >= 50) return { label: 'MEDIUM', color: '#EAB308' };
  return { label: 'LOW', color: '#22C55E' };
}

export function DepartmentQueue() {
  const { api, logout, session } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [problems, setProblems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [probs, dashboardStats] = await Promise.all([
          api('/staff/problems'),
          api('/dashboard/department')
        ]);
        setProblems(probs || []);
        setStats(dashboardStats || { open: 0, in_progress: 0, escalated: 0, resolved: 0 });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [api]);

  const filteredProblems = problems.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats calculation
  const totalApplications = stats ? (stats.open + stats.in_progress + stats.escalated + stats.resolved) : 0;
  const pendingApplications = stats ? (stats.open + stats.in_progress) : 0;
  const urgentApplications = problems.filter(p => p.priority_score >= 90).length;
  const resolvedApplications = stats ? stats.resolved : 0;

  // Priority Distribution calculation
  const distribution = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  problems.forEach(p => {
    const band = priorityBand(p.priority_score).label;
    distribution[band]++;
  });

  return (
    <div style={{ padding: '48px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Top Header & Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#000000', margin: 0, letterSpacing: '-0.02em' }}>
            Department Dashboard
          </h2>
          <div style={{ color: '#6B7280', fontSize: '14px', fontWeight: 500 }}>
            Logged in as {session?.name || session?.email || 'Staff'}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} color="#9CA3AF" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search problems..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 42px',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <button
            onClick={logout}
            style={{
              padding: '12px 24px',
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
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6B7280' }}>Loading dashboard...</div>
      ) : (
        <>
          {/* Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
            {[
              { label: 'Applications', value: totalApplications, color: '#3B82F6' },
              { label: 'Pending', value: pendingApplications, color: '#EAB308' },
              { label: 'Urgent', value: urgentApplications, color: '#DC2626' },
              { label: 'Resolved', value: resolvedApplications, color: '#22C55E' }
            ].map((stat, idx) => (
              <div key={idx} style={{ 
                backgroundColor: '#FFFFFF', 
                border: `3px solid ${stat.color}`, 
                borderRadius: '16px', 
                padding: '24px',
                textAlign: 'center',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: '36px', fontWeight: 800, color: '#000000' }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Priority Distribution */}
          <div style={{ backgroundColor: '#FFFFFF', border: '4px solid #000000', borderRadius: '16px', padding: '32px', marginBottom: '40px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 24px 0' }}>Priority Distribution</h3>
            <div style={{ display: 'flex', gap: '24px' }}>
              {Object.entries(distribution).map(([label, count]) => (
                <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ 
                    width: '100%', 
                    height: '120px', 
                    backgroundColor: '#F3F4F6', 
                    borderRadius: '8px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      position: 'absolute', 
                      bottom: 0, 
                      left: 0, 
                      right: 0, 
                      height: `${problems.length ? (count / problems.length) * 100 : 0}%`, 
                      backgroundColor: priorityBand(label === 'CRITICAL' ? 90 : label === 'HIGH' ? 75 : label === 'MEDIUM' ? 50 : 0).color,
                      transition: 'height 0.3s ease'
                    }} />
                  </div>
                  <div style={{ marginTop: '12px', fontWeight: 700, fontSize: '14px' }}>{label}</div>
                  <div style={{ color: '#6B7280', fontSize: '14px' }}>{count} problems</div>
                </div>
              ))}
            </div>
          </div>

          {/* List of Problem Groups */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {filteredProblems.map((group) => {
              const band = priorityBand(group.priority_score || 0);
              
              return (
                <div key={group.id} style={{
                  backgroundColor: '#FFFFFF',
                  border: '4px solid #000000',
                  borderRadius: '16px',
                  padding: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}>
                  
                  {/* Left: Info */}
                  <div style={{ 
                    border: '2px solid #000000', 
                    borderRadius: '8px', 
                    padding: '20px 24px', 
                    width: '320px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    backgroundColor: '#F9FAFB'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#000000', lineHeight: 1.2, paddingRight: '12px' }}>
                        {group.title}
                      </div>
                      <div style={{ 
                        backgroundColor: band.color, 
                        color: '#FFFFFF', 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '12px', 
                        fontWeight: 700 
                      }}>
                        {band.label}
                      </div>
                    </div>
                    
                    {group.category && (
                      <div style={{ display: 'inline-block', backgroundColor: '#E5E7EB', color: '#374151', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, width: 'fit-content' }}>
                        {group.category}
                      </div>
                    )}
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#4B5563' }}>
                      {group.complaint_count} applications • {group.affected_users} students affected
                    </div>
                  </div>

                  {/* Middle: Urgency & Impact Bars */}
                  <div style={{ flex: 1, padding: '0 48px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase', color: '#6B7280' }}>
                        <span>Urgency</span>
                        <span>{group.urgency_score || 0}/100</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', backgroundColor: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${group.urgency_score || 0}%`, height: '100%', backgroundColor: '#DC2626' }} />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase', color: '#6B7280' }}>
                        <span>Impact</span>
                        <span>{group.impact_score || 0}/100</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', backgroundColor: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${group.impact_score || 0}%`, height: '100%', backgroundColor: '#3B82F6' }} />
                      </div>
                    </div>

                  </div>

                  {/* Right: Resolve Button */}
                  <div>
                    <button
                      onClick={() => navigate(`/department/problems/${group.id}/resolve`)}
                      style={{
                        backgroundColor: '#000000',
                        color: '#FFFFFF',
                        border: '2px solid #000000',
                        borderRadius: '8px',
                        padding: '12px 32px',
                        fontSize: '16px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
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
                      Resolve
                    </button>
                  </div>

                </div>
              );
            })}

            {filteredProblems.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px', color: '#6B7280', fontSize: '16px' }}>
                No active problem groups found.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
