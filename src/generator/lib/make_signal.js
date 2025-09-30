// https://www.tele.soumu.go.jp/horei/law_honbun/72103000.html#joubun-toc-span

// 信号部分制作
/* type: {
    "I": 一类,
    "II": 二类,
    "F": 终了
} */
// 前置符号
function makePreSignalChunk(type = "II"){
    switch(type){
        case "I":
        case "II":
            return [1, 1, 0, 0];
        case "F":
            return [0, 0, 1, 1];
        default:
            throw new Error("Invalid signal type");
    };
};
// 固定符号
function makeFixedSignalChunk(type = "II"){
    switch(type){
        case "I":
        case "F":
            return [0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1];
        case "II":
            return [1, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0];
        default:
            throw new Error("Invalid signal type");
    };
};
// 地域区分符号
function makeAreaCodeChunk(type = "II", areaCode = []){
    if(!areaCode || areaCode.length !== 12){
        throw new Error("Area code must be an array of 12 bits");
    };
    switch(type){
        case "I":
        case "II":
            return [1, 0, ...areaCode, 0, 0];
        case "F":
            return [0, 1, ...areaCode, 1, 1];
        default:
            throw new Error("Invalid signal type");
    };
};
// 月日区分符号
function makeMonthDayCodeChunk(type = "II", dayCode = [], monthCode = [], sameDate = true){
    if(!dayCode || dayCode.length !== 5){
        throw new Error("Day code must be an array of 5 bits");
    }
    if(!monthCode || monthCode.length !== 5){
        throw new Error("Month code must be an array of 5 bits");
    }
    if (typeof sameDate !== "boolean") {
        throw new Error("sameDate must be a boolean");
    };
    const sameDateBit = sameDate ? 0 : 1;
    switch(type){
        case "I":
        case "II":
            return [0, 1, 0, ...dayCode, sameDateBit, ...monthCode, 0, 0];
        case "F":
            return [1, 0, 0, ...dayCode, sameDateBit, ...monthCode, 1, 1];
        default:
            throw new Error("Invalid signal type");
    };
};
// 年时区分符号
function makeHourYearCodeChunk(type = "II", hourCode = [], yearCode = [], sameDate = true){
    if(!hourCode || hourCode.length !== 5){
        throw new Error("Hour code must be an array of 5 bits");
    }
    if(!yearCode || yearCode.length !== 5){
        throw new Error("Year code must be an array of 5 bits");
    }
    if(!sameDate === true && !sameDate === false){
        throw new Error("sameDate must be a boolean");
    };
    const sameDateBit = sameDate ? 0 : 1;
    switch(type){
        case "I":
        case "II":
            return [0, 1, 1, ...hourCode, sameDateBit, ...yearCode, 0, 0];
        case "F":
            return [1, 0, 1, ...hourCode, sameDateBit, ...yearCode, 1, 1];
        default:
            throw new Error("Invalid signal type");
    };
};

module.exports = {
    makePreSignalChunk,
    makeFixedSignalChunk,
    makeAreaCodeChunk,
    makeMonthDayCodeChunk,
    makeHourYearCodeChunk
};