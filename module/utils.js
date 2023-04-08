import { DEBUG_LEVEL, TITLE } from './settings.js';
export const sounds = {
    dice: new Audio('sounds/dice.wav'),
    lock: new Audio('sounds/lock.wav'),
};
export const seeder = new MersenneTwister();
const style = 'color:green;font-weight:bold';
export const debug = (message) => {
    if (DEBUG_LEVEL < 1)
        console.log(`%c${TITLE} %c| ${message}`, style, '');
};
export const log = (message) => {
    if (DEBUG_LEVEL < 2)
        console.log(`%c${TITLE} %c| ${message}`, style, '');
};
export const warn = (message) => {
    if (DEBUG_LEVEL < 3)
        console.warn(`%c${TITLE} %c| ${message}`, style, '');
};
export const error = (message) => {
    if (DEBUG_LEVEL < 4)
        console.error(`%c${TITLE} %c| ${message}`, style, '');
};
export function pick(array) {
    return array[~~(seeder.rnd() * array.length)];
}
export function pick_weights(array, weights) {
    const length = array.length;
    const sum = weights.reduce((a, b) => a + b, 0);
    const rand = ~~(seeder.rnd() * sum);
    let k = 0;
    for (let i = 0; i < length; i++) {
        k += weights[i];
        if (k > rand)
            return array[i];
    }
}
export function between(min, max) {
    return ~~(seeder.rnd() * (max - min) + min + 0.5);
}
export function numberExtense(number) {
    const unity = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    return unity[number % 10];
}
export function numberSign(number) {
    return (number < 0 ? '' : '+') + number;
}
export function recursive_menu(group, fn) {
    const menu_by_name = {};
    const menu_by_reference = {};
    let id = 0;
    const recursion = (category, value, prefix = '') => {
        menu_by_reference[id] = value;
        id += 1;
        if (!Array.isArray(value) && !value.apply) {
            menu_by_name[id - 1] = prefix + category + ' [+]';
            Object.entries(value).forEach(([key, value]) => recursion(key, value, prefix + '&#160;&#160;'));
            return;
        }
        menu_by_name[id - 1] = prefix + category;
    };
    Object.entries(group).forEach(([key, value]) => recursion(key, value));
    return [menu_by_name, menu_by_reference];
}
export function isOdd(num) {
    return num % 2;
}
export function ordinalNumber(i) {
    var j = i % 10, k = i % 100;
    if (j == 1 && k != 11) {
        return i + 'st';
    }
    if (j == 2 && k != 12) {
        return i + 'nd';
    }
    if (j == 3 && k != 13) {
        return i + 'rd';
    }
    return i + 'th';
}
export function multipleFilter(main, filters) {
    const res = [main, ...filters].reduce((filterA, filterB) => (filterA ?? main).filter((el) => (filterB ?? main).indexOf(el) !== -1));
    if (!res?.length)
        return main;
    return res;
}
export function mathlog(x, base) {
    return Math.log(x) / Math.log(base);
}
export function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(seeder.rnd() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}
export function repeatFn(fn, steps, max_steps) {
    steps = ~~steps;
    if (steps < max_steps)
        max_steps = steps;
    for (let i = 0; i < max_steps; i++)
        fn();
}
export function sumArray(arr, start = 0) {
    let x = 0;
    const last = arr.length;
    for (let i = start; i < last; i++)
        x += arr[i];
    return x;
}
function bm_transform() {
    let u = 1 - Math.random();
    let v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}
export function normalRandom(mean, deviation) {
    return bm_transform() * deviation + mean;
}
export function normalRandomAdjusted(mean, deviation) {
    const dev = bm_transform() * deviation;
    return mean ** ((dev + mean) / mean);
}
export const elementFromList = (texts, element = 'p') => `<${element}>` + texts.join(`</${element}><${element}>`) + `</${element}>`;
