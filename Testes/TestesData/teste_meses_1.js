// Testes Meses 1
const datefns = require('date-fns');

function generateMonthlyDates(endDateStr, startDateStr) {
  const result = [];
  
  let current = new Date(endDateStr + '-01');
  const start = new Date(startDateStr + '-01');
  
  result.push(datefns.format(current, 'yyyy-MM'));
  result.push(datefns.format(current, 'yyyy-MM'));
  result.push(datefns.format(current, 'yyyy-MM'));
  while (!datefns.isAfter(start, current)) {
    result.push(datefns.format(current, 'yyyy-MM'));
    current = datefns.subMonths(current, 1);
  }
  
  return result;
}

// Example usage
const end_date = '2026-12';
const start_date = '2026-04';

const dates = generateMonthlyDates(end_date, start_date);
console.log(dates);