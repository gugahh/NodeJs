function generateMonthlyDates(startDateStr, endDateStr) {
  const datePattern = /^\d{4}-\d{2}$/;

  if (!datePattern.test(startDateStr) || !datePattern.test(endDateStr)) {
    throw new Error("Invalid date format. Use 'YYYY-MM'.");
  }

  const [startYear, startMonth] = startDateStr.split("-").map(Number);
  const [endYear, endMonth] = endDateStr.split("-").map(Number);

  if (startMonth < 1 || startMonth > 12 || endMonth < 1 || endMonth > 12) {
    throw new Error("Invalid month value. Month must be between 01 and 12.");
  }

  if (startDateStr > endDateStr) {
    throw new Error("startDateStr must not be greater than endDateStr.");
  }

  const dates = [];
  let year = endYear;
  let month = endMonth;

  while (year > startYear || (year === startYear && month >= startMonth)) {
    dates.push(`${year}-${String(month).padStart(2, "0")}`);
    month--;
    if (month === 0) {
      month = 12;
      year--;
    }
  }

  return dates;
}

// Example usage
const end_date = '2026-12';
const start_date = '2025-11';

const dates = generateMonthlyDates(start_date, end_date);
console.log(dates);