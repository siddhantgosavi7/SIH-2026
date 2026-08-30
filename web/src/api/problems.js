// The current FastAPI contract exposes problem groups to staff, not students.
// Student-side discovery therefore uses the student's own complaints and groups them locally.
export function groupStudentComplaints(complaints = []) {
  const groups = new Map();
  for (const complaint of complaints) {
    const key = complaint.problem_group_id || complaint.problem_id || `complaint:${complaint.id}`;
    if (!groups.has(key)) {
      groups.set(key, {
        id: complaint.problem_group_id || complaint.problem_id || complaint.id,
        problem_code: complaint.problem_code,
        title: complaint.problem_title || complaint.title || 'Problem group',
        description: complaint.problem_description || complaint.description || '',
        department: complaint.department,
        priority: complaint.priority,
        status: complaint.status,
        complaint_count: 0,
        complaints: [],
      });
    }
    const group = groups.get(key);
    group.complaint_count += 1;
    group.complaints.push(complaint);
    if (!group.problem_code) group.problem_code = complaint.problem_code;
    if (!group.title) group.title = complaint.problem_title || complaint.title;
  }
  return [...groups.values()];
}
