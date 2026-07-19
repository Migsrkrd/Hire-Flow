import type { Applicant } from '../types';

function daysWaiting(applicant: Applicant): number {
  const applied = new Date(applicant.appliedDate + 'T12:00:00');
  return Math.floor((Date.now() - applied.getTime()) / 86400000);
}

export function generateAISummary(applicant: Applicant): Applicant['aiSummary'] {
  const topSkills = applicant.skills.slice(0, 3).join(', ');
  const role = applicant.appliedRole;
  const years = applicant.yearsOfExperience;
  const score = applicant.matchScore;
  const waiting = daysWaiting(applicant);

  const level =
    years >= 7 ? 'senior' : years >= 4 ? 'mid-level' : years >= 2 ? 'developing' : 'early-career';

  const concernFromData =
    applicant.concerns.length > 0
      ? applicant.concerns[0]
      : score < 65
        ? 'Overall match score suggests gaps against role requirements'
        : years < 2
          ? 'Limited professional tenure for this level'
          : !applicant.portfolioUrl
            ? 'Missing portfolio link. Harder to assess craft.'
            : 'Limited depth outside primary skill stack';

  // Actionable recommendation framing — not a generic bio
  let summary: string;
  if (score >= 90) {
    summary = `${applicant.name} looks similar to your strongest ${role} hires. Fast-track is warranted. Core stack: ${topSkills}.`;
  } else if (score >= 85) {
    summary = `${applicant.name} is likely worth prioritizing today. ${years}y ${level} profile with ${topSkills}. Waiting ${waiting}d increases risk of losing them.`;
  } else if (waiting > 5 && score >= 75) {
    summary = `${applicant.name} has waited longer than similar applicants (${waiting} days). Match is solid at ${score}%. Act now or risk stall.`;
  } else if (hasIncomplete(applicant)) {
    summary = `This application appears incomplete. Confirm portfolio and skills before investing interview time.`;
  } else if (score < 60) {
    summary = `Low confidence match (${score}%). Recommend rejection or redirect unless a strong referral overrides.`;
  } else {
    summary = `${applicant.name} is a ${score}% match for ${role}. Review strengths and risks below, then set a recommendation.`;
  }

  const strengths: string[] = [
    `${level.charAt(0).toUpperCase() + level.slice(1)} experience in ${topSkills}`,
    `Match score of ${score}/100 against ${role} requirements`,
  ];

  if (applicant.applicationSource.includes('Referral')) {
    strengths.push('Employee referral — higher confidence in culture fit');
  }
  if (applicant.portfolioUrl) {
    strengths.push('Portfolio available for craft assessment');
  }
  if (applicant.githubUrl) {
    strengths.push('GitHub available for code review');
  }
  if (applicant.yearsOfExperience >= 5) {
    strengths.push('Likely to contribute independently within first month');
  }

  const concerns: string[] =
    applicant.concerns.length > 0 ? [...applicant.concerns] : [concernFromData];

  const redFlags: string[] = [];
  if (!applicant.portfolioUrl && role !== 'Data Analyst') {
    redFlags.push('No portfolio URL in application');
  }
  if (applicant.skills.length < 4) {
    redFlags.push('Thin skills list from ATS import');
  }
  if (score < 60) {
    redFlags.push('Below threshold match score for this role');
  }
  if (years < 2 && score < 75) {
    redFlags.push('Junior profile without compensating signals');
  }

  let recommendedNextStep: string;
  if (applicant.stage === 'Offer') {
    recommendedNextStep = 'Confirm offer status and close today.';
  } else if (applicant.stage === 'Hiring Manager Review') {
    recommendedNextStep = 'Hiring manager should Approve, Reject, or request more information.';
  } else if (score >= 90) {
    recommendedNextStep = 'Fast-track: set Strong Hire and send to hiring manager now.';
  } else if (applicant.stage === 'New' || applicant.stage === 'Needs Review') {
    recommendedNextStep = `Review today. Generate insights, then schedule a screen focused on ${applicant.skills[0]}.`;
  } else if (applicant.stage === 'Recruiter Screen') {
    recommendedNextStep = 'Set recommendation and send to hiring manager.';
  } else if (score >= 85) {
    recommendedNextStep = 'Send to hiring manager. High-confidence match.';
  } else if (score < 60) {
    recommendedNextStep = 'Reject or redirect to a junior opening.';
  } else {
    recommendedNextStep = `Technical screen on ${applicant.skills.slice(0, 2).join(' and ')}.`;
  }

  const confidence = Math.min(
    95,
    Math.max(
      45,
      score - redFlags.length * 8 + (applicant.applicationSource.includes('Referral') ? 10 : 0),
    ),
  );

  return { summary, strengths, concerns, redFlags, recommendedNextStep, confidence };
}

function hasIncomplete(applicant: Applicant): boolean {
  return (
    !applicant.portfolioUrl ||
    applicant.skills.length < 3 ||
    !applicant.resumeHighlights
  );
}

export function generateInterviewQuestions(applicant: Applicant): string[] {
  const role = applicant.appliedRole;
  const skills = applicant.skills;

  const base: string[] = [
    `Tell me about a recent project where you used ${skills[0]}. What was your specific contribution?`,
    `What drew you to this ${role} role, and what are you looking for in your next team?`,
  ];

  const roleSpecific: Record<string, string[]> = {
    'Frontend Engineer': [
      `How do you approach component architecture in ${skills.includes('React') ? 'React' : 'your framework of choice'}?`,
      'Describe a performance problem you diagnosed and fixed in a production UI.',
      'How do you ensure accessibility in the components you ship?',
    ],
    'Full Stack Developer': [
      'Walk me through how you designed an API and the frontend that consumed it.',
      'Tell me about a production incident you handled across the stack.',
      `How comfortable are you with ${skills.find((s) => ['PostgreSQL', 'MongoDB', 'MySQL'].includes(s)) ?? 'database'} schema design?`,
    ],
    'Product Designer': [
      'Walk me through your design process from research to handoff.',
      'Tell me about a time user feedback significantly changed your design direction.',
      'How do you collaborate with engineers when designs need to flex for technical constraints?',
    ],
    'Data Analyst': [
      'Describe an analysis that directly influenced a business decision.',
      'How do you validate data quality before presenting findings to stakeholders?',
      `Walk me through a complex ${skills.includes('SQL') ? 'SQL' : 'data'} query you wrote and why it was structured that way.`,
    ],
  };

  return [...base, ...(roleSpecific[role] ?? []).slice(0, 3)];
}

export function getExperienceLevel(years: number): 'Junior' | 'Mid' | 'Senior' | 'Lead' {
  if (years >= 8) return 'Lead';
  if (years >= 5) return 'Senior';
  if (years >= 2) return 'Mid';
  return 'Junior';
}

export function matchToStars(score: number): number {
  if (score >= 93) return 5;
  if (score >= 85) return 4;
  if (score >= 75) return 3;
  if (score >= 60) return 2;
  return 1;
}
