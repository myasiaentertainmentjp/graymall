// src/lib/toast.ts
type ToastFn = (message: string) => void;

function safeAlert(message: string) {
  if (typeof window !== 'undefined') window.alert(message);
}

export const toast: { success: ToastFn; error: ToastFn; message: ToastFn } = {
  success: (m) => safeAlert(m),
  error: (m) => safeAlert(m),
  message: (m) => safeAlert(m),
};
