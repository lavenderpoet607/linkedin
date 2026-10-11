import { config } from '../config.js';
import { logger } from '../utils/logger.js';

export class AiProviderService {
  constructor(provider = config.ai.provider, apiKey = config.ai.apiKey) {
    this.provider = provider || 'grounded';
    this.apiKey = apiKey || '';
  }

  sanitizeInput(text) {
    if (typeof text !== 'string') return '';
    return text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/system\s*:\s*ignore\s+all\s+previous\s+instructions/gi, '')
      .trim();
  }

  validateGrounding(generatedText, userFacts = {}) {
    const knownCompanies = (userFacts.experience || []).map((e) => (e.company || '').toLowerCase()).filter(Boolean);
    const knownSkills = (userFacts.skills || []).map((s) => s.toLowerCase());

    const suspectedHallucinations = [];
    const textLower = generatedText.toLowerCase();

    const techGiants = ['google', 'meta', 'apple', 'amazon', 'netflix', 'microsoft'];
    for (const giant of techGiants) {
      if (textLower.includes(giant) && !knownCompanies.some((c) => c.includes(giant))) {
        suspectedHallucinations.push(`Unverified employer mention: ${giant}`);
      }
    }

    return {
      isGrounded: suspectedHallucinations.length === 0,
      suspectedHallucinations
    };
  }

  async generateStructuredRecommendations(profile, jobDescription = '') {
    const role = profile.targetRole || profile.experience?.[0]?.title || 'Software Engineer';
    const skills = profile.skills || [];
    const exp = profile.experience || [];
    const lang = profile.language || 'id';
    const isId = lang === 'id';

    const recommendations = [];

    if (!profile.headline || profile.headline.length < 30) {
      recommendations.push({
        section: 'Headline',
        priority: 'high',
        rationale: isId
          ? 'Headline adalah elemen pertama yang dibaca recruiter dan algoritma pencarian LinkedIn.'
          : 'Headline is the first element indexed by LinkedIn recruiter search and algorithmic ranking.',
        action: isId
          ? `Gunakan format: [Peran Target] | [Keahlian Utama: ${skills.slice(0, 3).join(', ') || 'Teknologi'}] | [Dampak Rekayasa]`
          : `Use format: [Target Role] | [Core Skills: ${skills.slice(0, 3).join(', ') || 'Technologies'}] | [Engineering Value]`
      });
    }

    if (!profile.about || profile.about.length < 150) {
      recommendations.push({
        section: 'About / Summary',
        priority: 'high',
        rationale: isId
          ? 'Ringkasan About yang komprehensif meningkatkan engagement profil hingga 3.8 kali lipat.'
          : 'A comprehensive narrative summary boosts recruiter profile engagement by up to 3.8x.',
        action: isId
          ? 'Tulis narasi 3 paragraf: Latar belakang rekayasa, tumpukan teknologi inti, dan pencapaian terukur.'
          : 'Draft a 3-paragraph narrative: Engineering background, primary tech stack, and measurable milestones.'
      });
    }

    const missingMetrics = exp.filter((e) => !e.achievements_metrics || e.achievements_metrics.length === 0);
    if (missingMetrics.length > 0) {
      recommendations.push({
        section: 'Experience',
        priority: 'medium',
        rationale: isId
          ? 'Tanggung jawab tanpa angka pencapaian terlihat generik dan kurang meyakinkan.'
          : 'Job responsibilities without quantifiable outcomes appear generic and lack evidence.',
        action: isId
          ? `Tambahkan metrik STAR untuk peran di: ${missingMetrics.map((m) => m.company).join(', ')} (contoh: efisiensi latensi, throughput pengguna, atau pengurangan bug).`
          : `Add quantified STAR metrics for: ${missingMetrics.map((m) => m.company).join(', ')} (e.g. latency reduction, request throughput, or bug rate decline).`
      });
    }

    if (skills.length < 10) {
      recommendations.push({
        section: 'Skills',
        priority: 'medium',
        rationale: isId
          ? 'Profil dengan minimal 10 keahlian relevan memiliki kemungkinan muncul di filter pencarian 4 kali lebih tinggi.'
          : 'Profiles with at least 10 relevant skills appear up to 4x more often in keyword search filters.',
        action: isId
          ? 'Lengkapi daftar keahlian dengan platform cloud, basis data, dan metodologi pengujian yang aktif digunakan.'
          : 'Add cloud platforms, database technologies, and automated testing tools you actively use.'
      });
    }

    if (jobDescription && jobDescription.length > 30) {
      const cleanJobDesc = this.sanitizeInput(jobDescription);
      recommendations.push({
        section: 'Job Description Alignment',
        priority: 'high',
        rationale: isId
          ? 'Penyelarasan kata kunci terhadap deskripsi pekerjaan target memaksimalkan skor ATS.'
          : 'Keyword alignment against your target job spec maximizes ATS candidate match score.',
        action: isId
          ? 'Periksa tab Keyword & ATS Analyzer untuk melihat istilah penting yang belum ada di profil Anda.'
          : 'Check the Keyword & ATS Analyzer tab to inspect critical terms missing from your profile text.'
      });
    }

    return {
      provider: this.provider,
      recommendationsCount: recommendations.length,
      recommendations,
      generatedAt: new Date().toISOString()
    };
  }
}

export const aiProviderService = new AiProviderService();
