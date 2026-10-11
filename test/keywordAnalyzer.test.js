import test from 'node:test';
import assert from 'node:assert/strict';
import { KeywordAnalyzerService } from '../src/services/keywordAnalyzerService.js';

test('Keyword Analyzer: Density calculation and stuffing detection', () => {
  const service = new KeywordAnalyzerService();

  const profile = {
    target_role: 'Backend Engineer',
    headline: 'Backend Engineer specializing in Node.js and PostgreSQL',
    about: 'I am a backend engineer. Backend engineer loves backend engineer projects with backend engineer systems and backend engineer databases.',
    skills: ['Node.js', 'PostgreSQL', 'Docker'],
    experience: []
  };

  const result = service.analyze({ profile });

  assert.ok(result.totalWordCount > 0);
  assert.ok(result.topKeywords.length > 0);
  assert.ok(result.stuffedKeywords.includes('backend') || result.stuffedKeywords.includes('engineer'));

  const backendEntry = result.topKeywords.find((k) => k.keyword === 'backend');
  assert.ok(backendEntry);
  assert.ok(backendEntry.density > 3.5);
  assert.equal(backendEntry.isStuffed, true);
});

test('Keyword Analyzer: ATS matching against target role taxonomy', () => {
  const service = new KeywordAnalyzerService();

  const profile = {
    target_role: 'Frontend Engineer',
    headline: 'Frontend Engineer | TypeScript, React, CSS Architecture',
    about: 'Focusing on accessibility, web performance, and state management in production applications.',
    skills: ['TypeScript', 'React', 'CSS', 'HTML', 'Web Performance'],
    experience: [
      {
        title: 'Frontend Engineer',
        company: 'Web Corp',
        responsibilities: ['Engineered accessible components and state management pipelines'],
        tech_stack: ['React', 'TypeScript']
      }
    ]
  };

  const result = service.analyze({ profile });

  assert.ok(result.atsScore >= 35);
  assert.ok(result.matchedKeywords.includes('typescript'));
  assert.ok(result.matchedKeywords.includes('react'));
  assert.ok(result.matchedKeywords.includes('accessibility'));
  assert.ok(result.missingKeywords.includes('rest api') || result.missingKeywords.includes('testing'));
});

test('Keyword Analyzer: Comparison with target job description', () => {
  const service = new KeywordAnalyzerService();

  const profile = {
    target_role: 'DevOps Engineer',
    headline: 'DevOps Engineer | Kubernetes & CI/CD',
    about: 'Automating pipelines with Docker, Kubernetes, and Terraform.',
    skills: ['Kubernetes', 'Docker', 'Terraform', 'CI/CD']
  };

  const jobDesc = `
    We are seeking a DevOps Engineer with deep experience in Kubernetes, Docker, Terraform, and CI/CD automation.
    Candidates should understand monitoring, observability, and cloud infrastructure security.
  `;

  const result = service.analyze({ profile, jobDescription: jobDesc });

  assert.ok(result.jobMatchScore > 0);
  assert.ok(result.jobMatchScore <= 100);
});

test('Keyword Analyzer: Flesch readability metrics calculation', () => {
  const service = new KeywordAnalyzerService();

  const profile = {
    target_role: 'Software Engineer',
    headline: 'Software Engineer',
    about: 'We build systems. The code is tested. It runs fast. Teams collaborate well.',
    skills: ['Go']
  };

  const result = service.analyze({ profile });

  assert.ok(result.readability.fleschScore > 70);
  assert.ok(result.readability.averageSentenceLength < 10);
});
