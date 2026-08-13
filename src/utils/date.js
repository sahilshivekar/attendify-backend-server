const getDateStringFromObj = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const fromYYYYMMDDToDDMMYYYY = (dateString) => {
    let date = dateString.split('-');
    return `${date[2]}/${date[1]}/${date[0]}`;
};

export {
    getDateStringFromObj,
    fromYYYYMMDDToDDMMYYYY
};
