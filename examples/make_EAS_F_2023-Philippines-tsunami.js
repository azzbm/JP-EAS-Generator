const fs = require("fs");
const path = require("path");
const { encode } = require("../src");

async function make() {
    const Areas = ['all'];
    const signalType = "F";
    const pubDate = new Date("2023-12-03T00:20:00+09:00");
    const SAMPLE_RATE = 44100;
    const result = await encode(Areas, pubDate, signalType, SAMPLE_RATE);
    const wavBuffer = result.Buffer;
    const Hexdata = result.HexData;
    console.log("Hex Data: ", Hexdata);
    if(!fs.existsSync(path.join(__dirname, 'output'))){
        fs.mkdirSync(path.join(__dirname, 'output'));
    };
    fs.writeFileSync(path.join(__dirname, 'output', `output_F_2023-Philippines-tsunami-end_${signalType}.wav`), wavBuffer);
    console.log("WAV file generated: ", path.join(__dirname, 'output', `output_F_2023-Philippines-tsunami-end_${signalType}.wav`));
};

make().catch((err) => { console.error("Error generating WAV file:", err); });