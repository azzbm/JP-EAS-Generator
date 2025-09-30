const WavDecoder = require("wav-decoder");

const BIT_RATE = 64; // 64 bit/s
const BIT_DURATION = 1 / BIT_RATE;
const FREQ0 = 640;
const FREQ1 = 1024;

function freqEnergy(samples, sampleRate, freq) {
    const len = samples.length;
    let real = 0, imag = 0;
    for (let n = 0; n < len; n++) {
        const angle = 2 * Math.PI * freq * n / sampleRate;
        real += samples[n] * Math.cos(angle);
        imag += samples[n] * -Math.sin(angle);
    };
    return real * real + imag * imag;
};

async function decodeWav(buffer) {
    const audioData = await WavDecoder.decode(buffer);
    const samples = audioData.channelData[0];
    const sampleRate = audioData.sampleRate;

    const samplesPerBit = Math.floor(sampleRate * BIT_DURATION);
    let energies = [];
    // 统计所有片段的最大能量（FREQ0和FREQ1中较大者）
    for (let i = 0; i + samplesPerBit <= samples.length; i += samplesPerBit) {
        const segment = samples.slice(i, i + samplesPerBit);
        const e0 = freqEnergy(segment, sampleRate, FREQ0);
        const e1 = freqEnergy(segment, sampleRate, FREQ1);
        energies.push(Math.max(e0, e1));
    };
    
    const silenceSamples = sampleRate * 1;
    const silenceEnergies = [];
    for (let i = 0; i + samplesPerBit <= silenceSamples; i += samplesPerBit) {
        const segment = samples.slice(i, i + samplesPerBit);
        const e0 = freqEnergy(segment, sampleRate, FREQ0);
        const e1 = freqEnergy(segment, sampleRate, FREQ1);
        silenceEnergies.push(Math.max(e0, e1));
    };
    
    silenceEnergies.sort((a, b) => a - b);
    const qIdx = Math.floor(silenceEnergies.length * 0.9);
    const baseThreshold = silenceEnergies[qIdx];
    const THRESHOLD_MULTIPLIER = 2;
    const ENERGY_THRESHOLD = baseThreshold * THRESHOLD_MULTIPLIER;

    let startIdx = 0;

    for (let i = 0; i + samplesPerBit <= samples.length; i += samplesPerBit) {
        const segment = samples.slice(i, i + samplesPerBit);
        const e0 = freqEnergy(segment, sampleRate, FREQ0);
        const e1 = freqEnergy(segment, sampleRate, FREQ1);
        if (e0 > ENERGY_THRESHOLD || e1 > ENERGY_THRESHOLD) {
            startIdx = i;
            break;
        };
    };

    const bits = [];
    for (let i = startIdx; i + samplesPerBit <= samples.length; i += samplesPerBit) {
        const segment = samples.slice(i, i + samplesPerBit);
        const e0 = freqEnergy(segment, sampleRate, FREQ0);
        const e1 = freqEnergy(segment, sampleRate, FREQ1);
        if (e0 > ENERGY_THRESHOLD || e1 > ENERGY_THRESHOLD) {
            bits.push(e1 > e0 ? 1 : 0);
        };
    };

    return bits;
};

module.exports = {
    decodeWav
};