/**
 * Calculates a future business date (skipping Saturday and Sunday)
 */
export function calculateNextBusinessDay(startDate: Date = new Date(), businessDaysToAdd: number = 3): Date {
  const result = new Date(startDate);
  let added = 0;
  while (added < businessDaysToAdd) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      added++;
    }
  }
  // Set default reminder time to 9:00 AM EAT
  result.setHours(9, 0, 0, 0);
  return result;
}

/**
 * Format follow-up task label
 */
export function getTaskTypeLabel(type: string): string {
  switch (type) {
    case "follow_up_email":
      return "Follow-up Email";
    case "follow_up_whatsapp":
      return "WhatsApp Follow-up";
    case "follow_up_call":
      return "Phone Call Check-in";
    case "interview_prep":
      return "Interview Preparation";
    default:
      return "Follow-up Reminder";
  }
}
