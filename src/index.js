const { AreaCodes } = require("./generator/lib/constant");
const { makeEASWav } = require("./generator/lib/generator");
const { decodeWav } = require("./decode/lib/decode");

async function printGroupedRegionNames() {
    const { commonCode, wideAreaCodes, prefectureCodes } = AreaCodes;
    console.groupCollapsed("地域符号列表：");
    console.group("1. 地域共通符号");
    console.log(Object.entries(commonCode).map(([key, value]) => `${key}: ${value}`).join("\n"));
    console.groupEnd();

    console.group("2. 広域符号");
    console.log(Object.entries(wideAreaCodes).map(([key, value]) => `${key}: ${value}`).join("\n"));
    console.groupEnd();

    console.group("3. 県域符号");
    console.log(Object.entries(prefectureCodes).map(([key, value]) => `${key}: ${value}`).join("\n"));
    console.groupEnd();
    
    console.groupEnd();
};

module.exports = {
    printGroupedRegionNames,
    encode: makeEASWav,
    decode: decodeWav,
};