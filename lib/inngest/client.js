import { Inngest } from "inngest";

// Create a client to send and receive events
export const inngest = new Inngest({
  id: "fin-platfrim",
  name: "Finance-tracking-app",
  retryFunction: async (attempt) => ({
    delay: Math.pow(2, attempt) * 1000,
    maxAttempt: 2,
  }),
});
