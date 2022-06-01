export default (context, inject) => {
  const dateTranslate = (dateSubmitted) => {
    let newDate = new Date(dateSubmitted);
    newDate = {
      short: `${newDate.getDate()}/${newDate.getMonth() + 1}/${newDate.getFullYear() - 2000
        }`,
      long: newDate.toDateString()
    };
    return newDate;
  };
  inject("dateTranslate", dateTranslate);
};
