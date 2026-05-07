import { createContext, useContext, useState, useEffect } from "react";
import { itemAPI } from "../services/api";

const ItemContext = createContext(null);

export function ItemProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = async (filters = {}) => {
    try {
      setLoading(true);
      const { data } = await itemAPI.getAll(filters);
      setItems(data);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const searchItems = ({ keyword = '', category = '', location = '', fromDate, toDate, type }) => {
    return items.filter((item) => {
      const matchKeyword =
        item.title.toLowerCase().includes(keyword.toLowerCase()) ||
        item.category.toLowerCase().includes(keyword.toLowerCase());
      const matchCategory = category ? item.category === category : true;
      const matchLocation = location ? item.location.toLowerCase().includes(location.toLowerCase()) : true;
      const matchType = type ? item.type === type : true;
      const itemDate = new Date(item.date);
      const matchDate =
        (!fromDate || itemDate >= new Date(fromDate)) &&
        (!toDate || itemDate <= new Date(toDate));
      return matchKeyword && matchCategory && matchLocation && matchType && matchDate;
    });
  };

  const getItemById = async (id) => {
    // Try local cache first for speed, fall back to API (handles direct URL loads / refreshes)
    const cached = items.find((item) => item._id === id);
    if (cached) return cached;
    try {
      const { data } = await itemAPI.getById(id);
      return data;
    } catch {
      return null;
    }
  };

  const createItem = async (itemData) => {
    try {
      const { data } = await itemAPI.create(itemData);
      setItems((prev) => [data, ...prev]);
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to create item' };
    }
  };

  const submitClaim = async (itemId) => {
    try {
      const { data } = await itemAPI.submitClaim(itemId, {});
      setItems((prev) => prev.map((item) => (item._id === itemId ? data : item)));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to submit claim' };
    }
  };

  const startVerification = async (itemId, verificationMethod) => {
    try {
      const { data } = await itemAPI.startVerification(itemId, { verificationMethod });
      setItems((prev) => prev.map((item) => (item._id === itemId ? data : item)));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to start verification' };
    }
  };

  const decideClaim = async ({ itemId, approved, verificationMethod, notes }) => {
    try {
      const decision = approved ? 'RETURNED' : 'REJECTED';
      const { data } = await itemAPI.decideClaim(itemId, {
        decision,
        adminNotes: notes,
        verificationMethod,
      });
      setItems((prev) => prev.map((item) => (item._id === itemId ? data : item)));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to decide claim' };
    }
  };

  const deleteItem = async (itemId) => {
    try {
      await itemAPI.delete(itemId);
      setItems((prev) => prev.filter((item) => item._id !== itemId));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to delete item' };
    }
  };

  const getReturnToken = async (itemId) => {
    try {
      const { data } = await itemAPI.getReturnToken(itemId);
      return { success: true, token: data.returnToken };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to fetch return token' };
    }
  };

  const scanReturnItem = async (itemId, returnToken) => {
    try {
      const { data } = await itemAPI.scanReturnItem(itemId, { returnToken });
      setItems((prev) => prev.map((item) => (item._id === itemId ? data : item)));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to process return claim validation' };
    }
  };

  return (
    <ItemContext.Provider
      value={{
        items,
        loading,
        searchItems,
        getItemById,
        createItem,
        submitClaim,
        startVerification,
        decideClaim,
        deleteItem,
        getReturnToken,
        scanReturnItem,
        fetchItems,
      }}
    >
      {children}
    </ItemContext.Provider>
  );
}

export function useItems() {
  const ctx = useContext(ItemContext);
  if (!ctx) {
    throw new Error("useItems must be used inside ItemProvider");
  }
  return ctx;
}
