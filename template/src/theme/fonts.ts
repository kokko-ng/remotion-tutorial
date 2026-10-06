import {loadFont} from '@remotion/fonts';
import stix_two_text_400_normal from '@fontsource/stix-two-text/files/stix-two-text-latin-400-normal.woff2';
import stix_two_text_600_normal from '@fontsource/stix-two-text/files/stix-two-text-latin-600-normal.woff2';
import stix_two_text_700_normal from '@fontsource/stix-two-text/files/stix-two-text-latin-700-normal.woff2';
import stix_two_text_400_italic from '@fontsource/stix-two-text/files/stix-two-text-latin-400-italic.woff2';
import inter_400_normal from '@fontsource/inter/files/inter-latin-400-normal.woff2';
import inter_600_normal from '@fontsource/inter/files/inter-latin-600-normal.woff2';
import inter_700_normal from '@fontsource/inter/files/inter-latin-700-normal.woff2';
import jetbrains_mono_400_normal from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2';
import jetbrains_mono_700_normal from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff2';
import nunito_400_normal from '@fontsource/nunito/files/nunito-latin-400-normal.woff2';
import nunito_600_normal from '@fontsource/nunito/files/nunito-latin-600-normal.woff2';
import nunito_700_normal from '@fontsource/nunito/files/nunito-latin-700-normal.woff2';
import nunito_800_normal from '@fontsource/nunito/files/nunito-latin-800-normal.woff2';
import ibm_plex_sans_400_normal from '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2';
import ibm_plex_sans_600_normal from '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff2';
import ibm_plex_sans_700_normal from '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-700-normal.woff2';
import ibm_plex_sans_400_italic from '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-italic.woff2';
import ibm_plex_mono_400_normal from '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2';
import ibm_plex_mono_600_normal from '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-600-normal.woff2';
import ibm_plex_mono_700_normal from '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-700-normal.woff2';
import source_serif_4_400_normal from '@fontsource/source-serif-4/files/source-serif-4-latin-400-normal.woff2';
import source_serif_4_600_normal from '@fontsource/source-serif-4/files/source-serif-4-latin-600-normal.woff2';
import source_serif_4_700_normal from '@fontsource/source-serif-4/files/source-serif-4-latin-700-normal.woff2';
import rawManifest from '../../scenes.json';

/**
 * Fonts are self-hosted: each face is a woff2 file from an @fontsource package
 * (all SIL Open Font License 1.1), which the bundler serves locally, so a
 * render never depends on a font CDN being reachable (a CDN timeout used to
 * fail renders after 30 s). Only the active preset's faces are loaded, and
 * every weight a preset uses is a real face, not a synthesised bold. IBM Plex
 * always loads too, because the repository diagrams use it.
 */
type Face = {family: string; url: string; weight: string; style: 'normal' | 'italic'};

const facesByPreset: Record<string, Face[]> = {
  chalkboard: [
    {family: 'STIX Two Text', url: stix_two_text_400_normal, weight: '400', style: 'normal'},
    {family: 'STIX Two Text', url: stix_two_text_600_normal, weight: '600', style: 'normal'},
    {family: 'STIX Two Text', url: stix_two_text_700_normal, weight: '700', style: 'normal'},
    {family: 'STIX Two Text', url: stix_two_text_400_italic, weight: '400', style: 'italic'},
    {family: 'Inter', url: inter_400_normal, weight: '400', style: 'normal'},
    {family: 'Inter', url: inter_600_normal, weight: '600', style: 'normal'},
    {family: 'Inter', url: inter_700_normal, weight: '700', style: 'normal'},
    {family: 'JetBrains Mono', url: jetbrains_mono_400_normal, weight: '400', style: 'normal'},
    {family: 'JetBrains Mono', url: jetbrains_mono_700_normal, weight: '700', style: 'normal'},
  ],
  paper: [
    {family: 'Nunito', url: nunito_400_normal, weight: '400', style: 'normal'},
    {family: 'Nunito', url: nunito_600_normal, weight: '600', style: 'normal'},
    {family: 'Nunito', url: nunito_700_normal, weight: '700', style: 'normal'},
    {family: 'Nunito', url: nunito_800_normal, weight: '800', style: 'normal'},
    {family: 'JetBrains Mono', url: jetbrains_mono_400_normal, weight: '400', style: 'normal'},
    {family: 'JetBrains Mono', url: jetbrains_mono_700_normal, weight: '700', style: 'normal'},
  ],
  terminal: [
    {family: 'IBM Plex Sans', url: ibm_plex_sans_400_normal, weight: '400', style: 'normal'},
    {family: 'IBM Plex Sans', url: ibm_plex_sans_600_normal, weight: '600', style: 'normal'},
    {family: 'IBM Plex Sans', url: ibm_plex_sans_700_normal, weight: '700', style: 'normal'},
    {family: 'IBM Plex Sans', url: ibm_plex_sans_400_italic, weight: '400', style: 'italic'},
    {family: 'IBM Plex Mono', url: ibm_plex_mono_400_normal, weight: '400', style: 'normal'},
    {family: 'IBM Plex Mono', url: ibm_plex_mono_600_normal, weight: '600', style: 'normal'},
    {family: 'IBM Plex Mono', url: ibm_plex_mono_700_normal, weight: '700', style: 'normal'},
  ],
  print: [
    {family: 'Source Serif 4', url: source_serif_4_400_normal, weight: '400', style: 'normal'},
    {family: 'Source Serif 4', url: source_serif_4_600_normal, weight: '600', style: 'normal'},
    {family: 'Source Serif 4', url: source_serif_4_700_normal, weight: '700', style: 'normal'},
    {family: 'Inter', url: inter_400_normal, weight: '400', style: 'normal'},
    {family: 'Inter', url: inter_600_normal, weight: '600', style: 'normal'},
    {family: 'Inter', url: inter_700_normal, weight: '700', style: 'normal'},
    {family: 'IBM Plex Mono', url: ibm_plex_mono_400_normal, weight: '400', style: 'normal'},
    {family: 'IBM Plex Mono', url: ibm_plex_mono_600_normal, weight: '600', style: 'normal'},
    {family: 'IBM Plex Mono', url: ibm_plex_mono_700_normal, weight: '700', style: 'normal'},
  ],
};

// Repository diagrams (DiagramShot) draw their labels in IBM Plex whatever the
// preset, so those faces always load; without them diagram labels fall back to a
// system font and every label-size and label-crop measurement changes.
const diagramFaces: Face[] = facesByPreset.terminal;

const preset = (rawManifest as {preset?: string}).preset ?? 'chalkboard';
const wanted = [...(facesByPreset[preset] ?? []), ...diagramFaces];
const seen = new Set<string>();
for (const face of wanted) {
  const key = `${face.family}|${face.weight}|${face.style}`;
  if (seen.has(key)) continue;
  seen.add(key);
  void loadFont(face);
}
