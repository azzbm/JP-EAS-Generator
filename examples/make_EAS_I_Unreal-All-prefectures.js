const fs = require("fs");
const path = require("path");
const { encode } = require("../src");

async function make() {
    const Areas = [
        "hokkaido",
        "aomori",
        "iwate",
        "miyagi",
        "akita",
        "yamagata",
        "fukushima",
        "ibaraki",
        "tochigi",
        "gunma",
        "saitama",
        "chiba",
        "tokyo",
        "kanagawa",
        "niigata",
        "toyama",
        "ishikawa",
        "fukui",
        "yamanashi",
        "nagano",
        "gifu",
        "shizuoka",
        "aichi",
        "mie",
        "shiga",
        "kyoto",
        "osaka",
        "hyogo",
        "nara",
        "wakayama",
        "tottori",
        "shimane",
        "okayama",
        "hiroshima",
        "yamaguchi",
        "tokushima",
        "kagawa",
        "ehime",
        "kochi",
        "fukuoka",
        "saga",
        "nagasaki",
        "kumamoto",
        "oita",
        "miyazaki",
        "kagoshima",
        "okinawa"
    ];
    const signalType = "I";
    const pubDate = new Date("2099-12-31T23:59:00+09:00");
    const SAMPLE_RATE = 44100;
    const result = await encode(Areas, pubDate, signalType, SAMPLE_RATE);
    const wavBuffer = result.Buffer;
    const Hexdata = result.HexData;
    console.log("Hex Data: ", Hexdata);
    if(!fs.existsSync(path.join(__dirname, 'output'))){
        fs.mkdirSync(path.join(__dirname, 'output'));
    };
    fs.writeFileSync(path.join(__dirname, 'output', `output_I_Unreal-All-prefectures_${signalType}.wav`), wavBuffer);
    console.log("WAV file generated: ", path.join(__dirname, 'output', `output_I_Unreal-All-prefectures_${signalType}.wav`));
};

make().catch((err) => { console.error("Error generating WAV file:", err); });