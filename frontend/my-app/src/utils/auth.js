export const setToken = (token) => {
  localStorage.setItem('access', token);
};

export const getToken = () => {
  return localStorage.getItem('access');
};

export const logout = () => {
  localStorage.removeItem('access');
};

