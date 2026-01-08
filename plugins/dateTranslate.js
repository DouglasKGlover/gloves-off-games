export default defineNuxtPlugin(() => {
  const dateTranslate = (dateSubmitted) => {
    const parsedDate = new Date(dateSubmitted);
    return {
      short: `${parsedDate.getDate()}/${parsedDate.getMonth() + 1}/${parsedDate.getFullYear() - 2000}`,
      long: parsedDate.toDateString(),
    };
  };

  return {
    provide: {
      dateTranslate,
    },
  };
});
