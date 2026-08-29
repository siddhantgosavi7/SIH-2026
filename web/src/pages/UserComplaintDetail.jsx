import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, Lightbulb, Sparkles, Send, Bold, Italic, List, Link as LinkIcon, Image as ImageIcon, BarChart2, CheckCircle2, Copy, Download, Share2, ThumbsUp, ThumbsDown } from 'lucide-react';

export function UserComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api } = useAuth();
  
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');

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

  const isResolved = complaint.status === 'resolved' || complaint.status === 'closed';
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
          {isResolved ? 'Improved Solution' : 'Complaint Detail & Input'}
        </h1>
        <p style={{ margin: 0, color: '#64748B', fontSize: '14px' }}>
          {isResolved ? 'View improved solution and next steps' : 'View details and add thoughts / suggestions'}
        </p>
      </div>

      {/* Parent Card */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '20px 24px',
          marginBottom: '24px',
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

        {isResolved ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Status</span>
            <div
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid #BBF7D0',
                backgroundColor: '#F0FDF4',
                color: '#16A34A',
                fontWeight: 700,
                fontSize: '12px',
              }}
            >
              Resolved
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, marginBottom: '6px' }}>Priority</span>
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
                {complaint.priority || 'Medium'}
              </div>
            </div>

            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '100px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                color: '#3B82F6',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              <Sparkles size={16} /> AI Demo
            </button>
          </div>
        )}
      </div>

      {isResolved ? (
        /* Resolved State: Improved Solution Green Box */
        <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#16A34A' }}>
            <CheckCircle2 size={24} />
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Improved Solution</h2>
          </div>
          
          <div style={{ color: '#166534', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
            <p style={{ margin: '0 0 16px' }}>
              {complaint.solution_text || 'The issue was caused due to a faulty component. We have replaced the part and tested it thoroughly. The situation is now stable.'}
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                'Identified the root cause area',
                'Checked the relevant equipment',
                'Replaced the faulty parts',
                'Verified normal operational levels'
              ].map((step, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 500 }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#22C55E', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={12} strokeWidth={4} />
                  </div>
                  Step {idx + 1}: {step}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #BBF7D0', paddingTop: '16px', color: '#166534' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: '#166534', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                <Copy size={16} /> Copy
              </button>
              <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: '#166534', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                <Download size={16} /> Download
              </button>
              <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: '#166534', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                <Share2 size={16} /> Share
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Helpful?</span>
              <button style={{ background: 'transparent', border: 'none', color: '#166534', cursor: 'pointer' }}><ThumbsUp size={16} /></button>
              <button style={{ background: 'transparent', border: 'none', color: '#166534', cursor: 'pointer' }}><ThumbsDown size={16} /></button>
            </div>
          </div>
        </div>
      ) : (
        /* Unresolved State: Input Box */
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', display: 'flex', flexDirection: 'column' }}>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Type your thoughts, suggestions or solution..."
            style={{
              width: '100%',
              minHeight: '160px',
              padding: '24px',
              border: 'none',
              borderRadius: '16px 16px 0 0',
              resize: 'none',
              outline: 'none',
              fontSize: '15px',
              color: '#0F172A',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderTop: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#64748B' }}>
              <button style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}><Bold size={18} /></button>
              <button style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}><Italic size={18} /></button>
              <button style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}><List size={18} /></button>
              <button style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}><LinkIcon size={18} /></button>
              <button style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}><ImageIcon size={18} /></button>
              <button style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}><BarChart2 size={18} /></button>
            </div>
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 24px',
                backgroundColor: '#3D4FFF',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Send <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
