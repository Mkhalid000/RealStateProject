import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';

// Register once, app-wide.
gsap.registerPlugin(ScrollTrigger);

export {gsap, ScrollTrigger};
