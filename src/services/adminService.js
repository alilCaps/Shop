import { api } from "./api";

// Thin wrapper over api() so every admin call carries the login token.
export const adminService = {
  getOverview() {
    return api("/api/admin/overview");
  },

  getResource(resource) {
    return api(`/api/admin/${resource}`);
  },

  updateResource(resource, id, payload) {
    return api(`/api/admin/${resource}/${id}`, {
      method: "PUT",
      body: payload,
    });
  },

  createResource(resource, payload) {
    return api(`/api/admin/${resource}`, {
      method: "POST",
      body: payload,
    });
  },

  deleteResource(resource, id) {
    return api(`/api/admin/${resource}/${id}`, { method: "DELETE" });
  },
};
