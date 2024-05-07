const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getTodayAndThirtDaysAgo = () => {
  const today = new Date();
  const currentHour = today.getHours();
  if (currentHour <= 12) {
    today.setDate(today.getDate() - 1);
  }
  const formattedToday = formatDate(today);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  formattedThirtyDaysAgo = formatDate(thirtyDaysAgo);

  return { date1: formattedToday, date2: formattedThirtyDaysAgo };
};

module.exports = {
  formatDate,
  getTodayAndThirtDaysAgo,
};
