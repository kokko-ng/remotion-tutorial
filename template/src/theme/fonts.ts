import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {loadFont as loadJetBrainsMono} from '@remotion/google-fonts/JetBrainsMono';
import {loadFont as loadNunito} from '@remotion/google-fonts/Nunito';
import {loadFont as loadIBMPlexSans} from '@remotion/google-fonts/IBMPlexSans';
import {loadFont as loadIBMPlexMono} from '@remotion/google-fonts/IBMPlexMono';
import {loadFont as loadSTIXTwoText} from '@remotion/google-fonts/STIXTwoText';
import {loadFont as loadSourceSerif4} from '@remotion/google-fonts/SourceSerif4';

// Load only the weights the presets use, latin subset.
loadInter('normal', {weights: ['400', '600', '700'], subsets: ['latin']});
loadJetBrainsMono('normal', {weights: ['400', '700'], subsets: ['latin']});
loadNunito('normal', {weights: ['400', '600', '700', '800'], subsets: ['latin']});
loadIBMPlexSans('normal', {weights: ['400', '600'], subsets: ['latin']});
loadIBMPlexMono('normal', {weights: ['400', '600'], subsets: ['latin']});
loadSTIXTwoText('normal', {weights: ['400', '600', '700'], subsets: ['latin']});
loadSTIXTwoText('italic', {weights: ['400'], subsets: ['latin']});
loadSourceSerif4('normal', {weights: ['400', '600', '700'], subsets: ['latin']});
