const {
    getAreaCode,
    getYearCode,
    getMonthCode,
    getDayCode,
    getHourCode
} = require("./code");
const {
    make_Signal_I_Start_Chunk,
    make_Signal_II_Start_Chunk,
    make_Signal_Finish_Chunk
} = require("./make_chunk");
const {
    loopTimes
} = require("./constant");
const { makePreSignalChunk } = require("./make_signal");
const {
    getSignalDate,
    generateFSK,
    generateWavBuffer,
    makeUintArray,
    uintArrayToHexString
} = require("./tools");

/**
 * 生成EAS的FSK音频数据
 * @param {Array} Areas - 区域数组。
 * @param {Date} pubDate - 发布时间，正确转换为UTC时刻即可，程序会自动转换为JST，请勿手动+9！
 * @param {"I"|"II"|"F"} signalType - 信号类型，只能为 "I" 一类, "II" 二类, "F" 终了。
 * @param {Number} SAMPLE_RATE - 采样率，默认44100。
 * @returns {Promise<Buffer>} - 返回为音频的buffer。
 */
async function makeEASWav(Areas = [], pubDate = new Date(), signalType = "II", SAMPLE_RATE = 44100){
    try{
        // 检查传入参数的类型
        if(!Array.isArray(Areas) || pubDate.toString() === "Invalid Date" || (signalType !== "I" && signalType !== "II" && signalType !== "F") || typeof SAMPLE_RATE !== "number"){
            throw new Error("Invalid parameters");
        };

        // 初始化参数
        const pubDateRaw = new Date(pubDate);
        const signals = [];
        for(let area of Areas){
            signals.push({
                area,
                date: pubDateRaw
            });
        };

        // 生成信号区块
        let areaSignalChunks = [];
        for(let signalInfo of signals){
            try{
                const { area: areaName, date: pubDateRaw } = signalInfo;
                const areaCode = getAreaCode(areaName);
                if(!areaCode){
                    throw new Error("Invalid area name");
                };
                const { signalDate, sameDateForMonthDay, sameDateForYearHour } = getSignalDate(pubDateRaw);
                const dayCode = getDayCode(signalDate.getDate());
                const monthCode = getMonthCode(signalDate.getMonth() + 1);
                const yearCode = getYearCode(signalDate.getFullYear());
                const hourCode = getHourCode(signalDate.getHours());
                
                let signalChunk = [];
                switch(signalType){
                    case "I":
                        signalChunk = make_Signal_I_Start_Chunk(areaCode, dayCode, monthCode, yearCode, hourCode, sameDateForMonthDay, sameDateForYearHour);
                        break;
                    case "II":
                        signalChunk = make_Signal_II_Start_Chunk(areaCode, dayCode, monthCode, yearCode, hourCode, sameDateForMonthDay, sameDateForYearHour);
                        break;
                    case "F":
                        signalChunk = make_Signal_Finish_Chunk(areaCode, dayCode, monthCode, yearCode, hourCode, sameDateForMonthDay, sameDateForYearHour);
                        break;
                    default:
                        throw new Error("Invalid signal type");
                };
                areaSignalChunks.push(...signalChunk);
            } catch(err){
                console.error("Failed to generate signal chunk for area:", signalInfo?.area, err);
                continue;
            };
        };
        
        // 循环区块
        let fullSignalChunk = [];
        for(let i = 0; i < loopTimes[signalType]; i++){
            fullSignalChunk.push(...areaSignalChunks);
        };

        // 一类和二类信号前置符号
        if(signalType === "I" || signalType === "II"){
            fullSignalChunk = [...makePreSignalChunk(signalType), ...fullSignalChunk];
        };
        
        // 生成FSK音频样本
        let samples = generateFSK(fullSignalChunk, { sampleRate : SAMPLE_RATE });

        // 无信号期间1秒以上
        samples = [...new Array(SAMPLE_RATE).fill(0), ...samples];

        // 生成wav数据
        const wavBuffer = await generateWavBuffer(samples, SAMPLE_RATE);
        const uintArr = makeUintArray(fullSignalChunk);
        // 返回
        return {
            Buffer: Buffer.from(wavBuffer),
            // 完整数据chunk转换为16进制字符串
            Data: uintArr,
            HexData: uintArrayToHexString(uintArr)
        };
    } catch (err){
        console.error("Failed to generate EAS signal wav:", err);
    };
};

module.exports = {
    makeEASWav
};