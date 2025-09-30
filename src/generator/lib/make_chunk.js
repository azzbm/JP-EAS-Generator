const {
    makePreSignalChunk,
    makeFixedSignalChunk,
    makeAreaCodeChunk,
    makeMonthDayCodeChunk,
    makeHourYearCodeChunk
} = require("./make_signal");

// 信号区块制作
// 一类开始信号
function make_Signal_I_Start_Chunk(areaCode, dayCode, monthCode, yearCode, hourCode, sameDateForMonthDay = true, sameDateForYearHour = true){
    // 固定符号 地域区分符号 固定符号 月日区分符号 固定符号 年时区分符号
    const fixedSignal = makeFixedSignalChunk("I");
    const areaCodeChunk = makeAreaCodeChunk("I", areaCode);
    const monthDayCodeChunk = makeMonthDayCodeChunk("I", dayCode, monthCode, sameDateForMonthDay);
    const yearHourCodeChunk = makeHourYearCodeChunk("I", hourCode, yearCode, sameDateForYearHour);

    return [
        ...fixedSignal,
        ...areaCodeChunk,
        ...fixedSignal,
        ...monthDayCodeChunk,
        ...fixedSignal,
        ...yearHourCodeChunk
    ];
};
// 二类开始信号
function make_Signal_II_Start_Chunk(areaCode, dayCode, monthCode, yearCode, hourCode, sameDateForMonthDay = true, sameDateForYearHour = true){
    // 固定符号 地域区分符号 固定符号 月日区分符号 固定符号 年时区分符号
    const fixedSignal = makeFixedSignalChunk("II");
    const areaCodeChunk = makeAreaCodeChunk("II", areaCode);
    const monthDayCodeChunk = makeMonthDayCodeChunk("II", dayCode, monthCode, sameDateForMonthDay);
    const yearHourCodeChunk = makeHourYearCodeChunk("II", hourCode, yearCode, sameDateForYearHour);

    return [
        ...fixedSignal,
        ...areaCodeChunk,
        ...fixedSignal,
        ...monthDayCodeChunk,
        ...fixedSignal,
        ...yearHourCodeChunk
    ];
};
// 终了信号
function make_Signal_Finish_Chunk(areaCode, dayCode, monthCode, yearCode, hourCode, sameDateForMonthDay = true, sameDateForYearHour = true){
    // 前置符号 固定符号 地域区分符号 固定符号 月日区分符号 固定符号 年时区分符号 92比特空白
    const preSignal = makePreSignalChunk("F");
    const fixedSignal = makeFixedSignalChunk("F");
    const areaCodeChunk = makeAreaCodeChunk("F", areaCode);
    const monthDayCodeChunk = makeMonthDayCodeChunk("F", dayCode, monthCode, sameDateForMonthDay);
    const yearHourCodeChunk = makeHourYearCodeChunk("F", hourCode, yearCode, sameDateForYearHour);
    const blank92 = new Array(92).fill(-1);
    
    return [
        ...preSignal,
        ...fixedSignal,
        ...areaCodeChunk,
        ...fixedSignal,
        ...monthDayCodeChunk,
        ...fixedSignal,
        ...yearHourCodeChunk,
        ...blank92
    ];
};

module.exports = {
    make_Signal_I_Start_Chunk,
    make_Signal_II_Start_Chunk,
    make_Signal_Finish_Chunk
};