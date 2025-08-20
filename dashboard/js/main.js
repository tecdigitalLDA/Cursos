// js/main.js
import { checkAuth } from './auth.js';
import { initNavigation } from './navigation.js';

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initNavigation();
});