async function request(url, options = {}) {
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.message || data.error || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  auth: {
    getUrl: () => request('/auth/linkedin/url'),
    getStatus: () => request('/auth/linkedin/status'),
    disconnect: () => request('/auth/linkedin/disconnect', { method: 'POST' })
  },
  profile: {
    get: () => request('/api/profile'),
    update: (data, summary = 'Update profile') =>
      request('/api/profile', { method: 'PUT', body: { ...data, _summary: summary } }),
    getRevisions: () => request('/api/profile/revisions'),
    restoreRevision: (id) => request(`/api/profile/revisions/${id}/restore`, { method: 'POST' }),
    getVariations: () => request('/api/profile/variations'),
    optimizeHeadline: () => request('/api/profile/optimize/headline', { method: 'POST' }),
    optimizeAbout: (language, angle) =>
      request('/api/profile/optimize/about', { method: 'POST', body: { language, angle } })
  },
  audit: {
    run: () => request('/api/audit'),
    analyzeKeywords: (jobDescription = '') =>
      request('/api/audit/keywords', { method: 'POST', body: { jobDescription } }),
    getRecommendations: (jobDescription = '') =>
      request('/api/audit/recommendations', { method: 'POST', body: { jobDescription } })
  },
  automation: {
    getJobs: () => request('/api/automation/jobs'),
    toggleJob: (id, status) =>
      request(`/api/automation/jobs/${id}`, { method: 'PATCH', body: { status } }),
    getReminders: () => request('/api/automation/reminders'),
    getDrafts: () => request('/api/automation/drafts'),
    createDraft: (data) => request('/api/automation/drafts', { method: 'POST', body: data }),
    generateDraft: (category = 'Technical Learning') =>
      request('/api/automation/drafts/generate', { method: 'POST', body: { category } }),
    approveDraft: (id, approve, publishToLinkedIn = false) =>
      request(`/api/automation/drafts/${id}/approve`, {
        method: 'POST',
        body: { approve, publish_to_linkedin: publishToLinkedIn }
      }),
    getLogs: (limit = 50) => request(`/api/automation/logs?limit=${limit}`)
  },
  settings: {
    purge: () => request('/api/settings/purge', { method: 'POST' }),
    getGuidance: () => request('/api/settings/guidance'),
    getCredentials: () => request('/api/settings/credentials'),
    saveCredentials: (clientId, clientSecret) =>
      request('/api/settings/credentials', {
        method: 'POST',
        body: { clientId, clientSecret }
      })
  }
};
