import { customAlphabet } from 'nanoid';

const alphabet = '123456789abcdefghijklmnopqrstuvwxyz';
const nanoid = customAlphabet(alphabet, 12);

export const generateCheckInId = () => nanoid();
