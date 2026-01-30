import { toast as sonner } from "sonner";

export const toast = {
  success: (message: string, description?: string) =>
    sonner.success(message, { description }),
  error: (message: string, description?: string) =>
    sonner.error(message, { description }),
  info: (message: string, description?: string) =>
    sonner.info(message, { description }),
  promise: <T,>(promise: Promise<T>, messages: { loading: string; success: string; error: string }) =>
    sonner.promise(promise, messages),
};
