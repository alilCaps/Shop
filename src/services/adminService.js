
const API_BASE_URL = "http://localhost:5000";

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

export const adminService = {
  getOverview() {
    return request("/api/admin/overview");
  },

  getResource(resource) {
    return request(`/api/admin/${resource}`);
  },

  updateResource(resource, id, payload) {
    return request(`/api/admin/${resource}/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  createResource(resource, payload) {
    return request(`/api/admin/${resource}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  deleteResource(resource, id) {
    return request(`/api/admin/${resource}/${id}`, {
      method: "DELETE",
    });
  },
};
