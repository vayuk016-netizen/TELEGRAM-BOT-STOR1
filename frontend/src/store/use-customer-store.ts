import { create } from "zustand";

export interface Customer {
  id?: number;
  telegram_id: number;
  username?: string;
  first_name: string;
  last_name?: string;
  balance: number;
  photo_url?: string;
}

interface CustomerState {
  customer: Customer | null;
  token: string | null;
  setCustomer: (customer: Customer | null, token?: string | null) => void;
  logout: () => void;
}

const getStoredCustomer = (): Customer | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("customer_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getStoredToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("customer_token");
};

export const useCustomerStore = create<CustomerState>((set) => ({
  customer: getStoredCustomer(),
  token: getStoredToken(),

  setCustomer: (customer, token) => {
    if (customer) {
      localStorage.setItem("customer_user", JSON.stringify(customer));
    } else {
      localStorage.removeItem("customer_user");
    }

    if (token) {
      localStorage.setItem("customer_token", token);
    } else if (token === null) {
      localStorage.removeItem("customer_token");
    }

    set({ customer, token: token !== undefined ? token : getStoredToken() });
  },

  logout: () => {
    localStorage.removeItem("customer_user");
    localStorage.removeItem("customer_token");
    set({ customer: null, token: null });
  },
}));

