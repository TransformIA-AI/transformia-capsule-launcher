import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));

const failures = [];
const requireFile = (file) => {
  if (!exists(file)) failures.push(`Missing required file: ${file}`);
};

const requiredFiles = [
  'README.md',
  'docs/launch/PRODUCT_HUNT_LAUNCH_KIT_v0_6.md',
  'docs/launch/GITHUB_LAUNCH_README_NOTES_v0_6.md',
  'docs/launch/SCREENSHOT_AND_GIF_CHECKLIST_v0_6.md',
  'docs/launch/FAQ_v0_6.md',
];

for (const file of requiredFiles) requireFile(file);

if (failures.length === 0) {
  const readme = read('README.md');
  const requiredReadmeSections = [
    '# TransformIA Capsule Launcher',
    '## One-liner',
    '## What it does',
    '## What it does not do',
    '## Quickstart in under 5 minutes',
    '## Templates available',
    '## Local / BYOK posture',
    '## Cloud Trial path',
    '## Security posture',
    '## Human approval / no dangerous automation by default',
    '## Links to TransformIA web / launch page',
    '## Roadmap',
    '## License / source posture',
  ];

  for (const section of requiredReadmeSections) {
    if (!readme.includes(section)) failures.push(`README.md missing section: ${section}`);
  }

  const kit = read('docs/launch/PRODUCT_HUNT_LAUNCH_KIT_v0_6.md');
  const requiredKitSections = [
    '## Tagline',
    '## Short description',
    '## Long description',
    '## Maker comment',
    '## Gallery slide concepts',
    '## FAQ',
    '## First 24h plan',
    '## Hunter / maker outreach notes',
    '## Social snippets',
  ];

  for (const section of requiredKitSections) {
    if (!kit.includes(section)) failures.push(`Product Hunt kit missing section: ${section}`);
  }

  const galleryMatches = kit.match(/^\d+\. \*\*/gm) ?? [];
  if (galleryMatches.length < 5) failures.push('Product Hunt kit must include at least 5 gallery slide concepts.');

  const faqMatches = kit.match(/^### \d+\./gm) ?? [];
  if (faqMatches.length < 10) failures.push('Product Hunt kit must include at least 10 FAQ entries.');
}

const scannedFiles = requiredFiles.filter(exists);
const combined = scannedFiles.map((file) => `\n--- ${file} ---\n${read(file)}`).join('\n');

const forbiddenPatterns = [
  /guaranteed\s+ROI/i,
  /certified\s+compliant/i,
  /fully\s+operational\s+WhatsApp/i,
  /production[-\s]+ready\s+live\s+execution/i,
  /(?<!not\s)open\s+source/i,
  /apiKey\s*[:=]/i,
  /accessToken\s*[:=]/i,
  /secret\s*[:=]/i,
  /Evidence\s+Log\s+written/i,
  /live\s+execution\s+completed/i,
  /Stripe/i,
  /checkout\s+implemented/i,
  /customer\s+portal\s+implemented/i,
  /provider\s+SDK\s+configured/i,
  /connector\s+execution\s+enabled/i,
];

for (const pattern of forbiddenPatterns) {
  const match = combined.match(pattern);
  if (match) failures.push(`Forbidden launch-docs claim matched ${pattern}: ${match[0]}`);
}

const executableConnectorFiles = scannedFiles.filter((file) => /connector|workflow/i.test(file) && /\.(mjs|js|ts|json)$/.test(file));
if (executableConnectorFiles.length > 0) {
  failures.push(`Unexpected executable connector-like files in launch-docs scope: ${executableConnectorFiles.join(', ')}`);
}

if (failures.length > 0) {
  console.error('validate-launch-docs failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('validate-launch-docs passed.');
