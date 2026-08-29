/**
 * Student existing-problem discovery API.
 *
 * These functions use the existing `api()` helper from AuthContext, so JWT
 * handling, JSON parsing, 401 handling and the configured API base URL stay in
 * one place.
 */

export async function fetchExistingProblems(api, filters = {}) {
  const params = new URLSearchParams();

  if (filters.department) params.set('department', filters.department);
  if (filters.priority) params.set('priority', filters.priority);
  if (filters.status) params.set('status', filters.status);
  if (filters.q?.trim()) params.set('q', filters.q.trim());
  if (filters.limit != null) params.set('limit', String(filters.limit));
  if (filters.offset != null) params.set('offset', String(filters.offset));

  const query = params.toString();
  return api(`/problems${query ? `?${query}` : ''}`);
}

export async function fetchExistingProblem(api, problemId) {
  if (!problemId) throw new Error('problemId is required');
  return api(`/problems/${encodeURIComponent(problemId)}`);
}

export async function reportExistingProblem(api, problemId) {
  if (!problemId) throw new Error('problemId is required');
  return api(`/problems/${encodeURIComponent(problemId)}/report`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

/** Convenience helper for the discovery screen. */
export async function searchProblems(api, searchText, filters = {}) {
  return fetchExistingProblems(api, { ...filters, q: searchText });
}


/** Read-only similarity suggestions for the create-complaint form. */
export async function fetchSimilarProblems(api, { title, description = '', department } = {}) {
  if (!title?.trim()) return [];
  const params = new URLSearchParams({ title: title.trim() });
  if (description?.trim()) params.set('description', description.trim());
  if (department) params.set('department', department);
  params.set('limit', '5');
  return api(`/problems/similar?${params.toString()}`);
}

/** Create a genuinely new problem even when similar problems were suggested. */
export async function createNewComplaint(api, { title, description }) {
  return api('/complaints', {
    method: 'POST',
    headers: { 'Idempotency-Key': crypto.randomUUID() },
    body: JSON.stringify({ title: title.trim(), description: description.trim(), force_new: true }),
  });
}
