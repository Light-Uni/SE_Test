import api from "../utils/axiosInstance";

const API = "/medicines";

// GET
export const getMedicines = (status: "active" | "deleted" | "all") => {
  return api.get(API, {
    params: { status },
  });
};

// CREATE
export const createMedicine = (data: FormData) => {
  return api.post(API, data);
};

// UPDATE
export const updateMedicine = (id: number, data: FormData) => {
  return api.patch(`${API}/${id}`, data);
};

// DELETE
export const deleteMedicine = (id: number) => {
  return api.patch(`${API}/${id}/delete`, {});
};

export const restoreMedicine = (id: number) => {
  return api.patch(`${API}/${id}/restore`, {});
};
