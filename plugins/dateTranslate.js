export default (context, inject) => {
  const dateTranslate = (dateSubmitted) => {
    let newDate = new Date(dateSubmitted);
    newDate = `${newDate.getDate()}/${newDate.getMonth()}/${
      newDate.getFullYear() - 2000
    }`;
    return newDate;
  };
  inject("dateTranslate", dateTranslate);
};
