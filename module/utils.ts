import { DEBUG_LEVEL, TITLE } from './settings.js';

declare class MersenneTwister {
	seed: (seed: number) => number;
	SEED: number;
	rnd: () => number;
}

// All sound files are stored in this object for ease of use
export const sounds = {
	dice: new Audio('sounds/dice.wav'),
	lock: new Audio('sounds/lock.wav'),
};

export const seeder = new MersenneTwister();

const style = 'color:green;font-weight:bold';

// Padronized logging messages
export const debug = (message: string) => {
	if (DEBUG_LEVEL < 1) console.log(`%c${TITLE} %c| ${message}`, style, '');
};
export const log = (message: string) => {
	if (DEBUG_LEVEL < 2) console.log(`%c${TITLE} %c| ${message}`, style, '');
};
export const warn = (message: string) => {
	if (DEBUG_LEVEL < 3) console.warn(`%c${TITLE} %c| ${message}`, style, '');
};
export const error = (message: string) => {
	if (DEBUG_LEVEL < 4) console.error(`%c${TITLE} %c| ${message}`, style, '');
};

/**
 * Selects one element of the array at random
 * @param array Any array
 * @returns Any single element of the array
 */
export function pick(array: any[]) {
	return array[~~(seeder.rnd() * array.length)];
}

/**
 * Selects one element of the array at random, using weighted distribution
 * @param array Any array
 * @param weights An array of numbers containing the same number of elements than array
 * @returns Any single element of the array
 */
export function pick_weights(array: any[], weights: number[]) {
	const length = array.length;
	const sum = weights.reduce((a: number, b: number) => a + b, 0);
	const rand = ~~(seeder.rnd() * sum);
	let k = 0;
	for (let i = 0; i < length; i++) {
		k += weights[i];
		if (k > rand) return array[i];
	}
}

/**
 * Randomize an integer between the minimum and maximum number
 * @param min minimum
 * @param max maximum
 */
export function between(min: number, max: number) {
	return ~~(seeder.rnd() * (max - min) + min + 0.5);
}

interface Groups {
	[key: string]: Groups | any;
}

export function numberExtense(number: number) {
	const unity = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
	return unity[number % 10];
}

export function numberSign(number: number) {
	return (number < 0 ? '' : '+') + number;
}

/**
 * Creates a single object referencing all inner objects
 * @param group Object of chained entities
 */
export function recursive_menu(group: { [key: string]: Groups }, fn?: (ref: any) => string) {
	const menu_by_name: any = {};
	const menu_by_reference: any = {};
	let id = 0;
	const recursion = (category: string, value: any, prefix: string = '') => {
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

// Checks wether a number is odd
export function isOdd(num: number) {
	return num % 2;
}

/**
 * Returns the ordinal number of a given cardinal number
 * @param i Number to check
 * @returns [number]st or [number]nd or [number]rd
 */
export function ordinalNumber(i: number) {
	var j = i % 10,
		k = i % 100;
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

/**
 * Filters an array using multiple filters, if the remaining array is empty, returns the original array
 * @param main The main array to filter
 * @param filters Filters to be applied to the main array
 * @returns Either the main array or the filtered array
 */
export function multipleFilter(main: any[], filters: (any[] | undefined)[]) {
	const res = [main, ...filters].reduce((filterA, filterB) => (filterA ?? main).filter((el) => (filterB ?? main).indexOf(el) !== -1));
	if (!res?.length) return main;
	return res;
}

/**
 * Returns log of x in the determined base
 * @param x log
 * @param base
 * @returns
 */
export function mathlog(x: number, base: number) {
	return Math.log(x) / Math.log(base);
}

/**
 * Shuffles an Array in place
 * @param array
 * @returns
 */
export function shuffle<T>(array: T[]) {
	let currentIndex = array.length,
		randomIndex;

	// While there remain elements to shuffle.
	while (currentIndex != 0) {
		// Pick a remaining element.
		randomIndex = Math.floor(seeder.rnd() * currentIndex);
		currentIndex--;

		// And swap it with the current element.
		[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
	}

	return array;
}

export function repeatFn(fn: Function, steps: number, max_steps: number) {
	steps = ~~steps;
	if (steps < max_steps) max_steps = steps;
	for (let i = 0; i < max_steps; i++) fn();
}

export function sumArray(arr: number[], start = 0) {
	let x = 0;
	const last = arr.length;
	for (let i = start; i < last; i++) x += arr[i];
	return x;
}

function bm_transform() {
	let u = 1 - Math.random(); //Converting [0,1) to (0,1)
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

export const elementFromList = (texts: string[], element = 'p') => `<${element}>` + texts.join(`</${element}><${element}>`) + `</${element}>`; // .replaceAll(/(<|<\/)p/g, `$1${element}`)
