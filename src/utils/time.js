const getTimeInTwelveHourFormat = (time) => {
    time = time.split(':');
    let hours = time[0];
    const minutes = time[1];
    if (Number(hours) == 12) {
        return `${hours}:${minutes} PM`;
    }
    if (Number(hours) % 12 != Number(hours)) {
        return `${Number(hours) % 12}:${minutes} PM`;
    }
    return `${hours}:${minutes} AM`;
};

export {
    getTimeInTwelveHourFormat
};
