const WavEncoder = require("wav-encoder");
const {
    BIT_DURATION,
    FREQMAP
} = require("./constant");

function getJSTParts(date) {
    const formatter = new Intl.DateTimeFormat('ja-JP', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hourCycle: 'h23',
        timeZone: 'Asia/Tokyo'
    });
    
    // formatToParts解析时间部件
    const parts = formatter.formatToParts(date).reduce((acc, part) => {
        if (['year', 'month', 'day', 'hour', 'minute'].includes(part.type)) {
            acc[part.type] = parseInt(part.value, 10);
        }
        return acc;
    }, {});
    
    // 月份1-12，小时0-23
    return {
        year: parts.year,
        month: parts.month,
        day: parts.day,
        hour: parts.hour || 0,
        minute: parts.minute || 0
    };
};
function getSignalDate(pubDateRaw){
    // 特殊日期处理
    // (1)
    //     ア　信号送出の時刻が0時10分から23時50分未満の時刻にあるときは、信号送出の日に対応する月日区分符号。
    //     イ　信号送出の時刻が0時0分から0時10分未満の時刻にあるときは、信号送出の日の前日に対応する月日区分符号。
    //     ウ　信号送出の時刻が23時50分から24時0分未満の時刻にあるときは、信号送出の日の翌日に対応する月日区分符号。
    // 月日区分符号が信号送出の日に対応する符号である場合は、※は0とし、その他の場合にあつては1とする。
    // (2)
    //     ア　信号送出の時刻が毎時10分から50分未満の時刻にあるときは、信号送出時に対応する年時区分符号。
    //     イ　信号送出の時刻が毎時0分から10分未満の時刻にあるときは、信号送出時の前の時に対応する年時区分符号。
    //     ウ　信号送出の時刻が毎時50分から60分未満の時刻にあるときは、信号送出時の次の時に対応する年時区分符号。
    // 年時区分符号が信号送出の時に対応する符号である場合は※は0とし、その他の場合にあつては1とする。

    const pubDate = pubDateRaw;
    
    // 获取pubDate的东京时间
    const pubDateJST = getJSTParts(pubDate);
    let sameDateForMonthDay = true;
    let sameDateForYearHour = true;
    // signalDate复制pubDate的UTC时间戳，用于后续调整
    let signalDate = new Date(pubDate.getTime());

    // 以下判断逻辑基于东京时间的分钟和小时
    if(pubDateJST.minute < 10){
        // (2)イ
        // 减去1小时 (对 UTC 时间戳进行操作，保证调整的准确性)
        signalDate = new Date(signalDate.getTime() - 1 * 60 * 60 * 1000);
        sameDateForYearHour = false;
        if(pubDateJST.hour === 0){
            // (1)イ
            // signalDate 已经是前一天了，因为减了 1 小时
            sameDateForMonthDay = false;
        };
    } else if(pubDateJST.minute >= 50){
        // (2)ウ
        // 加1小时 (对 UTC 时间戳进行操作)
        signalDate = new Date(signalDate.getTime() + 1 * 60 * 60 * 1000);
        sameDateForYearHour = false;
        if(pubDateJST.hour === 23){
            // (1)ウ
            // signalDate 已经是后一天了，因为加了 1 小时
            sameDateForMonthDay = false;
        };
    } else {
        // (2)ア
        // (1)ア
        sameDateForYearHour = true;
        sameDateForMonthDay = true;
    };
    
    // 创建一个代理对象来封装最终的Date对象
    const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
    
    const jstDateProxy = {
        getFullYear: () => new Date(signalDate.getTime() + JST_OFFSET_MS).getUTCFullYear(),
        getMonth: () => new Date(signalDate.getTime() + JST_OFFSET_MS).getUTCMonth(),
        getDate: () => new Date(signalDate.getTime() + JST_OFFSET_MS).getUTCDate(),
        getHours: () => new Date(signalDate.getTime() + JST_OFFSET_MS).getUTCHours(),
        getMinutes: () => new Date(signalDate.getTime() + JST_OFFSET_MS).getUTCMinutes(),
        getSeconds: () => new Date(signalDate.getTime() + JST_OFFSET_MS).getUTCSeconds(),
        getTime: () => signalDate.getTime() // 仍返回原始的 UTC 时间戳
    };

    return { 
        signalDate: jstDateProxy,
        sameDateForMonthDay, 
        sameDateForYearHour 
    };
};
function generateFSK(bits, options = {}) {
    const sampleRate = options.sampleRate ?? 44100;
    const bitDuration = options.bitDuration ?? BIT_DURATION;
    const amplitude = options.amplitude ?? 0.8;
    const transitionTime = Math.min(options.transitionTime ?? 0.002, bitDuration / 4);
    const fadeTime = options.fadeTime ?? 0.01; 
    
    const samplesPerBit = Math.floor(sampleRate * bitDuration);
    const transitionSamples = Math.floor(sampleRate * transitionTime);
    const fadeSamples = Math.floor(sampleRate * fadeTime);
    const totalSamples = bits.length * samplesPerBit;
    
    // 输出样本数组
    const samples = new Float32Array(totalSamples);
    
    // 追踪相位
    let phase = 0;
    
    // 初始化低通滤波器状态
    let filterY1 = 0;
    let filterY2 = 0;
    
    // 第一阶段，生成具有相位连续性的基本波形
    for (let i = 0; i < bits.length; i++) {
        const bit = bits[i];
        const freq = FREQMAP[bit] || 0;
        const prevBit = i > 0 ? bits[i - 1] : -1;
        const nextBit = i < bits.length - 1 ? bits[i + 1] : -1;
        const prevFreq = FREQMAP[prevBit] || 0;
        const nextFreq = FREQMAP[nextBit] || 0;
        
        // 检测是否有频率转换
        const fromSilence = prevFreq === 0 && freq !== 0;
        const toSilence = freq !== 0 && nextFreq === 0;
        const freqChange = prevFreq !== freq && prevFreq !== 0 && freq !== 0;

        // 生成每个比特的样本
        for (let j = 0; j < samplesPerBit; j++) {
            const sampleIndex = i * samplesPerBit + j;
            let currentFreq = freq;
            
            // 频率平滑过渡
            if (freqChange && j < transitionSamples) {
                // 余弦插值
                const ratio = 0.5 - 0.5 * Math.cos((j / transitionSamples) * Math.PI);
                currentFreq = prevFreq + (freq - prevFreq) * ratio;
            };

            // 瞬时相位计算
            if (currentFreq !== 0) {
                phase += 2 * Math.PI * currentFreq / sampleRate;
                // 规范化相位到 0-2π
                while (phase >= 2 * Math.PI) {
                    phase -= 2 * Math.PI;
                };
                // 生成基本正弦波
                let value = Math.sin(phase);
                // 应用振幅包络
                let envelope = 1.0;
                // 应用开始渐入
                if (fromSilence && j < transitionSamples * 2) {
                    const fadeInRatio = j / (transitionSamples * 2);
                    // 更平滑的S型曲线(3x^2-2x^3)
                    const x = Math.min(1.0, Math.max(0.0, fadeInRatio));
                    envelope *= x * x * (3 - 2 * x);
                };
                // 应用结束渐出
                if (toSilence && j > samplesPerBit - transitionSamples * 2) {
                    const fadeOutRatio = (samplesPerBit - j) / (transitionSamples * 2);
                    // 更平滑的S型曲线
                    const x = Math.min(1.0, Math.max(0.0, fadeOutRatio));
                    envelope *= x * x * (3 - 2 * x);
                };
                // 应用全局淡入淡出
                if (sampleIndex < fadeSamples) {
                    envelope *= Math.pow(sampleIndex / fadeSamples, 2);
                } else if (sampleIndex > totalSamples - fadeSamples) {
                    envelope *= Math.pow((totalSamples - sampleIndex) / fadeSamples, 2);
                };
                // 应用最终振幅
                value *= amplitude * envelope;
                // 应用低通滤波器减少高频成分
                const filterOutput = value * 0.2 + filterY1 * 0.5 + filterY2 * 0.3;
                filterY2 = filterY1;
                filterY1 = filterOutput;
                // 平滑处理后的值
                samples[sampleIndex] = filterOutput;
            } else {
                // 对于静音状态，确保绝对为0
                samples[sampleIndex] = 0;
                // 重置相位避免静音后的相位跳跃
                phase = 0;
            };
        };

        // 确保频率转换发生在零交叉点附近
        if ((freq !== 0 && nextFreq !== 0 && freq !== nextFreq) || 
            (freq !== 0 && nextFreq === 0)) {
            // 比特结束处寻找最接近零的点
            const startIdx = (i + 1) * samplesPerBit - transitionSamples;
            const endIdx = (i + 1) * samplesPerBit;
            // 在结束处平滑过渡到零
            let lastNonZeroIdx = endIdx - 1;
            while (lastNonZeroIdx >= startIdx && Math.abs(samples[lastNonZeroIdx]) < 0.01) {
                lastNonZeroIdx--;
            };
            // 如果找到非零点，应用额外平滑
            if (lastNonZeroIdx >= startIdx) {
                for (let k = lastNonZeroIdx; k < endIdx; k++) {
                    const ratio = (k - lastNonZeroIdx) / (endIdx - lastNonZeroIdx);
                    // 指数衰减
                    samples[k] = samples[lastNonZeroIdx] * Math.exp(-ratio * 8);
                };
            };
        };
    };
    
    // 最终处理：确保首尾淡入淡出
    const smoothingSamples = Math.min(fadeSamples, 100);
    for (let i = 0; i < smoothingSamples; i++) {
        const ratio = i / smoothingSamples;
        // 平滑淡入
        samples[i] *= ratio;
        // 平滑淡出
        samples[totalSamples - i - 1] *= ratio;
    };
    
    // 确保首尾绝对为零
    samples[0] = 0;
    samples[totalSamples - 1] = 0;
    
    // 扫描整个样本数组寻找突变点，防止声音爆炸
    let prevValue = 0;
    for (let i = 1; i < totalSamples; i++) {
        // 检测突变
        if (Math.abs(samples[i] - prevValue) > 0.1) {
            // 平滑突变点
            const avgValue = (samples[i] + prevValue) / 2;
            samples[i] = avgValue + (samples[i] - avgValue) * 0.5;
        };
        prevValue = samples[i];
    };
    
    return samples;
};
function generateWavBuffer(samples, SAMPLE_RATE = 44100) {
    const audioData = {
        sampleRate: SAMPLE_RATE,
        channelData: [new Float32Array(samples)]
    };
    return WavEncoder.encode(audioData);
};
function makeUintArray(fullSignalChunk) {
    let bits = fullSignalChunk.map(v => (v === -1 ? 0 : v));
    while (bits.length % 8 !== 0) {
        bits.push(0);
    };
    let bytes = [];
    for (let i = 0; i < bits.length; i += 8) {
        let byte = 0;
        for (let j = 0; j < 8; j++) {
            byte |= (bits[i + j] & 1) << (7 - j); // 高位在前
        }
        bytes.push(byte);
    };
    return new Uint8Array(bytes);
};
function uintArrayToHexString(uintArr) {
    return Array.from(uintArr)
        .map(b => b.toString(16).padStart(2, "0").toUpperCase())
        .join("");
};

module.exports = {
    getSignalDate,
    generateFSK,
    generateWavBuffer,
    makeUintArray,
    uintArrayToHexString
};