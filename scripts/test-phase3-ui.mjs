/**
 * Phase 3 UI/UX Polish Verification Suite
 * Validates design system tokens, focus-ring classes, empty states, and route integrity.
 */

import fs from 'fs';

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failed++;
  }
}

console.log('\n--- JOBORA AI PHASE 3 UI/UX VERIFICATION SUITE ---\n');

// 1. Verify apps/web/src/app/globals.css has Warm Editorial utilities
console.log('1. Checking globals.css Warm Editorial utility classes:');
const globalsCss = fs.readFileSync('apps/web/src/app/globals.css', 'utf8');
assert(globalsCss.includes('.editorial-card'), 'globals.css defines .editorial-card');
assert(globalsCss.includes('.badge-emerald'), 'globals.css defines .badge-emerald');
assert(globalsCss.includes('.badge-coral'), 'globals.css defines .badge-coral');
assert(globalsCss.includes('.badge-neutral'), 'globals.css defines .badge-neutral');
assert(globalsCss.includes('.btn-editorial-primary'), 'globals.css defines .btn-editorial-primary');
assert(globalsCss.includes('.btn-editorial-secondary'), 'globals.css defines .btn-editorial-secondary');
assert(globalsCss.includes('.btn-editorial-coral'), 'globals.css defines .btn-editorial-coral');
assert(globalsCss.includes('.focus-ring'), 'globals.css defines .focus-ring');

// 2. Verify landing page (page.tsx) does not contain legacy colors
console.log('\n2. Checking landing page (page.tsx) color tokens:');
const landingPage = fs.readFileSync('apps/web/src/app/page.tsx', 'utf8');
assert(!landingPage.includes('#FAF6F2'), 'landing page does not contain legacy #FAF6F2');
assert(!landingPage.includes('#2A1728'), 'landing page does not contain legacy #2A1728');
assert(!landingPage.includes('#E05347'), 'landing page does not contain legacy #E05347');
assert(!landingPage.includes('#EFE7E1'), 'landing page does not contain legacy #EFE7E1');
assert(landingPage.includes('#F8F5F0'), 'landing page uses Warm Ivory (#F8F5F0)');
assert(landingPage.includes('#351B32'), 'landing page uses Deep Plum (#351B32)');
assert(landingPage.includes('#E76F72'), 'landing page uses Coral (#E76F72)');
assert(landingPage.includes('#EDE5E1'), 'landing page uses Warm Sand border (#EDE5E1)');
assert(landingPage.includes('min-h-[44px]'), 'landing page includes accessible mobile touch targets');

// 3. Verify Interview Coach UI
console.log('\n3. Checking interview route (interview/page.tsx):');
const interviewPage = fs.readFileSync('apps/web/src/app/interview/page.tsx', 'utf8');
assert(interviewPage.includes('editorial-card') || interviewPage.includes('#351B32'), 'interview route has warm editorial styling');
assert(interviewPage.includes('focus-ring'), 'interview route has focus-ring accessible controls');
assert(interviewPage.includes('STAR'), 'interview route has STAR practice mode');
assert(interviewPage.includes('#268566') || interviewPage.includes('emerald'), 'interview route has emerald score visualization');

// 4. Verify Email Composer UI
console.log('\n4. Checking email composer route (email-composer/page.tsx):');
const emailPage = fs.readFileSync('apps/web/src/app/email-composer/page.tsx', 'utf8');
assert(emailPage.includes('focus-ring'), 'email composer has focus-ring inputs');
assert(emailPage.includes('editorial-card') || emailPage.includes('#351B32'), 'email composer has warm editorial styling');
assert(emailPage.includes('btn-editorial-primary') || emailPage.includes('bg-[#351B32]'), 'email composer uses primary action styling');
assert(emailPage.includes('Confirm & Send Now') || emailPage.includes('handleConfirmSend'), 'email composer has explicit dispatch confirmation');

// 5. Verify Cover Letters UI
console.log('\n5. Checking cover letters route (cover-letters/page.tsx):');
const coverPage = fs.readFileSync('apps/web/src/app/cover-letters/page.tsx', 'utf8');
assert(coverPage.includes('editorial-card'), 'cover letters uses .editorial-card');
assert(coverPage.includes('focus-ring'), 'cover letters has accessible focus-ring controls');
assert(coverPage.includes('Generate Grounded Draft') || coverPage.includes('Grounded'), 'cover letters has grounded generation');

// 6. Verify Documents Vault UI
console.log('\n6. Checking documents route (documents/page.tsx):');
const docsPage = fs.readFileSync('apps/web/src/app/documents/page.tsx', 'utf8');
assert(docsPage.includes('editorial-card'), 'documents vault uses .editorial-card');
assert(docsPage.includes('focus-ring'), 'documents vault has focus-ring controls');
assert(docsPage.includes('Master Resume'), 'documents vault preserves master resume badge');
assert(docsPage.includes('Escape') || docsPage.includes('handleKeyDown'), 'documents vault supports keyboard rename cancel/save');

// 7. Verify Career Insights UI
console.log('\n7. Checking career insights route (career-insights/page.tsx):');
const insightsPage = fs.readFileSync('apps/web/src/app/career-insights/page.tsx', 'utf8');
assert(insightsPage.includes('editorial-card'), 'career insights uses .editorial-card');
assert(insightsPage.includes('Skill Gap Matrix') || insightsPage.includes('skillGapData'), 'career insights retains skill gap matrix');
assert(insightsPage.includes('#351B32') || insightsPage.includes('bg-[#351B32]'), 'career insights uses Warm Plum styling');

// 8. Verify Settings & Integrations routes:
console.log('\n8. Checking settings & integrations routes:');
const settingsPage = fs.readFileSync('apps/web/src/app/settings/page.tsx', 'utf8');
const integrationsPage = fs.readFileSync('apps/web/src/app/settings/integrations/page.tsx', 'utf8');
assert(settingsPage.includes('focus-ring'), 'settings route has focus-ring inputs');
assert(settingsPage.includes('Export My Data') || settingsPage.includes('handleExportAllData'), 'settings route supports export data action');
assert(integrationsPage.includes('focus-ring'), 'integrations route has focus-ring controls');
assert(integrationsPage.includes('Safe Cap') || integrationsPage.includes('rateLimit'), 'integrations route has safety controls');

// 9. Verify Auth & Onboarding UI
console.log('\n9. Checking auth and onboarding routes:');
const authPage = fs.readFileSync('apps/web/src/app/auth/page.tsx', 'utf8');
const onboardingPage = fs.readFileSync('apps/web/src/app/onboarding/page.tsx', 'utf8');
const resetPassPage = fs.readFileSync('apps/web/src/app/reset-password/page.tsx', 'utf8');
assert(authPage.includes('focus-ring'), 'auth portal uses focus-ring');
assert(authPage.includes('border-[#EDE5E1]'), 'auth portal uses warm sand borders');
assert(onboardingPage.includes('focus-ring'), 'onboarding wizard uses focus-ring');
assert(onboardingPage.includes('border-[#EDE5E1]'), 'onboarding wizard uses warm sand borders');
assert(resetPassPage.includes('focus-ring'), 'reset password route uses focus-ring');
assert(resetPassPage.includes('border-[#EDE5E1]'), 'reset password uses warm sand borders');

console.log(`\n========================================`);
console.log(`Phase 3 UI Verification: ${passed} passed, ${failed} failed.`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
