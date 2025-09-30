const { decode } = require("../src");
const fs = require("fs");
const path = require("path");

(async () => {
    const file = fs.readFileSync(path.join(__dirname, `example.wav`));
    const bits = await decode(file);
    console.log("Decoded data:", bits.join(''));
})();