// src/stores/imageStore.ts
import { writable } from 'svelte/store';

// This store will hold the list of image URLs
export const imageUrls = writable<string[]>([]);
export const files = writable<File[]>([]);
