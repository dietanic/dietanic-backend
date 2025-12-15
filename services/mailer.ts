export const sendEmail = async (to: string, subject: string, body: string): Promise<void> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  console.group(`📧 MOCK EMAIL SERVICE - Sent to ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body:\n${body}`);
  console.groupEnd();
};
